export type Gender = "남" | "여";

export type RoundStatus = "모집중" | "마감" | "팀확정" | "진행중" | "완료";

export type TeamMode =
  | "random"
  | "couples_together"
  | "couples_split"
  | "gender_balance"
  | "skill_balance";

export const TEAM_MODE_LABEL: Record<TeamMode, string> = {
  random: "완전 랜덤",
  couples_together: "부부 한 팀",
  couples_split: "부부 갈라놓기",
  gender_balance: "남녀 균등",
  skill_balance: "실력 균등",
};

export const TEAM_MODE_DESCRIPTION: Record<TeamMode, string> = {
  random: "참가자를 무작위로 팀에 배분해요.",
  couples_together: "부부(커플)는 항상 같은 팀으로 배정해요.",
  couples_split: "부부(커플)는 항상 다른 팀으로 배정해요.",
  gender_balance: "각 팀의 남녀 비율을 최대한 균등하게 배분해요.",
  skill_balance: "실력 순위가 각 팀에 고르게 섞이도록 배분해요.",
};

export interface Member {
  id: string;
  name: string;
  gender: Gender;
  partner_id: string | null;
  skill_rank: number;
  character_url: string | null;
  is_guest: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface Round {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  golf_course: string;
  status: RoundStatus;
  rsvp_deadline: string | null;
  created_at: string;
}

export interface RoundParticipant {
  id: string;
  round_id: string;
  member_id: string;
  attending: boolean;
  checked_at: string;
}

export interface TeamAssignment {
  id: string;
  round_id: string;
  attempt_no: number;
  mode: TeamMode;
  teams: Record<string, string[]>; // { "1": [memberId, ...], "2": [...] }
  created_at: string;
  created_by: string | null;
}

export interface RoundScore {
  id: string;
  round_id: string;
  member_id: string;
  team_no: number;
  score: number;
  rank_in_round: number | null;
  created_at: string;
}

export interface RoundResult {
  round_id: string;
  photos: string[];
  created_at: string;
}

export const TEAM_THEMES = [
  { no: 1, name: "버디팀", color: "#2f7a4f", ball: "#eab308" },
  { no: 2, name: "이글팀", color: "#1d5c9c", ball: "#f8fafc" },
  { no: 3, name: "파팀", color: "#b45309", ball: "#fb923c" },
  { no: 4, name: "홀인원팀", color: "#7c3aed", ball: "#f472b6" },
] as const;
