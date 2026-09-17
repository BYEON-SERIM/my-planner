import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 🌟 반드시 POST라는 이름의 함수로 export가 되어 있어야 합니다.
export async function POST(request: Request) {
  try {
    const { token, userId } = await request.json();

    if (!token || !userId) {
      return NextResponse.json({ error: '인자 값이 부족합니다.' }, { status: 400 });
    }

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, user_id')
      .eq('share_token', token)
      .maybeSingle();

    if (tripError || !trip) {
      return NextResponse.json({ error: '유효하지 않은 공유 토큰입니다.' }, { status: 404 });
    }

    if (trip.user_id === userId) {
      return NextResponse.json({ success: true, tripId: trip.id, message: '본인 여행입니다.' });
    }

    const { error: insertError } = await supabase
      .from('trip_members')
      .upsert([{ trip_id: trip.id, user_id: userId }], { onConflict: 'trip_id,user_id' });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, tripId: trip.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '서버 에러' }, { status: 500 });
  }
}