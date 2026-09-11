'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BookOpen, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Sparkles,
  Star,
  Pencil,
  X,
  Heart,
  ChevronDown,
  ChevronUp,
  Plus,
  Calendar
} from 'lucide-react';

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  color: string;
}

interface TripDiary {
  id: string;
  trip_id: string;
  day_num: number;
  title: string;
  content: string;
  photo_urls: string[];
  photo_paths: string[];
  rating: number;
  created_at: string;
}

export default function DiariesPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [diaries, setDiaries] = useState<TripDiary[]>([]);

  // Day 필터 상태 (0 = 전체 보기, 1 = Day 1, 2 = Day 2 ...)
  const [selectedDayFilter, setSelectedDayFilter] = useState<number>(0);

  // 펼쳐진 Day 카드의 ID 목록
  const [expandedDiaryIds, setExpandedDiaryIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // 다이어리 에디터 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDiaryId, setEditDiaryId] = useState<string | null>(null);
  const [activeDayNum, setActiveDayNum] = useState<number>(1);
  const [diaryTitle, setDiaryTitle] = useState('');
  const [diaryContent, setDiaryContent] = useState('');
  const [diaryRating, setDiaryRating] = useState(5);

  // 다중 이미지 관련 상태
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([]);
  const [existingPhotoPaths, setExistingPhotoPaths] = useState<string[]>([]);
  const [selectedNewFiles, setSelectedNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const photoInputRef = useRef<HTMLInputElement>(null);

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

  const fetchDiaries = async (tripId: string) => {
    const { data, error } = await supabase
      .from('trip_diaries')
      .select('*')
      .eq('trip_id', tripId)
      .order('day_num', { ascending: true });

    if (!error && data) {
      const formatted = data.map((d: any) => ({
        ...d,
        photo_urls: Array.isArray(d.photo_urls) ? d.photo_urls : (d.photo_url ? [d.photo_url] : []),
        photo_paths: Array.isArray(d.photo_paths) ? d.photo_paths : (d.photo_path ? [d.photo_path] : []),
      }));
      setDiaries(formatted);
      setExpandedDiaryIds(formatted.map(item => item.id));
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (selectedTrip) {
      fetchDiaries(selectedTrip.id);
      setSelectedDayFilter(0);
    }
  }, [selectedTrip]);

  const getTimelineDays = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const toggleExpand = (id: string) => {
    setExpandedDiaryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenModalForDay = (dayNum: number) => {
    setActiveDayNum(dayNum);
    const existing = diaries.find((d) => d.day_num === dayNum);

    if (existing) {
      setEditDiaryId(existing.id);
      setDiaryTitle(existing.title || '');
      setDiaryContent(existing.content || '');
      setDiaryRating(existing.rating || 5);
      setExistingPhotoUrls(existing.photo_urls || []);
      setExistingPhotoPaths(existing.photo_paths || []);
    } else {
      setEditDiaryId(null);
      setDiaryTitle('');
      setDiaryContent('');
      setDiaryRating(5);
      setExistingPhotoUrls([]);
      setExistingPhotoPaths([]);
    }

    setSelectedNewFiles([]);
    setNewPreviews([]);
    setIsModalOpen(true);
  };

  const handleMultiplePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFileList = Array.from(files);
    setSelectedNewFiles((prev) => [...prev, ...newFileList]);

    const newPreviewUrls = newFileList.map((file) => URL.createObjectURL(file));
    setNewPreviews((prev) => [...prev, ...newPreviewUrls]);
  };

  const handleRemoveNewPreview = (index: number) => {
    setSelectedNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingPhoto = (index: number) => {
    setExistingPhotoUrls((prev) => prev.filter((_, i) => i !== index));
    setExistingPhotoPaths((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;

    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];
      const uploadedPaths: string[] = [];

      for (const file of selectedNewFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `diary_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `${selectedTrip.id}/diaries/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('trip-files')
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('trip-files')
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
        uploadedPaths.push(filePath);
      }

      const finalUrls = [...existingPhotoUrls, ...uploadedUrls];
      const finalPaths = [...existingPhotoPaths, ...uploadedPaths];

      if (editDiaryId) {
        const { error } = await supabase
          .from('trip_diaries')
          .update({
            title: diaryTitle,
            content: diaryContent,
            rating: diaryRating,
            photo_urls: finalUrls,
            photo_paths: finalPaths,
            photo_url: finalUrls[0] || '',
            photo_path: finalPaths[0] || '',
          })
          .eq('id', editDiaryId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('trip_diaries').insert([
          {
            trip_id: selectedTrip.id,
            day_num: activeDayNum,
            title: diaryTitle,
            content: diaryContent,
            rating: diaryRating,
            photo_urls: finalUrls,
            photo_paths: finalPaths,
            photo_url: finalUrls[0] || '',
            photo_path: finalPaths[0] || '',
          },
        ]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchDiaries(selectedTrip.id);
    } catch (err: any) {
      alert('저장 실패: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDiary = async (id: string, paths: string[]) => {
    if (!confirm('이 일기와 작성된 모든 사진을 삭제하시겠습니까?')) return;

    try {
      if (paths && paths.length > 0) {
        await supabase.storage.from('trip-files').remove(paths);
      }
      const { error } = await supabase.from('trip_diaries').delete().eq('id', id);

      if (!error && selectedTrip) {
        fetchDiaries(selectedTrip.id);
      }
    } catch (err: any) {
      alert('삭제 실패: ' + err.message);
    }
  };

  const totalDays = selectedTrip ? getTimelineDays(selectedTrip.start_date, selectedTrip.end_date) : 0;

  const displayedDays = selectedDayFilter === 0
    ? Array.from({ length: totalDays }).map((_, i) => i + 1)
    : [selectedDayFilter];

  const getTargetDayDate = (startDateStr: string, dayIndex: number) => {
    if (!startDateStr) return '';
    const date = new Date(startDateStr);
    date.setDate(date.getDate() + (dayIndex - 1));

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[date.getDay()];

    return `${yyyy}.${mm}.${dd} (${dayName})`;
  };

  return (
    <div className="space-y-4 w-full flex flex-col h-auto lg:h-[calc(100vh-90px)]">
      {/* 🌟 1. 상단 타이틀 바: 모바일 대응 보정 */}
      <div className="flex items-center justify-between gap-2.5 bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-100 shadow-xs shrink-0">
        <div className="min-w-0">
          <h1 className="text-base sm:text-2xl font-black text-slate-800 flex items-center gap-1.5 sm:gap-2 truncate">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            <span>여행 포토 에세이 & 블로그</span>
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 mt-1">
            상단 Day 탭을 눌러 원하는 날짜의 일기를 펼쳐서 확인해 보세요.
          </p>
        </div>
      </div>

      {/* 2. 메인 스플릿 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 flex-1 min-h-0">
        {/* 좌측 여행 선택 */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-xs p-3.5 sm:p-4 flex flex-col min-h-[160px] max-h-[220px] lg:max-h-none lg:min-h-0">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5 shrink-0">
            <h2 className="text-xs sm:text-base font-bold text-slate-800">여행 선택</h2>
            <span className="text-[11px] sm:text-xs font-semibold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full">
              총 {trips.length}개
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {loading ? (
              <p className="text-xs sm:text-sm text-slate-400 py-6 text-center">불러오는 중...</p>
            ) : trips.length === 0 ? (
              <div className="text-center py-6 space-y-1">
                <Sparkles className="w-5 h-5 text-blue-400 mx-auto opacity-50" />
                <p className="text-xs sm:text-sm text-slate-400">등록된 여행이 없습니다.</p>
              </div>
            ) : (
              trips.map((trip) => {
                const isSelected = selectedTrip?.id === trip.id;
                const tripColor = trip.color || '#3b82f6';

                return (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-50/50 shadow-2xs font-bold'
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
                    <div className="pl-1.5 min-w-0 flex-1">
                      <h3 className="text-xs sm:text-base font-bold text-slate-900 truncate">{trip.title}</h3>
                      <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5">📍 {trip.destination}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 우측 포토 블로그 화면 */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-xs p-3.5 sm:p-5 flex flex-col min-h-[400px] lg:min-h-0">
          {selectedTrip ? (
            <div className="flex flex-col h-full space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0 gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <Heart className="text-pink-500 fill-pink-500 shrink-0" size={18} />
                  <h2 className="text-xs sm:text-lg font-bold text-slate-900 truncate">{selectedTrip.title} 포토 다이어리</h2>
                </div>
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-100 text-slate-600 shrink-0 whitespace-nowrap">
                  기록 {diaries.length} / {totalDays}일 완료
                </span>
              </div>

              {/* Day 필터 버튼 칩 바 */}
              <div 
                className="flex items-center gap-1.5 overflow-x-auto py-1 shrink-0 no-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <button
                  onClick={() => setSelectedDayFilter(0)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedDayFilter === 0
                      ? 'text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                  style={{
                    backgroundColor: selectedDayFilter === 0 ? (selectedTrip.color || '#3b82f6') : undefined,
                  }}
                >
                  전체 일기 보기
                </button>

                {Array.from({ length: totalDays }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const hasDiary = diaries.some((d) => d.day_num === dayNum);
                  const isSelectedDay = selectedDayFilter === dayNum;

                  return (
                    <button
                      key={dayNum}
                      onClick={() => setSelectedDayFilter(dayNum)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                        isSelectedDay
                          ? 'text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                      style={{
                        backgroundColor: isSelectedDay ? (selectedTrip.color || '#3b82f6') : undefined,
                      }}
                    >
                      Day {dayNum}
                      {hasDiary && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelectedDay ? 'bg-white' : 'bg-pink-500'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Day별 포토 포스팅 리스트 */}
              <div className="space-y-3.5 overflow-y-auto flex-1 pr-1 min-h-0">
                {displayedDays.map((dayNum) => {
                  const diary = diaries.find((d) => d.day_num === dayNum);
                  const isExpanded = diary ? expandedDiaryIds.includes(diary.id) : true;
                  const targetDateText = getTargetDayDate(selectedTrip.start_date, dayNum);

                  return (
                    <div 
                      key={dayNum}
                      className="p-3.5 sm:p-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3 transition hover:border-slate-300"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span 
                            className="text-xs font-black text-white px-2 py-0.5 rounded-md shadow-2xs shrink-0"
                            style={{ backgroundColor: selectedTrip.color || '#3b82f6' }}
                          >
                            Day {dayNum}
                          </span>
                          
                          <h3 className="text-xs sm:text-base font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                            {diary?.title ? (
                              diary.title
                            ) : (
                              <span className="text-slate-500 font-semibold flex items-center gap-1 text-xs sm:text-sm">
                                <Calendar size={13} className="text-slate-400" /> {targetDateText}
                              </span>
                            )}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {diary && (
                            <div className="hidden sm:flex items-center text-amber-400">
                              {Array.from({ length: diary.rating }).map((_, i) => (
                                <Star key={i} size={13} className="fill-amber-400" />
                              ))}
                            </div>
                          )}

                          <button
                            onClick={() => handleOpenModalForDay(dayNum)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <Pencil size={13} /> {diary ? '수정' : '작성'}
                          </button>

                          {diary && (
                            <>
                              <button
                                onClick={() => handleDeleteDiary(diary.id, diary.photo_paths)}
                                className="p-1 text-slate-300 hover:text-red-500 transition cursor-pointer"
                                title="삭제"
                              >
                                <Trash2 size={15} />
                              </button>

                              <button
                                onClick={() => toggleExpand(diary.id)}
                                className="p-1 text-slate-500 hover:bg-slate-200/60 rounded-lg transition cursor-pointer flex items-center gap-0.5 text-xs font-bold"
                              >
                                {isExpanded ? (
                                  <>접기 <ChevronUp size={14} /></>
                                ) : (
                                  <>펼치기 <ChevronDown size={14} /></>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 작성된 본문 (접기/펼치기 제어) */}
                      {diary ? (
                        isExpanded ? (
                          <div className="space-y-3 pt-1">
                            <p className="text-[11px] sm:text-xs font-bold text-slate-400 flex items-center gap-1">
                              <Calendar size={12} /> {targetDateText}
                            </p>

                            {/* 갤러리 이미지 */}
                            {diary.photo_urls && diary.photo_urls.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {diary.photo_urls.map((url, i) => (
                                  <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-2xs bg-slate-100">
                                    <img 
                                      src={url} 
                                      alt={`Day ${dayNum} 사진 ${i + 1}`} 
                                      className="w-full h-full object-cover hover:scale-105 transition duration-300 cursor-pointer"
                                      onClick={() => window.open(url, '_blank')}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* 긴 글 본문 */}
                            <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs">
                              <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                                {diary.content || '작성된 본문 글이 없습니다.'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => toggleExpand(diary.id)}
                            className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-500 cursor-pointer hover:border-slate-300 transition"
                          >
                            <p className="truncate pr-2">{diary.content || '내용 접힘'}</p>
                            <span className="text-[11px] font-bold text-blue-600 whitespace-nowrap">더보기 ∨</span>
                          </div>
                        )
                      ) : (
                        <div 
                          onClick={() => handleOpenModalForDay(dayNum)}
                          className="py-6 sm:py-8 text-center border border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-white transition space-y-1"
                        >
                          <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300 mx-auto" />
                          <p className="text-xs font-bold text-slate-700">
                            Day {dayNum} · {targetDateText}
                          </p>
                          <p className="text-[11px] text-slate-400">클릭하여 사진과 오늘의 추억을 기재해 보세요.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 text-xs sm:text-sm">좌측에서 여행 프로젝트를 선택하세요.</div>
          )}
        </div>
      </div>

      {/* 3. 에디터 모달 */}
      {isModalOpen && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 shrink-0">
              <h2 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-1.5">
                <BookOpen size={20} className="text-blue-600" /> Day {activeDayNum} ({getTargetDayDate(selectedTrip.start_date, activeDayNum)})
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDiary} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-400">오늘의 스냅 사진 (여러 장 선택 가능)</label>
                  <span className="text-xs text-slate-400">
                    총 {existingPhotoUrls.length + selectedNewFiles.length}장
                  </span>
                </div>

                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={handleMultiplePhotoSelect}
                  className="hidden"
                  accept="image/*"
                  multiple
                />

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {existingPhotoUrls.map((url, idx) => (
                    <div key={`exist-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={url} alt="기존 사진" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingPhoto(idx)}
                        className="absolute top-1 right-1 bg-slate-900/70 text-white p-1 rounded-full opacity-90 hover:bg-red-600 transition cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {newPreviews.map((url, idx) => (
                    <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-blue-400 group">
                      <img src={url} alt="새 미리보기" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewPreview(idx)}
                        className="absolute top-1 right-1 bg-slate-900/70 text-white p-1 rounded-full opacity-90 hover:bg-red-600 transition cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center space-y-1 cursor-pointer transition bg-slate-50/50"
                  >
                    <Plus className="w-5 h-5 text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-500">사진 추가</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">포스팅 제목 (한 줄 요약)</label>
                <input
                  type="text"
                  placeholder="예: 교토의 고즈넉한 대나무 숲과 소바 맛집 탐방"
                  value={diaryTitle}
                  onChange={(e) => setDiaryTitle(e.target.value)}
                  className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-white border border-slate-200 p-2.5 sm:p-3 rounded-xl outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">오늘의 별점 점수</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setDiaryRating(star)}
                      className="p-1 cursor-pointer hover:scale-110 transition"
                    >
                      <Star
                        size={22}
                        className={star <= diaryRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">블로그 본문 이야기 (긴 글 가능)</label>
                <textarea
                  rows={8}
                  placeholder="오늘 걸었던 길, 맛있었던 음식, 현지 사람들과의 소소한 대화 등 블로그 글처럼 자유롭게 길게 적어보세요..."
                  value={diaryContent}
                  onChange={(e) => setDiaryContent(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-white border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-600 leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  취소
                </button>
                
                {/* 🌟 소프트 파랑 스티일 버튼 적용 */}
                <button
                  type="submit"
                  disabled={isUploading}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50 transition"
                >
                  {isUploading ? '업로드 및 저장 중...' : '포스팅 저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}