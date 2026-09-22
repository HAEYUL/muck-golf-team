/**
 * 팀 편성 알고리즘이 정한 순서(랜덤 등)와 무관하게, 멤버 id 배열을
 * 주어진 순서(orderedIds, 보통 나이순으로 정렬된 전체 멤버 id 목록)에
 * 맞춰 다시 정렬한다. orderedIds에 없는 id는 맨 뒤로 보낸다.
 */
export function sortIdsByOrder(ids: string[], orderedIds: string[]): string[] {
  const indexOf = new Map(orderedIds.map((id, i) => [id, i]));
  return [...ids].sort((a, b) => (indexOf.get(a) ?? Infinity) - (indexOf.get(b) ?? Infinity));
}
