-- 먹회골프 데이터베이스 스키마
-- Supabase 대시보드 > SQL Editor 에서 이 파일을 그대로 실행하세요.

create extension if not exists pgcrypto;

-- 멤버 (고정 11명 + 게스트)
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gender text not null check (gender in ('남', '여')),
  partner_id uuid references members(id),
  skill_rank integer not null default 99,
  character_url text,
  is_guest boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- 라운딩(게임방)
create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time time not null,
  golf_course text not null,
  status text not null default '모집중'
    check (status in ('모집중', '마감', '팀확정', '진행중', '완료')),
  rsvp_deadline timestamptz,
  created_at timestamptz not null default now()
);

-- 라운딩별 참가 체크
create table if not exists round_participants (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  attending boolean not null default true,
  checked_at timestamptz not null default now(),
  unique (round_id, member_id)
);

-- 팀 편성 결과 (재편성 이력 포함)
create table if not exists team_assignments (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  attempt_no integer not null,
  mode text not null,
  teams jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid references members(id),
  unique (round_id, attempt_no)
);

-- 라운딩별 개인 스코어
create table if not exists round_scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  team_no integer not null,
  score integer not null,
  rank_in_round integer,
  created_at timestamptz not null default now(),
  unique (round_id, member_id)
);

-- 라운딩 결과(사진 등 부가정보)
create table if not exists round_results (
  round_id uuid primary key references rounds(id) on delete cascade,
  photos text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_round_participants_round on round_participants (round_id);
create index if not exists idx_team_assignments_round on team_assignments (round_id);
create index if not exists idx_round_scores_round on round_scores (round_id);
create index if not exists idx_round_scores_member on round_scores (member_id);

-- 이 앱은 서버(Service Role Key)에서만 데이터베이스에 접근한다.
-- RLS를 켜두면 실수로 노출된 anon/authenticated 키로는 데이터에 접근할 수 없고,
-- 서버 액션에서 쓰는 service_role 키는 RLS를 우회하므로 정상 동작한다.
alter table members enable row level security;
alter table rounds enable row level security;
alter table round_participants enable row level security;
alter table team_assignments enable row level security;
alter table round_scores enable row level security;
alter table round_results enable row level security;
