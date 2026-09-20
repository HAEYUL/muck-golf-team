"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/session";
import { listMembers } from "@/lib/queries";
import type { Gender } from "@/lib/types";

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
