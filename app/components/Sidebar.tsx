'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  CheckSquare, 
  Wallet, 
  Map, 
  Receipt, 
  Paperclip, 
  BookOpen, 
  Image as ImageIcon,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuGroups = [
    {
      groupName: '개인 관리',
      items: [
        { name: 'HOME', path: '/', icon: LayoutDashboard },
        { name: '캘린더', path: '/calendar', icon: Calendar },
        { name: 'To Do LIST', path: '/todo', icon: CheckSquare },
        { name: '월간 가계부', path: '/account-book', icon: Wallet },
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
      {/* 모바일 상단 네비게이션 바 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-100 z-40 px-4 flex items-center justify-between shadow-2xs">
        <Link href="/" className="flex items-center gap-2 font-black text-slate-800 text-base">
          <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center text-white">
            <Sparkles size={16} />
          </div>
          SECO LOG
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* 모바일 딤 배경 */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
        />
      )}

      {/* 🌟 좌측 고정 사이드바 컨테이너 */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-100 z-50 flex flex-col justify-between p-4 sm:p-5 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* 브랜드 로고 */}
          <Link href="/" className="flex items-center gap-2.5 font-black text-slate-800 text-lg sm:text-xl px-1">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles size={18} />
            </div>
            <span>SECO LOG</span>
          </Link>

          {/* 메뉴 그룹 내비게이션 */}
          <nav className="space-y-5 overflow-y-auto max-h-[calc(100vh-160px)] pr-1 no-scrollbar">
            {menuGroups.map((group) => (
              <div key={group.groupName} className="space-y-1.5">
                <p className="text-[11px] font-black text-slate-400 px-3 uppercase tracking-wider">
                  {group.groupName}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path;

                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-blue-50 text-blue-600 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* 하단 유저 / 앱 정보 프로필 바 */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold">SECO LOG v1.0</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" title="온라인" />
        </div>
      </aside>
    </>
  );
}