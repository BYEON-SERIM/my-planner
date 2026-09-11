'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  LayoutDashboard
} from 'lucide-react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const menuGroups = [
    {
      groupName: '개인 관리',
      items: [
        { name: '대시보드 홈', path: '/', icon: LayoutDashboard },
        { name: '캘린더', path: '/calendar', icon: Calendar },
        { name: 'To-Do 체크리스트', path: '/todo', icon: CheckSquare },
        { name: '월간 가계부', path: '/account-book', icon: Wallet }, // 🌟 신규 일상 가계부 메뉴
      ],
    },
    {
      groupName: '여행 프로젝트',
      items: [
        { name: '여행 일정', path: '/trips', icon: Map },
        { name: '여행 경비 관리', path: '/expenses', icon: Receipt }, // ✈️ 기존 여행 전용 경비
        { name: '예약 & 티켓', path: '/attachments', icon: Paperclip },
        { name: '여행 기록 다이어리', path: '/diaries', icon: BookOpen },
      ],
    },
  ];

  return (
    <>
      {/* 모바일/패드 상단 헤더 (로고 클릭 시 메인으로 이동) */}
      <div className="lg:hidden flex items-center justify-between p-3.5 bg-white border-b border-slate-100 sticky top-0 z-40">
        <Link 
          href="/" 
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-2 font-black text-lg text-blue-600 hover:opacity-80 transition cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
            <Sparkles size={16} />
          </div>
          <span className="text-base font-extrabold text-slate-800">SECO LOG</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* PC 및 가로모드 전용 접이식 사이드바 */}
      <aside
        className={`
          fixed top-0 left-0 z-50 min-h-screen h-full bg-white border-r border-slate-100 flex flex-col justify-between p-4 transition-all duration-300 ease-in-out shrink-0
          ${isCollapsed ? 'lg:w-16' : 'lg:w-60'}
          ${isOpen ? 'translate-x-0 shadow-2xl w-60' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto lg:shadow-none
        `}
      >
        <div className="space-y-6">
          {/* 상단 로고 (클릭 시 메인 홈 이동) 및 접기 버튼 */}
          <div className="flex items-center justify-between px-1 py-1">
            <Link 
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 overflow-hidden group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 group-hover:scale-105 transition">
                <Sparkles size={18} />
              </div>
              {!isCollapsed && (
                <span className="font-black text-lg text-slate-800 tracking-tight whitespace-nowrap">
                  SECO LOG
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
              title={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            >
              {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {/* 메뉴 리스트 */}
          <nav className="space-y-5">
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
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <Icon size={18} className={`shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      {!isCollapsed && <span className="truncate text-xs">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}