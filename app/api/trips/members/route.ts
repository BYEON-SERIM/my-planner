import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 1. 동행자 목록 조회 (Supabase Auth 데이터와 연동)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('tripId');

  if (!tripId) {
    return NextResponse.json({ error: 'tripId가 필요합니다.' }, { status: 400 });
  }

  // trip_members 정보 조회
  const { data: members, error } = await supabase
    .from('trip_members')
    .select('id, user_id, created_at')
    .eq('trip_id', tripId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members });
}

// 2. 동행자 삭제 (공유 해제)
export async function DELETE(request: Request) {
  try {
    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json({ error: 'memberId가 필요합니다.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('trip_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      return NextResponse.json({ error: '공유 해제 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: '서버 에러' }, { status: 500 });
  }
}