import "server-only";
import { redirect } from "next/navigation";
import { getCurrentMember } from "./session";
import { getRecordPin, isRecordsUnlocked } from "./records";
import type { Member } from "./types";

/** 기록장 하위 페이지(기록하기/수정) 공통: 로그인 + 기록장 잠금 해제가 안 돼 있으면 기록장 첫 화면으로 */
export async function requireUnlockedRecordsPage(): Promise<Member> {
  const member = await getCurrentMember();
  if (!member) redirect("/");
  const pin = await getRecordPin(member.id);
  if (!(await isRecordsUnlocked(member.id, pin))) redirect("/me/records");
  return member;
}
