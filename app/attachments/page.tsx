'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Paperclip, 
  Upload, 
  FileText, 
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
  X,
  Pencil,
  Maximize2,
  ChevronDown,
  ChevronUp
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

  // 모바일 여행 리스트 토글 상태
  const [isMobileTripListOpen, setIsMobileTripListOpen] = useState(false);

  // 등록 및 수정 모달 상태
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AttachmentItem | null>(null);

  // 서류 미리보기 팝업 모달 상태
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Form 입력 상태
  const [fileNameInput, setFileNameInput] = useState('');
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
    let { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      const backupResult = await supabase
        .from('trip_attachments')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (!backupResult.error && backupResult.data) {
        data = backupResult.data.map((item: any) => ({
          id: item.id,
          trip_id: item.trip_id,
          file_name: item.file_name || item.title || '예약 서류',
          file_path: item.file_path || '',
          file_type: item.file_type || 'image/jpeg',
          file_size: item.file_size || 0,
          public_url: item.public_url || item.file_url || item.url || '',
          category: item.category || '기타',
          booking_no: item.booking_no || '',
          memo: item.memo || '',
          created_at: item.created_at,
        }));
      }
    }

    if (data) {
      setAttachments(data as AttachmentItem[]);
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

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFileNameInput('');
    setSelectedFile(null);
    setCategory('호텔 예약');
    setBookingNo('');
    setMemo('');
    setIsUploadModalOpen(true);
  };

  const handleOpenEditModal = (item: AttachmentItem) => {
    setEditingItem(item);
    setFileNameInput(item.file_name);
    setSelectedFile(null);
    setCategory(item.category || '호텔 예약');
    setBookingNo(item.booking_no || '');
    setMemo(item.memo || '');
    setIsUploadModalOpen(true);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsUploading(true);

    try {
      let filePath = editingItem?.file_path || '';
      let publicUrl = editingItem?.public_url || '';
      let fileType = editingItem?.file_type || 'text/plain';
      let fileSize = editingItem?.file_size || 0;
      let finalFileName = fileNameInput.trim() || selectedFile?.name || editingItem?.file_name || '예약 서류';

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const generatedFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        filePath = `${selectedTrip.id}/${generatedFileName}`;
        fileType = selectedFile.type;
        fileSize = selectedFile.size;

        const { error: uploadError } = await supabase.storage
          .from('trip-files')
          .upload(filePath, selectedFile, { cacheControl: '3600', upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('trip-files')
          .getPublicUrl(filePath);

        publicUrl = urlData.publicUrl;
      }

      if (editingItem) {
        const { error: dbError } = await supabase
          .from('attachments')
          .update({
            file_name: finalFileName,
            file_path: filePath,
            file_type: fileType,
            file_size: fileSize,
            public_url: publicUrl,
            category,
            booking_no: bookingNo,
            memo,
          })
          .eq('id', editingItem.id);

        if (dbError) throw dbError;
      } else {
        const { error: dbError } = await supabase.from('attachments').insert([
          {
            trip_id: selectedTrip.id,
            file_name: finalFileName,
            file_path: filePath,
            file_type: fileType,
            file_size: fileSize,
            public_url: publicUrl,
            category,
            booking_no: bookingNo,
            memo,
            user_id: user.id 
          },
        ]);

        if (dbError) throw dbError;
      }

      setIsUploadModalOpen(false);
      fetchAttachments(selectedTrip.id);
    } catch (err: any) {
      alert('저장 실패: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (item: AttachmentItem) => {
    if (!confirm(`'${item.file_name}' 문서를 삭제하시겠습니까?`)) return;

    try {
      if (item.file_path) {
        await supabase.storage.from('trip-files').remove([item.file_path]);
      }
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

  return (
    <div className="space-y-3.5 sm:space-y-4 w-full flex flex-col h-auto lg:h-[calc(100vh-90px)]">
      {/* 1. 상단 타이틀 바 */}
      <div className="flex items-center justify-between gap-2.5 bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-100 shadow-xs shrink-0">
        <div className="min-w-0">
          <h1 className="text-base sm:text-2xl font-black text-slate-800 flex items-center gap-1.5 sm:gap-2 truncate">
            <Paperclip className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            <span>예약 & 티켓 서류 보관소</span>
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 mt-1">
            호텔 예약번호, QR 티켓, 바우처 정보를 안전하게 저장하고 관리하세요.
          </p>
        </div>

        {selectedTrip && (
          <button
            onClick={handleOpenAddModal}
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 text-xs sm:text-sm font-bold px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Upload size={16} className="shrink-0" />
            <span className="hidden sm:inline">새 서류 등록</span>
            <span className="sm:hidden">등록</span>
          </button>
        )}
      </div>

      {/* 2. 메인 스플릿 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 flex-1 min-h-0">
        
        {/* 🌟 좌측: 모바일 토글형 / PC 고정형 여행 선택 영역 */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-xs p-3.5 sm:p-4 flex flex-col shrink-0 lg:min-h-0">
          
          {/* 모바일 전용 토글 헤더 버튼 (PC에서는 일반 타이틀로 헤더 유지) */}
          <div 
            onClick={() => setIsMobileTripListOpen(!isMobileTripListOpen)}
            className="flex items-center justify-between cursor-pointer lg:cursor-default lg:border-b lg:border-slate-100 lg:pb-2.5 lg:mb-2.5 shrink-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-xs sm:text-base font-bold text-slate-800">여행 선택</h2>
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

          {/* 여행 카드 목록 (모바일은 토글 open 시만 보임, PC는 항상 보임) */}
          <div className={`space-y-2 overflow-y-auto flex-1 pr-1 transition-all ${
            isMobileTripListOpen ? 'mt-3 max-h-[220px] block' : 'hidden lg:block'
          }`}>
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
                    onClick={() => {
                      setSelectedTrip(trip);
                      setIsMobileTripListOpen(false); // 모바일에서 선택 후 자동 닫기
                    }}
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

        {/* 우측 서류 상세 카드 리스트 */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-xs p-3.5 sm:p-5 flex flex-col min-h-[400px] lg:min-h-0">
          {selectedTrip ? (
            <div className="flex flex-col h-full space-y-3.5">
              {/* 서류 목록 헤더 */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0 gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <FileCheck className="text-blue-600 shrink-0" size={18} />
                  <h2 className="text-xs sm:text-lg font-bold text-slate-900 truncate">
                    {selectedTrip.title} 서류 목록
                  </h2>
                </div>
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-100 text-slate-600 shrink-0 whitespace-nowrap">
                  총 {attachments.length}개 파일
                </span>
              </div>

              {/* 드래그/클릭 업로드 구역 */}
              <div 
                onClick={handleOpenAddModal}
                className="p-3.5 sm:p-4 border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/30 rounded-2xl text-center space-y-1 cursor-pointer transition shrink-0"
              >
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mx-auto" />
                <p className="text-xs sm:text-sm font-bold text-slate-700">여기를 누르고 티켓, QR 이미지, PDF를 업로드하세요</p>
                <p className="text-[10px] sm:text-[11px] text-slate-400">호텔 예약번호나 바우처 메모도 함께 정리할 수 있습니다.</p>
              </div>

              {/* 상세 카드 목록 */}
              <div className="space-y-3 overflow-y-auto flex-1 pr-1 min-h-0">
                {attachments.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl space-y-1">
                    <p className="text-xs sm:text-sm font-semibold text-slate-500">등록된 예약서류가 없습니다.</p>
                    <p className="text-[11px] text-slate-400">상단의 [등록]을 눌러 파일과 정보를 입력해보세요.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                    {attachments.map((item) => {
                      const Icon = categoryIcons[item.category] || FileText;

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 sm:p-4 bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl shadow-2xs flex flex-col justify-between space-y-3 transition group"
                        >
                          <div className="space-y-2">
                            {/* 상단 태그 및 수정/삭제 액션 */}
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1">
                                <Icon size={12} /> {item.category || '기타'}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditModal(item)}
                                  className="p-1 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                                  title="서류 정보 수정"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteFile(item)}
                                  className="p-1 text-slate-400 hover:text-red-500 transition cursor-pointer"
                                  title="삭제"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* 파일명 & 메모 */}
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate" title={item.file_name}>
                                {item.file_name}
                              </p>
                              {item.memo && (
                                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  📝 {item.memo}
                                </p>
                              )}
                            </div>

                            {/* 예약 번호 복사 바 */}
                            {item.booking_no && (
                              <div className="flex items-center justify-between bg-slate-100/80 px-2 py-1 rounded-lg text-xs font-semibold text-slate-700">
                                <span className="truncate text-[11px] sm:text-xs">예약번호: <strong className="font-bold text-slate-900">{item.booking_no}</strong></span>
                                <button
                                  onClick={() => handleCopyBookingNo(item.id, item.booking_no)}
                                  className="text-blue-600 hover:text-blue-800 transition flex items-center gap-1 shrink-0 ml-1 cursor-pointer"
                                  title="예약번호 복사"
                                >
                                  {copiedId === item.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                  <span className="text-[10px]">{copiedId === item.id ? '복사됨' : '복사'}</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* 열람 및 원본보기 액션 바 */}
                          <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                            {item.public_url ? (
                              <>
                                <button
                                  onClick={() => setPreviewUrl(item.public_url)}
                                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition cursor-pointer"
                                >
                                  <FileText size={13} /> 문서/티켓 열람하기
                                </button>
                                <a
                                  href={item.public_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-0.5 transition cursor-pointer"
                                  title="새 탭 창에서 파일 크게 열기"
                                >
                                  <span>원본보기</span>
                                  <ExternalLink size={12} />
                                </a>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">첨부 파일 없음 (메모)</span>
                            )}
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

      {/* 3. 서류 등록 & 수정 모달 */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-1.5">
                <Paperclip size={20} className="text-blue-600" />
                {editingItem ? '예약 서류 정보 수정' : '새 예약 서류 등록'}
              </h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">서류 제목 / 이름</label>
                <input
                  type="text"
                  placeholder="예: 피치항공 E-티켓, 피스 호스텔 바우처"
                  value={fileNameInput}
                  onChange={(e) => setFileNameInput(e.target.value)}
                  className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">
                  {editingItem ? '파일 변경 (선택)' : '티켓/QR/PDF 파일 첨부'}
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 bg-slate-50 border border-slate-200 p-2 rounded-xl outline-none"
                  accept="image/*,.pdf"
                />
                {editingItem && !selectedFile && (
                  <p className="text-[11px] text-blue-600 font-semibold mt-1">✓ 기존 파일이 등록되어 있습니다.</p>
                )}
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
                <label className="text-xs font-bold text-slate-400 mb-1 block">예약번호 / Confirmation No. (선택)</label>
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
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? '저장 중...' : editingItem ? '수정 완료' : '서류 저장하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. 미리보기 팝업 모달 */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 shrink-0">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <FileText size={16} className="text-blue-600" /> 예약 서류 / 티켓 팝업
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-blue-50 transition"
                  title="새 탭 창으로 더 크게 보기"
                >
                  <Maximize2 size={13} /> 크게 열기
                </a>
                <button onClick={() => setPreviewUrl(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X size={18} />
                </button>
              </div>
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