import type { Member, TeamMode } from "./types";

/** Fisher-Yates 셔플 (원본 배열은 변경하지 않음) */
function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 팀당 최소 3명, 목표 3~4명 기준으로 팀 인원 배분을 계산한다.
 * 예: 7명 -> [4,3] / 9명 -> [3,3,3] / 11명 -> [4,4,3]
 */
export function computeTeamSizes(memberCount: number): number[] {
  if (memberCount <= 0) return [];
  if (memberCount <= 4) return [memberCount];

  let teamCount = Math.ceil(memberCount / 4);
  while (teamCount > 1 && memberCount / teamCount < 3) {
    teamCount--;
  }

  const base = Math.floor(memberCount / teamCount);
  const remainder = memberCount % teamCount;
  const sizes = Array.from({ length: teamCount }, () => base);
  for (let i = 0; i < remainder; i++) sizes[i]++;
  return sizes;
}

function emptyTeams(sizes: number[]): string[][] {
  return sizes.map(() => []);
}

/** 남은 자리가 가장 많은 팀의 인덱스를 찾는다 (동률이면 무작위) */
function pickTeamWithMostRoom(
  remaining: number[],
  exclude?: Set<number>
): number {
  let bestRoom = -1;
  const candidates: number[] = [];
  remaining.forEach((room, idx) => {
    if (exclude?.has(idx)) return;
    if (room > bestRoom) {
      bestRoom = room;
      candidates.length = 0;
      candidates.push(idx);
    } else if (room === bestRoom) {
      candidates.push(idx);
    }
  });
  if (candidates.length === 0) return -1;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function assignRandom(members: Member[]): string[][] {
  const sizes = computeTeamSizes(members.length);
  const shuffled = shuffle(members).map((m) => m.id);
  const teams = emptyTeams(sizes);
  let cursor = 0;
  sizes.forEach((size, teamIdx) => {
    teams[teamIdx] = shuffled.slice(cursor, cursor + size);
    cursor += size;
  });
  return teams;
}

/** 참가자 중 배우자도 함께 참가 중인 경우 커플 그룹으로 묶는다 */
function buildGroups(members: Member[]): Member[][] {
  const byId = new Map(members.map((m) => [m.id, m]));
  const visited = new Set<string>();
  const groups: Member[][] = [];

  for (const m of members) {
    if (visited.has(m.id)) continue;
    const partner = m.partner_id ? byId.get(m.partner_id) : undefined;
    if (partner && !visited.has(partner.id)) {
      groups.push([m, partner]);
      visited.add(m.id);
      visited.add(partner.id);
    } else {
      groups.push([m]);
      visited.add(m.id);
    }
  }
  return groups;
}

function assignCouplesTogether(members: Member[]): string[][] {
  const sizes = computeTeamSizes(members.length);
  const teams = emptyTeams(sizes);
  const remaining = [...sizes];

  const groups = shuffle(buildGroups(members)).sort(
    (a, b) => b.length - a.length
  );

  for (const group of groups) {
    let targetIdx = -1;
    let bestRoom = -1;
    remaining.forEach((room, idx) => {
      if (room >= group.length && room > bestRoom) {
        bestRoom = room;
        targetIdx = idx;
      }
    });

    if (targetIdx === -1) {
      // 딱 맞는 자리가 없는 예외적인 경우: 한 명씩 나눠 배정
      for (const person of group) {
        const idx = pickTeamWithMostRoom(remaining);
        teams[idx].push(person.id);
        remaining[idx]--;
      }
      continue;
    }

    for (const person of group) teams[targetIdx].push(person.id);
    remaining[targetIdx] -= group.length;
  }

  return teams;
}

function assignCouplesSplit(members: Member[]): string[][] {
  const sizes = computeTeamSizes(members.length);
  const teams = emptyTeams(sizes);
  const remaining = [...sizes];

  const byId = new Map(members.map((m) => [m.id, m]));
  const paired = new Set<string>();
  const couples: [Member, Member][] = [];

  for (const m of members) {
    if (paired.has(m.id)) continue;
    const partner = m.partner_id ? byId.get(m.partner_id) : undefined;
    if (partner && !paired.has(partner.id)) {
      couples.push([m, partner]);
      paired.add(m.id);
      paired.add(partner.id);
    }
  }
  const singles = members.filter((m) => !paired.has(m.id));

  for (const [a, b] of shuffle(couples)) {
    const idxA = pickTeamWithMostRoom(remaining);
    teams[idxA].push(a.id);
    remaining[idxA]--;

    const excludeSet = new Set([idxA]);
    let idxB = pickTeamWithMostRoom(remaining, excludeSet);
    if (idxB === -1) idxB = pickTeamWithMostRoom(remaining); // 팀이 1개뿐인 극단적 예외
    teams[idxB].push(b.id);
    remaining[idxB]--;
  }

  for (const single of shuffle(singles)) {
    const idx = pickTeamWithMostRoom(remaining);
    teams[idx].push(single.id);
    remaining[idx]--;
  }

  return teams;
}

function assignGenderBalance(members: Member[]): string[][] {
  const sizes = computeTeamSizes(members.length);
  const teams = emptyTeams(sizes);
  const remaining = [...sizes];

  const males = shuffle(members.filter((m) => m.gender === "남"));
  const females = shuffle(members.filter((m) => m.gender === "여"));

  for (const person of [...males, ...females]) {
    const idx = pickTeamWithMostRoom(remaining);
    teams[idx].push(person.id);
    remaining[idx]--;
  }

  return teams;
}

/** 실력 순위(skill_rank, 1이 가장 잘 침)를 스네이크 드래프트 방식으로 배분 */
function assignSkillBalance(members: Member[]): string[][] {
  const sizes = computeTeamSizes(members.length);
  const teamCount = sizes.length;
  const teams: string[][] = Array.from({ length: teamCount }, () => []);

  const sorted = [...members].sort((a, b) => a.skill_rank - b.skill_rank);

  let idx = 0;
  let direction = 1;
  for (const member of sorted) {
    teams[idx].push(member.id);
    idx += direction;
    if (idx === teamCount) {
      idx = teamCount - 1;
      direction = -1;
    } else if (idx === -1) {
      idx = 0;
      direction = 1;
    }
  }

  return teams;
}

/** 참가자 안에서의 실력 순서(1부터). skill_rank 값 자체(게스트 99 등)의 차이에 휘둘리지 않도록 순위로 바꾼다 */
function skillPositions(members: Member[]): Map<string, number> {
  const sorted = shuffle(members).sort((a, b) => a.skill_rank - b.skill_rank);
  return new Map(sorted.map((m, idx) => [m.id, idx + 1]));
}

/**
 * 팀 안의 두 사람을 맞바꿔 가며 cost가 더 이상 줄지 않을 때까지 개선한다.
 * canSwap으로 바꿀 수 있는 쌍을 제한한다 (예: 같은 성별끼리만).
 */
function improveBySwaps(
  initial: string[][],
  cost: (teams: string[][]) => number,
  canSwap: (a: string, b: string) => boolean = () => true
): { teams: string[][]; cost: number } {
  const teams = initial.map((t) => [...t]);
  let best = cost(teams);
  let improved = true;
  while (improved) {
    improved = false;
    for (let t1 = 0; t1 < teams.length; t1++) {
      for (let t2 = t1 + 1; t2 < teams.length; t2++) {
        for (let i = 0; i < teams[t1].length; i++) {
          for (let j = 0; j < teams[t2].length; j++) {
            const a = teams[t1][i];
            const b = teams[t2][j];
            if (!canSwap(a, b)) continue;
            teams[t1][i] = b;
            teams[t2][j] = a;
            const next = cost(teams);
            if (next < best - 1e-9) {
              best = next;
              improved = true;
            } else {
              teams[t1][i] = a;
              teams[t2][j] = b;
            }
          }
        }
      }
    }
  }
  return { teams, cost: best };
}

/** 여러 번 새로 시작해 보고 cost가 가장 낮은 편성을 고른다 (동점이면 먼저 나온 것 = 무작위) */
function bestOfRestarts(
  restarts: number,
  start: () => string[][],
  cost: (teams: string[][]) => number,
  canSwap?: (a: string, b: string) => boolean
): string[][] {
  let best: { teams: string[][]; cost: number } | null = null;
  for (let r = 0; r < restarts; r++) {
    const result = improveBySwaps(start(), cost, canSwap);
    if (!best || result.cost < best.cost) best = result;
  }
  return best?.teams ?? [];
}

/**
 * 남자팀 / 여자팀 / 혼성팀.
 * 인원이 많은 성별부터 가장 큰 자리를 차지해 한 성별로만 된 팀을 만들고,
 * 그 성별 인원이 팀 하나를 채우기에 모자라면 그 팀은 만들지 않는다.
 * 남은 자리(혼성팀)에는 남은 인원을 남녀 비율이 고르게 섞이도록 배정한다.
 * 2팀이면 남자팀 + 여자팀(가능할 때), 3팀이면 남자팀 + 여자팀 + 혼성팀이 된다.
 */
function assignGenderSplit(members: Member[]): string[][] {
  const sizes = computeTeamSizes(members.length);
  if (sizes.length < 2) return assignRandom(members);

  const males = shuffle(members.filter((m) => m.gender === "남"));
  const females = shuffle(members.filter((m) => m.gender === "여"));
  const pools = [males, females].sort((a, b) => b.length - a.length);

  // computeTeamSizes는 큰 팀부터 돌려주므로 앞에서부터 찾으면 채울 수 있는 가장 큰 자리가 된다
  const freeSizes = [...sizes];
  let maleTeam: string[] | null = null;
  let femaleTeam: string[] | null = null;
  for (const pool of pools) {
    const slotPos = freeSizes.findIndex((size) => size <= pool.length);
    if (slotPos === -1) continue;
    const [size] = freeSizes.splice(slotPos, 1);
    const team = pool.splice(0, size).map((m) => m.id);
    if (pool === males) maleTeam = team;
    else femaleTeam = team;
  }

  const mixedTeams = emptyTeams(freeSizes);
  const remaining = [...freeSizes];
  for (const person of [...males, ...females]) {
    const idx = pickTeamWithMostRoom(remaining);
    mixedTeams[idx].push(person.id);
    remaining[idx]--;
  }

  // 남자팀 -> 여자팀 -> 혼성팀 순서로 1조, 2조, 3조가 된다
  return [maleTeam, femaleTeam, ...mixedTeams].filter((t): t is string[] => t !== null);
}

/** 남녀 비율을 고르게 맞춘 뒤, 같은 성별끼리 맞바꿔 가며 팀별 평균 실력 차이를 최소화한다 */
function assignSkillGenderBalance(members: Member[]): string[][] {
  if (computeTeamSizes(members.length).length < 2) return assignRandom(members);
  const position = skillPositions(members);
  const genderOf = new Map(members.map((m) => [m.id, m.gender]));
  const overallAvg = (members.length + 1) / 2;

  const cost = (teams: string[][]) =>
    teams.reduce((sum, team) => {
      const avg = team.reduce((s, id) => s + (position.get(id) ?? overallAvg), 0) / team.length;
      return sum + (avg - overallAvg) ** 2;
    }, 0);

  return bestOfRestarts(
    20,
    () => assignGenderBalance(members),
    cost,
    (a, b) => genderOf.get(a) === genderOf.get(b)
  );
}

/** 두 사람을 가리키는 순서 없는 키 */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** 최근 라운딩에서 같은 팀이었던 쌍(가중치가 클수록 최근)을 최대한 갈라놓는다 */
function assignAvoidRecent(
  members: Member[],
  recentTeammates: Map<string, number>
): string[][] {
  if (computeTeamSizes(members.length).length < 2 || recentTeammates.size === 0) {
    return assignRandom(members);
  }

  const cost = (teams: string[][]) => {
    let total = 0;
    for (const team of teams) {
      for (let i = 0; i < team.length; i++) {
        for (let j = i + 1; j < team.length; j++) {
          total += recentTeammates.get(pairKey(team[i], team[j])) ?? 0;
        }
      }
    }
    return total;
  };

  return bestOfRestarts(30, () => assignRandom(members), cost);
}

export interface AssignTeamsOptions {
  /** pairKey(a, b) -> 가중치. "지난번 같은 조 피하기"에서 사용 */
  recentTeammates?: Map<string, number>;
}

export function assignTeams(
  members: Member[],
  mode: TeamMode,
  options: AssignTeamsOptions = {}
): string[][] {
  switch (mode) {
    case "random":
      return assignRandom(members);
    case "couples_together":
      return assignCouplesTogether(members);
    case "couples_split":
      return assignCouplesSplit(members);
    case "gender_balance":
      return assignGenderBalance(members);
    case "skill_balance":
      return assignSkillBalance(members);
    case "gender_split":
      return assignGenderSplit(members);
    case "skill_gender_balance":
      return assignSkillGenderBalance(members);
    case "avoid_recent":
      return assignAvoidRecent(members, options.recentTeammates ?? new Map());
    default:
      return assignRandom(members);
  }
}

/** DB에 저장할 { "1": [...], "2": [...] } 형태로 변환 */
export function teamsToRecord(teams: string[][]): Record<string, string[]> {
  const record: Record<string, string[]> = {};
  teams.forEach((ids, idx) => {
    record[String(idx + 1)] = ids;
  });
  return record;
}
