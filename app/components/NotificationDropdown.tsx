'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Bell, Check, Trash2, X, Sparkles, ExternalLink } from 'lucide-react';

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
  const router = useRouter();

  // 알림 목록 불러오기
  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15);

    if (!error && data) {
      setNotifications(data as NotificationItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    // 🌟 Supabase Realtime: 새 알림 오면 실시간 업데이트
    const channel = supabase
      .channel('realtime_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          setNotifications((prev) => [payload.new as NotificationItem, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 🌟 클릭 시 해당 페이지 이동 + 읽음 처리 (뱃지 사라짐)
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

  // 🌟 전체 모두 읽음 처리 (뱃지 전체 없애기)
  const handleMarkAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  // 개별 알림 삭제
  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // 안 읽은 알림 개수 계산
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative">
      {/* 종 아이콘 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
        title="알림함"
      >
        <Bell size={20} />
        {/* 안 읽은 알림 빨간 뱃지 */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 드롭다운 팝업 레이어 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Bell size={16} className="text-blue-600" />
              <span className="text-xs font-bold text-slate-800">알림 소식함</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-extrabold bg-red-100 text-red-600 px-1.5 py-0.2 rounded-md">
                  {unreadCount}개 안읽음
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  모두 읽음
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* 알림 피드 리스트 */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <p className="text-xs text-slate-400 text-center py-8">알림 확인 중...</p>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center space-y-1">
                <Sparkles className="w-5 h-5 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-400">도착한 새 알림이 없습니다.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3 transition cursor-pointer flex items-start justify-between gap-2 hover:bg-slate-50 ${
                    !item.is_read ? 'bg-blue-50/40 font-semibold' : 'opacity-70'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {!item.is_read && (
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0" />
                      )}
                      <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{item.message}</p>
                    <p className="text-[9px] text-slate-400 mt-1">{new Date(item.created_at).toLocaleString()}</p>
                  </div>

                  <button
                    onClick={(e) => handleDeleteNotification(e, item.id)}
                    className="p-1 text-slate-300 hover:text-red-500 transition cursor-pointer shrink-0"
                    title="삭제"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}