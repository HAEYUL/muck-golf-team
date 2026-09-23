import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";

export const dynamic = "force-dynamic";

const TEAM_MODES = [
  { emoji: "🎲", name: "완전 랜덤", desc: "무작위로 배분해요." },
  { emoji: "💑", name: "부부 한 팀", desc: "부부(커플)는 항상 같은 팀으로 배정해요." },
  { emoji: "💔", name: "부부 갈라놓기", desc: "부부(커플)는 항상 다른 팀으로 배정해요." },
  { emoji: "⚖️", name: "남녀 균등", desc: "각 팀의 남녀 비율을 고르게 맞춰요." },
  { emoji: "🎯", name: "실력 균등", desc: "실력 순위가 각 팀에 고르게 섞이도록 배분해요." },
];

const STEPS = [
  {
    title: "1. 시작하기",
    body: "홈 화면에서 본인 이름을 찾아 선택하면 입장돼요.",
  },
  {
    title: "2. 참가 체크하기",
    body: '다음 라운딩이 뜨면 "참가 O" 또는 "불참 X"를 눌러주세요. 관리자가 마감하면 다음 단계로 넘어가요.',
  },
  {
    title: "4. 라운딩 진행 & 스코어",
    body: "라운딩 당일, 관리자가 스코어보드에 타수를 입력해요. 완료되면 홈 화면과 라운딩 상세 페이지에서 순위를 확인할 수 있어요.",
  },
  {
    title: "5. 추억 페이지",
    body: "완료된 라운딩은 추억 페이지에 카드로 모여요. 카드를 누르면 조편성/스코어/추억사진을 자세히 볼 수 있고, 라운딩 상세에서 사진도 올릴 수 있어요.",
  },
  {
    title: "6. 마이페이지",
    body: "내 참여 횟수, 평균 타수, 최고 기록, 역대 라운딩을 한눈에 볼 수 있어요.",
  },
];

const ADMIN_SECTIONS = [
  {
    title: "라운딩 만들기 & 관리",
    items: [
      "관리자 페이지에서 날짜·시간·골프장(코스명 선택)을 입력해 새 라운딩을 만들어요.",
      '만든 라운딩은 "게시" 버튼을 눌러야 회원들에게 보여요. 필요하면 삭제도 가능해요.',
      '라운딩 상세 페이지에서 "이전 단계로 되돌리기"로 단계를 되돌릴 수 있어요 (예: 조편성중 → 모집중).',
    ],
  },
  {
    title: "참가 체크 관리",
    items: [
      '회원들이 참가/불참을 체크하면, 관리자가 "참가 체크 마감하기"를 눌러 조편성 단계로 넘겨요.',
      '마감 후에도 필요하면 "참가 체크 다시 열기"로 되돌릴 수 있고, 참가자 명단에서 특정 회원의 참가 여부를 대신 체크/초기화할 수도 있어요.',
    ],
  },
  {
    title: "조편성 관리",
    items: [
      '"팀 뽑기 게임 시작하기"에서 5가지 방식 중 하나를 골라 시작해요.',
      '회원이 직접 뽑는 대신 "수동으로 편성하기"로 관리자가 직접 팀을 짤 수도 있어요.',
      '전원이 다 뽑지 않아도 "모두 완료된 것으로 처리하고 확정하기"로 바로 확정할 수 있어요.',
      '확정 후에도 "다시 팀짜기"로 새로 뽑거나 수동으로 수정할 수 있어요.',
    ],
  },
  {
    title: "스코어 관리",
    items: ['라운딩 확정 후 "스코어보드 입력하기"에서 팀별/개인별 타수를 입력해요. 완료 후에도 수정 가능해요.'],
  },
  {
    title: "공지사항 & 회원 관리",
    items: [
      "공지사항을 기간(시작일~종료일)을 정해 등록하면 홈 화면 이름 아래에 노출돼요.",
      "게스트 회원을 이름·성별로 추가하고, 원하는 라운딩에 바로 참가시킬 수 있어요.",
      "전에 왔던 게스트는 「기존 게스트 참가시키기」에서 골라 다시 참가시켜요. 같은 이름으로 게스트를 추가해도 새로 만들지 않고 기존 게스트를 그대로 써요.",
      '회원별 실력 순위를 직접 조정하거나 "평균순으로 자동 채우기"로 한 번에 정렬할 수 있어요 (실력 균등 모드에서 사용돼요).',
      "다른 회원에게 관리자 권한을 주거나 해제할 수 있어요.",
      "본인 관리자 비밀번호를 설정/변경할 수 있어요.",
    ],
  },
];

export default async function GuidePage() {
  const member = await getCurrentMember();
  if (!member) redirect("/");

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-fairway">
          ← 홈으로
        </Link>
        <h1 className="text-xl font-extrabold text-fairway-dark">📖 앱 가이드</h1>
      </header>

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-bold">{STEPS[0].title}</h2>
        <p className="text-foreground/80">{STEPS[0].body}</p>
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-bold">{STEPS[1].title}</h2>
        <p className="text-foreground/80">{STEPS[1].body}</p>
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-bold">3. 조편성 게임 참여하기</h2>
        <p className="text-foreground/80">
          참가 체크가 마감되면 조편성이 시작돼요. 홈 화면에서 본인 이름(캐릭터)을 눌러 팀 뽑기
          게임에 참여하세요. 모든 인원이 뽑으면 팀이 확정돼요.
        </p>
        <p className="text-sm font-semibold text-foreground/70">
          관리자가 고르는 조편성 방식에 따라 팀이 이렇게 나뉘어요:
        </p>
        <div className="flex flex-col gap-2">
          {TEAM_MODES.map((mode) => (
            <div
              key={mode.name}
              className="flex items-start gap-2 rounded-xl bg-sand/30 px-3 py-2"
            >
              <span className="text-lg" aria-hidden="true">
                {mode.emoji}
              </span>
              <p className="text-sm">
                <span className="font-bold">{mode.name}</span>
                <span className="text-foreground/70"> — {mode.desc}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {STEPS.slice(2).map((step) => (
        <section key={step.title} className="card flex flex-col gap-3">
          <h2 className="text-lg font-bold">{step.title}</h2>
          <p className="text-foreground/80">{step.body}</p>
        </section>
      ))}

      <section className="card flex flex-col gap-4 border-2 border-accent/40">
        <h2 className="text-lg font-bold text-accent">🛠 관리자 전용 기능</h2>
        {ADMIN_SECTIONS.map((section) => (
          <div key={section.title} className="flex flex-col gap-1.5">
            <h3 className="font-bold text-fairway-dark">{section.title}</h3>
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => (
                <li key={item} className="flex gap-1.5 text-sm text-foreground/80">
                  <span className="text-foreground/40">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
