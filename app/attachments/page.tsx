'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Paperclip, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  ExternalLink, 
  Sparkles,
  FileCheck,
  Building2,
  Plane,
  Ticket,
  Info,
  Copy,
  Check,
  X
} from 'lucide-react';

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  color: string;
}

interface AttachmentItem {
  id: string;
  trip_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  public_url: string;
  category: string;
  booking_no: string;
  memo: string;
  created_at: string;
}

export default function AttachmentsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 업로드용 폼 모달 상태
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('호텔 예약');
  const [bookingNo, setBookingNo] = useState('');
  const [memo, setMemo] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['호텔 예약', '항공권', '티켓 & QR', '바우처/패스', '기타'];

  const categoryIcons: { [key: string]: any } = {
    '호텔 예약': Building2,
    '항공권': Plane,
    '티켓 & QR': Ticket,
    '바우처/패스': FileText,
    '기타': Info,
  };

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

  const fetchAttachments = async (tripId: string) => {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAttachments(data);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (selectedTrip) {
      fetchAttachments(selectedTrip.id);
    }
  }, [selectedTrip]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setIsUploadModalOpen(true);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedTrip) return;

    setIsUploading(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `${selectedTrip.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('trip-files')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('trip-files')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      const { error: dbError } = await supabase.from('attachments').insert([
        {
          trip_id: selectedTrip.id,
          file_name: selectedFile.name,
          file_path: filePath,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          public_url: publicUrl,
          category,
          booking_no: bookingNo,
          memo,
        },
      ]);

      if (dbError) throw dbError;

      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setBookingNo('');
      setMemo('');
      fetchAttachments(selectedTrip.id);
    } catch (err: any) {
      alert('업로드 실패: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (item: AttachmentItem) => {
    if (!confirm(`'${item.file_name}' 문서를 삭제하시겠습니까?`)) return;

    try {
      await supabase.storage.from('trip-files').remove([item.file_path]);
      const { error } = await supabase.from('attachments').delete().eq('id', item.id);

      if (!error && selectedTrip) {
        fetchAttachments(selectedTrip.id);
      }
    } catch (err: any) {
      alert('삭제 실패: ' + err.message);
    }
  };

  const handleCopyBookingNo = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4 w-full flex flex-col h-auto lg:h-[calc(100vh-90px)]">
      {/* 1. 상단 타이틀 바 */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Paperclip className="w-6 h-6 text-blue-600 shrink-0" />
            예약 & 티켓 서류 보관소
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">호텔 예약번호, QR 티켓, 바우처 정보를 안전하게 저장하고 일정과 연동하세요.</p>
        </div>

        {selectedTrip && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap shrink-0"
            >
              <Upload size={18} /> 새 서류 등록
            </button>
          </div>
        )}
      </div>

      {/* 2. 메인 스플릿 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* 좌측 여행 선택 */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-xs p-4 flex flex-col min-h-[180px] max-h-[250px] lg:max-h-none lg:min-h-0">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3 shrink-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-800">여행 선택</h2>
            <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full">
              총 {trips.length}개
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
            {loading ? (
              <p className="text-xs sm:text-sm text-slate-400 py-8 text-center">불러오는 중...</p>
            ) : trips.length === 0 ? (
              <div className="text-center py-8 space-y-1">
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
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex items-center justify-between ${
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
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{trip.title}</h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5">📍 {trip.destination}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 우측 서류 상세 카드 리스트 */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-xs p-4 sm:p-5 flex flex-col min-h-[450px] lg:min-h-0">
          {selectedTrip ? (
            <div className="flex flex-col h-full space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <FileCheck className="text-blue-600" size={20} />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">{selectedTrip.title} 서류 목록</h2>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
                  총 {attachments.length}개 파일
                </span>
              </div>

              {/* 문서 추가 드래그 구역 */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="p-4 border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/30 rounded-2xl text-center space-y-1 cursor-pointer transition shrink-0"
              >
                <Upload className="w-5 h-5 text-blue-500 mx-auto" />
                <p className="text-xs sm:text-sm font-bold text-slate-700">여기를 누르고 티켓, QR 이미지, PDF를 업로드하세요</p>
                <p className="text-[11px] text-slate-400">호텔 예약번호나 바우처 메모도 함께 정리할 수 있습니다.</p>
              </div>

              {/* 상세 카드 목록 */}
              <div className="space-y-3 overflow-y-auto flex-1 pr-1 min-h-0">
                {attachments.length === 0 ? (
                  <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl space-y-1">
                    <p className="text-xs sm:text-sm font-semibold text-slate-500">등록된 예약서류가 없습니다.</p>
                    <p className="text-xs text-slate-400">상단의 [새 서류 등록]을 눌러 파일과 정보를 입력해보세요.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {attachments.map((item) => {
                      const Icon = categoryIcons[item.category] || FileText;

                      return (
                        <div
                          key={item.id}
                          className="p-4 bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl shadow-2xs flex flex-col justify-between space-y-3 transition group"
                        >
                          <div className="space-y-2.5">
                            {/* 상단 태그 & 삭제 버튼 */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1">
                                <Icon size={12} /> {item.category || '기타'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {formatFileSize(item.file_size)}
                              </span>
                            </div>

                            {/* 파일명 & 메모 */}
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-snug truncate" title={item.file_name}>
                                {item.file_name}
                              </p>
                              {item.memo && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  📝 {item.memo}
                                </p>
                              )}
                            </div>

                            {/* 예약 번호 복사 바 */}
                            {item.booking_no && (
                              <div className="flex items-center justify-between bg-slate-100/80 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700">
                                <span className="truncate">예약번호: <strong className="font-bold text-slate-900">{item.booking_no}</strong></span>
                                <button
                                  onClick={() => handleCopyBookingNo(item.id, item.booking_no)}
                                  className="text-blue-600 hover:text-blue-800 transition flex items-center gap-1 shrink-0 ml-1 cursor-pointer"
                                  title="예약번호 복사"
                                >
                                  {copiedId === item.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                                  <span className="text-[10px]">{copiedId === item.id ? '복사됨' : '복사'}</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* 하단 보기 및 삭제 액션 */}
                          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                            <a
                              href={item.public_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                            >
                              <ExternalLink size={14} /> 문서/티켓 열람하기
                            </a>

                            <button
                              onClick={() => handleDeleteFile(item)}
                              className="p-1 text-slate-300 hover:text-red-500 transition cursor-pointer"
                              title="삭제"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 text-xs sm:text-sm">좌측에서 여행 프로젝트를 선택하세요.</div>
          )}
        </div>
      </div>

      {/* 3. 파일 정보 입력 모달 */}
      {isUploadModalOpen && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-1.5">
                <Paperclip size={20} className="text-blue-600" /> 서류 상세 정보 입력
              </h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                <p className="text-[11px] font-bold text-slate-400">선택된 파일</p>
                <p className="text-xs font-bold text-slate-800 truncate">{selectedFile.name}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">서류 카테고리</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">예약번호 / confirmation No. (선택)</label>
                <input
                  type="text"
                  placeholder="예: BK-9281034"
                  value={bookingNo}
                  onChange={(e) => setBookingNo(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">메모 / 안내사항 (선택)</label>
                <input
                  type="text"
                  placeholder="예: 체크인 15:00부터, 캡처된 QR코드"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? '저장 중...' : '서류 저장하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}