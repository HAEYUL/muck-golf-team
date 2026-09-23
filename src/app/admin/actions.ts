"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/session";
import { listMembers } from "@/lib/queries";
import { hashPassword } from "@/lib/password";
import type { Gender } from "@/lib/types";

export type AdminPasswordState = { error?: string; success?: string } | null;

/** 로그인한 관리자 본인의 비밀번호를 설정/변경한다 */
export async function setAdminPasswordAction(
  _prevState: AdminPasswordState,
  formData: FormData
): Promise<AdminPasswordState> {
  const admin = await requireAdmin();
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (newPassword.length < 4) {
    return { error: "비밀번호는 4자 이상으로 설정해주세요." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "비밀번호가 서로 일치하지 않아요." };
  }

  const { error } = await getSupabaseAdmin()
    .from("members")
    .update({ password_hash: hashPassword(newPassword) })
    .eq("id", admin.id);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: "비밀번호가 설정됐어요. 다음 로그인부터 비밀번호를 입력해야 해요." };
}

export async function addGuestAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const gender = (String(formData.get("gender") ?? "남") as Gender) || "남";
  const roundId = formData.get("round_id");
  if (!name) throw new Error("게스트 이름을 입력해주세요.");

  const members = await listMembers();
  const maxSkill = members.reduce((max, m) => Math.max(max, m.skill_rank), 0);

  const { data, error } = await getSupabaseAdmin()
    .from("members")
    .insert({ name, gender, is_guest: true, skill_rank: maxSkill + 1 })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (typeof roundId === "string" && roundId) {
    await getSupabaseAdmin().from("round_participants").upsert(
      {
        round_id: roundId,
        member_id: data.id,
        attending: true,
        checked_at: new Date().toISOString(),
      },
      { onConflict: "round_id,member_id" }
    );
    revalidatePath(`/rounds/${roundId}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

/** 정회원/게스트 구분 없이 새 회원을 등록한다 */
export async function addMemberAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const gender = (String(formData.get("gender") ?? "남") as Gender) || "남";
  const isGuest = formData.get("is_guest") === "true";
  if (!name) throw new Error("이름을 입력해주세요.");

  const { error } = await getSupabaseAdmin()
    .from("members")
    .insert({ name, gender, is_guest: isGuest, skill_rank: 99 });
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
}

/** 회원 이름/성별을 수정한다 (예: 중복 게스트 이름 정리, 오타 수정) */
export async function updateMemberAction(formData: FormData) {
  await requireAdmin();
  const memberId = String(formData.get("member_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const gender = (String(formData.get("gender") ?? "남") as Gender) || "남";
  if (!memberId || !name) throw new Error("이름을 입력해주세요.");

  const { error } = await getSupabaseAdmin()
    .from("members")
    .update({ name, gender })
    .eq("id", memberId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
}

/** 회원을 삭제한다. 참가체크·스코어·조편성 기록도 함께 삭제된다(DB의 on delete cascade) */
export async function deleteMemberAction(formData: FormData) {
  const admin = await requireAdmin();
  const memberId = String(formData.get("member_id") ?? "");
  if (!memberId) throw new Error("삭제할 회원 정보가 없어요.");
  if (memberId === admin.id) {
    throw new Error("본인 계정은 삭제할 수 없어요.");
  }

  const { error } = await getSupabaseAdmin().from("members").delete().eq("id", memberId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateSkillRanksAction(formData: FormData) {
  await requireAdmin();
  const supabase = getSupabaseAdmin();
  const entries = Array.from(formData.entries()).filter(([key]) =>
    key.startsWith("skill_")
  );

  for (const [key, value] of entries) {
    const memberId = key.replace("skill_", "");
    const skillRank = Number(value);
    if (Number.isNaN(skillRank)) continue;
    const { error } = await supabase
      .from("members")
      .update({ skill_rank: skillRank })
      .eq("id", memberId);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function toggleAdminAction(formData: FormData) {
  await requireAdmin();
  const memberId = String(formData.get("member_id") ?? "");
  const makeAdmin = formData.get("is_admin") === "true";
  const { error } = await getSupabaseAdmin()
    .from("members")
    .update({ is_admin: makeAdmin })
    .eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/** 공지사항은 관리자만 작성할 수 있고, 지정한 기간 동안만 홈 화면에 노출된다 */
export async function createAnnouncementAction(formData: FormData) {
  const admin = await requireAdmin();
  const content = String(formData.get("content") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");

  if (!content || !startDate || !endDate) {
    throw new Error("내용과 노출 기간을 모두 입력해주세요.");
  }
  if (startDate > endDate) {
    throw new Error("종료일이 시작일보다 빠를 수 없어요.");
  }

  const { error } = await getSupabaseAdmin().from("announcements").insert({
    content,
    start_date: startDate,
    end_date: endDate,
    created_by: admin.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteAnnouncementAction(formData: FormData) {
  await requireAdmin();
  const announcementId = String(formData.get("announcement_id") ?? "");
  const { error } = await getSupabaseAdmin()
    .from("announcements")
    .delete()
    .eq("id", announcementId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
}
