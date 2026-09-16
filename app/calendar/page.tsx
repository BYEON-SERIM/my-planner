'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  CalendarDays,
  CalendarRange,
  Palette,
  ChevronDown,
  Tag,
  X,
  Pencil,
  Map,
  ExternalLink
} from 'lucide-react';

interface Schedule {
  id: string;
  title: string;
  date: string;
  end_date: string;
  category: string;
  color: string;
  is_completed?: boolean;
  is_trip_auto?: boolean;
}

export default function CalendarPage() {
  const router = useRouter();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayString());
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const [tripGuideModal, setTripGuideModal] = useState<{
    isOpen: boolean;
    tripTitle: string;
  }>({
    isOpen: false,
    tripTitle: '',
  });

  const [newTitle, setNewTitle] = useState('');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [newCategory, setNewCategory] = useState('일반');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(true);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categories = ['개인', '업무', '약속', '여행', '운동', '생일'];
  const dropdownRef = useRef<HTMLDivElement>(null);

  const colorOptions = [
    { label: '블루', value: '#3b82f6' },
    { label: '레드', value: '#ef4444' },
    { label: '그린', value: '#10b981' },
    { label: '옐로우', value: '#f59e0b' },
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (endDate < val) {
      setEndDate(val);
    }
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (val < startDate) {
      setStartDate(val);
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    
    const { data: scheduleData, error } = await supabase.from('schedules').select('*');
    let formattedSchedules: Schedule[] = [];

    if (!error && scheduleData) {
      formattedSchedules = scheduleData.map((item) => ({
        ...item,
        end_date: item.end_date || item.date,
        color: item.color || '#3b82f6',
      }));
    }

    const { data: tripData } = await supabase.from('trips').select('*');
    if (tripData) {
      const tripSchedules: Schedule[] = tripData.map((trip) => ({
        id: `trip_auto_${trip.id}`,
        title: `✈️ ${trip.title}`,
        date: trip.start_date,
        end_date: trip.end_date,
        category: '여행',
        color: trip.color || '#8b5cf6',
        is_trip_auto: true,
      }));

      formattedSchedules = [...formattedSchedules, ...tripSchedules];
    }

    setSchedules(formattedSchedules);
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedules();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenAddModal = (dateStr: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedDateStr(dateStr);
    setStartDate(dateStr);
    setEndDate(dateStr);
    setNewTitle('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (schedule: Schedule, e: React.MouseEvent) => {
    e.stopPropagation();
    if (schedule.is_trip_auto) {
      setTripGuideModal({
        isOpen: true,
        tripTitle: schedule.title,
      });
      return;
    }
    setSelectedSchedule(schedule);
    setNewTitle(schedule.title);
    setStartDate(schedule.date);
    setEndDate(schedule.end_date);
    setNewCategory(schedule.category);
    setNewColor(schedule.color);
    setIsEditModalOpen(true);
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    const { error } = await supabase.from('schedules').insert([
      {
        title: newTitle,
        date: startDate,
        end_date: endDate,
        category: newCategory,
        color: newColor,
        user_id: user.id 
      },
    ]);

    if (!error) {
      setIsAddModalOpen(false);
      fetchSchedules();
    } else {
      alert('등록 실패: ' + error.message);
    }
  };

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule || !newTitle.trim()) return;

    const { error } = await supabase
      .from('schedules')
      .update({
        title: newTitle,
        date: startDate,
        end_date: endDate,
        category: newCategory,
        color: newColor,
      })
      .eq('id', selectedSchedule.id);

    if (!error) {
      setIsEditModalOpen(false);
      setSelectedSchedule(null);
      fetchSchedules();
    } else {
      alert('수정 실패: ' + error.message);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', selectedSchedule.id);

    if (!error) {
      setIsEditModalOpen(false);
      setSelectedSchedule(null);
      fetchSchedules();
    } else {
      alert('삭제 실패: ' + error.message);
    }
  };

  const isDateInRange = (targetDateStr: string, schedule: Schedule) => {
    return targetDateStr >= schedule.date && targetDateStr <= schedule.end_date;
  };

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const newD = new Date(currentDate);
      newD.setDate(newD.getDate() - 7);
      setCurrentDate(newD);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const newD = new Date(currentDate);
      newD.setDate(newD.getDate() + 7);
      setCurrentDate(newD);
    }
  };

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const getWeekDaysDates = () => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay();
    const sunday = new Date(curr);
    sunday.setDate(curr.getDate() - dayOfWeek);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      weekDates.push({ dateStr: `${y}-${m}-${d}`, dayNum: d.getDate(), monthNum: d.getMonth() + 1 });
    }
    return weekDates;
  };

  return (
    <div className="space-y-4 w-full flex flex-col min-h-[calc(100vh-120px)] sm:h-[calc(100vh-90px)]">
      {/* 1. 상단 컨트롤 영역 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-100 shadow-xs shrink-0">
        <div>
          <h1 className="text-lg sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            {year}년 {month + 1}월
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 mt-0.5">날짜의 + 버튼으로 일정을 추가하고, 일정을 클릭하면 수정/삭제할 수 있습니다.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* 🌟 소프트 블루 스타일로 개선된 일정 추가 버튼 */}
          <button
            onClick={() => handleOpenAddModal(getTodayString())}
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 text-xs sm:text-sm font-bold px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl transition flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus size={15} className="shrink-0" />
            <span className="hidden sm:inline">일정 추가</span>
            <span className="sm:hidden">추가</span>
          </button>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                viewMode === 'month' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarDays size={14} /> 월간
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                viewMode === 'week' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarRange size={14} /> 주간
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 shrink-0">
            <button onClick={handlePrev} className="p-1.5 rounded-lg hover:bg-white text-slate-600 cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white transition rounded-lg cursor-pointer whitespace-nowrap"
            >
              오늘
            </button>
            <button onClick={handleNext} className="p-1.5 rounded-lg hover:bg-white text-slate-600 cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. 메인 캘린더 그리드 */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-0.5 w-full flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 text-center py-2 shrink-0">
          {weekDays.map((day, idx) => (
            <span
              key={day}
              className={`text-xs font-bold ${
                idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-slate-400'
              }`}
            >
              {day}
            </span>
          ))}
        </div>

        {/* 월간 뷰 */}
        {viewMode === 'month' && (
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 flex-1 min-h-0">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-slate-50/30" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const m = String(month + 1).padStart(2, '0');
              const d = String(day).padStart(2, '0');
              const dateStr = `${year}-${m}-${d}`;

              const daySchedules = schedules.filter((s) => isDateInRange(dateStr, s));
              const isToday = getTodayString() === dateStr;

              return (
                <div
                  key={day}
                  className="p-1 sm:p-1.5 lg:p-2 transition select-none flex flex-col justify-between rounded-xl hover:bg-slate-50/80 group overflow-hidden"
                >
                  <div className="flex justify-between items-center px-0.5">
                    <span
                      className={`text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>

                    <button
                      onClick={(e) => handleOpenAddModal(dateStr, e)}
                      className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-400 cursor-pointer"
                      title="이 날짜에 일정 추가"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="space-y-1 my-0.5 overflow-hidden">
                    {daySchedules.slice(0, 3).map((item) => {
                      const isStart = item.date === dateStr;
                      const isEnd = item.end_date === dateStr;
                      const isSingleDay = isStart && isEnd;

                      let roundedClass = 'rounded-md';
                      if (!isSingleDay) {
                        if (isStart) roundedClass = 'rounded-l-md rounded-r-none mr-[-5px] z-10';
                        else if (isEnd) roundedClass = 'rounded-r-md rounded-l-none ml-[-5px]';
                        else roundedClass = 'rounded-none mx-[-5px]';
                      }

                      return (
                        <div
                          key={item.id}
                          onClick={(e) => handleOpenEditModal(item, e)}
                          className={`text-[10px] sm:text-[11px] lg:text-xs xl:text-sm py-0.5 px-1 sm:px-1.5 font-semibold truncate relative transition-all cursor-pointer hover:opacity-90 shadow-2xs ${roundedClass}`}
                          style={{
                            backgroundColor: item.color,
                            color: '#ffffff',
                          }}
                          title="클릭하여 일정 수정/삭제"
                        >
                          {(isStart || isSingleDay || new Date(dateStr).getDay() === 0) ? (
                            <span className="truncate block leading-tight">{item.title}</span>
                          ) : (
                            <span className="opacity-0 block">.</span>
                          )}
                        </div>
                      );
                    })}
                    {daySchedules.length > 3 && (
                      <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium pl-0.5">
                        +{daySchedules.length - 3}개 더보기
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 주간 뷰 */}
        {viewMode === 'week' && (
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-slate-100 flex-1 min-h-0">
            {getWeekDaysDates().map(({ dateStr, dayNum, monthNum }) => {
              const daySchedules = schedules.filter((s) => isDateInRange(dateStr, s));
              const isToday = getTodayString() === dateStr;

              return (
                <div
                  key={dateStr}
                  className="p-2 transition select-none flex flex-col justify-start rounded-xl hover:bg-slate-50/80 group"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 px-1">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400">{monthNum}월</span>
                      <span
                        className={`text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full ${
                          isToday ? 'bg-blue-600 text-white' : 'text-slate-800'
                        }`}
                      >
                        {dayNum}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleOpenAddModal(dateStr, e)}
                      className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-400 cursor-pointer"
                      title="이 날짜에 일정 추가"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="space-y-1.5 overflow-y-auto">
                    {daySchedules.map((item) => (
                      <div
                        key={item.id}
                        onClick={(e) => handleOpenEditModal(item, e)}
                        className="text-xs lg:text-sm p-2 rounded-lg font-semibold text-white shadow-xs cursor-pointer hover:opacity-90"
                        style={{ backgroundColor: item.color }}
                      >
                        <p className="truncate leading-tight">{item.title}</p>
                        <p className="text-[10px] opacity-80 font-normal mt-0.5">{item.category}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3-A. 신규 등록 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                <Plus size={18} className="text-blue-600" /> 새 일정 추가
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <label className="text-[10px] sm:text-xs text-slate-400 font-bold mb-1 block">일정 제목</label>
                <input
                  type="text"
                  placeholder="일정 제목 입력..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] sm:text-xs text-slate-400 font-bold mb-1 block">시작일</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full text-xs sm:text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-2 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs text-slate-400 font-bold mb-1 block">종료일</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full text-xs sm:text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-2 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs text-slate-400 font-bold block">카테고리 & 라벨 컬러</label>
                <div className="flex items-center justify-between gap-2">
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                      className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl transition shadow-2xs cursor-pointer"
                    >
                      <Tag size={14} className="text-blue-600" />
                      <span>{newCategory}</span>
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isCategoryOpen && (
                      <div className="absolute bottom-full left-0 mb-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-[60] py-1.5">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setNewCategory(cat);
                              setIsCategoryOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs sm:text-sm font-medium transition flex items-center justify-between ${
                              newCategory === cat
                                ? 'bg-blue-50 text-blue-600 font-semibold'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {colorOptions.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setNewColor(c.value)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                          newColor === c.value ? 'scale-125 ring-2 ring-slate-400' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                    
                    <label 
                      className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition relative overflow-hidden shrink-0"
                    >
                      <Palette size={12} className="text-slate-500" />
                      <input
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                >
                  등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3-B. 수정 & 삭제 모달 */}
      {isEditModalOpen && selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                <Pencil size={16} className="text-blue-600" /> 일정 수정 및 삭제
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateSchedule} className="space-y-4">
              <div>
                <label className="text-[10px] sm:text-xs text-slate-400 font-bold mb-1 block">일정 제목</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] sm:text-xs text-slate-400 font-bold mb-1 block">시작일</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full text-xs sm:text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-2 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs text-slate-400 font-bold mb-1 block">종료일</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full text-xs sm:text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-2 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs text-slate-400 font-bold block">카테고리 & 라벨 컬러</label>
                <div className="flex items-center justify-between gap-2">
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                      className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl transition shadow-2xs cursor-pointer"
                    >
                      <Tag size={14} className="text-blue-600" />
                      <span>{newCategory}</span>
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isCategoryOpen && (
                      <div className="absolute bottom-full left-0 mb-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-[60] py-1.5">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setNewCategory(cat);
                              setIsCategoryOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs sm:text-sm font-medium transition flex items-center justify-between ${
                              newCategory === cat
                                ? 'bg-blue-50 text-blue-600 font-semibold'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {colorOptions.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setNewColor(c.value)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                          newColor === c.value ? 'scale-125 ring-2 ring-slate-400' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                    
                    <label 
                      className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition relative overflow-hidden shrink-0"
                    >
                      <Palette size={12} className="text-slate-500" />
                      <input
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDeleteSchedule}
                  className="px-3 py-2 text-xs sm:text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={15} /> 삭제하기
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    저장하기
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. 자동 연동 여행 일정 이동 안내 모달 */}
      {tripGuideModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm p-5 sm:p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-2xs">
              <Map size={24} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">여행 프로젝트 연동 일정</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong className="text-purple-600 font-bold">{tripGuideModal.tripTitle}</strong> 일정을 수정하거나 세부 계획을 변경하시려면 여행 관리 페이지로 이동해 주세요.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setTripGuideModal({ isOpen: false, tripTitle: '' })}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer flex-1"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => {
                  setTripGuideModal({ isOpen: false, tripTitle: '' });
                  router.push('/trips');
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs flex items-center justify-center gap-1 flex-1 cursor-pointer"
              >
                이동하기 <ExternalLink size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}