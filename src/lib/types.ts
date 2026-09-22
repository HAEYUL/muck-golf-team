export type Gender = "남" | "여";

export type RoundStatus = "모집중" | "조편성중" | "확정" | "완료";

export const ROUND_STATUS_STEPS: RoundStatus[] = ["모집중", "조편성중", "확정", "완료"];

export type TeamMode =
  | "random"
  | "couples_together"
  | "couples_split"
  | "gender_balance"
  | "skill_balance"
  | "manual";

export const TEAM_MODE_LABEL: Record<TeamMode, string> = {
  random: "완전 랜덤",
  couples_together: "부부 한 팀",
  couples_split: "부부 갈라놓기",
  gender_balance: "남녀 균등",
  skill_balance: "실력 균등",
  manual: "수동 입력",
};

export const TEAM_MODE_DESCRIPTION: Record<TeamMode, string> = {
  random: "참가자를 무작위로 팀에 배분해요.",
  couples_together: "부부(커플)는 항상 같은 팀으로 배정해요.",
  couples_split: "부부(커플)는 항상 다른 팀으로 배정해요.",
  gender_balance: "각 팀의 남녀 비율을 최대한 균등하게 배분해요.",
  skill_balance: "실력 순위가 각 팀에 고르게 섞이도록 배분해요.",
  manual: "관리자가 팀 명단을 직접 입력했어요.",
};

export interface Member {
  id: string;
  name: string;
  gender: Gender;
  partner_id: string | null;
  skill_rank: number;
  /** 나이순 표시 순서. 낮을수록 연장자. 게스트는 기본값(999)으로 맨 뒤에 표시됨 */
  age_rank: number;
  character_url: string | null;
  is_guest: boolean;
  is_admin: boolean;
  /** 관리자만 사용. "salt:해시" 형태. 없으면 비밀번호 없이 로그인 가능 */
  password_hash: string | null;
  created_at: string;
}

export interface Round {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  golf_course: string;
  /** 같은 골프장 안의 코스명 (예: 올림프스코스). 코스 구분이 없으면 빈 문자열 */
  course: string;
  status: RoundStatus;
  /** 홈 화면 맨 위에 노출할지 여부. 관리자가 라운딩 목록에서 [게시]로 지정한다 */
  is_published: boolean;
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

export interface RoundSuggestion {
  id: string;
  round_id: string;
  member_id: string;
  content: string;
  created_at: string;
}

export interface TeamReveal {
  id: string;
  team_assignment_id: string;
  member_id: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  content: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  created_by: string | null;
  created_at: string;
}

export const TEAM_THEMES = [
  { no: 1, name: "1조", color: "#2f7a4f", ball: "#eab308" },
  { no: 2, name: "2조", color: "#1d5c9c", ball: "#f8fafc" },
  { no: 3, name: "3조", color: "#b45309", ball: "#fb923c" },
  { no: 4, name: "4조", color: "#7c3aed", ball: "#f472b6" },
] as const;
