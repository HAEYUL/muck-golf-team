-- 기존 프로젝트를 위한 마이그레이션.
-- 0001, 0002 마이그레이션을 먼저 실행했다는 전제로 실행하세요.
--
-- 1) 관리자 로그인 시 비밀번호를 확인할 수 있도록 members.password_hash 추가
--    (비어있으면 지금처럼 비밀번호 없이 로그인 가능 - 최초 1회는 이 상태)
-- 2) 라운딩별 건의사항 게시판(round_suggestions) 추가 - 누구나 쓰고 볼 수 있음

alter table members add column if not exists password_hash text;

create table if not exists round_suggestions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_round_suggestions_round on round_suggestions (round_id);

alter table round_suggestions enable row level security;
