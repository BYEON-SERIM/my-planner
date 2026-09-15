'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  Coins, 
  Sparkles,
  X,
  Wallet,
  Utensils,
  ShoppingBag,
  Ticket,
  MoreHorizontal,
  CreditCard,
  RefreshCw,
  PieChart,
  List,
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
  exchanged_amount: number;
  currency_unit: string;
}

interface Expense {
  id: string;
  trip_id: string;
  title: string;
  category: string;
  amount: number;
  amount_krw?: number;
  payment_method?: '현금' | '카드';
  expense_date: string;
  created_at: string;
}

export default function ExpensesPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // 모바일 여행 리스트 토글 상태
  const [isMobileTripListOpen, setIsMobileTripListOpen] = useState(false);

  // 모바일 전용 뷰 탭 상태 ('list' | 'summary')
  const [mobileViewTab, setMobileViewTab] = useState<'list' | 'summary'>('list');

  // 실시간 환율 상태
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [rateLoading, setRateLoading] = useState<boolean>(false);

  // 환전 금액 설정 모달
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [exchangedAmount, setExchangedAmount] = useState<number>(10000);
  const [currencyUnit, setCurrencyUnit] = useState('엔');

  // 지출 등록 모달
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setCategory] = useState('식비');
  const [paymentMethod, setPaymentMethod] = useState<'현금' | '카드'>('현금');
  const [amount, setAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // 카테고리 설정
  const categories = [
    { name: '식비', icon: Utensils, iconColor: 'text-amber-600', bg: 'bg-amber-50/60' },
    { name: '쇼핑', icon: ShoppingBag, iconColor: 'text-rose-600', bg: 'bg-rose-50/60' },
    { name: '관광&티켓', icon: Ticket, iconColor: 'text-indigo-600', bg: 'bg-indigo-50/60' },
    { name: '기타', icon: MoreHorizontal, iconColor: 'text-slate-600', bg: 'bg-slate-100/80' },
  ];

  const fetchExchangeRate = async (unitStr?: string) => {
    if (!unitStr) {
      setExchangeRate(1);
      return;
    }

    const unit = unitStr.toUpperCase().trim();
    let currencyCode = 'USD';

    if (unit.includes('엔') || unit.includes('JPY')) currencyCode = 'JPY';
    else if (unit.includes('달러') || unit.includes('USD')) currencyCode = 'USD';
    else if (unit.includes('유로') || unit.includes('EUR')) currencyCode = 'EUR';
    else if (unit.includes('바트') || unit.includes('THB')) currencyCode = 'THB';
    else if (unit.includes('동') || unit.includes('VND')) currencyCode = 'VND';
    else if (unit.includes('원') || unit.includes('KRW')) {
      setExchangeRate(1);
      return;
    }

    setRateLoading(true);
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${currencyCode}`);
      const data = await res.json();
      if (data && data.rates && data.rates.KRW) {
        setExchangeRate(data.rates.KRW);
      }
    } catch {
      setExchangeRate(0);
    } finally {
      setRateLoading(false);
    }
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

  const fetchExpenses = async (tripId: string) => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('expense_date', { ascending: false });

    if (!error && data) {
      setExpenses(data);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (selectedTrip) {
      fetchExpenses(selectedTrip.id);
      setExchangedAmount(selectedTrip.exchanged_amount || 0);
      setCurrencyUnit(selectedTrip.currency_unit || '엔');
      fetchExchangeRate(selectedTrip.currency_unit || '엔');
    }
  }, [selectedTrip]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;

    const { error } = await supabase
      .from('trips')
      .update({
        exchanged_amount: exchangedAmount,
        currency_unit: currencyUnit,
      })
      .eq('id', selectedTrip.id);

    if (!error) {
      setIsBudgetModalOpen(false);
      const updatedTrip = {
        ...selectedTrip,
        exchanged_amount: exchangedAmount,
        currency_unit: currencyUnit,
      };
      setSelectedTrip(updatedTrip);
      fetchTrips();
      fetchExchangeRate(currencyUnit);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip || !expenseTitle.trim()) return;

    const finalAmount = parseFloat(amount) || 0;
    const calcKrw = exchangeRate > 0 ? Math.round(finalAmount * exchangeRate) : finalAmount;

    const { error } = await supabase.from('expenses').insert([
      {
        trip_id: selectedTrip.id,
        title: expenseTitle,
        category: expenseCategory,
        amount: finalAmount,
        amount_krw: calcKrw,
        payment_method: paymentMethod,
        expense_date: expenseDate,
      },
    ]);

    if (!error) {
      setIsExpenseModalOpen(false);
      setExpenseTitle('');
      setAmount('');
      fetchExpenses(selectedTrip.id);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('이 지출 내역을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error && selectedTrip) {
      fetchExpenses(selectedTrip.id);
    }
  };

  // 통계 계산
  const totalSpent = expenses.reduce((sum, item) => sum + (item.amount || item.amount_krw || 0), 0);
  const totalSpentCash = expenses
    .filter((e) => (e.payment_method || '현금') === '현금')
    .reduce((sum, item) => sum + (item.amount || item.amount_krw || 0), 0);
  const totalSpentCard = expenses
    .filter((e) => e.payment_method === '카드')
    .reduce((sum, item) => sum + (item.amount || item.amount_krw || 0), 0);

  const totalExchanged = selectedTrip?.exchanged_amount || 0;
  const remainingCash = totalExchanged - totalSpentCash;
  const usagePercent = totalExchanged > 0 ? Math.min(Math.round((totalSpentCash / totalExchanged) * 100), 100) : 0;

  return (
    <div className="space-y-3.5 sm:space-y-4 w-full flex flex-col h-auto lg:h-[calc(100vh-90px)]">
      {/* 1. 상단 타이틀 바 */}
      <div className="flex items-center justify-between gap-2 bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-100 shadow-xs shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-2xl font-black text-slate-800 flex items-center gap-1.5 sm:gap-2">
            <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            <span className="hidden sm:inline">여행 경비 가계부</span>
            <span className="sm:hidden text-sm font-black whitespace-nowrap">여행 경비 가계부</span>
          </h1>
          
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-1">
            {rateLoading ? (
              <span className="flex items-center gap-1 text-slate-400">
                <RefreshCw size={12} className="animate-spin text-blue-500" /> 실시간 환율 정보 조회 중...
              </span>
            ) : exchangeRate > 0 && selectedTrip ? (
              <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/80">
                📊 현재 실시간 환율: 1{selectedTrip.currency_unit || '엔'} ≈ {exchangeRate.toFixed(2)}원
              </span>
            ) : (
              <span>현금 환전금 차감 및 카드 결제 내역을 함께 관리하세요.</span>
            )}
          </div>
        </div>

        {selectedTrip && (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold px-2 py-1.5 sm:px-3 sm:py-2.5 rounded-xl transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Wallet size={14} className="shrink-0" />
              <span className="hidden sm:inline">총 환전금 입력</span>
              <span className="sm:hidden">환전금</span>
            </button>

            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 text-xs sm:text-sm font-bold px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Plus size={14} className="shrink-0" />
              <span className="hidden sm:inline">지출 추가</span>
              <span className="sm:hidden">추가</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. 메인 스플릿 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 flex-1 min-h-0">
        
        {/* 🌟 좌측: 모바일 토글형 / PC 고정형 여행 선택 영역 */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-xs p-3.5 sm:p-4 flex flex-col shrink-0 lg:min-h-0">
          
          {/* 모바일 전용 토글 헤더 버튼 (PC에서는 일반 타이틀로 표시) */}
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
            isMobileTripListOpen ? 'mt-3 max-h-[200px] block' : 'hidden lg:block'
          }`}>
            {loading ? (
              <p className="text-xs sm:text-sm text-slate-400 py-6 text-center">불러오는 중...</p>
            ) : trips.length === 0 ? (
              <p className="text-xs sm:text-sm text-slate-400 py-6 text-center">등록된 여행이 없습니다.</p>
            ) : (
              trips.map((trip) => {
                const isSelected = selectedTrip?.id === trip.id;
                const tripColor = trip.color || '#3b82f6';

                return (
                  <div
                    key={trip.id}
                    onClick={() => {
                      setSelectedTrip(trip);
                      setIsMobileTripListOpen(false); // 모바일에서 선택 후 닫기
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-50/80 shadow-2xs font-bold'
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

        {/* 우측 경비 현황 */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-xs p-3.5 sm:p-5 flex flex-col min-h-[400px] lg:min-h-0 space-y-3.5 sm:space-y-4">
          {selectedTrip ? (
            <div className="flex flex-col h-full space-y-3.5 sm:space-y-4">
              
              {/* 모바일 전용 뷰 탭 */}
              <div className="lg:hidden flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setMobileViewTab('list')}
                  className={`flex-1 justify-center py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    mobileViewTab === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <List size={14} /> 지출 항목 ({expenses.length})
                </button>
                <button
                  onClick={() => setMobileViewTab('summary')}
                  className={`flex-1 justify-center py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    mobileViewTab === 'summary' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <PieChart size={14} /> 경비 요약
                </button>
              </div>

              {/* 모바일 전용 상단 미니 잔액 바 (지출 항목 탭일 때 노출) */}
              {mobileViewTab === 'list' && (
                <div className="lg:hidden bg-amber-50/90 border border-amber-200/80 p-2.5 rounded-xl flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Coins size={14} className="text-amber-500 shrink-0" />
                    <span>남은 현금 잔액</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900">
                      {remainingCash.toLocaleString()} {selectedTrip.currency_unit || '엔'}
                    </span>
                    {exchangeRate > 0 && (
                      <span className="text-[10px] text-slate-400 font-semibold ml-1">
                        (약 ₩{Math.round(remainingCash * exchangeRate).toLocaleString()}원)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 요약 정보 섹션 */}
              <div className={`space-y-3.5 sm:space-y-4 ${mobileViewTab === 'summary' ? 'block' : 'hidden lg:block'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. 현금 잔액 게이지 카드 */}
                  <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span className="flex items-center gap-1.5"><Coins size={15} className="text-amber-500" /> 남은 환전 잔액 (현금)</span>
                      <span className="text-amber-600 font-extrabold">{usagePercent}% 소진</span>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {remainingCash.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{selectedTrip.currency_unit || '엔'}</span>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          usagePercent > 90 ? 'bg-red-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold pt-0.5">
                      <span>총 환전금: {totalExchanged.toLocaleString()}{selectedTrip.currency_unit}</span>
                      <span>사용: {totalSpentCash.toLocaleString()}{selectedTrip.currency_unit}</span>
                    </div>
                  </div>

                  {/* 2. 카드 승인 및 전체 지출 요약 카드 */}
                  <div className="p-3.5 sm:p-4 bg-blue-50/40 border border-blue-100 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                      <span className="flex items-center gap-1.5"><CreditCard size={15} className="text-blue-600" /> 총 지출 내역</span>
                      <span className="text-blue-600 font-extrabold">총 {expenses.length}건</span>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {totalSpent.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-blue-700">{selectedTrip.currency_unit || '엔'}</span>
                    </div>

                    <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                      <span>💳 카드 결제 합계:</span>
                      <span className="font-extrabold text-blue-700">{totalSpentCard.toLocaleString()} {selectedTrip.currency_unit}</span>
                    </div>
                  </div>
                </div>

                {/* 카테고리별 사용금액 카드 */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 mb-1.5">카테고리별 지출 요약</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
                    {categories.map((cat) => {
                      const CategoryIcon = cat.icon;
                      const catSpent = expenses
                        .filter((e) => e.category === cat.name)
                        .reduce((sum, item) => sum + (item.amount || item.amount_krw || 0), 0);

                      return (
                        <div key={cat.name} className={`p-2.5 sm:p-3.5 rounded-xl border border-slate-100 flex items-center gap-2 sm:gap-2.5 ${cat.bg}`}>
                          <CategoryIcon size={16} className={`shrink-0 ${cat.iconColor}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500">{cat.name}</p>
                            <p className="text-xs sm:text-sm font-black text-slate-900 truncate mt-0.5">
                              {catSpent.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{selectedTrip.currency_unit || '엔'}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 상세 지출 목록 섹션 */}
              <div className={`flex-1 flex flex-col min-h-0 space-y-2 ${mobileViewTab === 'list' ? 'block' : 'hidden lg:block'}`}>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800">지출 세부 항목</h3>
                </div>

                <div className="space-y-2 overflow-y-auto flex-1 pr-1 min-h-0 max-h-[420px] lg:max-h-none">
                  {expenses.length === 0 ? (
                    <div className="py-10 text-center border border-dashed border-slate-200 rounded-2xl space-y-1">
                      <Sparkles className="w-5 h-5 text-blue-400 mx-auto opacity-40" />
                      <p className="text-xs font-semibold text-slate-500">등록된 지출 내역이 없습니다.</p>
                    </div>
                  ) : (
                    expenses.map((item) => {
                      const isCard = item.payment_method === '카드';

                      return (
                        <div
                          key={item.id}
                          className="p-2.5 sm:p-3 bg-slate-50/70 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-xl shadow-2xs flex items-center justify-between gap-2.5 transition group"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                                {item.category}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isCard ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900'
                              }`}>
                                {isCard ? '💳 카드' : '💵 현금'}
                              </span>
                              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">{item.expense_date}</span>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{item.title}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-xs sm:text-sm font-black text-slate-900">
                              -{(item.amount || item.amount_krw || 0).toLocaleString()} {selectedTrip.currency_unit}
                            </p>
                            {exchangeRate > 0 && (
                              <p className="text-[10px] text-slate-400 font-semibold">
                                (약 ₩{Math.round((item.amount || 0) * exchangeRate).toLocaleString()}원)
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteExpense(item.id)}
                            className="p-1 text-slate-300 hover:text-red-500 transition cursor-pointer shrink-0"
                            title="삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 text-xs sm:text-sm">좌측에서 여행 프로젝트를 선택하세요.</div>
          )}
        </div>
      </div>

      {/* 3. 총 환전금 설정 모달 */}
      {isBudgetModalOpen && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                <Wallet size={18} className="text-blue-600" /> 총 환전금 설정
              </h2>
              <button onClick={() => setIsBudgetModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">화폐 단위 표기</label>
                <input
                  type="text"
                  placeholder="예: 엔, 달러, 유로, 바트"
                  value={currencyUnit}
                  onChange={(e) => setCurrencyUnit(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">환전해간 총 금액</label>
                <input
                  type="number"
                  placeholder="예: 10000"
                  value={exchangedAmount || ''}
                  onChange={(e) => setExchangedAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600"
                  required
                  autoFocus
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
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

      {/* 4. 지출 등록 모달 */}
      {isExpenseModalOpen && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                <Plus size={18} className="text-blue-600" /> 지출 추가
              </h2>
              <button onClick={() => setIsExpenseModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1.5 block">결제 수단</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('현금')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer flex flex-col items-center justify-center gap-0.5 min-h-[48px] ${
                      paymentMethod === '현금'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-1 font-extrabold text-xs">
                      💵 현금 / 트래블
                    </span>
                    <span className={`text-[10px] font-normal ${paymentMethod === '현금' ? 'text-amber-100' : 'text-slate-400'}`}>
                      환전 잔액 차감
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('카드')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer flex flex-col items-center justify-center gap-0.5 min-h-[48px] ${
                      paymentMethod === '카드'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-1 font-extrabold text-xs">
                      💳 신용카드
                    </span>
                    <span className={`text-[10px] font-normal ${paymentMethod === '카드' ? 'text-blue-100' : 'text-slate-400'}`}>
                      후불 추가 지출
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">지출 내용</label>
                <input
                  type="text"
                  placeholder="예: 이치란 라멘, 백화점 쇼핑"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">
                  지출 금액 ({selectedTrip.currency_unit || '엔'})
                </label>
                <input
                  type="number"
                  placeholder="예: 1500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600"
                  required
                />
                {exchangeRate > 0 && amount && (
                  <p className="text-[11px] font-semibold text-blue-600 mt-1">
                    예상 원화: 약 ₩{Math.round(parseFloat(amount) * exchangeRate).toLocaleString()}원
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">카테고리</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 p-2 rounded-xl outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">날짜</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 p-2 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition"
                >
                  기록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}