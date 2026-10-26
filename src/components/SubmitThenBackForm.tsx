"use client";

import { useRouter } from "next/navigation";
import { goBack } from "@/lib/navigation";

/**
 * 입력 화면(스코어 입력, 수동 팀 편성 등)용 폼. 저장이 끝나면 바로 전 화면으로 돌아간다.
 * 서버에서 redirect하면 뒤로가기 기록에 입력 화면이 남아서, 뒤로가기를 누르면 다시 입력 화면이 나온다.
 */
export function SubmitThenBackForm({
  action,
  fallbackHref,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  fallbackHref: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <form
      action={async (formData) => {
        await action(formData);
        goBack(router, fallbackHref);
      }}
      className={className}
    >
      {children}
    </form>
  );
}
