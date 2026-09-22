-- 기존 프로젝트를 위한 마이그레이션. 0001~0004를 먼저 실행했다는 전제로 실행하세요.
--
-- 공지사항: 관리자가 작성하고, 지정한 기간(start_date~end_date) 동안만
-- 홈 화면 상단(이름 바로 아래)에 노출된다. 활성화된 공지가 없으면
-- 홈 화면에 공지사항 칸 자체가 보이지 않는다.

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  start_date date not null,
  end_date date not null,
  created_by uuid references members(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_announcements_dates on announcements (start_date, end_date);

alter table announcements enable row level security;
