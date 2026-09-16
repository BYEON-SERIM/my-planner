'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Map, 
  Plus, 
  Calendar, 
  CheckSquare, 
  ShoppingBag, 
  Trash2, 
  X, 
  Sparkles,
  CheckCircle2,
  ListTodo,
  Clock,
  MapPin,
  Pencil,
  Palette,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Paperclip,
  ExternalLink,
  Share2
} from 'lucide-react';

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  color: string;
  share_token?: string;
  is_public?: boolean;
}

interface TripItem {
  id: string;
  trip_id: string;
  type: 'packing' | 'shopping';
  content: string;
  is_checked: boolean;
}

interface AttachmentItem {
  id: string;
  file_name: string;
  public_url: string;
  category: string;
}

interface TripPlan {
  id: string;
  trip_id: string;
  day_num: number;
  plan_time: string;
  content: string;
  location: string;
  attachment_id?: string;
  attachment?: AttachmentItem;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripItems, setTripItems] = useState<TripItem[]>([]);
  const [tripPlans, setTripPlans] = useState<TripPlan[]>([]);
  const [availableAttachments, setAvailableAttachments] = useState<AttachmentItem[]>([]);
  
  const [activeTab, setActiveTab] = useState<'timeline' | 'packing' | 'shopping'>('timeline');
  const [isMobileTripListOpen, setIsMobileTripListOpen] = useState(false);

  const [activeDayNum, setActiveDayNum] = useState<number>(1);
  const sliderRef = useRef<HTMLDivElement>(null);
  const dayTabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 모달 상태
  const [isAddTripModalOpen, setIsAddTripModalOpen] = useState(false);
  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');

  const colorOptions = [
    { label: '블루', value: '#3b82f6' },
    { label: '퍼플', value: '#8b5cf6' },
    { label: '에메랄드', value: '#10b981' },
    { label: '옐로우', value: '#f59e0b' },
    { label: '코랄', value: '#f43f5e' },
    { label: '인디고', value: '#6366f1' },
  ];

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TripPlan | null>(null);
  const [selectedDayNum, setSelectedScheduleDayNum] = useState<number>(1);
  const [planTime, setPlanTime] = useState('09:00');
  const [planContent, setPlanContent] = useState('');
  const [planLocation, setPlanLocation] = useState('');
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string>('');

  const [newItemText, setNewItemText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTrips = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('start_date', { ascending: true });

    if (!error && data) {
      setTrips(data);
      if (data.length > 0 && !selectedTrip) {
        setSelectedTrip(data[0]);
      }
    }
    setLoading(false);
  };

  const fetchTripDetails = async (tripId: string) => {
    const { data: items } = await supabase
      .from('trip_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (items) setTripItems(items);

    const { data: plans } = await supabase
      .from('trip_plans')
      .select('*, attachment:attachments(id, file_name, public_url, category)')
      .eq('trip_id', tripId)
      .order('plan_time', { ascending: true });

    if (plans) setTripPlans(plans);

    const { data: atts } = await supabase
      .from('attachments')
      .select('id, file_name, public_url, category')
      .eq('trip_id', tripId);

    if (atts) setAvailableAttachments(atts);
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (selectedTrip) {
      fetchTripDetails(selectedTrip.id);
      setActiveDayNum(1);
    }
  }, [selectedTrip]);

  // 🌟 동행자 초대를 위한 공유 링크 생성 핸들러
  const handleShareTrip = async (trip: Trip, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    try {
      let token = trip.share_token;

      // 공유 토큰이 없는 경주 자동 생성 후 저장
      if (!token) {
        token = crypto.randomUUID();
        await supabase
          .from('trips')
          .update({ is_public: true, share_token: token })
          .eq('id', trip.id);
      } else {
        await supabase
          .from('trips')
          .update({ is_public: true })
          .eq('id', trip.id);
      }

      const shareUrl = `${window.location.origin}/trips/join?token=${token}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('🌟 여행 초대를 위한 공유 링크가 복사되었습니다!\n이 링크로 접속 후 구글 로그인 시 동행자로 합류되어 데이터를 함께 조회/수정할 수 있습니다.');
    } catch (err) {
      alert('공유 링크 복사에 실패했습니다.');
    }
  };

  const calculateNights = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '당일치기';
    return `${diffDays}박 ${diffDays + 1}일`;
  };

  const calculateDday = (startStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(startStr);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'D-Day';
    if (diffDays > 0) return `D-${diffDays}`;
    return `D+${Math.abs(diffDays)}`;
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDestination.trim() || !startDate || !endDate) return;

    const { data, error } = await supabase
      .from('trips')
      .insert([
        {
          title: newTitle,
          destination: newDestination,
          start_date: startDate,
          end_date: endDate,
          color: selectedColor,
        },
      ])
      .select();

    if (!error && data) {
      setIsAddTripModalOpen(false);
      resetForm();
      fetchTrips();
      setSelectedTrip(data[0]);
    }
  };

  const handleOpenEditModal = (trip: Trip, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTrip(trip);
    setNewTitle(trip.title);
    setNewDestination(trip.destination);
    setStartDate(trip.start_date);
    setEndDate(trip.end_date);
    setSelectedColor(trip.color || '#3b82f6');
    setIsEditTripModalOpen(true);
  };

  const handleUpdateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip || !newTitle.trim() || !newDestination.trim()) return;

    const { error } = await supabase
      .from('trips')
      .update({
        title: newTitle,
        destination: newDestination,
        start_date: startDate,
        end_date: endDate,
        color: selectedColor,
      })
      .eq('id', editingTrip.id);

    if (!error) {
      setIsEditTripModalOpen(false);
      resetForm();
      fetchTrips();
      if (selectedTrip?.id === editingTrip.id) {
        setSelectedTrip({
          ...editingTrip,
          title: newTitle,
          destination: newDestination,
          start_date: startDate,
          end_date: endDate,
          color: selectedColor,
        });
      }
    }
  };

  const handleDeleteTrip = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('이 여행 프로젝트를 삭제하시겠습니까? 관련 세부 일정이 모두 삭제됩니다.')) return;

    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (!error) {
      setSelectedTrip(null);
      fetchTrips();
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDestination('');
    setStartDate('');
    setEndDate('');
    setSelectedColor('#3b82f6');
    setEditingTrip(null);
  };

  const handleOpenAddPlanModal = (dayNum: number) => {
    setEditingPlan(null);
    setSelectedScheduleDayNum(dayNum);
    setPlanTime('09:00');
    setPlanContent('');
    setPlanLocation('');
    setSelectedAttachmentId('');
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlanModal = (plan: TripPlan) => {
    setEditingPlan(plan);
    setSelectedScheduleDayNum(plan.day_num);
    setPlanTime(plan.plan_time || '09:00');
    setPlanContent(plan.content || '');
    setPlanLocation(plan.location || '');
    setSelectedAttachmentId(plan.attachment_id || '');
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip || !planContent.trim()) return;

    if (editingPlan) {
      const { error } = await supabase
        .from('trip_plans')
        .update({
          plan_time: planTime,
          content: planContent,
          location: planLocation,
          attachment_id: selectedAttachmentId || null,
        })
        .eq('id', editingPlan.id);

      if (!error) {
        setIsPlanModalOpen(false);
        fetchTripDetails(selectedTrip.id);
      }
    } else {
      const { error } = await supabase.from('trip_plans').insert([
        {
          trip_id: selectedTrip.id,
          day_num: selectedDayNum,
          plan_time: planTime,
          content: planContent,
          location: planLocation,
          attachment_id: selectedAttachmentId || null,
        },
      ]);

      if (!error) {
        setIsPlanModalOpen(false);
        fetchTripDetails(selectedTrip.id);
      }
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('trip_plans').delete().eq('id', planId);
    if (!error && selectedTrip) {
      fetchTripDetails(selectedTrip.id);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || !selectedTrip || activeTab === 'timeline') return;

    const type = activeTab === 'packing' ? 'packing' : 'shopping';

    const { error } = await supabase.from('trip_items').insert([
      {
        trip_id: selectedTrip.id,
        type,
        content: newItemText,
      },
    ]);

    if (!error) {
      setNewItemText('');
      fetchTripDetails(selectedTrip.id);
    }
  };

  const toggleItemCheck = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('trip_items')
      .update({ is_checked: !currentStatus })
      .eq('id', id);

    if (!error && selectedTrip) {
      fetchTripDetails(selectedTrip.id);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const { error } = await supabase.from('trip_items').delete().eq('id', id);
    if (!error && selectedTrip) {
      fetchTripDetails(selectedTrip.id);
    }
  };

  const getTimelineDays = (startStr: string, endStr: string) => {
    const days = [];
    const current = new Date(startStr);
    const end = new Date(endStr);

    let dayNum = 1;
    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      
      days.push({
        dayNum,
        dateStr: `${y}-${m}-${d}`,
        displayDate: `${current.getMonth() + 1}/${current.getDate()}`,
      });

      current.setDate(current.getDate() + 1);
      dayNum++;
    }
    return days;
  };

  const handleScroll = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, clientWidth } = sliderRef.current;
    if (clientWidth === 0) return;
    
    const currentDay = Math.round(scrollLeft / clientWidth) + 1;
    if (currentDay !== activeDayNum) {
      setActiveDayNum(currentDay);
      dayTabRefs.current[currentDay - 1]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

  const scrollToDay = (dayNum: number) => {
    setActiveDayNum(dayNum);
    if (sliderRef.current) {
      const cardWidth = sliderRef.current.clientWidth;
      sliderRef.current.scrollTo({
        left: (dayNum - 1) * cardWidth,
        behavior: 'smooth',
      });
    }
    dayTabRefs.current[dayNum - 1]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  };

  const packingItems = tripItems.filter((i) => i.type === 'packing');
  const shoppingItems = tripItems.filter((i) => i.type === 'shopping');

  return (
    <div className="space-y-3.5 sm:space-y-4 w-full flex flex-col h-auto lg:h-[calc(100vh-90px)]">
      {/* 1. 상단 타이틀 바 */}
      <div className="flex items-center justify-between gap-2.5 bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-100 shadow-xs shrink-0">
        <div className="min-w-0">
          <h1 className="text-base sm:text-2xl font-black text-slate-800 flex items-center gap-1.5 sm:gap-2 truncate">
            <Map className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            <span>여행 프로젝트 관리</span>
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 mt-0.5">
            일정 선택 시 연동된 티켓과 바우처를 바로 열람하고 수정을 완료하세요.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsAddTripModalOpen(true);
          }}
          className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 text-xs sm:text-sm font-bold px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus size={16} className="shrink-0" />
          <span className="hidden sm:inline">새 여행 등록</span>
          <span className="sm:hidden">등록</span>
        </button>
      </div>

      {/* 2. 메인 스플릿 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 flex-1 min-h-0">
        
        {/* 좌측 여행 리스트 영역 */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-xs p-3.5 sm:p-4 flex flex-col shrink-0 lg:min-h-0">
          
          <div 
            onClick={() => setIsMobileTripListOpen(!isMobileTripListOpen)}
            className="flex items-center justify-between cursor-pointer lg:cursor-default lg:border-b lg:border-slate-100 lg:pb-2.5 lg:mb-2.5 shrink-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-xs sm:text-base font-bold text-slate-800">내 여행 리스트</h2>
              {selectedTrip && (
                <span className="text-[11px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md truncate max-w-[150px] lg:hidden">
                  📍 {selectedTrip.title}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[11px] sm:text-xs font-semibold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full">
                총 {trips.length}개
              </span>
              <button type="button" className="lg:hidden text-slate-400 p-0.5">
                {isMobileTripListOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </div>

          <div className={`space-y-2.5 overflow-y-auto flex-1 pr-1 transition-all ${
            isMobileTripListOpen ? 'mt-3 max-h-[220px] block' : 'hidden lg:block'
          }`}>
            {loading ? (
              <p className="text-xs sm:text-sm text-slate-400 py-6 text-center">불러오는 중...</p>
            ) : trips.length === 0 ? (
              <div className="text-center py-8 space-y-1.5">
                <Sparkles className="w-5 h-5 text-blue-400 mx-auto opacity-50" />
                <p className="text-xs sm:text-sm text-slate-400 font-medium">등록된 여행이 없습니다.</p>
              </div>
            ) : (
              trips.map((trip) => {
                const isSelected = selectedTrip?.id === trip.id;
                const durationText = calculateNights(trip.start_date, trip.end_date);
                const dDayText = calculateDday(trip.start_date);
                const tripColor = trip.color || '#3b82f6';

                return (
                  <div
                    key={trip.id}
                    onClick={() => {
                      setSelectedTrip(trip);
                      setIsMobileTripListOpen(false);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-slate-50/50 shadow-2xs'
                        : 'bg-white border-slate-100 hover:border-slate-300'
                    }`}
                    style={{
                      borderColor: isSelected ? tripColor : undefined,
                      borderWidth: isSelected ? '2px' : '1px'
                    }}
                  >
                    <div 
                      className="absolute top-0 left-0 bottom-0 w-1.5"
                      style={{ backgroundColor: tripColor }}
                    />

                    <div className="pl-1.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span 
                          className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: tripColor }}
                        >
                          {dDayText}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">{durationText}</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{trip.title}</h3>
                      <p className="text-[11px] text-slate-500 font-medium">📍 {trip.destination}</p>
                    </div>

                    <div className="pl-1.5 flex items-center justify-between border-t border-slate-100/80 pt-2 text-[10px] sm:text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {trip.start_date} ~ {trip.end_date}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        {/* 🌟 여행 카드 내 공유 버튼 */}
                        <button
                          onClick={(e) => handleShareTrip(trip, e)}
                          className="p-1 text-slate-400 hover:text-emerald-600 transition cursor-pointer"
                          title="동행자 초대 링크 복사"
                        >
                          <Share2 size={13} />
                        </button>
                        <button
                          onClick={(e) => handleOpenEditModal(trip, e)}
                          className="p-1 hover:text-blue-600 transition opacity-60 hover:opacity-100 cursor-pointer"
                          title="수정"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteTrip(trip.id, e)}
                          className="p-1 hover:text-red-500 transition opacity-60 hover:opacity-100 cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 우측 상세 화면 */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-xs p-3.5 sm:p-5 flex flex-col min-h-[400px] lg:min-h-0">
          {selectedTrip ? (
            <div className="flex flex-col h-full space-y-3.5">
              {/* 상단 탭 헤더 */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-100 pb-2.5 shrink-0">
                <div className="flex items-center justify-between w-full xl:w-auto">
                  <div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs" 
                        style={{ backgroundColor: selectedTrip.color || '#3b82f6' }}
                      />
                      <h2 className="text-xs sm:text-lg font-bold text-slate-900 truncate">{selectedTrip.title}</h2>
                      <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                        {calculateNights(selectedTrip.start_date, selectedTrip.end_date)}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">📍 {selectedTrip.destination} | {selectedTrip.start_date} ~ {selectedTrip.end_date}</p>
                  </div>

                  {/* 🌟 여행 상세 상단 공유 버튼 */}
                  <button
                    onClick={() => handleShareTrip(selectedTrip)}
                    className="ml-2 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/60 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                    title="동행자 공유 링크 생성"
                  >
                    <Share2 size={14} />
                    <span className="hidden sm:inline">공유</span>
                  </button>
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 w-full xl:w-auto">
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`flex-1 xl:flex-none justify-center px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                      activeTab === 'timeline' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ListTodo size={14} /> 일정
                  </button>
                  <button
                    onClick={() => setActiveTab('packing')}
                    className={`flex-1 xl:flex-none justify-center px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                      activeTab === 'packing' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <CheckSquare size={14} /> 준비물 ({packingItems.filter(i => i.is_checked).length}/{packingItems.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('shopping')}
                    className={`flex-1 xl:flex-none justify-center px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                      activeTab === 'shopping' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ShoppingBag size={14} /> 쇼핑 ({shoppingItems.filter(i => i.is_checked).length}/{shoppingItems.length})
                  </button>
                </div>
              </div>

              {/* 탭 1: Day 타임라인 */}
              {activeTab === 'timeline' && (
                <div className="flex-1 flex flex-col min-h-0 space-y-3">
                  {/* Day 선택 탭 헤더 */}
                  <div 
                    className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 shrink-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  >
                    <div 
                      className="flex items-center gap-1.5 overflow-x-auto py-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    >
                      {getTimelineDays(selectedTrip.start_date, selectedTrip.end_date).map((d, idx) => (
                        <button
                          key={d.dayNum}
                          ref={(el) => { dayTabRefs.current[idx] = el; }}
                          onClick={() => scrollToDay(d.dayNum)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                            activeDayNum === d.dayNum
                              ? 'text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                          style={{
                            backgroundColor: activeDayNum === d.dayNum ? (selectedTrip.color || '#3b82f6') : undefined,
                          }}
                        >
                          Day {d.dayNum} ({d.displayDate})
                        </button>
                      ))}
                    </div>

                    <div className="hidden lg:flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => scrollToDay(Math.max(1, activeDayNum - 1))}
                        disabled={activeDayNum === 1}
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => scrollToDay(Math.min(getTimelineDays(selectedTrip.start_date, selectedTrip.end_date).length, activeDayNum + 1))}
                        disabled={activeDayNum === getTimelineDays(selectedTrip.start_date, selectedTrip.end_date).length}
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* 스와이프 슬라이더 */}
                  <div 
                    ref={sliderRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-x-auto flex snap-x snap-mandatory scroll-smooth min-h-0 divide-x divide-transparent [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {getTimelineDays(selectedTrip.start_date, selectedTrip.end_date).map((d) => {
                      const dayPlans = tripPlans.filter((p) => p.day_num === d.dayNum);

                      return (
                        <div 
                          key={d.dateStr} 
                          className="w-full shrink-0 snap-center p-3.5 sm:p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col space-y-3 min-h-0"
                        >
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 shrink-0">
                            <div className="flex items-center gap-2">
                              <span 
                                className="text-xs font-black text-white px-2.5 py-1 rounded-md shadow-2xs"
                                style={{ backgroundColor: selectedTrip.color || '#3b82f6' }}
                              >
                                Day {d.dayNum}
                              </span>
                              <span className="text-xs font-bold text-slate-700">{d.displayDate} 일정 목록</span>
                            </div>

                            <button
                              onClick={() => handleOpenAddPlanModal(d.dayNum)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={14} /> 일정 추가
                            </button>
                          </div>

                          <div className="space-y-2 overflow-y-auto flex-1 pr-1 min-h-0">
                            {dayPlans.length === 0 ? (
                              <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl space-y-1">
                                <p className="text-xs font-semibold text-slate-500">등록된 일정이 없습니다.</p>
                                <p className="text-[11px] text-slate-400">[+ 일정 추가]를 눌러 코스를 추가해보세요.</p>
                              </div>
                            ) : (
                              dayPlans.map((plan) => (
                                <div
                                  key={plan.id}
                                  className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-2xs flex items-start justify-between gap-2 group hover:border-slate-300 transition"
                                >
                                  <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                                      <Clock size={13} /> {plan.plan_time || '시간 미정'}
                                    </div>
                                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{plan.content}</p>
                                    
                                    {plan.location && (
                                      <p className="pt-0.5">
                                        <a
                                          href={
                                            plan.location.trim().startsWith('http')
                                              ? plan.location.trim()
                                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plan.location.trim())}`
                                          }
                                          target="_blank"
                                          rel="noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium transition cursor-pointer"
                                          title="구글 맵에서 위치 확인하기"
                                        >
                                          <MapPin size={12} className="text-blue-600 shrink-0" />
                                          <span className="truncate max-w-[180px]">
                                            {plan.location.trim().startsWith('http') ? '구글 맵 장소 열기' : plan.location}
                                          </span>
                                          <ExternalLink size={10} className="text-blue-400 shrink-0" />
                                        </a>
                                      </p>
                                    )}

                                    {plan.attachment && (
                                      <div className="pt-1.5">
                                        <a
                                          href={plan.attachment.public_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200/80 transition"
                                        >
                                          <Paperclip size={12} className="text-blue-600" />
                                          <span className="truncate max-w-[180px]">{plan.attachment.file_name}</span>
                                          <ExternalLink size={11} />
                                        </a>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => handleOpenEditPlanModal(plan)}
                                      className="p-1 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                                      title="일정 수정"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePlan(plan.id)}
                                      className="p-1 text-slate-300 hover:text-red-500 transition cursor-pointer"
                                      title="일정 삭제"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 탭 2 & 3: 준비물 / 쇼핑리스트 */}
              {(activeTab === 'packing' || activeTab === 'shopping') && (
                <div className="flex-1 flex flex-col min-h-0 space-y-3">
                  <form onSubmit={handleAddItem} className="flex items-center gap-2 shrink-0">
                    <input
                      type="text"
                      placeholder={activeTab === 'packing' ? '예: 여권, 보조배터리, 돼지코...' : '예: 도쿄 바나나, 드럭스토어 화장품...'}
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      className="flex-1 text-xs sm:text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-600 transition"
                    />
                    <button
                      type="submit"
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 text-xs font-bold px-3.5 py-2.5 rounded-xl transition cursor-pointer shrink-0"
                    >
                      추가
                    </button>
                  </form>

                  <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                    {(activeTab === 'packing' ? packingItems : shoppingItems).length === 0 ? (
                      <p className="text-xs text-slate-400 py-10 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        {activeTab === 'packing' ? '등록된 준비물이 없습니다.' : '등록된 쇼핑 리스트가 없습니다.'}
                      </p>
                    ) : (
                      (activeTab === 'packing' ? packingItems : shoppingItems).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white transition group"
                        >
                          <div
                            onClick={() => toggleItemCheck(item.id, item.is_checked)}
                            className="flex items-center gap-2.5 cursor-pointer flex-1"
                          >
                            <CheckCircle2
                              size={18}
                              className={item.is_checked ? 'text-blue-600' : 'text-slate-300'}
                            />
                            <span
                              className={`text-xs sm:text-sm font-medium ${
                                item.is_checked ? 'line-through text-slate-400' : 'text-slate-800'
                              }`}
                            >
                              {item.content}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-slate-300 hover:text-red-500 transition cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 text-xs sm:text-sm">좌측에서 여행 프로젝트를 선택하세요.</div>
          )}
        </div>
      </div>

      {/* 3. 새 여행 등록 모달 */}
      {isAddTripModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                <Map size={18} className="text-blue-600" /> 새 여행 프로젝트
              </h2>
              <button onClick={() => setIsAddTripModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">여행 프로젝트 제목</label>
                <input
                  type="text"
                  placeholder="예: 오사카 3박 4일 여행"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">여행지</label>
                <input
                  type="text"
                  placeholder="예: 일본 오사카"
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">시작일</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 p-2 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">종료일</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 p-2 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                  <Palette size={12} /> 여행 테마 색상
                </label>
                <div className="flex items-center gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSelectedColor(c.value)}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        selectedColor === c.value ? 'scale-125 ring-2 ring-slate-400' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                  
                  <label className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition relative overflow-hidden shrink-0">
                    <Palette size={12} className="text-slate-500" />
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddTripModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition"
                >
                  등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. 여행 수정 모달 */}
      {isEditTripModalOpen && editingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                <Pencil size={18} className="text-blue-600" /> 여행 정보 & 색상 수정
              </h2>
              <button onClick={() => setIsEditTripModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateTrip} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">여행 프로젝트 제목</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">여행지</label>
                <input
                  type="text"
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">시작일</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 p-2 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">종료일</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 p-2 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                  <Palette size={12} /> 여행 테마 색상 변경
                </label>
                <div className="flex items-center gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSelectedColor(c.value)}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        selectedColor === c.value ? 'scale-125 ring-2 ring-slate-400' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                  
                  <label className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition relative overflow-hidden shrink-0">
                    <Palette size={12} className="text-slate-500" />
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditTripModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition"
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. 타임라인 일정 모달 */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                <Clock size={16} className="text-blue-600" /> 
                {editingPlan ? `Day ${selectedDayNum} 일정 수정` : `Day ${selectedDayNum} 일정 추가`}
              </h2>
              <button onClick={() => setIsPlanModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">시간</label>
                <input
                  type="time"
                  value={planTime}
                  onChange={(e) => setPlanTime(e.target.value)}
                  className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 p-2 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">일정 내용</label>
                <input
                  type="text"
                  placeholder="예: 난바역 도착 후 라피트 탑승"
                  value={planContent}
                  onChange={(e) => setPlanContent(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">
                  장소 (구글 맵 검색)
                </label>
                <input
                  type="text"
                  placeholder="예: 신사이바시, 도카이도 신칸센"
                  value={planLocation}
                  onChange={(e) => setPlanLocation(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">연동할 티켓/바우처 서류 (선택)</label>
                <select
                  value={selectedAttachmentId}
                  onChange={(e) => setSelectedAttachmentId(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none"
                >
                  <option value="">연동 서류 없음</option>
                  {availableAttachments.map((att) => (
                    <option key={att.id} value={att.id}>
                      [{att.category}] {att.file_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition"
                >
                  {editingPlan ? '수정 완료' : '등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}