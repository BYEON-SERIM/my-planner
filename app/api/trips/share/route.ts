import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { token, userId } = await request.json();

    if (!token || !userId) {
      return NextResponse.json({ error: '인자 값이 부족합니다.' }, { status: 400 });
    }

    // 1. share_token으로 여행 찾기
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, user_id')
      .eq('share_token', token)
      .single();

    if (tripError || !trip) {
      console.error('여행 조회 실패:', tripError);
      return NextResponse.json({ error: '유효하지 않은 공유 토큰입니다.' }, { status: 404 });
    }

    // 2. 이미 작성자인지 확인
    if (trip.user_id === userId) {
      return NextResponse.json({ success: true, tripId: trip.id, message: '본인 여행입니다.' });
    }

    // 3. trip_members 테이블에 멤버 등록
    const { error: insertError } = await supabase
      .from('trip_members')
      .upsert([{ trip_id: trip.id, user_id: userId }], { onConflict: 'trip_id,user_id' });

    if (insertError) {
      console.error('멤버 등록 DB 에러:', insertError); // 🌟 터미널 콘솔에서 원인 확인 가능
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, tripId: trip.id });
  } catch (err: any) {
    console.error('서버 내부 에러:', err);
    return NextResponse.json({ error: err.message || '서버 에러' }, { status: 500 });
  }
}