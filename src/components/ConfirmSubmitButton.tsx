"use client";

/** 누르면 확인창을 띄우고, 확인했을 때만 제출하는 폼 버튼 */
export function ConfirmSubmitButton({
  action,
  fields,
  message,
  label,
  className,
}: {
  action: (formData: FormData) => void;
  fields: Record<string, string>;
  message: string;
  label: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
