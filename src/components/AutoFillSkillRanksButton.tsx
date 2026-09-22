"use client";

export function AutoFillSkillRanksButton() {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.closest("form");
    if (!form) return;
    const inputs = form.querySelectorAll<HTMLInputElement>('input[name^="skill_"]');
    inputs.forEach((input, idx) => {
      input.value = String(idx + 1);
    });
  }

  return (
    <button type="button" onClick={handleClick} className="btn btn-secondary w-full">
      평균순으로 자동 채우기
    </button>
  );
}
