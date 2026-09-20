"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { clearSessionMemberId, setSessionMemberId } from "@/lib/session";

export async function loginAction(formData: FormData) {
  const memberId = formData.get("memberId");
  if (typeof memberId !== "string" || !memberId) {
    throw new Error("이름을 목록에서 선택해주세요.");
  }

  const { data, error } = await getSupabaseAdmin()
    .from("members")
    .select("id")
    .eq("id", memberId)
    .maybeSingle();
  if (error || !data) {
    throw new Error("등록되지 않은 이름이에요.");
  }

  await setSessionMemberId(memberId);
  revalidatePath("/");
  redirect("/");
}

export async function logoutAction() {
  await clearSessionMemberId();
  revalidatePath("/");
  redirect("/");
}
