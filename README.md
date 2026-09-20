# 먹회골프 — 팀 편성 게임 앱

골프 모임 "먹회골프" 인원을 게임처럼 팀 편성하고, 라운딩 기록(스코어·사진)을 누적 보관하는 웹앱입니다.

- 기술 스택: Next.js 16 (App Router) + Supabase + Vercel
- 로그인: 회원가입/비밀번호 없이 이름 자동완성으로 본인 확인

## 1. Supabase 프로젝트 준비

1. [supabase.com](https://supabase.com) 에서 새 프로젝트를 만듭니다.
2. 프로젝트의 **SQL Editor** 에서 아래 순서로 실행합니다.
   1. `supabase/schema.sql` — 테이블 생성
   2. `supabase/seed.sql` — 고정 멤버 11명 등록 (배우자 관계 포함)
   3. `supabase/storage.sql` — 사진 업로드용 공개 버킷 생성
3. 시드 데이터의 관리자는 기본으로 **이성표**로 지정돼 있습니다. 실제 운영할 관리자로
   바꾸려면 `seed.sql` 맨 아래 주석 처리된 `update` 문을 참고해서 SQL Editor에서
   실행하세요.
4. **Project Settings → API** 에서 `Project URL` 과 `service_role` 키(secret)를 복사합니다.
   - `service_role` 키는 절대 클라이언트(브라우저)에 노출되지 않고, 서버 코드에서만
     사용됩니다(Server Components / Server Actions).

## 2. 환경변수 설정

`.env.example` 을 복사해 `.env.local` 을 만들고 값을 채워주세요.

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=발급받은 Project URL
SUPABASE_SERVICE_ROLE_KEY=발급받은 service_role 키
SUPABASE_PHOTO_BUCKET=round-photos
```

## 3. 로컬 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인합니다.

## 4. Vercel 배포

1. 이 저장소를 Vercel 프로젝트로 Import 합니다.
2. Vercel 프로젝트의 **Environment Variables** 에 2단계와 동일한 값을 등록합니다.
3. Deploy 합니다.

## 화면/기능 요약

- **홈**: 이름 자동완성 로그인, 멤버 라인업, 다음 라운딩 카드(참가 체크 / 팀 뽑기 진입)
- **관리자 페이지** (`/admin`): 라운딩 생성, 라운딩 목록, 게스트 추가, 실력 순위(skill_rank)
  조정, 관리자 권한 부여
- **라운딩 상세** (`/rounds/[id]`): 상태별(모집중 → 마감 → 팀확정 → 진행중 → 완료) 화면 전환,
  참가 체크, 팀 편성 모드 선택(완전랜덤 / 부부한팀 / 부부갈라놓기 / 남녀균등 / 실력균등),
  다시 팀짜기, 팀 결과, 스코어/사진
- **팀 뽑기 게임** (`/rounds/[id]/draw`): 이름을 눌러 골프공을 뽑는 인터랙션으로 팀 결과를
  하나씩 공개
- **스코어보드 입력** (`/rounds/[id]/score`): 팀별/개인별 타수 입력 + 사진 업로드 →
  라운딩을 "완료" 상태로 전환
- **추억 페이지** (`/memories`): 완료된 라운딩을 시간순 카드 피드로 조회
- **마이페이지** (`/me`): 개인 참여 횟수, 평균 타수, 최고 기록, 역대 라운딩

## 데이터 구조

`supabase/schema.sql` 참고: `members`, `rounds`, `round_participants`,
`team_assignments`(재편성 이력 포함), `round_scores`, `round_results` 6개 테이블로
구성됩니다.

## v2 확장 포인트

- `members.character_url` 필드가 이미 열려 있어서, 추후 AI로 생성한 캐릭터 이미지를
  연결해도 다른 테이블 변경 없이 확장할 수 있습니다.
- 게스트도 `is_guest = true` 로 `members` 테이블에 저장되므로, 자주 오는 게스트를
  재사용할 수 있습니다.
