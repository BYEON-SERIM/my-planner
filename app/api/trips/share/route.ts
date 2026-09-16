import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { token, userId } = await request.json();

    if (!token || !userId) {
      return NextResponse.json({ error: '토큰 또는 유저 ID가 누락되었습니다.' }, { status: 400 });
    }

    // 1. share_token으로 해당 여행 찾기 (maybeSingle 사용으로 406/RLS 에러 방지)
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, user_id')
      .eq('share_token', token)
      .maybeSingle();

    if (tripError) {
      console.error('DB 조회 에러:', tripError);
      return NextResponse.json({ error: `DB 에러: ${tripError.message}` }, { status: 500 });
    }

    if (!trip) {
      return NextResponse.json({ error: '유효하지 않은 공유 토큰입니다. (여행을 찾을 수 없음)' }, { status: 404 });
    }

    // 2. 여행 작성자 본인인 경우 바로 성공 처리
    if (trip.user_id === userId) {
      return NextResponse.json({ success: true, tripId: trip.id, message: '본인이 작성한 여행입니다.' });
    }

    // 3. trip_members 테이블에 멤버 추가
    const { error: insertError } = await supabase
      .from('trip_members')
      .upsert([{ trip_id: trip.id, user_id: userId }], { onConflict: 'trip_id,user_id' });

    if (insertError) {
      console.error('멤버 등록 실패:', insertError);
      return NextResponse.json({ error: `멤버 등록 실패: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, tripId: trip.id });
  } catch (err: any) {
    console.error('서버 예외 발생:', err);
    return NextResponse.json({ error: err.message || '서버 에러' }, { status: 500 });
  }
}