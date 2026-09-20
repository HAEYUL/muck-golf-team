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
import type { TeamMode } from "@/lib/types";

export async function createRoundAction(formData: FormData) {
  await requireAdmin();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const golfCourse = String(formData.get("golf_course") ?? "").trim();
  if (!date || !time || !golfCourse) {
    throw new Error("날짜, 시간, 골프장명을 모두 입력해주세요.");
  }

  const { data, error } = await getSupabaseAdmin()
    .from("rounds")
    .insert({ date, time, golf_course: golfCourse, status: "모집중" })
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
    .update({ status: "마감" })
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

  await getSupabaseAdmin()
    .from("rounds")
    .update({ status: "팀확정" })
    .eq("id", roundId);

  revalidatePath("/");
  revalidatePath(`/rounds/${roundId}`);
  revalidatePath(`/rounds/${roundId}/draw`);
  redirect(`/rounds/${roundId}/draw`);
}

export async function startRoundAction(formData: FormData) {
  await requireAdmin();
  const roundId = String(formData.get("round_id") ?? "");
  const { error } = await getSupabaseAdmin()
    .from("rounds")
    .update({ status: "진행중" })
    .eq("id", roundId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/rounds/${roundId}`);
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

  const photoFiles = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const photoUrls: string[] = [];
  const bucket = process.env.SUPABASE_PHOTO_BUCKET || "round-photos";

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
