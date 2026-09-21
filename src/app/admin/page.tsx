import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import { listMembers, listRounds } from "@/lib/queries";
import { formatCourseLabel, formatDate, formatTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteRoundButton } from "@/components/DeleteRoundButton";
import { AdminPasswordForm } from "@/components/AdminPasswordForm";
import {
  createRoundAction,
  deleteRoundAction,
  publishRoundAction,
} from "@/app/rounds/actions";
import { addGuestAction, toggleAdminAction, updateSkillRanksAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/");
  if (!member.is_admin) redirect("/");

  const [members, rounds] = await Promise.all([listMembers(), listRounds()]);
  const upcomingRounds = rounds.filter((r) => r.status !== "완료");

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-fairway-dark">🛠 관리자 페이지</h1>
        <Link href="/" className="text-sm font-semibold text-fairway">
          홈으로
        </Link>
      </header>

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
        <div className="flex flex-col gap-2">
          {rounds.map((r) => (
            <div
              key={r.id}
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
                <DeleteRoundButton
                  roundId={r.id}
                  label={formatCourseLabel(r)}
                  action={deleteRoundAction}
                />
              </div>
            </div>
          ))}
        </div>
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
        <h2 className="text-lg font-bold">실력 순위 (skill_rank) 조정</h2>
        <p className="text-sm text-foreground/60">
          숫자가 작을수록 실력이 높은 멤버예요. 실력 균등 모드에서 사용돼요.
        </p>
        <form action={updateSkillRanksAction} className="flex flex-col gap-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3">
              <span className="font-semibold">
                {m.name} {m.is_guest && <span className="text-xs text-foreground/50">(게스트)</span>}
              </span>
              <input
                type="number"
                name={`skill_${m.id}`}
                defaultValue={m.skill_rank}
                className="w-20 rounded-lg border-2 border-sand px-2 py-2 text-center"
              />
            </div>
          ))}
          <button type="submit" className="btn btn-secondary mt-2 w-full">
            순위 저장하기
          </button>
        </form>
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-bold">관리자 권한 관리</h2>
        <div className="flex flex-col gap-2">
          {members
            .filter((m) => !m.is_guest)
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
