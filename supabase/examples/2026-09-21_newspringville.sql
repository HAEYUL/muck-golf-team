-- 2026-09-21(월) 뉴스프링빌CC 올림프스코스 라운딩 기록 (수동 입력)
-- 0001_add_course_column.sql 을 먼저 실행한 뒤 이 파일을 실행하세요.

do $$
declare
  v_round_id uuid;
begin
  insert into rounds (date, time, golf_course, course, status)
  values ('2026-09-21', '12:44', '뉴스프링빌CC', '올림프스코스', '확정')
  returning id into v_round_id;

  insert into round_participants (round_id, member_id, attending)
  select v_round_id, id, true
  from members
  where name in (
    '이성표', '문숙현', '김옥화', '최홍창', '조인호',
    '김민환', '이효신', '유종범', '유정선', '김유정', '채효진'
  );

  insert into team_assignments (round_id, attempt_no, mode, teams)
  values (
    v_round_id,
    1,
    'manual',
    jsonb_build_object(
      '1', jsonb_build_array(
        (select id from members where name = '김민환'),
        (select id from members where name = '유정선'),
        (select id from members where name = '이효신'),
        (select id from members where name = '채효진')
      ),
      '2', jsonb_build_array(
        (select id from members where name = '문숙현'),
        (select id from members where name = '김옥화'),
        (select id from members where name = '김유정')
      ),
      '3', jsonb_build_array(
        (select id from members where name = '이성표'),
        (select id from members where name = '조인호'),
        (select id from members where name = '유종범'),
        (select id from members where name = '최홍창')
      )
    )
  );
end $$;
