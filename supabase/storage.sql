-- 라운딩 사진을 저장할 공개 Storage 버킷을 만든다.
-- 업로드는 서버(Service Role Key)에서만 하고, 다운로드(공개 URL)는 누구나 볼 수 있게 한다.

insert into storage.buckets (id, name, public)
values ('round-photos', 'round-photos', true)
on conflict (id) do nothing;
