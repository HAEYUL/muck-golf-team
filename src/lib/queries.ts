import "server-only";
import { getSupabaseAdmin } from "./supabase-admin";
import type {
  Member,
  Round,
  RoundParticipant,
  RoundResult,
  RoundScore,
  TeamAssignment,
} from "./types";

export async function listMembers(): Promise<Member[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("members")
    .select("*")
    .order("skill_rank", { ascending: true });
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

/** 완료되지 않은 라운딩 중 가장 최근 것 (홈 화면에 보여줄 "다음 라운딩") */
export async function getActiveRound(): Promise<Round | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("rounds")
    .select("*")
    .neq("status", "완료")
    .order("date", { ascending: true })
    .order("time", { ascending: true })
    .limit(1)
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

export async function listMemberScoreHistory(memberId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("round_scores")
    .select("*, rounds(*)")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as (RoundScore & { rounds: Round })[];
}
