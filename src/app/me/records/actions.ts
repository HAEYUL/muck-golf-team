"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireMember } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  PIN_LOCK_MINUTES,
  PIN_MAX_FAILS,
  getRecordPin,
  requireRecordsUnlocked,
  setRecordsUnlocked,
} from "@/lib/records";

export type PinState = { error: string } | null;

const PIN_PATTERN = /^\d{4}$/;

/** 기록장에 처음 들어갈 때 숫자 4자리 비밀번호를 정한다 */
export async function setRecordPinAction(
  _prevState: PinState,
  formData: FormData
): Promise<PinState> {
  const member = await requireMember();
  const pin = String(formData.get("pin") ?? "");
  const pinConfirm = String(formData.get("pin_confirm") ?? "");

  if (!PIN_PATTERN.test(pin)) return { error: "비밀번호는 숫자 4자리로 입력해주세요." };
  if (pin !== pinConfirm) return { error: "두 번 입력한 비밀번호가 서로 달라요." };
  if (await getRecordPin(member.id)) {
    return { error: "이미 비밀번호가 있어요. 화면을 새로고침해주세요." };
  }

  const pinHash = hashPassword(pin);
  const { error } = await getSupabaseAdmin()
    .from("member_record_pins")
    .insert({ member_id: member.id, pin_hash: pinHash });
  if (error) return { error: error.message };

  await setRecordsUnlocked(member.id, pinHash);
  redirect("/me/records");
}

/** 기록장 비밀번호 확인. 5번 연속 틀리면 10분 동안 잠근다 */
export async function unlockRecordsAction(
  _prevState: PinState,
  formData: FormData
): Promise<PinState> {
  const member = await requireMember();
  const pin = String(formData.get("pin") ?? "");
  const stored = await getRecordPin(member.id);
  if (!stored) redirect("/me/records");

  if (stored.locked_until && new Date(stored.locked_until) > new Date()) {
    return {
      error: `비밀번호를 여러 번 틀려서 잠겼어요. ${PIN_LOCK_MINUTES}분 뒤에 다시 시도해주세요.`,
    };
  }

  const supabase = getSupabaseAdmin();
  if (!PIN_PATTERN.test(pin) || !verifyPassword(pin, stored.pin_hash)) {
    const failedCount = stored.failed_count + 1;
    const locked = failedCount >= PIN_MAX_FAILS;
    await supabase
      .from("member_record_pins")
      .update({
        failed_count: locked ? 0 : failedCount,
        locked_until: locked
          ? new Date(Date.now() + PIN_LOCK_MINUTES * 60 * 1000).toISOString()
          : null,
      })
      .eq("member_id", member.id);
    return {
      error: locked
        ? `비밀번호를 ${PIN_MAX_FAILS}번 틀려서 ${PIN_LOCK_MINUTES}분 동안 잠겼어요.`
        : `비밀번호가 맞지 않아요. (${failedCount}/${PIN_MAX_FAILS})`,
    };
  }

  if (stored.failed_count > 0 || stored.locked_until) {
    await supabase
      .from("member_record_pins")
      .update({ failed_count: 0, locked_until: null })
      .eq("member_id", member.id);
  }
  await setRecordsUnlocked(member.id, stored.pin_hash);
  redirect("/me/records");
}

function readPersonalRoundForm(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const golfCourse = String(formData.get("golf_course") ?? "").trim();
  const course = String(formData.get("course") ?? "").trim();
  const scoreRaw = String(formData.get("score") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();
  const companionMemberIds = formData
    .getAll("companion_member_ids")
    .map(String)
    .filter(Boolean);
  const companionNames = String(formData.get("companion_names") ?? "")
    .split(/[,，、]/)
    .map((name) => name.trim())
    .filter(Boolean);

  if (!date || !golfCourse || !scoreRaw) {
    throw new Error("날짜, 골프장, 타수는 꼭 입력해주세요.");
  }
  const score = Number(scoreRaw);
  if (!Number.isInteger(score) || score < 1 || score > 300) {
    throw new Error("타수는 1~300 사이의 숫자로 입력해주세요.");
  }

  return {
    date,
    time: time || null,
    golf_course: golfCourse,
    course,
    score,
    memo,
    companion_member_ids: companionMemberIds,
    companion_names: companionNames,
  };
}

/** 개인 라운딩 새로 기록 (id가 있으면 수정) */
export async function savePersonalRoundAction(formData: FormData) {
  const member = await requireMember();
  await requireRecordsUnlocked(member.id);

  const id = String(formData.get("id") ?? "");
  const values = readPersonalRoundForm(formData);
  const supabase = getSupabaseAdmin();

  if (id) {
    const { error } = await supabase
      .from("personal_rounds")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("member_id", member.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("personal_rounds")
      .insert({ ...values, member_id: member.id });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/me/records");
  redirect("/me/records");
}

export async function deletePersonalRoundAction(formData: FormData) {
  const member = await requireMember();
  await requireRecordsUnlocked(member.id);

  const id = String(formData.get("id") ?? "");
  const { error } = await getSupabaseAdmin()
    .from("personal_rounds")
    .delete()
    .eq("id", id)
    .eq("member_id", member.id);
  if (error) throw new Error(error.message);

  revalidatePath("/me/records");
  redirect("/me/records");
}
