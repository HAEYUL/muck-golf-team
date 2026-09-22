import "server-only";
import { getSupabaseAdmin } from "./supabase-admin";
import type {
  Announcement,
  Member,
  Round,
  RoundParticipant,
  RoundResult,
  RoundScore,
  RoundSuggestion,
  TeamAssignment,
  TeamReveal,
} from "./types";

/** 나이순(연장자 우선, 게스트는 맨 뒤)으로 정렬된 전체 멤버 목록 */
export async function listMembers(): Promise<Member[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("members")
    .select("*")
    .order("age_rank", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Member[];
}

export async function getMember(id: string): Promise<Member | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("members")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Member | null) ?? null;
}

/** 관리자가 [게시]로 지정한, 홈 화면 맨 위에 보여줄 라운딩 하나 (없으면 null) */
export async function getActiveRound(): Promise<Round | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("rounds")
    .select("*")
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return (data as Round | null) ?? null;
}

export async function listRounds(): Promise<Round[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("rounds")
    .select("*")
    .order("date", { ascending: false })
    .order("time", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Round[];
}

export async function getRound(id: string): Promise<Round | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("rounds")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Round | null) ?? null;
}

export async function listCompletedRounds(): Promise<Round[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("rounds")
    .select("*")
    .eq("status", "완료")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Round[];
}

export async function listParticipants(
  roundId: string
): Promise<RoundParticipant[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("round_participants")
    .select("*")
    .eq("round_id", roundId);
  if (error) throw error;
  return (data ?? []) as RoundParticipant[];
}

export async function getLatestTeamAssignment(
  roundId: string
): Promise<TeamAssignment | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("team_assignments")
    .select("*")
    .eq("round_id", roundId)
    .order("attempt_no", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as TeamAssignment | null) ?? null;
}

export async function listTeamAssignments(
  roundId: string
): Promise<TeamAssignment[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("team_assignments")
    .select("*")
    .eq("round_id", roundId)
    .order("attempt_no", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TeamAssignment[];
}

export async function listTeamReveals(
  teamAssignmentId: string
): Promise<TeamReveal[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("team_reveals")
    .select("*")
    .eq("team_assignment_id", teamAssignmentId);
  if (error) throw error;
  return (data ?? []) as TeamReveal[];
}

export async function listScores(roundId: string): Promise<RoundScore[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("round_scores")
    .select("*")
    .eq("round_id", roundId);
  if (error) throw error;
  return (data ?? []) as RoundScore[];
}

export async function getRoundResult(
  roundId: string
): Promise<RoundResult | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("round_results")
    .select("*")
    .eq("round_id", roundId)
    .maybeSingle();
  if (error) throw error;
  return (data as RoundResult | null) ?? null;
}

export async function listSuggestions(roundId: string): Promise<RoundSuggestion[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("round_suggestions")
    .select("*")
    .eq("round_id", roundId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as RoundSuggestion[];
}

/** 멤버별 전체 라운딩 평균 타수. 추억 페이지에서 동타 순위를 가릴 때 사용한다 */
export async function getMemberAverageScores(): Promise<Record<string, number>> {
  const { data, error } = await getSupabaseAdmin()
    .from("round_scores")
    .select("member_id, score");
  if (error) throw error;

  const totals = new Map<string, { sum: number; count: number }>();
  for (const row of data ?? []) {
    const entry = totals.get(row.member_id) ?? { sum: 0, count: 0 };
    entry.sum += row.score;
    entry.count += 1;
    totals.set(row.member_id, entry);
  }

  const averages: Record<string, number> = {};
  for (const [memberId, { sum, count }] of totals) {
    averages[memberId] = sum / count;
  }
  return averages;
}

export async function listAllAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("announcements")
    .select("*")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Announcement[];
}

/** 오늘 날짜가 start_date~end_date 사이인 공지사항만 */
export async function listActiveAnnouncements(): Promise<Announcement[]> {
  const all = await listAllAnnouncements();
  const today = new Date().toISOString().slice(0, 10);
  return all.filter((a) => a.start_date <= today && a.end_date >= today);
}

export async function listMemberScoreHistory(memberId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("round_scores")
    .select("*, rounds(*)")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as (RoundScore & { rounds: Round })[];
}
