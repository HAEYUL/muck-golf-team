-- 기존 프로젝트를 위한 마이그레이션. 0001~0007을 먼저 실행했다는 전제로 실행하세요.
--
-- 📒 내 골프 기록장: 회원이 먹회골프 외에 개인적으로 다녀온 라운딩을 직접 기록한다.
-- 먹회골프 라운딩은 기존 round_scores에서 자동으로 가져오므로 여기에 저장하지 않는다.
-- 기록장은 회원별 숫자 4자리 비밀번호(member_record_pins)로 잠근다.

create table if not exists personal_rounds (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  date date not null,
  time time,
  golf_course text not null,
  course text not null default '',
  score integer not null,
  -- 함께 친 먹회 회원(members.id)과 외부 동반자 이름
  companion_member_ids uuid[] not null default '{}',
  companion_names text[] not null default '{}',
  memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_personal_rounds_member on personal_rounds (member_id, date desc);

-- 기록장 비밀번호. "salt:해시" 형태로만 저장하고, 연속으로 틀리면 잠시 잠근다.
create table if not exists member_record_pins (
  member_id uuid primary key references members(id) on delete cascade,
  pin_hash text not null,
  failed_count integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table personal_rounds enable row level security;
alter table member_record_pins enable row level security;
