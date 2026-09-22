"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin, requireMember } from "@/lib/session";
import { assignTeams, teamsToRecord } from "@/lib/team-assignment";
import {
  getRound,
  listMembers,
  listParticipants,
  listTeamAssignments,
} from "@/lib/queries";
import { ROUND_STATUS_STEPS } from "@/lib/types";
import type { TeamMode } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/** "photos" 필드로 넘어온 파일들을 Storage에 올리고 round_results.photos에 이어붙인다 */
async function uploadPhotosToRound(
  supabase: SupabaseClient,
  roundId: string,
  formData: FormData
) {
  const photoFiles = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (photoFiles.length === 0) return;

  const bucket = process.env.SUPABASE_PHOTO_BUCKET || "round-photos";
  const photoUrls: string[] = [];

  for (const file of photoFiles) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${roundId}/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
    if (uploadError) {
      throw new Error(`사진 업로드 실패: ${uploadError.message}`);
    }
    const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);
    photoUrls.push(publicUrl.publicUrl);
  }

  const { data: existingResult } = await supabase
    .from("round_results")
    .select("photos")
    .eq("round_id", roundId)
    .maybeSingle();

  const mergedPhotos = [...(existingResult?.photos ?? []), ...photoUrls];

  const { error: resultError } = await supabase
    .from("round_results")
    .upsert({ round_id: roundId, photos: mergedPhotos }, { onConflict: "round_id" });
  if (resultError) throw new Error(resultError.message);
}

