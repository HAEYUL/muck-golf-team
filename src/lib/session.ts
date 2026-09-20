import "server-only";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "./supabase-admin";
import type { Member } from "./types";

const SESSION_COOKIE = "mgt_member_id";

export async function getSessionMemberId(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function setSessionMemberId(memberId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, memberId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearSessionMemberId() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentMember(): Promise<Member | null> {
  const id = await getSessionMemberId();
  if (!id) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("members")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as Member;
}

/** 관리자가 아니면 에러를 던진다. 서버 액션 맨 앞에서 호출해서 사용한다. */
export async function requireAdmin(): Promise<Member> {
  const member = await getCurrentMember();
  if (!member) throw new Error("로그인이 필요합니다.");
  if (!member.is_admin) throw new Error("관리자만 사용할 수 있어요.");
  return member;
}

export async function requireMember(): Promise<Member> {
  const member = await getCurrentMember();
  if (!member) throw new Error("로그인이 필요합니다.");
  return member;
}
