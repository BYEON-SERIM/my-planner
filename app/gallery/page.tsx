'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Star, 
  X, 
  BookOpen, 
  MapPin, 
  ExternalLink 
} from 'lucide-react';

interface Trip {
  id: string;
  title: string;
  destination: string;
  color: string;
}

interface GalleryPhoto {
  id: string;
  diary_id: string;
  trip_id: string;
  trip_title: string;
  trip_color: string;
  destination: string;
  day_num: number;
  diary_title: string;
  diary_content: string | null;
  photo_url: string;
  rating: number;
  created_at: string;
}

export default function GalleryPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('all');
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  // 라이트박스 모달 상태
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  const fetchGalleryData = async () => {
    setLoading(true);

    // 1. 여행 목록 불러오기
    const { data: tripData } = await supabase
      .from('trips')
      .select('id, title, destination, color')
      .order('start_date', { ascending: false });

    if (tripData) {
      setTrips(tripData);
    }

    // 2. 다이어리 데이터 불러와서 사진 단위로 언패킹(Unpack)
    const { data: diaryData, error } = await supabase
      .from('trip_diaries')
      .select('*, trips(id, title, destination, color)')
      .order('day_num', { ascending: true });

    if (!error && diaryData) {
      const photoList: GalleryPhoto[] = [];

      diaryData.forEach((diary: any) => {
        const tripInfo = diary.trips;
        const urls = Array.isArray(diary.photo_urls) 
          ? diary.photo_urls 
          : (diary.photo_url ? [diary.photo_url] : []);

        urls.forEach((url: string) => {
          if (url) {
            photoList.push({
              id: `${diary.id}_${Math.random().toString(36).substring(2, 7)}`,
              diary_id: diary.id,
              trip_id: diary.trip_id,
              trip_title: tripInfo?.title || '여행 프로젝트',
              trip_color: tripInfo?.color || '#3b82f6',
              destination: tripInfo?.destination || '',
              day_num: diary.day_num,
              diary_title: diary.title || `Day ${diary.day_num} 기록`,
              diary_content: diary.content || '',
              photo_url: url,
              rating: diary.rating || 5,
              created_at: diary.created_at,
            });
          }
        });
      });

      setPhotos(photoList);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGalleryData();
  }, []);

  // 필터링된 사진 목록
  const filteredPhotos = selectedTripId === 'all'
    ? photos
    : photos.filter((p) => p.trip_id === selectedTripId);

  return (
    <div className="space-y-4 sm:space-y-5 w-full pb-8">
      {/* 🌟 1. 상단 타이틀 바: 모바일 대응 보정 */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-row items-center justify-between gap-2.5">
        <div className="min-w-0">
          <h1 className="text-base sm:text-2xl font-black text-slate-800 flex items-center gap-1.5 sm:gap-2 truncate">
            <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            <span>추억 포토 갤러리</span>
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 mt-0.5">
            그동안 소중하게 기록했던 여행 사진들을 피드로 한눈에 감상해 보세요.
          </p>
        </div>

        <span className="text-[11px] sm:text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl shrink-0 whitespace-nowrap">
          총 <strong className="text-blue-600 font-extrabold">{filteredPhotos.length}장</strong>의 순간
        </span>
      </div>

      {/* 2. 여행 프로젝트 필터 칩 바 */}
      <div 
        className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <button
          onClick={() => setSelectedTripId('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
            selectedTripId === 'all'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          전체 사진 보기 ({photos.length})
        </button>

        {trips.map((trip) => {
          const isSelected = selectedTripId === trip.id;
          const count = photos.filter((p) => p.trip_id === trip.id).length;

          return (
            <button
              key={trip.id}
              onClick={() => setSelectedTripId(trip.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
              style={{
                backgroundColor: isSelected ? (trip.color || '#3b82f6') : undefined,
              }}
            >
              <span>{trip.title}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. 그리드 피드 */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <Sparkles className="w-6 h-6 text-blue-500 mx-auto animate-pulse" />
          <p className="text-xs text-slate-400 font-medium">사진 갤러리를 불러오는 중입니다...</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="py-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl space-y-2">
          <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs sm:text-sm font-semibold text-slate-500">등록된 추억 사진이 없습니다.</p>
          <Link href="/diaries" className="text-xs font-bold text-blue-600 hover:underline inline-block">
            + 포토 다이어리에서 일기 작성하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {filteredPhotos.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedPhoto(item)}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 cursor-pointer shadow-2xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            >
              <img
                src={item.photo_url}
                alt={item.diary_title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* 오버레이 마스크 */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2.5 sm:p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-black text-white px-2 py-0.5 rounded-md shadow-2xs"
                    style={{ backgroundColor: item.trip_color }}
                  >
                    Day {item.day_num}
                  </span>
                  <div className="flex items-center text-amber-300">
                    <Star size={11} className="fill-amber-300" />
                    <span className="text-[10px] font-bold ml-0.5 text-white">{item.rating}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-white truncate">{item.diary_title}</p>
                  <p className="text-[10px] text-slate-300 truncate mt-0.5">{item.trip_title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. 라이트박스 확대 모달 팝업 */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[85vh] sm:max-h-[90vh] flex flex-col sm:flex-row overflow-hidden relative">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 z-10 p-1.5 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full transition cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* 좌측: 큰 사진 */}
            <div className="sm:w-1/2 bg-slate-950 flex items-center justify-center min-h-[220px] sm:min-h-[380px]">
              <img
                src={selectedPhoto.photo_url}
                alt={selectedPhoto.diary_title}
                className="max-w-full max-h-[45vh] sm:max-h-[80vh] object-contain"
              />
            </div>

            {/* 우측: 일기 정보 상세 */}
            <div className="sm:w-1/2 p-4 sm:p-5 flex flex-col justify-between space-y-3 sm:space-y-4 bg-white overflow-y-auto">
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span
                    className="text-xs font-black text-white px-2.5 py-0.5 rounded-md"
                    style={{ backgroundColor: selectedPhoto.trip_color }}
                  >
                    Day {selectedPhoto.day_num}
                  </span>
                  <div className="flex items-center text-amber-400 gap-0.5 pr-6 sm:pr-0">
                    {Array.from({ length: selectedPhoto.rating }).map((_, i) => (
                      <Star key={i} size={13} className="fill-amber-400" />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-400 flex items-center gap-1">
                    <MapPin size={12} /> {selectedPhoto.trip_title} • {selectedPhoto.destination}
                  </p>
                  <h3 className="text-sm sm:text-lg font-black text-slate-900 mt-0.5">
                    {selectedPhoto.diary_title}
                  </h3>
                </div>

                <div className="bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[120px] sm:max-h-[160px] overflow-y-auto">
                    {selectedPhoto.diary_content || '작성된 본문 내용이 없습니다.'}
                  </p>
                </div>
              </div>

              {/* 하단 일기 페이지 이동 링크 */}
              <div className="pt-2 border-t border-slate-100">
                <Link
                  href="/diaries"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BookOpen size={14} /> 해당 일기 전체 보러가기 <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}