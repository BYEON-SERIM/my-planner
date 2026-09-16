import type { Metadata, Viewport } from 'next';
import './globals.css';
import Sidebar from './components/Sidebar';

export const metadata: Metadata = {
  title: 'SECO LOG',
  description: '일정 및 여행 예산 관리 웹앱',
};

// 🌟 모바일/패드 포커스 시 화면 줌인 및 쏠림 방지
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-slate-50/50 text-slate-900 antialiased font-['Pretendard']">
        <div className="min-h-screen flex flex-col lg:flex-row">
          {/* 사이드바 */}
          <Sidebar />

          {/* 메인 영역 */}
          <main className="flex-1 min-w-0 transition-all lg:pt-0">
            {/* 🌟 max-w-5xl 제거: 일반 PC/노트북 화면부터 기본 7xl(최대 1280px) 이상으로 시원하게 확장 */}
            <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}