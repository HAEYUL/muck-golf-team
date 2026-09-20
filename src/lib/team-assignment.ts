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

export function assignTeams(members: Member[], mode: TeamMode): string[][] {
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
