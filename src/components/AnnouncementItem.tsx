"use client";

import { useState } from "react";
import type { Announcement } from "@/lib/types";
import { formatDate } from "@/lib/format";

type Mode = "view" | "edit" | "repost";

/** 기기 시간 기준 YYYY-MM-DD (재공지 기본 기간 계산용) */
function localDateString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * 관리자 페이지의 공지 카드 하나.
 * 수정: 그 자리에서 내용·기간을 고친다(순서 유지).
 * 재공지: 같은 내용을 새 공지로 등록해 현재 공지로 올린다(원래 공지는 기록으로 남음).
 */
export function AnnouncementItem({
  announcement: a,
  isCurrent,
  updateAction,
  repostAction,
  deleteAction,
}: {
  announcement: Announcement;
  isCurrent: boolean;
  updateAction: (formData: FormData) => Promise<void>;
  repostAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [mode, setMode] = useState<Mode>("view");
  const [pending, setPending] = useState(false);

  const boxClass = `rounded-lg px-3 py-2 ${isCurrent ? "bg-accent/10" : "bg-sand/30"}`;
  const smallBtn = "rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap";

  if (mode === "view") {
    return (
      <div className={`flex flex-col gap-2 ${boxClass}`}>
        <div>
          <p className="whitespace-pre-wrap text-sm text-foreground/90">{a.content}</p>
          <p className="mt-1 text-xs text-foreground/50">
            {formatDate(a.start_date)} ~ {formatDate(a.end_date)}
          </p>
        </div>
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => setMode("edit")}
            className={`${smallBtn} bg-white text-fairway`}
          >
            수정
          </button>
          {!isCurrent && (
            <button
              type="button"
              onClick={() => setMode("repost")}
              className={`${smallBtn} bg-white text-accent`}
            >
              재공지
            </button>
          )}
          <form
            action={deleteAction}
            onSubmit={(e) => {
              if (!window.confirm("이 공지를 삭제할까요? 되돌릴 수 없어요.")) e.preventDefault();
            }}
          >
            <input type="hidden" name="announcement_id" value={a.id} />
            <button
              type="submit"
              aria-label="공지사항 삭제"
              className={`${smallBtn} bg-white text-danger`}
            >
              삭제
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isEdit = mode === "edit";
  const submit = async (formData: FormData) => {
    setPending(true);
    try {
      await (isEdit ? updateAction : repostAction)(formData);
      setMode("view");
    } finally {
      setPending(false);
    }
  };

  return (
    <form action={submit} className={`flex flex-col gap-2 ${boxClass}`}>
      <p className="text-xs font-semibold text-foreground/70">
        {isEdit ? "✏️ 공지 수정" : "🔁 재공지 — 새 공지로 등록되어 현재 공지가 돼요"}
      </p>
      {isEdit && <input type="hidden" name="announcement_id" value={a.id} />}
      <textarea
        name="content"
        required
        defaultValue={a.content}
        rows={3}
        className="rounded-xl border-2 border-sand bg-white px-3 py-2 text-base"
      />
      <div className="flex gap-2">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-semibold text-foreground/70">시작일</span>
          <input
            type="date"
            name="start_date"
            required
            defaultValue={isEdit ? a.start_date : localDateString()}
            className="w-full rounded-xl border-2 border-sand bg-white px-2 py-2"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-semibold text-foreground/70">종료일</span>
          <input
            type="date"
            name="end_date"
            required
            defaultValue={isEdit ? a.end_date : localDateString(7)}
            className="w-full rounded-xl border-2 border-sand bg-white px-2 py-2"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("view")}
          disabled={pending}
          className="btn btn-secondary flex-1 !py-2 !text-sm"
        >
          취소
        </button>
        <button type="submit" disabled={pending} className="btn btn-primary flex-1 !py-2 !text-sm">
          {pending ? "저장 중…" : isEdit ? "수정 저장" : "재공지하기"}
        </button>
      </div>
    </form>
  );
}
