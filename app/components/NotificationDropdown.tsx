'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Bell, Trash2, X, Sparkles } from 'lucide-react';

interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  // 1. 유저 정보 및 알림 가져오기
  const initNotifications = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const uid = session.user.id;
      setCurrentUserId(uid);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(15);

      if (!error && data) {
        setNotifications(data as NotificationItem[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initNotifications();
  }, [initNotifications]);

  // 2. Realtime 실시간 알림 구독
  useEffect(() => {
    if (!currentUserId) return;

    // 🌟 고유한 채널 이름 생성
    const channelName = `notif_${currentUserId}_${Math.random().toString(36).substring(2, 7)}`;
    const newChannel = supabase.channel(channelName);

    // 🌟 .on() 리스너를 먼저 완벽하게 바인딩한 후 .subscribe()를 마지막에 호출
    newChannel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          setNotifications((prev) => [payload.new as NotificationItem, ...prev]);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // 정상 구독 확인
        }
      });

    // 🌟 클린업: 언마운트 시 해당 채널을 안전하게 제거
    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [currentUserId]);

  // 알림 클릭 시 읽음 처리 + 해당 페이지 이동
  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', item.id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
    }

    setIsOpen(false);
    if (item.link_url) {
      router.push(item.link_url);
    }
  };

  // 모두 읽음 처리
  const handleMarkAllAsRead = async () => {
    if (!currentUserId) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', currentUserId)
      .eq('is_read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  // 개별 알림 삭제
  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // 안 읽은 알림 개수
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // 🌟 안 읽은 알림이 0개면 종 아이콘 완전히 숨김
  if (unreadCount === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* 종 아이콘 버튼 (안 읽은 알림이 있을 때만 노출) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
        title="알림함"
      >
        <Bell size={20} />
        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      </button>

      {/* 모바일 딤 배경 오버레이 */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-[9998]"
        />
      )}

      {/* 알림 드롭다운 팝업 레이어 */}
      {isOpen && (
        <div className="
          fixed inset-x-3 top-16 max-w-sm mx-auto
          lg:absolute lg:top-full lg:left-0 lg:right-auto lg:mt-2 lg:w-80 lg:mx-0
          bg-white rounded-2xl shadow-2xl border border-slate-100 z-[9999] overflow-hidden transition-all
        ">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-1.5 min-w-0">
              <Bell size={16} className="text-blue-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 shrink-0">알림 소식함</span>
              <span className="text-[10px] font-extrabold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
                {unreadCount}개 안읽음
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer whitespace-nowrap"
              >
                모두 읽음
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-[65vh] lg:max-h-80 overflow-y-auto divide-y divide-slate-50">
            {notifications
              .filter((item) => !item.is_read)
              .map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className="p-3.5 transition cursor-pointer flex items-start justify-between gap-2.5 hover:bg-slate-50 bg-blue-50/40 font-semibold"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0" />
                      <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug break-keep">{item.message}</p>
                    <p className="text-[9px] text-slate-400 mt-1">{new Date(item.created_at).toLocaleString()}</p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteNotification(e, item.id)}
                    className="p-1 text-slate-300 hover:text-red-500 transition cursor-pointer shrink-0"
                    title="삭제"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}