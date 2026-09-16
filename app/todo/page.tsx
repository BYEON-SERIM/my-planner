'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Calendar, 
  Tag, 
  Check, 
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Schedule {
  id: string;
  title: string;
  date: string;
  category: string;
  is_completed: boolean;
}

export default function TodoPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [title, setTitle] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [category, setCategory] = useState('개인');
  const [filterMode, setFilterMode] = useState<'all_week' | 'day' | 'overdue'>('all_week');
  const [loading, setLoading] = useState(true);
  const [isOverdueOpen, setIsOverdueOpen] = useState(true);

  const categories = ['개인', '업무'];

  const getWeekDays = () => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay();
    const sunday = new Date(curr);
    sunday.setDate(curr.getDate() - dayOfWeek);

    const week = [];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      week.push({
        dateStr,
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        dayName: dayNames[i],
        isToday: dateStr === getTodayString(),
      });
    }
    return week;
  };

  const weekDays = getWeekDays();
  const weekStartDate = weekDays[0].dateStr;
  const weekEndDate = weekDays[6].dateStr;
  const todayStr = getTodayString();

  const fetchSchedules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('date', { ascending: true });

    if (!error && data) {
      const filtered = data.filter(
        (item) => item.category === '개인' || item.category === '업무'
      );
      setSchedules(filtered);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handlePrevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
  
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
  
    const { error } = await supabase.from('schedules').insert([
      { 
        title, 
        date: selectedDate, 
        category,
        user_id: user.id 
      },
    ]);
  
    if (!error) {
      setTitle('');
      fetchSchedules();
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('schedules')
      .update({ is_completed: !currentStatus })
      .eq('id', id);

    if (!error) fetchSchedules();
  };

  // 🌟 미완료 지연 일정을 '오늘' 날짜로 변경해주는 함수
  const rescheduleToToday = async (id: string) => {
    const { error } = await supabase
      .from('schedules')
      .update({ date: todayStr })
      .eq('id', id);

    if (!error) fetchSchedules();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 할 일을 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (!error) fetchSchedules();
  };

  // 🌟 오늘 이전 날짜이고 미완료된 항목 필터링
  const overdueSchedules = schedules.filter(
    (s) => s.date < todayStr && !s.is_completed
  );

  const thisWeekSchedules = schedules.filter(
    (s) => s.date >= weekStartDate && s.date <= weekEndDate
  );

  const displaySchedules = schedules.filter((s) => {
    if (filterMode === 'overdue') return s.date < todayStr && !s.is_completed;
    if (filterMode === 'day') return s.date === selectedDate;
    return s.date >= weekStartDate && s.date <= weekEndDate;
  });

  const totalCount = thisWeekSchedules.length;
  const completedCount = thisWeekSchedules.filter((s) => s.is_completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-6 w-full pb-8">
      {/* 1. 주간 헤더 & 진행률 */}
      <div className="bg-white p-3.5 sm:p-6 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            <h1 className="text-sm sm:text-2xl font-black text-slate-800 truncate">
              주간 투두 체크리스트
            </h1>
            <div className="bg-blue-50 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg border border-blue-100/80 flex items-center gap-1 shrink-0">
              <span className="text-[11px] sm:text-xs font-bold text-blue-600">{progressPercent}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <p className="sm:hidden text-[11px] text-slate-400 font-medium">
              {weekDays[0].monthNum}.{weekDays[0].dayNum} ~ {weekDays[6].monthNum}.{weekDays[6].dayNum}
            </p>
            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 ml-auto sm:ml-0">
              <button onClick={handlePrevWeek} className="p-1 rounded-lg hover:bg-white text-slate-600 cursor-pointer">
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDate(getTodayString());
                }}
                className="px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white transition rounded-lg cursor-pointer whitespace-nowrap"
              >
                이번 주
              </button>
              <button onClick={handleNextWeek} className="p-1 rounded-lg hover:bg-white text-slate-600 cursor-pointer">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="w-full bg-slate-100 h-2 sm:h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 🌟 지난 미완료 할 일 알림 카드 (Overdue Banner) */}
      {overdueSchedules.length > 0 && (
        <div className="bg-rose-50/80 border border-rose-200/80 p-3.5 sm:p-4 rounded-2xl shadow-2xs space-y-3">
          <div 
            onClick={() => setIsOverdueOpen(!isOverdueOpen)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 shrink-0" />
              <h2 className="text-xs sm:text-sm font-bold text-rose-900">
                지난 미완료 할 일 <span className="text-rose-600 font-black">({overdueSchedules.length}개)</span>
              </h2>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold">
              <span>{isOverdueOpen ? '접기' : '펼치기'}</span>
              {isOverdueOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {isOverdueOpen && (
            <ul className="space-y-2 pt-1 border-t border-rose-200/60">
              {overdueSchedules.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between p-2.5 bg-white border border-rose-100 rounded-xl gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      onClick={() => toggleComplete(item.id, item.is_completed)}
                      className="w-4 h-4 rounded border border-rose-300 hover:border-rose-500 bg-white flex items-center justify-center shrink-0"
                    >
                      {item.is_completed && <Check size={11} strokeWidth={3} className="text-rose-600" />}
                    </button>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-rose-500 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                      {item.date}
                    </span>

                    <button
                      onClick={() => rescheduleToToday(item.id)}
                      className="px-2 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-lg transition flex items-center gap-0.5 cursor-pointer"
                      title="오늘 날짜로 변경"
                    >
                      <span>오늘로 미루기</span>
                      <ArrowRight size={11} />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-slate-300 hover:text-red-500 rounded-lg cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 2. 주간 요일 캘린더 탭 */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterMode('all_week')}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer ${
                filterMode === 'all_week'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200/60 font-extrabold'
                  : 'text-slate-500 hover:bg-slate-50 border border-transparent'
              }`}
            >
              📅 주간 전체 보기 ({thisWeekSchedules.length})
            </button>

            {overdueSchedules.length > 0 && (
              <button
                onClick={() => setFilterMode('overdue')}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer ${
                  filterMode === 'overdue'
                    ? 'bg-rose-50 text-rose-600 border border-rose-200/60 font-extrabold'
                    : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                }`}
              >
                ⏰ 지난 미완료 ({overdueSchedules.length})
              </button>
            )}
          </div>

          <span className="hidden sm:inline text-[11px] text-slate-400">날짜를 클릭하면 해당 일만 필터링됩니다.</span>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {weekDays.map((w) => {
            const daySchedules = thisWeekSchedules.filter((s) => s.date === w.dateStr);
            const isSelected = filterMode === 'day' && selectedDate === w.dateStr;

            return (
              <button
                key={w.dateStr}
                onClick={() => {
                  setSelectedDate(w.dateStr);
                  setFilterMode('day');
                }}
                className={`p-1.5 sm:p-2 rounded-xl flex flex-col items-center transition cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 border-2 border-blue-500 font-bold text-blue-600 shadow-2xs'
                    : w.isToday
                    ? 'bg-slate-100 font-bold text-slate-900'
                    : 'bg-slate-50/70 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className={`text-[10px] ${w.dayName === '일' ? 'text-red-500' : w.dayName === '토' ? 'text-blue-500' : 'text-slate-400'}`}>
                  {w.dayName}
                </span>
                <span className="text-xs sm:text-sm font-extrabold my-0.5">{w.dayNum}</span>
                {daySchedules.length > 0 && (
                  <span className="text-[9px] px-1 sm:px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-bold">
                    {daySchedules.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* 3. 할 일 입력 폼 */}
      <form onSubmit={handleAddSchedule} className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <Plus className="text-slate-400 w-5 h-5 shrink-0" />
          <input
            type="text"
            placeholder="할 일을 입력하세요..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs sm:text-sm font-medium outline-none text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <div className="flex items-center bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-xl text-xs text-slate-700 hover:bg-slate-100 transition">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setFilterMode('day');
                }}
                className="bg-transparent outline-none cursor-pointer font-bold text-xs text-slate-700 p-0 border-none appearance-none"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-xl text-xs text-slate-700 hover:bg-slate-100 transition">
              <Tag size={13} className="text-slate-400 shrink-0" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-transparent outline-none cursor-pointer font-bold text-xs text-slate-700 border-none p-0"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 whitespace-nowrap shadow-2xs"
          >
            추가하기
          </button>
        </div>
      </form>

      {/* 4. 할 일 리스트 */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">목록을 불러오는 중...</div>
      ) : displaySchedules.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
          <p className="text-slate-400 text-xs sm:text-sm font-medium">선택된 기간에 등록된 할 일이 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {displaySchedules.map((item) => (
            <li
              key={item.id}
              className="group flex items-center justify-between p-3 sm:p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-xs transition gap-2"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
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

                <span
                  className={`text-xs sm:text-sm font-medium truncate ${
                    item.is_completed ? 'line-through text-slate-400' : 'text-slate-900'
                  }`}
                >
                  {item.title}
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <span className="text-[10px] sm:text-[11px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 font-semibold">
                  {item.category}
                </span>

                <span className="text-[10px] sm:text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 sm:px-2 rounded-md border border-slate-100 font-medium">
                  {item.date}
                </span>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 sm:p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                  aria-label="삭제"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}