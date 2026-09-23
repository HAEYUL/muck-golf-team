"use client";

export function DeleteMemberButton({
  memberId,
  label,
  action,
}: {
  memberId: string;
  label: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const ok = window.confirm(
          `정말 "${label}" 회원을 삭제할까요?\n참가체크·스코어·조편성 기록도 모두 함께 삭제되고 되돌릴 수 없어요.`
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="member_id" value={memberId} />
      <button
        type="submit"
        aria-label="회원 삭제"
        className="btn btn-danger !px-3 !py-1.5 !text-sm"
      >
        삭제
      </button>
    </form>
  );
}
