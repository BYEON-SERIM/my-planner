import { createClient } from '@supabase/supabase-js';

// .env.local 파일에 적어둔 키 값을 불러옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 앱 전체에서 가져다 쓸 수 있는 Supabase 연결 리모컨(클라이언트)을 만듭니다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);