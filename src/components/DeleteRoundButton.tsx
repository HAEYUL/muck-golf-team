"use client";

export function DeleteRoundButton({
  roundId,
  label,
  action,
}: {
  roundId: string;
  label: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const ok = window.confirm(
          `정말 "${label}" 라운딩을 삭제할까요?\n참가체크·조편성·스코어·사진이 모두 함께 삭제되고 되돌릴 수 없어요.`
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="round_id" value={roundId} />
      <button
        type="submit"
        aria-label="라운딩 삭제"
        className="btn btn-danger !px-3 !py-1.5 !text-sm"
      >
        ✕
      </button>
    </form>
  );
}
