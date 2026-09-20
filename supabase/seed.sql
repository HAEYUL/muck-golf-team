-- 먹회골프 고정 멤버 11명 시드 데이터
-- schema.sql 을 먼저 실행한 뒤 이 파일을 실행하세요.

insert into members (name, gender, skill_rank, is_admin) values
  ('이성표', '남', 1, true),
  ('문숙현', '여', 2, false),
  ('김옥화', '여', 3, false),
  ('최홍창', '남', 4, false),
  ('조인호', '남', 5, false),
  ('김민환', '남', 6, false),
  ('이효신', '남', 7, false),
  ('유종범', '남', 8, false),
  ('유정선', '여', 9, false),
  ('김유정', '여', 10, false),
  ('채효진', '여', 11, false);

-- 배우자 연결 (양방향)
update members set partner_id = (select id from members where name = '김옥화') where name = '이성표';
update members set partner_id = (select id from members where name = '이성표') where name = '김옥화';
update members set partner_id = (select id from members where name = '조인호') where name = '문숙현';
update members set partner_id = (select id from members where name = '문숙현') where name = '조인호';
update members set partner_id = (select id from members where name = '유정선') where name = '김민환';
update members set partner_id = (select id from members where name = '김민환') where name = '유정선';
update members set partner_id = (select id from members where name = '채효진') where name = '이효신';
update members set partner_id = (select id from members where name = '이효신') where name = '채효진';
update members set partner_id = (select id from members where name = '김유정') where name = '유종범';
update members set partner_id = (select id from members where name = '유종범') where name = '김유정';
-- 최홍창은 솔로 멤버라 partner_id 를 비워둡니다.

-- 관리자는 기본으로 '이성표'에게 지정했습니다.
-- 실제 운영할 관리자 계정으로 바꾸려면 아래처럼 실행하세요.
-- update members set is_admin = false where name = '이성표';
-- update members set is_admin = true where name = '원하는 이름';
