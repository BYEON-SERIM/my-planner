import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { token, userId } = await request.json();

    if (!token || !userId) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    // 1. share_token으로 대상 여행 조회
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, user_id')
      .eq('share_token', token)
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ error: '유효하지 않은 공유 링크입니다.' }, { status: 404 });
    }

    // 2. 이미 본인 여행이거나 멤버로 등록되어 있는지 확인 후 추가
    if (trip.user_id !== userId) {
      const { error: insertError } = await supabase
        .from('trip_members')
        .upsert([{ trip_id: trip.id, user_id: userId }], { onConflict: 'trip_id,user_id' });

      if (insertError) {
        return NextResponse.json({ error: '멤버 추가에 실패했습니다.' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, tripId: trip.id });
  } catch (err) {
    return NextResponse.json({ error: '서버 에러가 발생했습니다.' }, { status: 500 });
  }
}