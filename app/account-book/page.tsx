'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { 
  Plus, 
  Trash2, 
  Pencil,
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  ChevronLeft, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  X
} from 'lucide-react';

interface AccountItem {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  payment_method: string;
}

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#cbd5e1'];

export default function AccountBookPage() {
  const [items, setItems] = useState<AccountItem[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // 모달 폼 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('식비');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('신용카드');

  const categories = {
    expense: ['식비', '교통/차량', '쇼핑/생필품', '문화/취미', '주거/통신', '기타지출'],
    income: ['월급/수당', '용돈', '부수입', '기타수입'],
  };

  const getYearMonth = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    return { year: y, month: m, str: `${y}-${m}` };
  };

  const { year, month, str: currentMonthStr } = getYearMonth(currentMonth);

  const fetchMonthItems = async () => {
    setLoading(true);
    const startDate = `${currentMonthStr}-01`;
    const lastDay = new Date(year, parseInt(month), 0).getDate();
    const endDate = `${currentMonthStr}-${lastDay}`;

    const { data, error } = await supabase
      .from('account_book')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (!error && data) {
      setItems(data as AccountItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMonthItems();
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, currentMonth.getMonth() + 1, 1));
  };

  const openNewModal = () => {
    setEditingId(null);
    setType('expense');
    setAmount('');
    setCategory(categories.expense[0]);
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('신용카드');
    setIsModalOpen(true);
  };

  const openEditModal = (item: AccountItem) => {
    setEditingId(item.id);
    setType(item.type);
    setAmount(String(item.amount));
    setCategory(item.category);
    setDescription(item.description || '');
    setDate(item.date);
    setPaymentMethod(item.payment_method || '신용카드');
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    const payload = {
      type,
      amount: Number(amount),
      category,
      description,
      date,
      payment_method: paymentMethod,
      user_id: user.id 
    };

    let error;
    if (editingId) {
      const res = await supabase.from('account_book').update(payload).eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase.from('account_book').insert([payload]);
      error = res.error;
    }

    if (!error) {
      setIsModalOpen(false);
      fetchMonthItems();
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('내역을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('account_book').delete().eq('id', id);
    if (!error) fetchMonthItems();
  };

  const totalIncome = items
    .filter((i) => i.type === 'income')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalExpense = items
    .filter((i) => i.type === 'expense')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalBalance = totalIncome - totalExpense;

  const expenseByCategory = items
    .filter((i) => i.type === 'expense')
    .reduce((acc: { [key: string]: number }, item) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
      return acc;
    }, {});

  const pieChartData = Object.keys(expenseByCategory).map((cat) => ({
    name: cat,
    value: expenseByCategory[cat],
  }));

  return (
    <div className="space-y-4 sm:space-y-6 w-full pb-8">
      {/* 🌟 1. 상단 월 선택 & 요약 바: 모바일 대응 보정 */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-base sm:text-2xl font-black text-slate-800 flex items-center gap-1.5 sm:gap-2 truncate">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            <span>월간 가계부 & 자산 리포트</span>
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 mt-0.5">
            한 달 수입과 지출 흐름을 그래프로 스마트하게 관리하세요.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-black text-slate-800 px-1 sm:px-2 whitespace-nowrap">
              {year}년 {parseInt(month)}월
            </span>
            <button onClick={handleNextMonth} className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 🌟 눈에 부담스럽지 않은 연파랑 트렌디 버튼으로 교체 */}
          <button
            onClick={openNewModal}
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 text-xs sm:text-sm font-bold px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl transition flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap"
          >
            <Plus size={16} className="shrink-0" />
            <span className="hidden sm:inline">내역 추가</span>
            <span className="sm:hidden">추가</span>
          </button>
        </div>
      </div>

      {/* 2. 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">월 총 수입</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900">+ ₩{totalIncome.toLocaleString()}</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">월 총 지출</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-red-500 flex items-center justify-center">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900">- ₩{totalExpense.toLocaleString()}</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">이번 달 남은 돈</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${totalBalance >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
              {totalBalance >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </div>
          </div>
          <p className={`text-lg sm:text-xl font-black ${totalBalance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
            {totalBalance >= 0 ? '+' : ''} ₩{totalBalance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 3. 차트 및 세부 내역 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <h2 className="text-xs sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-2.5">
            📊 지출 카테고리 비중
          </h2>

          {pieChartData.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              지출 내역이 없습니다.
            </div>
          ) : (
            <div className="h-[200px] sm:h-[220px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => `₩${Number(val).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400">총 지출</span>
                <span className="text-xs font-black text-slate-800">₩{totalExpense.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* 상세 내역 목록 */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-xs space-y-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-xs sm:text-base font-bold text-slate-900">
              📝 입출금 상세 내역 ({items.length}건)
            </h2>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 max-h-[300px] sm:max-h-[320px] pr-1">
            {loading ? (
              <p className="text-xs text-slate-400 text-center py-10">불러오는 중...</p>
            ) : items.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10 border border-dashed border-slate-200 rounded-xl">
                등록된 입출금 내역이 없습니다.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 sm:p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between transition hover:border-slate-200"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0 ${item.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-red-600'}`}>
                      {item.category.substring(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {item.description || item.category}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                        {item.date} • {item.payment_method || '현금'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className={`text-xs sm:text-sm font-extrabold mr-1 ${item.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {item.type === 'income' ? '+' : '-'} ₩{Number(item.amount).toLocaleString()}
                    </span>

                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                      title="수정"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. 내역 추가/수정 겸용 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base">
                {editingId ? '가계부 내역 수정' : '가계부 내역 추가'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3">
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategory(categories.expense[0]); }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${type === 'expense' ? 'bg-white text-red-600 shadow-2xs' : 'text-slate-500'}`}
                >
                  지출 (-)
                </button>
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategory(categories.income[0]); }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${type === 'income' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-500'}`}
                >
                  수입 (+)
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">금액 (원)</label>
                <input
                  type="number"
                  placeholder="예: 15000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-sm font-bold text-slate-900 bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">카테고리</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none"
                >
                  {categories[type].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">내용 / 메모</label>
                <input
                  type="text"
                  placeholder="예: 점심 식대, 커피"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs font-medium text-slate-900 bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600"
                />
              </div>

              {/* 🌟 날짜와 결제수단 반응형 줄바꿈 처리 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">날짜</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 p-2 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">결제 수단</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 p-2 rounded-xl outline-none"
                  >
                    <option value="신용카드">신용카드</option>
                    <option value="체크카드">체크카드</option>
                    <option value="현금">현금</option>
                    <option value="계좌이체">계좌이체</option>
                  </select>
                </div>
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
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm cursor-pointer"
                >
                  {editingId ? '수정 완료' : '저장하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}