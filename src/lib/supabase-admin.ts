import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

/**
 * 서버 전용 Supabase 클라이언트. Service role 키를 사용하므로
 * 절대 클라이언트 컴포넌트나 브라우저로 전달하면 안 된다.
 * 환경변수가 없을 때는 실제로 호출되는 시점에만 에러를 던져서
 * (빌드 타임에는 이 함수가 호출되지 않으므로) 빌드가 깨지지 않게 한다.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 를 .env.local 에 설정해주세요."
    );
  }

  cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}
