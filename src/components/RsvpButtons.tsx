"use client";

import { useActionState, useEffect, useState } from "react";
import { rsvpAction } from "@/app/rounds/actions";

type RsvpState = { message: string | null };

const idleState: RsvpState = { message: null };

export function RsvpButtons({
  roundId,
  attending,
}: {
  roundId: string;
  /** 아직 체크 안 했으면 null */
  attending: boolean | null;
}) {
  const [toast, setToast] = useState<string | null>(null);

  async function attendAction(_prev: RsvpState, formData: FormData): Promise<RsvpState> {
    await rsvpAction(formData);
    const message = "참가 신청이 완료됐어요! 🙌";
    setToast(message);
    return { message };
  }

  async function declineAction(_prev: RsvpState, formData: FormData): Promise<RsvpState> {
    await rsvpAction(formData);
    const message = "불참으로 처리됐어요.";
    setToast(message);
    return { message };
  }

  const [, attendFormAction, attendPending] = useActionState(attendAction, idleState);
  const [, declineFormAction, declinePending] = useActionState(declineAction, idleState);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const pending = attendPending || declinePending;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <form action={attendFormAction} className="flex-1">
          <input type="hidden" name="round_id" value={roundId} />
          <input type="hidden" name="attending" value="true" />
          <button
            type="submit"
            disabled={pending}
            className={`btn w-full ${attending === true ? "btn-primary" : "btn-secondary"}`}
          >
            {attendPending ? "처리 중..." : "참가 O"}
          </button>
        </form>
        <form action={declineFormAction} className="flex-1">
          <input type="hidden" name="round_id" value={roundId} />
          <input type="hidden" name="attending" value="false" />
          <button
            type="submit"
            disabled={pending}
            className={`btn w-full ${attending === false ? "btn-danger" : "btn-secondary"}`}
          >
            {declinePending ? "처리 중..." : "불참 X"}
          </button>
        </form>
      </div>
      {toast && (
        <p className="rounded-lg bg-fairway/10 px-3 py-2 text-center text-sm font-semibold text-fairway-dark">
          {toast}
        </p>
      )}
    </div>
  );
}
