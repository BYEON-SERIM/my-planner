'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Users, Loader2 } from 'lucide-react';

// 🌟 Suspense 내부로 로직 분리
function JoinTripContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [msg, setMsg] = useState('여행 멤버 등록 중입니다...');

  useEffect(() => {
    const processJoin = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMsg('동행자로 참여하려면 먼저 구글 로그인이 필요합니다.');
        setStatus('error');
        return;
      }

      if (!token) {
        setMsg('올바르지 않은 공유 링크입니다.');
        setStatus('error');
        return;
      }

      const res = await fetch('/api/trips/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userId: user.id }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMsg('여행 프로젝트 멤버로 등록되었습니다! 해당 여행 페이지로 이동합니다.');
        setTimeout(() => {
          router.push('/trips');
        }, 1500);
      } else {
        setStatus('error');
        setMsg(data.error || '참여 처리에 실패했습니다.');
      }
    };

    processJoin();
  }, [token, router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full space-y-4">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          {status === 'loading' ? <Loader2 size={24} className="animate-spin" /> : <Users size={24} />}
        </div>
        
        <h2 className="text-lg font-bold text-slate-800">
          {status === 'loading' && '여행 일정 공유 참여'}
          {status === 'success' && '참여 완료!'}
          {status === 'error' && '참여 안내'}
        </h2>
        
        <p className="text-xs text-slate-500 leading-relaxed">{msg}</p>

        {status === 'error' && (
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold transition hover:bg-blue-700 cursor-pointer"
          >
            홈으로 이동
          </button>
        )}
      </div>
    </div>
  );
}

// 🌟 메인 Export 부분에서 Suspense 감싸기
export default function JoinTripPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">페이지 로딩 중...</div>}>
      <JoinTripContent />
    </Suspense>
  );
}