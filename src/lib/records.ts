import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "./supabase-admin";
import { listMembers, listMemberScoreHistory } from "./queries";
import type { GolfRecordEntry, PersonalRound } from "./types";

const UNLOCK_COOKIE = "mgt_records_unlock";
export const PIN_MAX_FAILS = 5;
export const PIN_LOCK_MINUTES = 10;

export interface RecordPin {
  member_id: string;
  pin_hash: string;
  failed_count: number;
  locked_until: string | null;
}

export async function getRecordPin(memberId: string): Promise<RecordPin | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("member_record_pins")
    .select("member_id, pin_hash, failed_count, locked_until")
    .eq("member_id", memberId)
    .maybeSingle();
  if (error) throw error;
  return (data as RecordPin | null) ?? null;
}

/**
 * 잠금 해제 쿠키 서명. 비밀번호 해시를 함께 넣어서, 관리자가 비밀번호를 초기화하거나
 * 회원이 새로 정하면 이전에 열어둔 쿠키는 자동으로 무효가 된다.
 */
function signUnlock(memberId: string, pinHash: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return crypto.createHmac("sha256", secret).update(`${memberId}:${pinHash}`).digest("hex");
}

export async function setRecordsUnlocked(memberId: string, pinHash: string) {
  const store = await cookies();
  store.set(UNLOCK_COOKIE, `${memberId}.${signUnlock(memberId, pinHash)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearRecordsUnlocked() {
  const store = await cookies();
  store.delete(UNLOCK_COOKIE);
}

export async function isRecordsUnlocked(memberId: string, pin: RecordPin | null): Promise<boolean> {
  if (!pin) return false;
  const store = await cookies();
  const value = store.get(UNLOCK_COOKIE)?.value;
  if (!value) return false;
  const [cookieMemberId, signature] = value.split(".");
  if (cookieMemberId !== memberId || !signature) return false;
  const expected = Buffer.from(signUnlock(memberId, pin.pin_hash), "hex");
  const actual = Buffer.from(signature, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

/** 서버 액션용: 기록장이 잠겨 있으면 에러 */
export async function requireRecordsUnlocked(memberId: string) {
  const pin = await getRecordPin(memberId);
  if (!(await isRecordsUnlocked(memberId, pin))) {
    throw new Error("기록장 비밀번호를 먼저 입력해주세요.");
  }
}

export async function listPersonalRounds(memberId: string): Promise<PersonalRound[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("personal_rounds")
    .select("*")
    .eq("member_id", memberId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PersonalRound[];
}

export async function getPersonalRound(
  memberId: string,
  id: string
): Promise<PersonalRound | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("personal_rounds")
    .select("*")
    .eq("id", id)
    .eq("member_id", memberId)
    .maybeSingle();
  if (error) throw error;
  return (data as PersonalRound | null) ?? null;
}

/**
 * 먹회골프 스코어(자동) + 개인 라운딩(직접 기록)을 하나의 목록으로 합친다. 최신순.
 * 먹회골프 동반자는 같은 라운딩에서 같은 조였던 회원들이다.
 */
export async function listGolfRecords(memberId: string): Promise<GolfRecordEntry[]> {
  const [muckHistory, personalRounds, members] = await Promise.all([
    listMemberScoreHistory(memberId),
    listPersonalRounds(memberId),
    listMembers(),
  ]);
  const nameById = new Map(members.map((m) => [m.id, m.name]));

  const roundIds = muckHistory.map((h) => h.round_id);
  const teammatesByRound = new Map<string, string[]>();
  if (roundIds.length > 0) {
    const { data, error } = await getSupabaseAdmin()
      .from("round_scores")
      .select("round_id, member_id, team_no")
      .in("round_id", roundIds);
    if (error) throw error;
    const myTeam = new Map(muckHistory.map((h) => [h.round_id, h.team_no]));
    for (const row of (data ?? []) as { round_id: string; member_id: string; team_no: number }[]) {
      if (row.member_id === memberId || myTeam.get(row.round_id) !== row.team_no) continue;
      const list = teammatesByRound.get(row.round_id) ?? [];
      list.push(nameById.get(row.member_id) ?? "?");
      teammatesByRound.set(row.round_id, list);
    }
  }

  const entries: GolfRecordEntry[] = [
    ...muckHistory.map((h) => ({
      kind: "muck" as const,
      id: h.round_id,
      date: h.rounds.date,
      time: h.rounds.time,
      golf_course: h.rounds.golf_course,
      course: h.rounds.course,
      score: h.score,
      companions: teammatesByRound.get(h.round_id) ?? [],
      memo: "",
    })),
    ...personalRounds.map((p) => ({
      kind: "personal" as const,
      id: p.id,
      date: p.date,
      time: p.time,
      golf_course: p.golf_course,
      course: p.course,
      score: p.score,
      companions: [
        ...p.companion_member_ids.map((id) => nameById.get(id) ?? "?"),
        ...p.companion_names,
      ],
      memo: p.memo,
    })),
  ];

  return entries.sort((a, b) =>
    `${b.date} ${b.time ?? ""}`.localeCompare(`${a.date} ${a.time ?? ""}`)
  );
}

/** 관리자 화면용: 기록장 비밀번호를 정해 둔 회원 id 목록 */
export async function listRecordPinMemberIds(): Promise<Set<string>> {
  const { data, error } = await getSupabaseAdmin().from("member_record_pins").select("member_id");
  if (error) {
    // 0008 마이그레이션을 아직 실행하지 않았더라도 관리자 페이지는 열리도록 한다
    console.error("기록장 비밀번호 목록을 불러오지 못했어요:", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((row: { member_id: string }) => row.member_id));
}
