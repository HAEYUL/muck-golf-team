const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

export function formatTime(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(":");
  const h = Number(hStr);
  if (Number.isNaN(h)) return timeStr;
  const period = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${h12}시${mStr && mStr !== "00" ? ` ${mStr}분` : ""}`;
}

/** "태화CC" + "올림프스코스" -> "태화CC · 올림프스코스" (코스명이 없으면 골프장명만) */
export function formatCourseLabel(round: { golf_course: string; course: string }): string {
  return round.course ? `${round.golf_course} · ${round.course}` : round.golf_course;
}
