'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Heart, 
  Gift, 
  Send, 
  Ticket, 
  CheckCircle2, 
  Sparkles, 
  X, 
  Trash2, 
  Check,
  UserPlus,
  User,
  Clock,
  AlertCircle,
  Users,
  Search
} from 'lucide-react';

interface Coupon {
  id: string;
  sender_id: string;
  receiver_email: string;
  title: string;
  description?: string;
  status: 'AVAILABLE' | 'USED';
  created_at: string;
  used_at?: string;
  expires_at?: string;
  sender_email?: string;
  sender_name?: string;
}

interface Friend {
  id: string;
  friend_id?: string;
  friend_email: string;
  friend_name?: string;
}

interface SearchedUser {
  user_id: string;
  email: string;
  name: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFriendAddOpen, setIsFriendAddOpen] = useState(false);
  const [isFriendListOpen, setIsFriendListOpen] = useState(false);
  
  // Form 입력 상태
  const [receiverEmailInput, setReceiverEmailInput] = useState('');
  const [couponTitle, setCouponTitle] = useState('');
  const [couponDesc, setCouponDesc] = useState('');
  const [expiresAtInput, setExpiresAtInput] = useState('');

  // 🌟 실시간 친구 검색 관련 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const presets = [
    '☕ 커피&디저트 쏘기권',
    '🚗 하루 전담 기사권',
    '💆 15분 마사지권',
    '🍽️ 오늘 저녁 메뉴 결정권',
    '👑 하루 동안 왕처럼 모시기',
    '🤫 무조건 봐주기 1회권'
  ];

  // 친구 목록 조회
  const fetchFriends = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setFriends(data as Friend[]);
  };

  // 쿠폰 목록 조회
  const fetchCoupons = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      setCurrentUserEmail(user.email || null);

      const { data, error } = await supabase.rpc('get_coupons_with_sender');

      if (!error && data) {
        setCoupons(data as Coupon[]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
    fetchFriends();
  }, []);

  // 🌟 실시간 users 테이블 검색 (드롭다운용)
  const handleSearchUsers = async (query: string) => {
    setSearchKeyword(query);
    if (!query.trim() || !currentUserId) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const { data, error } = await supabase.rpc('search_registered_users', {
      search_query: query.trim(),
      current_user_id: currentUserId
    });

    if (!error && data) setSearchResults(data as SearchedUser[]);
    setIsSearching(false);
  };

  // 🌟 검색 드롭다운에서 유저 선택 후 친구 추가
  const handleSelectAndAddFriend = async (targetUser: SearchedUser) => {
    if (!currentUserId) return;

    const { error } = await supabase.from('friends').insert([
      {
        user_id: currentUserId,
        friend_id: targetUser.user_id,
        friend_email: targetUser.email,
        friend_name: targetUser.name
      }
    ]);

    if (!error) {
      alert(`🎉 '${targetUser.name}(${targetUser.email})' 님이 친구로 등록되었습니다!`);
      setSearchKeyword('');
      setSearchResults([]);
      setIsFriendAddOpen(false);
      fetchFriends();
    } else {
      alert('친구 등록 실패: ' + error.message);
    }
  };

  // 친구 삭제 처리
  const handleDeleteFriend = async (friendshipId: string, friendName: string) => {
    if (!confirm(`'${friendName}' 님을 친구 목록에서 삭제하시겠습니까?`)) return;

    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendshipId);

    if (!error) {
      alert('친구 삭제가 완료되었습니다.');
      setFriends((prev) => prev.filter((f) => f.id !== friendshipId));
    } else {
      alert('친구 삭제 실패: ' + error.message);
    }
  };

  // 쿠폰 발행
  const handleSendCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverEmailInput.trim() || !couponTitle.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    const { error } = await supabase.from('coupons').insert([
      {
        sender_id: user.id,
        receiver_email: receiverEmailInput.trim().toLowerCase(),
        title: couponTitle.trim(),
        description: couponDesc.trim(),
        expires_at: expiresAtInput || null,
        status: 'AVAILABLE'
      }
    ]);

    if (!error) {
      setIsModalOpen(false);
      setReceiverEmailInput('');
      setCouponTitle('');
      setCouponDesc('');
      setExpiresAtInput('');
      alert('🎉 약속 쿠폰을 발송했습니다!');
      fetchCoupons();
    } else {
      alert('쿠폰 발행 실패: ' + error.message);
    }
  };

  // 사용 완료 도장 찍기
  const handleCompleteUseCoupon = async (couponId: string) => {
    if (!confirm('이 쿠폰을 사용 완료 상태로 변경하시겠습니까?')) return;

    const { error } = await supabase
      .from('coupons')
      .update({
        status: 'USED',
        used_at: new Date().toISOString()
      })
      .eq('id', couponId);

    if (!error) fetchCoupons();
  };

  // 쿠폰 삭제
  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('발행했던 쿠폰을 취소/삭제하시겠습니까?')) return;
    const { error } = await supabase.from('coupons').delete().eq('id', couponId);
    if (!error) fetchCoupons();
  };

  const getFriendNameByEmail = (email: string) => {
    const friend = friends.find(f => f.friend_email.toLowerCase() === email.toLowerCase());
    return friend?.friend_name || email;
  };

  const checkIsExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const today = new Date().toISOString().split('T')[0];
    return expiresAt < today;
  };

  const receivedCoupons = coupons.filter(c => c.receiver_email.toLowerCase() === currentUserEmail?.toLowerCase());
  const sentCoupons = coupons.filter(c => c.sender_id === currentUserId);
  const displayCoupons = activeTab === 'received' ? receivedCoupons : sentCoupons;

  return (
    <div className="space-y-4 sm:space-y-5 w-full max-w-5xl mx-auto pb-10 px-2 sm:px-0">
      {/* 1. 상단 헤더 영역 */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pink-50 rounded-xl shrink-0">
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
              약속 & 소원 쿠폰함
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
              소원 쿠폰을 친구와 자유롭게 주고받으세요
            </p>
          </div>
        </div>

        {/* 액션 버튼 그룹 */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end shrink-0">
          <button
            onClick={() => setIsFriendListOpen(true)}
            className="flex-1 sm:flex-initial bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
            title="친구 목록"
          >
            <Users size={15} />
            <span>친구 ({friends.length})</span>
          </button>

          <button
            onClick={() => {
              setSearchKeyword('');
              setSearchResults([]);
              setIsFriendAddOpen(true);
            }}
            className="flex-1 sm:flex-initial bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <UserPlus size={15} />
            <span>친구 추가</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-initial bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Gift size={15} />
            <span>쿠폰 발행</span>
          </button>
        </div>
      </div>

      {/* 2. 탭 선택 바 */}
      <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 justify-center py-2 text-xs sm:text-sm font-extrabold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'received' ? 'bg-white text-pink-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gift size={15} /> 내가 받은 쿠폰 ({receivedCoupons.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 justify-center py-2 text-xs sm:text-sm font-extrabold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'sent' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send size={15} /> 내가 발행한 쿠폰 ({sentCoupons.length})
        </button>
      </div>

      {/* 3. 쿠폰 목록 피드 */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <Sparkles className="w-6 h-6 text-pink-400 mx-auto animate-pulse" />
          <p className="text-xs text-slate-400 font-medium">쿠폰함을 불러오는 중입니다...</p>
        </div>
      ) : displayCoupons.length === 0 ? (
        <div className="py-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl space-y-2.5">
          <Ticket className="w-9 h-9 text-slate-300 mx-auto" />
          <p className="text-xs sm:text-sm font-semibold text-slate-500">
            {activeTab === 'received' ? '아직 받은 약속 쿠폰이 없습니다.' : '발행한 약속 쿠폰이 없습니다.'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-bold text-pink-600 hover:underline inline-block cursor-pointer"
          >
            + 친구 선택하고 첫 쿠폰 발행하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayCoupons.map((item) => {
            const isUsed = item.status === 'USED';
            const isExpired = !isUsed && checkIsExpired(item.expires_at);

            const displaySenderName = item.sender_name || item.sender_email || '보낸 사람';
            const displayTargetName = activeTab === 'received' 
              ? `From. ${displaySenderName}` 
              : `To. ${getFriendNameByEmail(item.receiver_email)}`;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border relative overflow-hidden transition flex flex-col justify-between space-y-3 ${
                  isUsed || isExpired
                    ? 'bg-slate-50/80 border-slate-200 opacity-60' 
                    : 'bg-gradient-to-br from-pink-50/40 via-white to-amber-50/20 border-pink-200/80 shadow-2xs hover:border-pink-300'
                }`}
              >
                {isUsed ? (
                  <div className="absolute top-3 right-3 border-2 border-red-500/80 text-red-500 font-black text-[10px] px-2 py-0.5 rounded-lg rotate-12 bg-white/95">
                    사용 완료
                  </div>
                ) : isExpired ? (
                  <div className="absolute top-3 right-3 border-2 border-slate-400 text-slate-500 font-black text-[10px] px-2 py-0.5 rounded-lg rotate-12 bg-white/95">
                    기간 만료
                  </div>
                ) : null}

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-pink-100 text-pink-600 flex items-center gap-1 truncate max-w-[160px]">
                      <User size={10} /> {displayTargetName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-slate-600 bg-white/90 p-2 rounded-xl border border-slate-100 leading-relaxed">
                      💬 {item.description}
                    </p>
                  )}

                  {item.expires_at && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded-lg border border-amber-100">
                      <Clock size={11} /> 유효기간: {item.expires_at}까지 {isExpired && '(기간 만료)'}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  {activeTab === 'sent' ? (
                    isUsed ? (
                      <div className="flex items-center justify-between w-full text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-bold">
                          <CheckCircle2 size={13} className="text-emerald-500" /> {new Date(item.used_at || '').toLocaleDateString()} 사용됨
                        </span>
                        <button onClick={() => handleDeleteCoupon(item.id)} className="text-slate-300 hover:text-red-500 p-1 cursor-pointer" title="삭제">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : isExpired ? (
                      <div className="flex items-center justify-between w-full text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-bold">
                          <AlertCircle size={13} className="text-slate-400" /> 유효기간 만료
                        </span>
                        <button onClick={() => handleDeleteCoupon(item.id)} className="text-slate-300 hover:text-red-500 p-1 cursor-pointer" title="삭제">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full gap-2">
                        <button
                          onClick={() => handleCompleteUseCoupon(item.id)}
                          className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Check size={13} /> 사용 완료 처리
                        </button>
                        <button onClick={() => handleDeleteCoupon(item.id)} className="text-slate-300 hover:text-red-500 p-1 cursor-pointer" title="취소">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  ) : (
                    isUsed ? (
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <CheckCircle2 size={13} className="text-emerald-500" /> 사용 완료된 쿠폰
                      </span>
                    ) : isExpired ? (
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <AlertCircle size={13} /> 기간이 만료되었습니다.
                      </span>
                    ) : (
                      <span className="text-xs font-extrabold text-pink-600 flex items-center gap-1">
                        <Sparkles size={13} /> 사용 가능
                      </span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. 친구 목록 & 삭제 모달 */}
      {isFriendListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                <Users size={16} className="text-blue-600" /> 내 친구 목록 관리
              </h2>
              <button onClick={() => setIsFriendListOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 divide-y divide-slate-100 pr-1">
              {friends.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">등록된 친구가 없습니다.</p>
              ) : (
                friends.map((f) => (
                  <div key={f.id} className="pt-2 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate flex items-center gap-1">
                        <User size={12} className="text-blue-600" /> {f.friend_name || '친구'}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{f.friend_email}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteFriend(f.id, f.friend_name || f.friend_email)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer shrink-0"
                      title="친구 삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFriendListOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. 🌟 복원된 드롭다운 방식 유저 검색 및 친구 추가 모달 */}
      {isFriendAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                <UserPlus size={16} className="text-blue-600" /> 가입된 유저 검색 / 친구 추가
              </h2>
              <button onClick={() => setIsFriendAddOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {/* 검색어 입력창 */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="이름 또는 이메일 입력..."
                  value={searchKeyword}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 pl-9 pr-3 py-2.5 rounded-xl outline-none focus:border-blue-600"
                  autoFocus
                />
              </div>

              {/* 검색 드롭다운 결과 목록 */}
              <div className="max-h-52 overflow-y-auto space-y-1.5 divide-y divide-slate-100 pr-1">
                {isSearching ? (
                  <p className="text-xs text-slate-400 text-center py-4">사용자를 검색 중입니다...</p>
                ) : searchKeyword.trim() === '' ? (
                  <p className="text-xs text-slate-400 text-center py-4">이름이나 이메일을 치면 결과가 나타납니다.</p>
                ) : searchResults.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">가입된 일치 유저가 없습니다.</p>
                ) : (
                  searchResults.map((u) => {
                    const isAlreadyFriend = friends.some(f => f.friend_email.toLowerCase() === u.email.toLowerCase());

                    return (
                      <div key={u.user_id} className="pt-2 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate flex items-center gap-1">
                            <User size={12} className="text-blue-600" /> {u.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                        </div>

                        {isAlreadyFriend ? (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg shrink-0">
                            등록됨
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectAndAddFriend(u)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-bold px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0"
                          >
                            + 친구 추가
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-2 flex justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFriendAddOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. 쿠폰 발행 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-1.5">
                <Gift size={18} className="text-pink-600" /> 약속 쿠폰 발행하기
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendCoupon} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-400 block">받는 사람 선택</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsFriendAddOpen(true);
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    + 새 친구 등록하기
                  </button>
                </div>

                {friends.length > 0 ? (
                  <select
                    value={receiverEmailInput}
                    onChange={(e) => setReceiverEmailInput(e.target.value)}
                    className="w-full text-xs sm:text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-pink-500"
                    required
                  >
                    <option value="">친구 선택하기...</option>
                    {friends.map((f) => (
                      <option key={f.id} value={f.friend_email}>
                        👤 {f.friend_name || '친구'} ({f.friend_email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center justify-between">
                    <span>등록된 친구가 없습니다.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setIsFriendAddOpen(true);
                      }}
                      className="font-bold text-blue-600 underline cursor-pointer"
                    >
                      친구 등록하기
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1.5 block">추천 약속 쿠폰 (클릭 시 자동 입력)</label>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCouponTitle(p)}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-pink-50 text-pink-600 border border-pink-100 hover:bg-pink-100 transition cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">쿠폰 제목</label>
                <input
                  type="text"
                  placeholder="예: 오늘 저녁 메뉴 결정권 1회"
                  value={couponTitle}
                  onChange={(e) => setCouponTitle(e.target.value)}
                  className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-pink-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">상세 메모 (선택)</label>
                <input
                  type="text"
                  placeholder="예: 거절하기 없기! 맛있는 음식 사줄게"
                  value={couponDesc}
                  onChange={(e) => setCouponDesc(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">유효기간 만료일 (선택)</label>
                <input
                  type="date"
                  value={expiresAtInput}
                  onChange={(e) => setExpiresAtInput(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-pink-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!receiverEmailInput}
                  className="bg-pink-500 hover:bg-pink-600 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer transition disabled:opacity-50"
                >
                  쿠폰 발송하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}