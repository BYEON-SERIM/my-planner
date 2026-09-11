https://my-planner-lovat.vercel.app/

# 📑 SECO LOG (세코로그)

> **일상의 생산적 관리부터 특별한 여행 기록까지, 나만을 위한 스마트 라이프 플래너 & 오거나이저**

---

## 프로젝트 소개 (About Project)

**SECO LOG**는 바쁜 일상 속 **To-Do 체크리스트, 주간/월간 스케줄, 자산 관리(월간 가계부)**를 효율적으로 관리함과 동시에, **여행 프로젝트(일정, D-Day, 여행 가계부, 예약 티켓 바우처, 포토 다이어리)**를 하나의 통합된 공간에서 직관적으로 사용할 수 있도록 설계된 개인 맞춤형 대시보드 웹 서비스입니다.

---

## 개발 환경 및 기술 스택 (Tech Stack)

- **프레임워크 (Framework)**: Next.js 14 (App Router)
- **라이브러리 (Library)**: React 18
- **언어 (Language)**: TypeScript
- **스타일링 (Styling)**: Tailwind CSS
- **빌드 도구 (Build Tool)**: Next.js Compiler (SWC 기반)
- **백엔드 & 데이터베이스 (Backend & DB)**: Supabase (PostgreSQL, Supabase Storage)
- **배포 도구 (Deployment)**: Vercel
- **데이터 시각화 (Visualization)**: Recharts
- **아이콘 (Icons)**: Lucide React
- **버전 관리 (VCS)**: Git / GitHub

---

## 핵심 메뉴 및 주요 기능 (Features)

### 1. 종합 대시보드 홈 (`/`)

- **대시보드 퀵 서머리**: 오늘 처리해야 할 미완료 Task 개수 및 금주 스케줄 요약 노출
- **오늘의 To-Do & 금주 스케줄**: 메인 화면 접속 시 일상 속 핵심 Task와 주간 스케줄 실시간 동기화 및 즉시 체크
- **여행 프로젝트 미니 카드**: 다가오는 여행의 **D-Day 카운트다운**, 여행지, 기간 정보 및 포토 일기 바로가기
- **서브 위젯**: 여행 누적 지출 금액 요약 및 보관된 서류 **`미리보기`** 모달 팝업 지원 (바우처 instant 확인)

---

### 2. 개인 관리 (Personal Management)

#### **캘린더 (`/calendar`)**

- 월간 일정 등록 및 일정별 커스텀 컬러 지정
- 개인, 업무, 여행 일정을 한눈에 파악하는 전체 스케줄 타임라인

#### **To-Do 체크리스트 (`/todo`)**

- 주간 요일별 날짜 선택 필터링 및 카테고리(`개인`, `업무`) 구분 관리
- 실시간 완료 체크 및 주간 달성률 프로그레스 바 시각화

#### **월간 가계부 (`/account-book`)**

- 일상 생활비 및 용돈 관리를 위한 수입(+)/지출(-) 내역 기록
- **`이번 달 남은 돈`** 자동 집계 (총 수입 - 총 지출)
- Recharts 기반 지출 카테고리별 비중 도넛 차트 제공
- 내역 신규 등록, **수정(Pencil 모달)**, 삭제 기능 지원

---

### 3. 여행 프로젝트 (Travel Projects)

#### **여행 일정 (`/trips`)**

- 프로젝트별 메인 여행 등록 (여행지, 출발/도착일, 테마 컬러 설정)

#### **여행 경비 관리 (`/expenses`)**

- 여행 전용 결제수단별(현금/트래블카드 vs 신용카드) 지출 내역 분리 관리
- 현지 통화 및 한국 원화(KRW) 지출 금액 기록

#### **예약 & 티켓 보관소 (`/attachments`)**

- 호텔 바우처, E-티켓, QR코드 등 중요 예약 서류 보관
- 메인 대시보드 및 상세 페이지에서 **`미리보기`** 클릭 시 PDF/이미지 팝업 모달 노출

#### **여행 기록 다이어리 (`/diaries`)**

- Day N 별 포토 에세이 및 일기 작성
- 이미지 첨부 및 별점(Rating) 평가 기능

---

## 프로젝트 구조 (Directory Structure)

```text
my-planner/
├── app/
│   ├── page.tsx            # 메인 종합 대시보드
│   ├── calendar/           # 캘린더 페이지
│   ├── todo/               # To-Do 체크리스트 페이지
│   ├── account-book/       # 월간 가계부 & 자산 차트 페이지
│   ├── trips/              # 여행 프로젝트 일정 페이지
│   ├── expenses/           # 여행 경비 관리 페이지
│   ├── attachments/        # 예약 서류 및 티켓 보관소
│   └── diaries/            # 여행 기록 포토 다이어리
├── components/
│   └── Sidebar.tsx         # 반응형 접이식 사이드바 (PC/모바일)
├── lib/
│   └── supabase.ts         # Supabase Client 설정
└── public/                 # 정적 리소스
```
