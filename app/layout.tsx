import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from './components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'My TickTick Planner',
  description: '일정 및 여행 예산 관리 웹앱',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${inter.className} bg-white text-slate-900 flex flex-col lg:flex-row min-h-screen overflow-x-hidden`}>
        {/* 접이식 사이드바 */}
        <Sidebar />

        {/* 웹 화면에서 사이드 여백을 더 줄인 메인 레이아웃 (max-w-[1400px] 적용) */}
        <main className="flex-1 py-4 px-3 sm:px-4 lg:px-6 overflow-y-auto pb-16 lg:pb-6 bg-white w-full min-w-0">
          <div className="max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}