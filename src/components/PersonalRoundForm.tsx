import Link from "next/link";
import { savePersonalRoundAction } from "@/app/me/records/actions";
import type { PersonalRound } from "@/lib/types";

const inputClass = "rounded-xl border-2 border-sand px-4 py-3 text-lg";
const labelTextClass = "text-sm font-semibold text-foreground/70";

/** 개인 라운딩 기록/수정 폼. round가 있으면 수정 모드 */
export function PersonalRoundForm({
  round,
  members,
  golfCourseSuggestions,
}: {
  round?: PersonalRound;
  members: { id: string; name: string }[];
  golfCourseSuggestions: string[];
}) {
  const selectedCompanions = new Set(round?.companion_member_ids ?? []);

  return (
    <form action={savePersonalRoundAction} className="card flex flex-col gap-4">
      {round && <input type="hidden" name="id" value={round.id} />}
      <div className="flex gap-2">
        <label className="flex flex-1 flex-col gap-1">
          <span className={labelTextClass}>날짜 *</span>
          <input
            type="date"
            name="date"
            required
            defaultValue={round?.date ?? new Date().toISOString().slice(0, 10)}
            className="rounded-xl border-2 border-sand px-3 py-3"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className={labelTextClass}>시간</span>
          <input
            type="time"
            name="time"
            defaultValue={round?.time?.slice(0, 5) ?? ""}
            className="rounded-xl border-2 border-sand px-3 py-3"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className={labelTextClass}>골프장 *</span>
        <input
          type="text"
          name="golf_course"
          required
          list="golf-course-suggestions"
          defaultValue={round?.golf_course ?? ""}
          placeholder="예: 태광CC"
          className={inputClass}
        />
        <datalist id="golf-course-suggestions">
          {golfCourseSuggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelTextClass}>코스명</span>
        <input
          type="text"
          name="course"
          defaultValue={round?.course ?? ""}
          placeholder="없으면 비워두세요"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelTextClass}>타수 *</span>
        <input
          type="number"
          name="score"
          required
          min={1}
          max={300}
          inputMode="numeric"
          defaultValue={round?.score ?? ""}
          placeholder="예: 92"
          className={inputClass}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${labelTextClass} mb-1`}>동반자 (먹회 회원)</legend>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <label
              key={m.id}
              className="flex items-center gap-1.5 rounded-full border-2 border-sand px-3 py-1.5 text-sm has-[:checked]:border-fairway has-[:checked]:bg-fairway/10"
            >
              <input
                type="checkbox"
                name="companion_member_ids"
                value={m.id}
                defaultChecked={selectedCompanions.has(m.id)}
              />
              {m.name}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className={labelTextClass}>동반자 (그 외)</span>
        <input
          type="text"
          name="companion_names"
          defaultValue={round?.companion_names.join(", ") ?? ""}
          placeholder="여러 명이면 쉼표로 구분 (예: 홍길동, 김철수)"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelTextClass}>메모</span>
        <textarea
          name="memo"
          rows={3}
          defaultValue={round?.memo ?? ""}
          placeholder="예: 드라이버 잘 맞음, 3퍼트 4번"
          className="rounded-xl border-2 border-sand px-4 py-3 text-base"
        />
      </label>

      <button type="submit" className="btn btn-primary w-full">
        {round ? "수정 저장하기" : "기록 저장하기"}
      </button>
      <Link href="/me/records" className="btn btn-secondary w-full">
        취소
      </Link>
    </form>
  );
}
