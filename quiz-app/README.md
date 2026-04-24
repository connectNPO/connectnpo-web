# 990 Readiness Quiz

GivingArc의 리드 매그넷 — 비영리단체의 Form 990 제출 준비도 퀴즈.

## 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
```bash
cp .env.example .env.local
```
`.env.local`을 열어서 실제 값 입력:
- Supabase URL + Service Key (기존 ConnectNPO 프로젝트 재사용)
- Gmail App Password (`quiz@givingarc.com`용 — 2FA 필수)
- Consultation URL (예: Cal.com 링크)

### 3. Supabase 테이블 생성
Supabase SQL Editor에서 `sql/create_quiz_leads.sql` 실행 (또는 아래 쿼리):
```sql
CREATE TABLE quiz_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  org_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT NOT NULL,
  revenue_range TEXT,
  org_type TEXT,
  fiscal_year_end TEXT,
  score INT NOT NULL,
  grade TEXT NOT NULL,
  weak_categories TEXT[],
  answers JSONB,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);
CREATE INDEX idx_quiz_leads_email ON quiz_leads(email);
CREATE INDEX idx_quiz_leads_created_at ON quiz_leads(created_at DESC);
```

### 4. 로컬 실행
```bash
npx vercel dev
```
→ http://localhost:3000 접속

### 5. 배포
```bash
npx vercel --prod
```
Vercel Dashboard에서:
- 환경변수 등록
- Custom domain: `quiz.givingarc.com` 연결
- DNS: `quiz` CNAME → `cname.vercel-dns.com`

## 폴더 구조

```
quiz-app/
├── public/              정적 파일 (브라우저로 전송)
│   ├── index.html       메인 페이지 (6-step SPA)
│   ├── app.js           상태 관리 + 퀴즈 로직
│   ├── questions.js     18문항 데이터
│   └── styles.css       커스텀 스타일
├── api/
│   └── submit.js        Serverless: Supabase + Gmail SMTP
├── emails/
│   └── result-template.js  이메일 HTML 생성
├── package.json
└── vercel.json
```

## 블로그 통합

WordPress 글 하단에 HTML 블록 삽입:
```html
<a href="https://quiz.givingarc.com?utm_source=blog&utm_campaign=POST_SLUG">
  Take the Free 990 Quiz →
</a>
```
