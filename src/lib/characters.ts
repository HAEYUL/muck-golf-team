/** 이름 -> public/characters 에 저장된 캐릭터 이미지 경로. DB의 character_url이 없을 때 이 값으로 대신한다 */
const CHARACTER_URLS: Record<string, string> = {
  김민환: "/characters/김민환.webp",
  김옥화: "/characters/김옥화.webp",
  김유정: "/characters/김유정.webp",
  문숙현: "/characters/문숙현.webp",
  유정선: "/characters/유정선.webp",
  유종범: "/characters/유종범.webp",
  이성표: "/characters/이성표.webp",
  조인호: "/characters/조인호.webp",
  최홍창: "/characters/최홍창.webp",
};

export function getCharacterUrl(name: string, characterUrl?: string | null): string | null {
  return characterUrl || CHARACTER_URLS[name] || null;
}
