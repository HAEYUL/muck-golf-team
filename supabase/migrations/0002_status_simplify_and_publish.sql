-- 기존 프로젝트(이미 schema.sql v1을 실행한 DB)를 위한 마이그레이션.
-- 0001_add_course_column.sql 을 먼저 실행했다는 전제로 실행하세요.
--
-- 1) 라운딩 상태를 4단계로 단순화: 모집중 / 조편성중 / 확정 / 완료
--    (기존 "마감" -> "조편성중", "팀확정"/"진행중" -> "확정")
-- 2) 홈 화면에 노출할 라운딩을 관리자가 직접 고를 수 있도록 is_published 컬럼 추가

update rounds set status = '조편성중' where status = '마감';
update rounds set status = '확정' where status in ('팀확정', '진행중');

alter table rounds drop constraint if exists rounds_status_check;
alter table rounds add constraint rounds_status_check
  check (status in ('모집중', '조편성중', '확정', '완료'));

alter table rounds add column if not exists is_published boolean not null default false;

create unique index if not exists idx_rounds_single_published
  on rounds ((is_published))
  where is_published;
