'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  BookOpen, 
  Paperclip, 
  Plus, 
  Sparkles, 
  ChevronRight, 
  Wallet,
  MapPin,
  CheckSquare,
  Clock,
  CalendarDays,
  X,
  FileText,
  Check
} from 'lucide-react';

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  color: string;
}

interface Expense {
  id: string;
  amount: number;
  payment_method: string;
}

interface Attachment {
  id: string;
  file_name: string;
  category: string;
  booking_no: string;
  public_url: string;
}

interface ScheduleItem {
  id: string;
  title: string;
  date: string;
  category: string;
  is_completed: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  start_date: string;
  color?: string;
}

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [quickAttachments, setQuickAttachments] = useState<Attachment[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [weeklyEvents, setWeeklyEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getThisWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
      startStr: monday.toISOString().split('T')[0],
      endStr: sunday.toISOString().split('T')[0],
    };
  };

  const fetchDashboardData = async () => {
    setLoading(true);

    // 1. schedules 불러오기
    const { data: scheduleData, error: schedError } = await supabase
      .from('schedules')
      .select('*')
      .order('date', { ascending: true });

    if (!schedError && scheduleData) {
      const filtered = scheduleData.filter(
        (item) => item.category === '개인' || item.category === '업무'
      );
      setSchedules(filtered);
    }

    const weekRange = getThisWeekRange();

    // 🌟 2. [수정됨] calendar_events 제거 ➔ schedules와 trips로 이번주 일정 집계
    const { data: weekSchedules } = await supabase
      .from('schedules')
      .select('id, title, date, category')
      .gte('date', weekRange.startStr)
      .lte('date', weekRange.endStr)
      .order('date', { ascending: true });

    const { data: tripSchedule } = await supabase
      .from('trips')
      .select('id, title, start_date, color')
      .gte('start_date', weekRange.startStr)
      .lte('start_date', weekRange.endStr);

    const combinedEvents: CalendarEvent[] = [];

    if (weekSchedules) {
      weekSchedules.forEach((s) => {
        combinedEvents.push({
          id: s.id,
          title: s.title,
          start_date: s.date,
          color: s.category === '업무' ? '#6366f1' : '#3b82f6',
        });
      });
    }

    if (tripSchedule) {
      tripSchedule.forEach((t) => {
        combinedEvents.push({
          id: t.id,
          title: `✈️ ${t.title}`,
          start_date: t.start_date,
          color: t.color || '#10b981',
        });
      });
    }

    setWeeklyEvents(combinedEvents);

    // 3. 여행 정보 불러오기
    const { data: tripData } = await supabase
      .from('trips')
      .select('*')
      .order('start_date', { ascending: true });

    if (tripData && tripData.length > 0) {
      setTrips(tripData);

      const todayStr = getTodayString();
      const ongoingOrUpcoming = tripData.find((t) => t.end_date >= todayStr) || tripData[0];
      setActiveTrip(ongoingOrUpcoming);

      if (ongoingOrUpcoming) {
        const tripId = ongoingOrUpcoming.id;

        const { data: expData } = await supabase
          .from('expenses')
          .select('id, amount, payment_method')
          .eq('trip_id', tripId);
        if (expData) setExpenses(expData);

        const { data: attachData } = await supabase
          .from('attachments')
          .select('*')
          .eq('trip_id', tripId)
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (attachData && attachData.length > 0) {
          setQuickAttachments(attachData);
        } else {
          const { data: backupAttach } = await supabase
            .from('trip_attachments')
            .select('*')
            .eq('trip_id', tripId)
            .order('created_at', { ascending: false })
            .limit(3);
          if (backupAttach) {
            setQuickAttachments(
              backupAttach.map((a: any) => ({
                id: a.id,
                file_name: a.file_name || a.title || '예약 서류',
                category: a.category || '서류',
                booking_no: a.booking_no || '',
                public_url: a.public_url || a.file_url || a.url || '',
              }))
            );
          }
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('schedules')
      .update({ is_completed: !currentStatus })
      .eq('id', id);

    if (!error) fetchDashboardData();
  };

  const calculateDDay = (startDateStr: string, endDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDateStr);
    end.setHours(0, 0, 0, 0);

    // 1. 여행 중일 때: 상큼한 에메랄드 파스텔
    if (today >= start && today <= end) {
      const diffTime = Math.abs(today.getTime() - start.getTime());
      const currentDayNum = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return { 
        text: `✈️ 여행 중 (Day ${currentDayNum})`, 
        badgeBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' 
      };
    }

    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 2. 다가오는 여행(D-Day): 또렷하고 산뜻한 블루 소프트 뱃지
    if (diffDays > 0) {
      return { 
        text: `D-${diffDays}`, 
        badgeBg: 'bg-blue-50 text-blue-600 border border-blue-200/60' 
      };
    } else {
      // 3. 지난 여행: 차분한 슬레이트 뱃지
      return { 
        text: `D+${Math.abs(diffDays)} (완료)`, 
        badgeBg: 'bg-slate-100 text-slate-500 border border-slate-200/60' 
      };
    }
  };

  const todayStr = getTodayString();
  const todaySchedules = schedules.filter((s) => s.date === todayStr);
  const remainingTodayCount = todaySchedules.filter((s) => !s.is_completed).length;

  const weekRange = getThisWeekRange();
  const thisWeekSchedules = schedules.filter(
    (s) => s.date >= weekRange.startStr && s.date <= weekRange.endStr
  );
  const completedCount = thisWeekSchedules.filter((s) => s.is_completed).length;
  const progressPercent = thisWeekSchedules.length > 0 
    ? Math.round((completedCount / thisWeekSchedules.length) * 100) 
    : 0;

  const grandTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-2">
        <Sparkles className="w-6 h-6 text-blue-500 mx-auto animate-pulse" />
        <p className="text-xs text-slate-400 font-medium">대시보드를 준비하는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full pb-8">
      {/* 🌟 1. 모바일 반응형 보정: 상단 대시보드 퀵 서머리 바 */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4 divide-x divide-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
            <span className="text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap">
              오늘 할 일 <strong className="text-blue-600 font-extrabold">{remainingTodayCount}개</strong> 남음
            </span>
          </div>
          <div className="pl-3 sm:pl-4 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
            <span className="text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap">
              금주 일정 <strong className="text-indigo-600 font-extrabold">{thisWeekSchedules.length}개</strong>
            </span>
          </div>
        </div>

        <Link
          href="/todo"
          className="text-[11px] sm:text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center justify-end gap-1 transition cursor-pointer pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-50"
        >
          <Plus size={13} /> 새 Task 추가
        </Link>
      </div>

      {/* 2. 메인 영역: 오늘의 To Do & 금주 일정 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* 오늘의 To Do */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CheckSquare className="w-5 h-5 text-blue-600 shrink-0" />
              <h2 className="text-sm sm:text-lg font-black text-slate-900 truncate">
                오늘의 To Do
              </h2>
            </div>
            <Link href="/todo" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 shrink-0 whitespace-nowrap">
              전체보기 <span className="hidden sm:inline">({completedCount}/{thisWeekSchedules.length})</span> <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-2.5 overflow-y-auto flex-1 max-h-[260px]">
            {todaySchedules.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl space-y-1">
                <p className="text-xs font-semibold text-slate-500">오늘 예정된 할 일이 없습니다.</p>
                <Link href="/todo" className="text-[11px] font-bold text-blue-600 hover:underline">
                  + 투두 페이지에서 할 일 추가하기
                </Link>
              </div>
            ) : (
              todaySchedules.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between transition hover:border-slate-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      onClick={() => toggleComplete(item.id, item.is_completed)}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition cursor-pointer shrink-0 ${
                        item.is_completed
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 hover:border-blue-500 bg-white'
                      }`}
                    >
                      {item.is_completed && <Check size={13} strokeWidth={3} />}
                    </button>

                    <span className={`text-xs sm:text-sm font-semibold truncate ${item.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {item.title}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-slate-200 text-blue-600 rounded-md shrink-0 ml-2">
                    {item.category}
                  </span>
                </div>
              ))
            )}
          </div>

          {thisWeekSchedules.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>주간 투두 달성률</span>
                <span className="text-blue-600">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 이번 주 스케줄 */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CalendarDays className="w-5 h-5 text-indigo-600 shrink-0" />
              <h2 className="text-sm sm:text-lg font-black text-slate-900 truncate">이번 주 스케줄</h2>
            </div>
            <Link href="/calendar" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 shrink-0 whitespace-nowrap">
              월간 캘린더 <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 max-h-[260px]">
            {weeklyEvents.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl space-y-1">
                <p className="text-xs font-semibold text-slate-500">이번 주 예정된 일정이 없습니다.</p>
                <p className="text-[11px] text-slate-400">캘린더에서 자유롭게 일정을 등록해 보세요.</p>
              </div>
            ) : (
              weeklyEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between transition hover:border-slate-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: evt.color || '#3b82f6' }}
                    />
                    <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      {evt.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                    {evt.start_date}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/calendar"
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <Clock size={14} /> 월간 캘린더 전체 일정 보기
            </Link>
          </div>
        </div>
      </div>

      {/* 3. 부수적 섹션: 여행 프로젝트 요약 카드 */}
      {activeTrip && (
        (() => {
          const ddayInfo = calculateDDay(activeTrip.start_date, activeTrip.end_date);
          const accentColor = activeTrip.color || '#2563eb';

          return (
            <div 
              className="bg-white rounded-2xl border-2 p-4 sm:p-5 shadow-2xs space-y-3"
              style={{ borderColor: accentColor }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-lg shrink-0 ${ddayInfo.badgeBg}`}>
                    {ddayInfo.text}
                  </span>
                  <h3 className="text-xs sm:text-base font-extrabold text-slate-900 truncate">
                    ✈️ {activeTrip.title}
                  </h3>
                </div>

                {trips.length > 1 && (
                  <select
                    value={activeTrip.id}
                    onChange={(e) => {
                      const found = trips.find((t) => t.id === e.target.value);
                      if (found) {
                        setActiveTrip(found);
                        fetchDashboardData();
                      }
                    }}
                    className="text-[11px] sm:text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg outline-none cursor-pointer shrink-0"
                  >
                    {trips.map((t) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400 shrink-0" /> {activeTrip.destination}
                  </p>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <CalendarIcon size={13} className="text-slate-400 shrink-0" /> {activeTrip.start_date} ~ {activeTrip.end_date}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href="/diaries"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer flex-1 sm:flex-initial justify-center"
                  >
                    <BookOpen size={13} /> 포토 일기
                  </Link>
                  <Link
                    href="/trips"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer flex-1 sm:flex-initial justify-center"
                  >
                    프로젝트 상세 <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* 4. 하단 서브 위젯: 경비 & 서류 보관함 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-xs p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Wallet size={14} className="text-emerald-600" /> 여행 경비 요약
            </p>
            <Link href="/expenses" className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5">
              가계부 열기 <ChevronRight size={12} />
            </Link>
          </div>

          <div>
            <p className="text-[11px] font-bold text-slate-400">총 누적 지출금액</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              ₩{grandTotal.toLocaleString()}
            </p>
          </div>

          <Link
            href="/expenses"
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus size={14} /> 지출 추가하기
          </Link>
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-xs p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Paperclip size={14} className="text-blue-600" /> 보관된 예약 서류 ({quickAttachments.length}개)
            </p>
            <Link href="/attachments" className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5">
              전체 서류함 <ChevronRight size={12} />
            </Link>
          </div>

          <div className="space-y-2">
            {quickAttachments.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl space-y-1">
                <p className="text-xs font-semibold text-slate-500">등록된 바우처 서류가 없습니다.</p>
                <Link href="/attachments" className="text-[11px] font-bold text-blue-600 hover:underline">
                  + 새 서류/티켓 등록하기
                </Link>
              </div>
            ) : (
              quickAttachments.map((doc) => (
                <div key={doc.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="truncate flex items-center gap-2 pr-2 min-w-0">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-white text-blue-600 rounded border border-slate-200 shrink-0">
                      {doc.category || '서류'}
                    </span>
                    <span className="truncate text-slate-800 font-semibold">{doc.file_name}</span>
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {doc.public_url ? (
                      <button
                        onClick={() => setPreviewUrl(doc.public_url)}
                        className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                      >
                        미리보기
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-normal">파일 없음</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. 1초 미리보기 팝업 모달 */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 shrink-0">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <FileText size={16} className="text-blue-600" /> 예약 서류 / 티켓 팝업
              </h3>
              <button onClick={() => setPreviewUrl(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100/50">
              {previewUrl.toLowerCase().includes('.pdf') ? (
                <iframe src={previewUrl} className="w-full h-[60vh] rounded-xl" title="PDF 미리보기" />
              ) : (
                <img src={previewUrl} alt="서류/QR 미리보기" className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-xs" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}