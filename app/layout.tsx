import type { Metadata } from 'next';
import './globals.css';
import Sidebar from './components/Sidebar';

export const metadata: Metadata = {
  title: 'SECO LOG',
  description: '일정 및 여행 예산 관리 웹앱',
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
          <main className="flex-1 min-w-0 transition-all pt-14 lg:pt-0">
            <div className="w-full max-w-5xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}