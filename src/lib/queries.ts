import "server-only";
import { getSupabaseAdmin } from "./supabase-admin";
import { pairKey } from "./team-assignment";
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

/** 나이순(연장자 우선, 게스트는 맨 뒤)으로 정렬된 전체 멤버 목록. 탈퇴(비활성화)한 회원도
 *  포함하므로, 과거 라운딩 기록의 이름을 표시할 때(getName 등)는 이 함수를 쓴다 */
export async function listMembers(): Promise<Member[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("members")
    .select("*")
    .order("age_rank", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Member[];
}

/** 로그인 명단, 참가체크, 실력순위 조정처럼 "지금 활동 중인 회원"만 보여줘야 하는
 *  화면에서 쓴다. 탈퇴(비활성화)한 회원은 제외된다 */
export async function listActiveMembers(): Promise<Member[]> {
  const members = await listMembers();
  return members.filter((m) => m.is_active);
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

/**
 * "지난번 같은 조 피하기"용: 이 라운딩보다 앞선 최근 라운딩(최대 roundLimit개)의
 * 최종 팀 편성을 보고, 같은 팀이었던 두 사람마다 가중치를 매긴다.
 * 가장 최근 라운딩일수록 가중치가 크다 (3개면 3, 2, 1).
 */
export async function getRecentTeammateWeights(
  roundId: string,
  roundLimit = 3
): Promise<Map<string, number>> {
  const round = await getRound(roundId);
  if (!round) return new Map();

  const { data, error } = await getSupabaseAdmin()
    .from("team_assignments")
    .select("round_id, attempt_no, teams, rounds!inner(date, time)")
    .neq("round_id", roundId)
    .lte("rounds.date", round.date);
  if (error) throw error;

  type Row = {
    round_id: string;
    attempt_no: number;
    teams: Record<string, string[]>;
    rounds: { date: string; time: string };
  };
  const latestByRound = new Map<string, Row>();
  for (const row of (data ?? []) as unknown as Row[]) {
    const prev = latestByRound.get(row.round_id);
    if (!prev || row.attempt_no > prev.attempt_no) latestByRound.set(row.round_id, row);
  }

  const recent = [...latestByRound.values()]
    .sort((a, b) =>
      `${b.rounds.date} ${b.rounds.time}`.localeCompare(`${a.rounds.date} ${a.rounds.time}`)
    )
    .slice(0, roundLimit);

  const weights = new Map<string, number>();
  recent.forEach((row, idx) => {
    const weight = roundLimit - idx;
    for (const ids of Object.values(row.teams)) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const key = pairKey(ids[i], ids[j]);
          weights.set(key, (weights.get(key) ?? 0) + weight);
        }
      }
    }
  });
  return weights;
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
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Announcement[];
}

/**
 * 가장 최근에 등록한 공지 하나만 "현재 공지"이고, 나머지는 모두 지난 공지(이력)다.
 * 현재 공지는 오늘 날짜가 start_date~end_date 사이일 때만 홈 화면에 노출된다.
 */
export async function getAnnouncementBoard(): Promise<{
  current: Announcement | null;
  active: Announcement | null;
  history: Announcement[];
}> {
  const [current = null, ...history] = await listAllAnnouncements();
  const today = new Date().toISOString().slice(0, 10);
  const active =
    current && current.start_date <= today && current.end_date >= today ? current : null;
  return { current, active, history };
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
