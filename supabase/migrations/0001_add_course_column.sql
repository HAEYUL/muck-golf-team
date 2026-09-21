-- 이미 schema.sql을 실행해서 rounds 테이블이 있는 기존 프로젝트에
-- course(코스명) 컬럼을 추가하기 위한 마이그레이션.
-- (새로 시작하는 프로젝트는 schema.sql에 이미 반영돼 있어서 이 파일이 필요 없어요.)

alter table rounds add column if not exists course text not null default '';
