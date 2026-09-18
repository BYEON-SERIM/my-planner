'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import {
  Sparkles,
  Calendar,
  Map,
  Receipt,
  Paperclip,
  BookOpen,
  Menu,
  X,
  CheckSquare,
  Wallet,
  PanelLeftClose,
  PanelLeft,
  LayoutDashboard,
  Image as ImageIcon,
  LogOut,
  LogIn,
  Heart
} from 'lucide-react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    const redirectUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/auth/callback'
      : 'https://my-planner-lovat.vercel.app/auth/callback';

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
  };

  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    await supabase.auth.signOut();
  };

  const menuGroups = [
    {
      groupName: '개인 관리',
      items: [
        { name: 'HOME', path: '/', icon: LayoutDashboard },
        { name: '캘린더', path: '/calendar', icon: Calendar },
        { name: 'To Do LIST', path: '/todo', icon: CheckSquare },
        { name: '월간 가계부', path: '/account-book', icon: Wallet },
        { name: '약속 쿠폰함', path: '/coupons', icon: Heart },
      ],
    },
    {
      groupName: '여행 프로젝트',
      items: [
        { name: '여행 일정', path: '/trips', icon: Map },
        { name: '여행 경비 관리', path: '/expenses', icon: Receipt },
        { name: '예약 & 티켓', path: '/attachments', icon: Paperclip },
        { name: '여행 포토 일기', path: '/diaries', icon: BookOpen },
        { name: '추억 갤러리', path: '/gallery', icon: ImageIcon },
      ],
    },
  ];

  return (
    <>
      {/* 모바일/패드 전용 상단 헤더 */}
      <div className="lg:hidden flex items-center justify-between p-3.5 bg-white border-b border-slate-100 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="font-black text-base text-slate-800 hover:opacity-80 transition cursor-pointer tracking-tight"
          >
            SECO LOG
          </Link>
        </div>
      </div>

      {/* 모바일 메뉴 오버레이 */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
        />
      )}

      {/* PC 및 고정/접이식 사이드바 */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-white border-r border-slate-100 flex flex-col justify-between p-4 transition-all duration-300 ease-in-out shrink-0
          ${isCollapsed ? 'lg:w-16' : 'lg:w-60'}
          ${isOpen ? 'translate-x-0 shadow-2xl w-60' : '-translate-x-full'}
          lg:translate-x-0 lg:shadow-none lg:sticky
        `}
      >
        <div className="space-y-6">
          {/* 상단 로고 & 토글 버튼 */}
          <div className="flex items-center justify-between px-1 py-1">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 overflow-hidden group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-blue-600 shrink-0">
                <Sparkles size={18} />
              </div>
              {!isCollapsed && (
                <span className="font-black text-lg text-slate-800 tracking-tight whitespace-nowrap">
                  SECO LOG
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
              title={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            >
              {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {/* 메뉴 리스트 */}
          <nav className="space-y-5 overflow-y-auto max-h-[calc(100vh-200px)] no-scrollbar">
            {menuGroups.map((group, groupIdx) => (
              <div key={group.groupName} className="space-y-1">
                {!isCollapsed ? (
                  <p className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider mb-2">
                    {group.groupName}
                  </p>
                ) : (
                  groupIdx > 0 && <div className="my-2 border-t border-slate-100" />
                )}

                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <Icon 
                        size={18} 
                        className={`shrink-0 ${
                          isActive 
                            ? 'text-blue-600' 
                            : 'text-slate-400'
                        }`} 
                      />
                      {!isCollapsed && (
                        <span className="truncate text-xs">{item.name}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* 하단 로그인/프로필 영역 */}
        <div className="pt-3 border-t border-slate-100">
          {loading ? (
            <div className="py-2 text-center text-[10px] text-slate-400">확인 중...</div>
          ) : user ? (
            <div className={`flex items-center justify-between gap-2 px-1 ${isCollapsed ? 'flex-col justify-center' : ''}`}>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="프로필"
                    className="w-7 h-7 rounded-full border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-[10px] shrink-0">
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                      {user.user_metadata?.full_name || '사용자'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate leading-tight">{user.email}</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                title="로그아웃"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleLogin}
              className={`w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                isCollapsed ? 'px-0' : ''
              }`}
              title="Google 로그인"
            >
              <LogIn size={15} />
              {!isCollapsed && <span>Google 로그인</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}