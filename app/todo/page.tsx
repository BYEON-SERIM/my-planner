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
  ChevronRight
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
  const [filterMode, setFilterMode] = useState<'all_week' | 'day'>('all_week');
  const [loading, setLoading] = useState(true);

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

    const { error } = await supabase.from('schedules').insert([
      { title, date: selectedDate, category },
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

  const handleDelete = async (id: string) => {
    if (!confirm('이 할 일을 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (!error) fetchSchedules();
  };

  const thisWeekSchedules = schedules.filter(
    (s) => s.date >= weekStartDate && s.date <= weekEndDate
  );

  const displaySchedules = thisWeekSchedules.filter((s) => {
    if (filterMode === 'day') return s.date === selectedDate;
    return true;
  });

  const totalCount = thisWeekSchedules.length;
  const completedCount = thisWeekSchedules.filter((s) => s.is_completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 w-full">
      {/* 1. 주간 헤더 & 진행률 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-blue-600" />
              주간 투두 체크리스트
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {weekDays[0].monthNum}월 {weekDays[0].dayNum}일 ~ {weekDays[6].monthNum}월 {weekDays[6].dayNum}일 주간 단위 관리
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-100 flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-600">주간 달성률</span>
              <span className="text-sm font-bold text-blue-700">{progressPercent}%</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button onClick={handlePrevWeek} className="p-1 rounded-lg hover:bg-white text-slate-600 cursor-pointer">
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDate(getTodayString());
                }}
                className="px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white transition rounded-lg cursor-pointer"
              >
                이번 주
              </button>
              <button onClick={handleNextWeek} className="p-1 rounded-lg hover:bg-white text-slate-600 cursor-pointer">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 2. 주간 요일 캘린더 탭 */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            onClick={() => setFilterMode('all_week')}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer ${
              filterMode === 'all_week'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            📅 주간 전체 모아보기 ({thisWeekSchedules.length})
          </button>
          <span className="text-[11px] text-slate-400">날짜를 클릭하면 해당 일만 필터링됩니다.</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
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
                className={`p-2 rounded-xl flex flex-col items-center transition cursor-pointer ${
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
                <span className="text-sm font-extrabold my-0.5">{w.dayNum}</span>
                {daySchedules.length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-bold">
                    {daySchedules.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 할 일 입력 폼 */}
      <form onSubmit={handleAddSchedule} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <Plus className="text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="할 일을 입력하세요..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-sm font-medium outline-none text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-700">
              <Calendar size={14} className="text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setFilterMode('day');
                }}
                className="bg-transparent outline-none cursor-pointer font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-700">
              <Tag size={14} className="text-slate-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-transparent outline-none cursor-pointer font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2 rounded-xl transition active:scale-95 shadow-sm shadow-blue-500/20 ml-auto cursor-pointer"
          >
            추가하기
          </button>
        </div>
      </form>

      {/* 4. 할 일 리스트 */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">목록을 불러오는 중...</div>
      ) : displaySchedules.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
          <p className="text-slate-400 text-sm font-medium">선택된 기간에 등록된 할 일이 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {displaySchedules.map((item) => (
            <li
              key={item.id}
              className="group flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-xs transition"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  onClick={() => toggleComplete(item.id, item.is_completed)}
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                    item.is_completed
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300 hover:border-blue-500 bg-white'
                  }`}
                >
                  {item.is_completed && <Check size={14} strokeWidth={3} />}
                </button>

                <span
                  className={`text-sm font-medium truncate ${
                    item.is_completed ? 'line-through text-slate-400' : 'text-slate-900'
                  }`}
                >
                  {item.title}
                </span>
              </div>

              <div className="flex items-center gap-2 ml-3 shrink-0">
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 font-semibold">
                  {item.category}
                </span>

                <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 font-medium">
                  {item.date}
                </span>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100 cursor-pointer"
                  aria-label="삭제"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}