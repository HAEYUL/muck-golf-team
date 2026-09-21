-- 기존 프로젝트를 위한 마이그레이션. 0001~0003을 먼저 실행했다는 전제로 실행하세요.
--
-- 조편성 게임: 참가자가 홈 화면에서 본인 이름을 눌러 "게임에 참가"한 기록을 저장한다.
-- 이 회차(team_assignment)에 배정된 전원이 눌렀는지를 서버가 판단해서
-- 자동으로 라운딩 상태를 "확정"으로 전환한다.

create table if not exists team_reveals (
  id uuid primary key default gen_random_uuid(),
  team_assignment_id uuid not null references team_assignments(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (team_assignment_id, member_id)
);

create index if not exists idx_team_reveals_assignment on team_reveals (team_assignment_id);

alter table team_reveals enable row level security;
