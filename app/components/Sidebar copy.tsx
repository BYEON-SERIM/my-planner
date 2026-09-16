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
  LayoutDashboard,
  Image as ImageIcon
} from 'lucide-react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

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
      {/* 모바일/패드 전용 상단 헤더 (화면 폭이 좁을 때 노출) */}
      <div className="lg:hidden flex items-center justify-between p-3.5 bg-white border-b border-slate-100 fixed top-0 left-0 right-0 z-40">
        {/* 1. 왼쪽: 햄버거 메뉴 버튼 + 반짝이는 아이콘 */}
        <div className="flex items-center">
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

      {/* 모바일 메뉴 열림 시 배경 오버레이 */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
        />
      )}

      {/* PC 및 가로모드 전용 고정/접이식 사이드바 */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-white border-r border-slate-100 flex flex-col justify-between p-4 transition-all duration-300 ease-in-out shrink-0
          ${isCollapsed ? 'lg:w-16' : 'lg:w-60'}
          ${isOpen ? 'translate-x-0 shadow-2xl w-60' : '-translate-x-full'}
          lg:translate-x-0 lg:shadow-none lg:sticky
        `}
      >
        <div className="space-y-6">
          {/* 상단 로고 & PC 사이드바 토글(축소) 버튼 */}
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

            {/* PC 전용 축소 토글 버튼 */}
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
          <nav className="space-y-5 overflow-y-auto max-h-[calc(100vh-140px)] no-scrollbar">
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
                      <Icon size={18} className={`shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      {!isCollapsed && <span className="truncate text-xs">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* 하단 버전 정보 */}
        {!isCollapsed && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-[11px]">SECO LOG v1.0</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="온라인" />
          </div>
        )}
      </aside>
    </>
  );
}