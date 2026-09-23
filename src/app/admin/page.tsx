import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import { getMemberAverageScores, listAllAnnouncements, listMembers, listRounds } from "@/lib/queries";
import { formatCourseLabel, formatDate, formatTime } from "@/lib/format";
import type { Round } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteRoundButton } from "@/components/DeleteRoundButton";
import { AdminPasswordForm } from "@/components/AdminPasswordForm";
import { AutoFillSkillRanksButton } from "@/components/AutoFillSkillRanksButton";
import { DeleteMemberButton } from "@/components/DeleteMemberButton";
import {
  createRoundAction,
  deleteRoundAction,
  publishRoundAction,
} from "@/app/rounds/actions";
import {
  addGuestAction,
  addMemberAction,
  createAnnouncementAction,
  deleteAnnouncementAction,
  deleteMemberAction,
  promoteGuestToMemberAction,
  toggleAdminAction,
  toggleMemberActiveAction,
  updateMemberAction,
  updateSkillRanksAction,
} from "./actions";

export const dynamic = "force-dynamic";

function RoundListItem({ round: r }: { round: Round }) {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl border-2 px-4 py-3"
      style={{ borderColor: r.is_published ? "var(--fairway)" : "var(--sand)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/rounds/${r.id}`}
          className="cursor-pointer transition-colors hover:text-fairway hover:underline"
        >
          <p className="font-bold">{formatCourseLabel(r)}</p>
          <p className="text-sm text-foreground/60">
            {formatDate(r.date)} · {formatTime(r.time)}
          </p>
        </Link>
        <StatusBadge status={r.status} />
      </div>
      <div className="flex items-center gap-2">
        <form action={publishRoundAction} className="flex-1">
          <input type="hidden" name="round_id" value={r.id} />
          <button
            type="submit"
            className={`btn w-full !py-1.5 !text-sm ${
              r.is_published ? "btn-primary" : "btn-secondary"
            }`}
          >
            {r.is_published ? "게시중 ✓" : "게시"}
          </button>
        </form>
        <DeleteRoundButton roundId={r.id} label={formatCourseLabel(r)} action={deleteRoundAction} />
      </div>
    </div>
  );
}

export default async function AdminPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/");
  if (!member.is_admin) redirect("/");

  const [members, rounds, averageByMember, announcements] = await Promise.all([
    listMembers(),
    listRounds(),
    getMemberAverageScores(),
    listAllAnnouncements(),
  ]);
  const upcomingRounds = rounds.filter((r) => r.status !== "완료");
  const pastRounds = rounds.filter((r) => r.status === "완료");

  const membersBySkill = members
    .filter((m) => !m.is_guest && m.is_active)
    .sort((a, b) => {
      const avgA = averageByMember[a.id] ?? Infinity;
      const avgB = averageByMember[b.id] ?? Infinity;
      return avgA - avgB;
    });

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-fairway-dark">🛠 관리자 페이지</h1>
        <Link href="/" className="text-sm font-semibold text-fairway">
          홈으로
        </Link>
      </header>

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-bold">📢 공지사항</h2>
        <p className="text-sm text-foreground/60">
          지정한 기간 동안만 홈 화면 이름 아래에 노출돼요. 기간이 지나면 자동으로 사라져요.
        </p>
        <form action={createAnnouncementAction} className="flex flex-col gap-3">
          <textarea
            name="content"
            required
            placeholder="공지 내용을 입력하세요"
            rows={2}
            className="rounded-xl border-2 border-sand px-4 py-3 text-base"
          />
          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-semibold text-foreground/70">시작일</span>
              <input
                type="date"
                name="start_date"
                required
                className="rounded-xl border-2 border-sand px-3 py-3"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-semibold text-foreground/70">종료일</span>
              <input
                type="date"
                name="end_date"
                required
                className="rounded-xl border-2 border-sand px-3 py-3"
              />
            </label>
          </div>
          <button type="submit" className="btn btn-primary w-full">
            공지사항 등록하기
          </button>
        </form>

        {announcements.length > 0 && (
          <div className="flex flex-col gap-2">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between gap-2 rounded-lg bg-sand/30 px-3 py-2"
              >
                <div>
                  <p className="text-sm text-foreground/90">{a.content}</p>
                  <p className="mt-1 text-xs text-foreground/50">
                    {formatDate(a.start_date)} ~ {formatDate(a.end_date)}
                  </p>
                </div>
                <form action={deleteAnnouncementAction}>
                  <input type="hidden" name="announcement_id" value={a.id} />
                  <button
                    type="submit"
                    className="shrink-0 text-xs font-semibold text-danger"
                    aria-label="공지사항 삭제"
                  >
                    삭제
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-bold">새 라운딩 만들기</h2>
        <form action={createRoundAction} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground/70">날짜</span>
            <input
              type="date"
              name="date"
              required
              className="rounded-xl border-2 border-sand px-4 py-3 text-lg"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground/70">시간</span>
            <input
              type="time"
              name="time"
              required
              className="rounded-xl border-2 border-sand px-4 py-3 text-lg"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground/70">골프장</span>
            <input
              type="text"
              name="golf_course"
              placeholder="예: 뉴스프링빌CC"
              required
              className="rounded-xl border-2 border-sand px-4 py-3 text-lg"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground/70">
              코스명 (선택)
            </span>
            <input
              type="text"
              name="course"
              placeholder="예: 올림프스코스 (없으면 비워두세요)"
              className="rounded-xl border-2 border-sand px-4 py-3 text-lg"
            />
          </label>
          <button type="submit" className="btn btn-primary w-full">
            라운딩 생성하기
          </button>
        </form>
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-bold">라운딩 목록</h2>
        {rounds.length === 0 && (
          <p className="text-foreground/60">아직 만든 라운딩이 없어요.</p>
        )}
        {rounds.length > 0 && upcomingRounds.length === 0 && (
          <p className="text-foreground/60">진행중인 라운딩이 없어요.</p>
        )}
        <div className="flex flex-col gap-2">
          {upcomingRounds.map((r) => (
            <RoundListItem key={r.id} round={r} />
          ))}
        </div>

        {pastRounds.length > 0 && (
          <details className="rounded-xl border-2 border-sand p-3">
            <summary className="cursor-pointer font-bold">
              지난 라운딩 보기 ({pastRounds.length}개)
            </summary>
            <div className="mt-3 flex flex-col gap-2">
              {pastRounds.map((r) => (
                <RoundListItem key={r.id} round={r} />
              ))}
            </div>
          </details>
        )}
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-bold">게스트 추가</h2>
        <form action={addGuestAction} className="flex flex-col gap-3">
          <input
            type="text"
            name="name"
            placeholder="게스트 이름"
            required
            className="rounded-xl border-2 border-sand px-4 py-3 text-lg"
          />
          <div className="flex gap-2">
            <label className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-sand py-3">
              <input type="radio" name="gender" value="남" defaultChecked /> 남
            </label>
            <label className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-sand py-3">
              <input type="radio" name="gender" value="여" /> 여
            </label>
          </div>
          {upcomingRounds.length > 0 && (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-foreground/70">
                참가시킬 라운딩 (선택)
              </span>
              <select
                name="round_id"
                className="rounded-xl border-2 border-sand px-4 py-3 text-lg"
                defaultValue=""
              >
                <option value="">선택 안 함</option>
                {upcomingRounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    {formatDate(r.date)} {r.golf_course}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button type="submit" className="btn btn-primary w-full">
            게스트 추가하기
          </button>
        </form>
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-bold">회원 관리</h2>
        <p className="text-sm text-foreground/60">
          이름·성별을 고치거나, 게스트를 정회원으로 전환할 수 있어요. 정회원이 탈퇴하면
          「탈퇴 처리」를 눌러주세요 — 로그인 명단·참가체크에서만 빠지고 과거 기록은 그대로
          남아요. 「삭제」는 완전히 지우는 것이라 참가체크·스코어·조편성 기록도 함께
          사라지니, 중복 등록된 게스트처럼 정말 필요없는 회원에게만 사용해주세요.
        </p>
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <div key={m.id} className="flex flex-col gap-2 rounded-xl border-2 border-sand p-3">
              <form action={updateMemberAction} className="flex items-center gap-2">
                <input type="hidden" name="member_id" value={m.id} />
                <input
                  type="text"
                  name="name"
                  defaultValue={m.name}
                  required
                  className="min-w-0 flex-1 rounded-lg border-2 border-sand px-3 py-2"
                />
                <select
                  name="gender"
                  defaultValue={m.gender}
                  className="rounded-lg border-2 border-sand px-2 py-2"
                >
                  <option value="남">남</option>
                  <option value="여">여</option>
                </select>
                <button type="submit" className="btn btn-secondary shrink-0 !px-3 !py-2 !text-sm">
                  저장
                </button>
              </form>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-foreground/50">
                  {m.is_guest ? "게스트" : "정회원"}
                  {!m.is_active && <span className="ml-1 text-danger">· 비활성</span>}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  {m.is_guest && (
                    <form action={promoteGuestToMemberAction}>
                      <input type="hidden" name="member_id" value={m.id} />
                      <button
                        type="submit"
                        className="btn btn-secondary !px-3 !py-1.5 !text-sm"
                      >
                        정회원 전환
                      </button>
                    </form>
                  )}
                  {!m.is_guest && (
                    <form action={toggleMemberActiveAction}>
                      <input type="hidden" name="member_id" value={m.id} />
                      <input type="hidden" name="is_active" value={(!m.is_active).toString()} />
                      <button
                        type="submit"
                        className="btn btn-secondary !px-3 !py-1.5 !text-sm"
                      >
                        {m.is_active ? "탈퇴 처리" : "재활성화"}
                      </button>
                    </form>
                  )}
                  <DeleteMemberButton memberId={m.id} label={m.name} action={deleteMemberAction} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <details className="rounded-xl border-2 border-sand p-3">
          <summary className="cursor-pointer font-bold">➕ 새 회원 추가</summary>
          <form action={addMemberAction} className="mt-3 flex flex-col gap-3">
            <input
              type="text"
              name="name"
              placeholder="이름"
              required
              className="rounded-xl border-2 border-sand px-4 py-3 text-lg"
            />
            <div className="flex gap-2">
              <label className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-sand py-3">
                <input type="radio" name="gender" value="남" defaultChecked /> 남
              </label>
              <label className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-sand py-3">
                <input type="radio" name="gender" value="여" /> 여
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
              <input type="checkbox" name="is_guest" value="true" />
              게스트로 추가 (체크 안 하면 정회원으로 추가돼요)
            </label>
            <button type="submit" className="btn btn-primary w-full">
              회원 추가하기
            </button>
          </form>
        </details>
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-bold">실력 순위 (skill_rank) 조정</h2>
        <p className="text-sm text-foreground/60">
          숫자가 작을수록 실력이 높은 멤버예요. 실력 균등 모드에서 사용돼요. 개인 평균
          타수가 좋은(낮은) 순으로 정렬했어요.
        </p>
        <form action={updateSkillRanksAction} className="flex flex-col gap-2">
          {membersBySkill.map((m) => {
            const avg = averageByMember[m.id];
            return (
              <div key={m.id} className="flex items-center justify-between gap-3">
                <span className="font-semibold">
                  {m.name}
                  <span className="ml-1 text-xs font-normal text-foreground/50">
                    {avg ? `평균 ${avg.toFixed(1)}타` : "기록 없음"}
                  </span>
                </span>
                <input
                  type="number"
                  name={`skill_${m.id}`}
                  defaultValue={m.skill_rank}
                  className="w-20 rounded-lg border-2 border-sand px-2 py-2 text-center"
                />
              </div>
            );
          })}
          <AutoFillSkillRanksButton />
          <button type="submit" className="btn btn-primary w-full">
            순위 저장하기
          </button>
        </form>
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-bold">관리자 권한 관리</h2>
        <div className="flex flex-col gap-2">
          {members
            .filter((m) => !m.is_guest && m.is_active)
            .map((m) => (
              <form
                key={m.id}
                action={toggleAdminAction}
                className="flex items-center justify-between"
              >
                <input type="hidden" name="member_id" value={m.id} />
                <input type="hidden" name="is_admin" value={(!m.is_admin).toString()} />
                <span className="font-semibold">{m.name}</span>
                <button
                  type="submit"
                  className={`btn !px-3 !py-1.5 !text-sm ${
                    m.is_admin ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  {m.is_admin ? "관리자 O" : "관리자 X"}
                </button>
              </form>
            ))}
        </div>
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-bold">🔒 내 관리자 비밀번호</h2>
        <p className="text-sm text-foreground/60">
          {member.password_hash
            ? "비밀번호가 설정돼 있어요. 이름 선택 후 로그인 시 확인해요."
            : "아직 비밀번호가 없어요. 지금은 이름만 선택해도 로그인돼요. 설정하면 다음부터 비밀번호를 물어봐요."}
        </p>
        <AdminPasswordForm />
      </section>
    </main>
  );
}
