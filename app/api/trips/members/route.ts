import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');

    if (!tripId) {
      return NextResponse.json({ error: 'tripId가 필요합니다.' }, { status: 400 });
    }

    // trip_members 테이블에서 해당 여행의 동행자 목록 조회
    const { data: members, error } = await supabase
      .from('trip_members')
      .select('id, user_id, created_at')
      .eq('trip_id', tripId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ members });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '서버 에러' }, { status: 500 });
  }
}