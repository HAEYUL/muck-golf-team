-- 기존 프로젝트를 위한 마이그레이션. 0001~0005를 먼저 실행했다는 전제로 실행하세요.
--
-- 나이순(연장자 우선) 표시 순서를 위한 age_rank 컬럼 추가.
-- 스코어 관련 화면(스코어 순위, 실력순위 조정)을 제외한 모든 명단(참가자 명단,
-- 조편성 게임, 팀 편성 결과, 관리자 게스트/권한 목록 등)이 이 순서를 따른다.
-- 게스트나 값이 없는 멤버는 기본값(999)이라 항상 맨 뒤에 표시된다.

alter table members add column if not exists age_rank integer not null default 999;

update members set age_rank = 1 where name = '이성표';
update members set age_rank = 2 where name = '조인호';
update members set age_rank = 3 where name = '유종범';
update members set age_rank = 4 where name = '문숙현';
update members set age_rank = 5 where name = '최홍창';
update members set age_rank = 6 where name = '김민환';
update members set age_rank = 7 where name = '유정선';
update members set age_rank = 8 where name = '김옥화';
update members set age_rank = 9 where name = '김유정';
update members set age_rank = 10 where name = '이효신';
update members set age_rank = 11 where name = '채효진';
-- 게스트(예: 황선정 등)는 컬럼 기본값(999) 그대로 맨 뒤에 표시됩니다.