export async function createRoundAction(formData: FormData) {
  await requireAdmin();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const golfCourse = String(formData.get("golf_course") ?? "").trim();
  const course = String(formData.get("course") ?? "").trim();
  if (!date || !time || !golfCourse) {
    throw new Error("날짜, 시간, 골프장명을 모두 입력해주세요.");
  }

  const { data, error } = await getSupabaseAdmin()
    .from("rounds")
    .insert({ date, time, golf_course: golfCourse, course, status: "모집중" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/rounds/${data.id}`);
}

export async function rsvpAction(formData: FormData) {
  const currentMember = await requireMember();
  const roundId = String(formData.get("round_id") ?? "");
  const attending = formData.get("attending") === "true";
  const targetMemberIdRaw = formData.get("member_id");
  let targetMemberId = currentMember.id;

  if (
    typeof targetMemberIdRaw === "string" &&
    targetMemberIdRaw &&
    targetMemberIdRaw !== currentMember.id
  ) {
    if (!currentMember.is_admin) {
      throw new Error("본인의 참가 여부만 체크할 수 있어요.");
    }
    targetMemberId = targetMemberIdRaw;
  }

  const { error } = await getSupabaseAdmin()
    .from("round_participants")
    .upsert(
      {
        round_id: roundId,
        member_id: targetMemberId,
        attending,
        checked_at: new Date().toISOString(),
      },
      { onConflict: "round_id,member_id" }
    );
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/rounds/${roundId}`);
}

export async function closeRsvpAction(formData: FormData) {
  await requireAdmin();
  const roundId = String(formData.get("round_id") ?? "");
  const { error } = await getSupabaseAdmin()
    .from("rounds")
    .update({ status: "조편성중" })
    .eq("id", roundId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/rounds/${roundId}`);
}

export async function reopenRsvpAction(formData: FormData) {
  await requireAdmin();
  const roundId = String(formData.get("round_id") ?? "");
  const { error } = await getSupabaseAdmin()
    .from("rounds")
    .update({ status: "모집중" })
    .eq("id", roundId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/rounds/${roundId}`);
}

export async function createTeamAssignmentAction(formData: FormData) {
  const admin = await requireAdmin();
  const roundId = String(formData.get("round_id") ?? "");
  const mode = String(formData.get("mode") ?? "random") as TeamMode;

  const participants = await listParticipants(roundId);
  const attendingIds = new Set(
    participants.filter((p) => p.attending).map((p) => p.member_id)
  );
  if (attendingIds.size < 3) {
    throw new Error("참가 인원이 최소 3명 이상이어야 팀을 짤 수 있어요.");
  }

  const allMembers = await listMembers();
  const attendingMembers = allMembers.filter((m) => attendingIds.has(m.id));

  const teams = assignTeams(attendingMembers, mode);
  const previousAssignments = await listTeamAssignments(roundId);
  const nextAttemptNo =
    previousAssignments.length > 0
      ? Math.max(...previousAssignments.map((a) => a.attempt_no)) + 1
      : 1;

  const { error } = await getSupabaseAdmin().from("team_assignments").insert({
    round_id: roundId,
    attempt_no: nextAttemptNo,
    mode,
    teams: teamsToRecord(teams),
    created_by: admin.id,
  });
  if (error) throw new Error(error.message);

  // 상태는 그대로 둔다: 처음 시작이면 "조편성중"에 남아 참가자들이 각자
  // 홈 화면에서 본인 이름을 눌러 게임에 참가해야 "확정"으로 넘어간다.
  // 이미 "확정" 상태에서 다시 뽑은 경우(재편성)에는 그대로 확정 상태 유지.
  revalidatePath("/");
  revalidatePath(`/rounds/${roundId}`);
  revalidatePath(`/rounds/${roundId}/draw`);
  redirect(`/rounds/${roundId}`);
}

/** 조편성 게임: 참가자 본인이 홈 화면에서 자기 이름을 눌러 게임에 참가한다 */
export async function revealTeamAction(formData: FormData) {
  const currentMember = await requireMember();
  const roundId = String(formData.get("round_id") ?? "");

  const assignment = (await listTeamAssignments(roundId)).at(-1);
  if (!assignment) throw new Error("아직 팀 편성이 시작되지 않았어요.");

  const assignedMemberIds = Object.values(assignment.teams).flat();
  if (!assignedMemberIds.includes(currentMember.id)) {
    throw new Error("이번 라운딩 참가자만 게임에 참여할 수 있어요.");
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("team_reveals").upsert(
    { team_assignment_id: assignment.id, member_id: currentMember.id },
    { onConflict: "team_assignment_id,member_id", ignoreDuplicates: true }
  );
  if (error) throw new Error(error.message);

  const { count, error: countError } = await supabase
    .from("team_reveals")
    .select("*", { count: "exact", head: true })
    .eq("team_assignment_id", assignment.id);
  if (countError) throw new Error(countError.message);

  if ((count ?? 0) >= assignedMemberIds.length) {
    await supabase.from("rounds").update({ status: "확정" }).eq("id", roundId);
  }

  revalidatePath("/");
  revalidatePath(`/rounds/${roundId}`);
}

/** 관리자가 아직 다 안 누른 사람이 있어도 강제로 확정 처리한다 */
export async function forceConfirmTeamsAction(formData: FormData) {
  await requireAdmin();
  const roundId = String(formData.get("round_id") ?? "");
  const { error } = await getSupabaseAdmin()
    .from("rounds")
    .update({ status: "확정" })
    .eq("id", roundId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/rounds/${roundId}`);
}

/** 관리자가 참가자별 팀 번호를 직접 지정해서 팀을 편성/수정한다 */
export async function saveManualTeamsAction(formData: FormData) {
  const admin = await requireAdmin();
  const roundId = String(formData.get("round_id") ?? "");

  const participants = await listParticipants(roundId);
  const attendingIds = new Set(
    participants.filter((p) => p.attending).map((p) => p.member_id)
  );

  const teams: Record<string, string[]> = {};
  for (const memberId of attendingIds) {
    const teamNo = String(formData.get(`team_${memberId}`) ?? "1");
    if (!teams[teamNo]) teams[teamNo] = [];
    teams[teamNo].push(memberId);
  }

  if (Object.keys(teams).length === 0) {
    throw new Error("참가 확정된 인원이 없어서 팀을 편성할 수 없어요.");
  }

  const previousAssignments = await listTeamAssignments(roundId);
  const nextAttemptNo =
    previousAssignments.length > 0
      ? Math.max(...previousAssignments.map((a) => a.attempt_no)) + 1
      : 1;

  const { error } = await getSupabaseAdmin().from("team_assignments").insert({
    round_id: roundId,
    attempt_no: nextAttemptNo,
    mode: "manual",
    teams,
    created_by: admin.id,
  });
  if (error) throw new Error(error.message);

  // 완료된 라운딩을 사후 수정하는 경우 상태를 "확정"으로 되돌리지 않는다
  // (스코어/사진 화면이 그대로 유지되도록).
  const round = await getRound(roundId);
  if (round && round.status !== "완료") {
    await getSupabaseAdmin().from("rounds").update({ status: "확정" }).eq("id", roundId);
  }

  revalidatePath("/");
  revalidatePath(`/rounds/${roundId}`);
  redirect(`/rounds/${roundId}`);
}

/** 관리자가 라운딩 목록에서 홈 화면에 노출할 라운딩을 고른다 (한 번에 하나만 게시) */
export async function publishRoundAction(formData: FormData) {
  await requireAdmin();
  const roundId = String(formData.get("round_id") ?? "");
  const round = await getRound(roundId);
  if (!round) throw new Error("라운딩을 찾을 수 없어요.");

  const supabase = getSupabaseAdmin();

  if (round.is_published) {
    const { error } = await supabase
      .from("rounds")
      .update({ is_published: false })
      .eq("id", roundId);
    if (error) throw new Error(error.message);
  } else {
    const { error: unpublishError } = await supabase
      .from("rounds")
      .update({ is_published: false })
      .eq("is_published", true);
    if (unpublishError) throw new Error(unpublishError.message);

    const { error } = await supabase
      .from("rounds")
      .update({ is_published: true })
      .eq("id", roundId);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

/** 관리자가 라운딩을 완전히 삭제한다 (참가체크/조편성/스코어/사진도 함께 삭제됨) */
export async function deleteRoundAction(formData: FormData) {
  await requireAdmin();
  const roundId = String(formData.get("round_id") ?? "");
  const { error } = await getSupabaseAdmin().from("rounds").delete().eq("id", roundId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/memories");
}

export async function submitScoresAction(formData: FormData) {
  await requireMember();
  const roundId = String(formData.get("round_id") ?? "");
  const round = await getRound(roundId);
  if (!round) throw new Error("라운딩을 찾을 수 없어요.");

  const assignment = (await listTeamAssignments(roundId)).at(-1);
  if (!assignment) throw new Error("팀 편성이 없어서 스코어를 입력할 수 없어요.");

  const memberToTeam = new Map<string, number>();
  Object.entries(assignment.teams).forEach(([teamNo, ids]) => {
    ids.forEach((id) => memberToTeam.set(id, Number(teamNo)));
  });

  const scoreRows: {
    round_id: string;
    member_id: string;
    team_no: number;
    score: number;
  }[] = [];
  for (const [memberId, teamNo] of memberToTeam.entries()) {
    const raw = formData.get(`score_${memberId}`);
    if (raw === null || raw === "") continue;
    const score = Number(raw);
    if (Number.isNaN(score)) continue;
    scoreRows.push({ round_id: roundId, member_id: memberId, team_no: teamNo, score });
  }

  if (scoreRows.length === 0) {
    throw new Error("최소 한 명 이상의 점수를 입력해주세요.");
  }

  const supabase = getSupabaseAdmin();
  const { error: scoreError } = await supabase
    .from("round_scores")
    .upsert(scoreRows, { onConflict: "round_id,member_id" });
  if (scoreError) throw new Error(scoreError.message);

  await uploadPhotosToRound(supabase, roundId, formData);

  const { error: statusError } = await supabase
    .from("rounds")
    .update({ status: "완료" })
    .eq("id", roundId);
  if (statusError) throw new Error(statusError.message);

  revalidatePath("/");
  revalidatePath(`/rounds/${roundId}`);
  revalidatePath("/memories");
  redirect(`/rounds/${roundId}`);
}

/** 스코어 입력과 무관하게, 로그인한 사람 누구나 라운딩 사진을 올릴 수 있는 액션 */
export async function uploadRoundPhotosAction(formData: FormData) {
  await requireMember();
  const roundId = String(formData.get("round_id") ?? "");
  const round = await getRound(roundId);
  if (!round) throw new Error("라운딩을 찾을 수 없어요.");

  const supabase = getSupabaseAdmin();
  await uploadPhotosToRound(supabase, roundId, formData);

  revalidatePath(`/rounds/${roundId}`);
  revalidatePath(`/rounds/${roundId}/photos`);
  revalidatePath("/memories");
  redirect(`/rounds/${roundId}/photos`);
}

/** 라운딩별 건의사항. 로그인한 사람 누구나 쓰고 볼 수 있다 */
export async function addSuggestionAction(formData: FormData) {
  const currentMember = await requireMember();
  const roundId = String(formData.get("round_id") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!content) throw new Error("내용을 입력해주세요.");

  const { error } = await getSupabaseAdmin().from("round_suggestions").insert({
    round_id: roundId,
    member_id: currentMember.id,
    content,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/rounds/${roundId}`);
}

/** 건의사항은 작성자 본인 또는 관리자만 삭제할 수 있다 */
export async function deleteSuggestionAction(formData: FormData) {
  const currentMember = await requireMember();
  const suggestionId = String(formData.get("suggestion_id") ?? "");
  const roundId = String(formData.get("round_id") ?? "");

  const supabase = getSupabaseAdmin();
  const { data: suggestion, error: fetchError } = await supabase
    .from("round_suggestions")
    .select("member_id")
    .eq("id", suggestionId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!suggestion) throw new Error("이미 삭제된 건의사항이에요.");

  if (suggestion.member_id !== currentMember.id && !currentMember.is_admin) {
    throw new Error("작성자 본인 또는 관리자만 삭제할 수 있어요.");
  }

  const { error } = await supabase.from("round_suggestions").delete().eq("id", suggestionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/rounds/${roundId}`);
}

/**
 * 라운딩 상태를 한 단계 이전으로 되돌린다 (완료->확정->조편성중->모집중).
 * 참가체크/조편성/스코어 데이터는 지우지 않고 상태값만 되돌린다.
 */
export async function revertRoundStatusAction(formData: FormData) {
  await requireAdmin();
  const roundId = String(formData.get("round_id") ?? "");
  const round = await getRound(roundId);
  if (!round) throw new Error("라운딩을 찾을 수 없어요.");

  const currentIndex = ROUND_STATUS_STEPS.indexOf(round.status);
  if (currentIndex <= 0) {
    throw new Error("더 이상 되돌릴 수 없어요.");
  }
  const previousStatus = ROUND_STATUS_STEPS[currentIndex - 1];

  const { error } = await getSupabaseAdmin()
    .from("rounds")
    .update({ status: previousStatus })
    .eq("id", roundId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/rounds/${roundId}`);
}
