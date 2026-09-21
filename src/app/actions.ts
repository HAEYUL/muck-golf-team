"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { clearSessionMemberId, setSessionMemberId } from "@/lib/session";
import { verifyPassword } from "@/lib/password";
import type { Member } from "@/lib/types";

export type LoginState = { error: string } | null;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const memberId = formData.get("memberId");
  if (typeof memberId !== "string" || !memberId) {
    return { error: "이름을 목록에서 선택해주세요." };
  }

  const { data, error } = await getSupabaseAdmin()
    .from("members")
    .select("*")
    .eq("id", memberId)
    .maybeSingle();
  if (error || !data) {
    return { error: "등록되지 않은 이름이에요." };
  }

  const member = data as Member;

  if (member.is_admin && member.password_hash) {
    const password = String(formData.get("password") ?? "");
    if (!password || !verifyPassword(password, member.password_hash)) {
      return { error: "비밀번호가 올바르지 않아요." };
    }
  }

  await setSessionMemberId(member.id);
  revalidatePath("/");
  redirect("/");
}

export async function logoutAction() {
  await clearSessionMemberId();
  revalidatePath("/");
  redirect("/");
}
