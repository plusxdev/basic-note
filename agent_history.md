# 🕒 Project Checkpoint (2026-04-16)

- **Current Milestone**: Phase 7 완료 + UX 개선 패치

- **Key Achievements**:
  - Phase 1: 기반 구축 (패키지 설치, 타입/DB/상수 정의, Provider, 앱 셸+사이드바+라우팅)
  - Phase 3: 데이터 CRUD + AES-256-GCM 암호화 (노트/카테고리/블록 생성·수정·삭제)
  - Phase 4: 블록 에디터 (8종 블록: text/heading/bullet/numbered/todo/divider/quote/code, 키보드 핸들링, @dnd-kit 드래그앤드롭, 슬래시 명령 메뉴)
  - Supabase 동기화: Realtime 즉시 sync + 60초 주기 fallback pull, 기기 간 비밀번호/데이터 공유
  - Phase 5: 뷰 시스템 (캘린더 뷰, 카테고리 트리 뷰, 뷰 전환 탭 in header)
  - Vercel 배포: https://pro03note.vercel.app (GitHub 연동, 환경변수 설정)
  - 카테고리 이동: 노트 리스트 아이템에 폴더 아이콘 드롭다운, 노트 상세 드롭다운 서브메뉴
  - 노트 생성일: 상세 타이틀 우측에 날짜 표시, 클릭 시 캘린더 팝오버로 날짜 변경 가능
  - 캘린더 뷰: createdAt 기준 노트 그룹핑, 선택 날짜 검정 점 표시
  - Phase 6 (PWA): manifest.json, Service Worker(network-first navigation + cache-first static), 아이콘(192/512/apple-touch, "n" 글자), SW 등록 컴포넌트
  - 앱 이름: "basic note"로 통일
  - 세션 유지: sessionStorage 기반 — 새로고침해도 타임아웃 내 자동 잠금해제
  - 삭제 컨펌: 카테고리/노트 삭제 시 AlertDialog 확인창
  - 사이드바/콘텐츠 UI 정리
  - 고정(Pin) 정렬 수정: 고정 노트가 리스트 최상단에 항상 위치
  - **Phase 7 (설정 페이지)**:
    - **보안 섹션**: 자동 잠금 타임아웃 Select (1분/5분/15분/30분/사용안함), DB+Supabase 동기화, 즉시 잠금 버튼
    - **데이터 섹션**: 내보내기 (모든 노트/카테고리/블록 복호화 → JSON 다운로드), 가져오기 (JSON → 암호화 → DB 저장)
    - **키보드 단축키 섹션**: 에디터 단축키 + 슬래시 명령 목록 (Kbd 컴포넌트 사용)
    - **토스트 알림 (Sonner)**: AuthGate에 Toaster 배치, 노트 삭제/고정/카테고리 이동/카테고리 추가·삭제/설정 변경/내보내기·가져오기 완료 시 toast 알림
    - **CryptoProvider 확장**: lockTimeoutMinutes + setLockTimeout 컨텍스트 노출
  - **UX 개선 패치 (이번 세션)**:
    - **카테고리 삭제 UX 변경**: 사이드바 호버 삭제 버튼 제거 → 카테고리 페이지 헤더에 삭제 버튼 이동, 2단계 컨펌 (1차: 삭제 확인, 2차: 카테고리+하위 노트 전부 삭제 경고)
    - **deleteCategoryWithNotes**: 카테고리+노트+블록 모두 소프트 삭제 후 Supabase 동기화
    - **fractional-index 방어**: before >= after 시 크래시 방지 (after 무시)
    - **캘린더 뷰 미세 조정**: 노트 점 표시 3px 하향, 선택 박스 ::before pseudo로 아래 6px 확장 + 2px 하향, hover/focus 시 텍스트·링 간섭 제거 (globals.css .calendar-days 클래스)

- **Pending Tasks**:
  - 모바일 대응: 블록 에디터 + 버튼 (슬래시 명령 터치 대안)
  - 비밀번호 변경 기능 (현재 비밀번호 분실 시 복구 불가)
  - 비밀번호 힌트 또는 초기화 기능

- **Technical Decisions**:
  - 저장소: Dexie.js (IndexedDB) + Supabase (PostgreSQL, 도쿄 리전)
  - 암호화: Web Crypto API, PBKDF2 600K iterations, AES-256-GCM
  - 동기화: 로컬 우선 → 변경 시 즉시 push → Supabase Realtime으로 다른 기기에 즉시 전파
  - 블록 에디터: 커스텀 contentEditable (Tiptap/BlockNote 미사용, dx-kit 규칙 준수)
  - 드래그앤드롭: @dnd-kit + fractional-indexing
  - 배포: Vercel (서버리스), 수동 vercel --prod
  - 뷰 전환: 라우트 기반 (/notes, /notes/calendar, /notes/categories) + 헤더 탭 네비게이션
  - PWA: 수동 Service Worker (next-pwa 미사용)
  - 세션 유지: sessionStorage 기반
  - DB 이름: "SecureNotes" 유지
  - 앱 이름: "basic note"
  - Toaster: AuthGate(client component) 내부 배치 (root layout은 서버 컴포넌트라 useTheme 불가)
  - 내보내기/가져오기: ExportData v1 포맷 (JSON, 복호화된 평문)
  - 카테고리 삭제: 2단계 컨펌 → deleteCategoryWithNotes (카테고리+노트+블록 소프트삭제)
  - 캘린더 선택 박스: globals.css .calendar-days 클래스로 ::before pseudo 오프셋 관리

- **Agent Notes**:
  - Supabase URL: https://yjguaevkaymidxvllioo.supabase.co
  - Supabase anon key: .env.local에 저장됨
  - Supabase 테이블: encrypted_entities (RLS + Realtime ON), app_settings (RLS ON)
  - Vercel 프로젝트: kihyun-5528s-projects/pro_03_note
  - Vercel 도메인: https://pro03note.vercel.app
  - Vercel 환경변수: NPM_TOKEN, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (production)
  - GitHub 레포: plusxdev/pro-03-note (private)
  - git config: plusxdev / kihyun@plus-ex.com
  - dev 서버 포트: 3003 (3000번 충돌)
  - .npmrc: @minnjii/dx-kit용 NPM_TOKEN 환경변수 참조

## 파일 구조 요약
```
app/
  layout.tsx (PWA 메타태그+SW등록, basic note)
  page.tsx (→ /notes 리다이렉트)
  notes/ (layout.tsx[뷰탭+pt-10] + page.tsx + [noteId]/page.tsx[삭제컨펌+날짜+카테고리이동+toast] + calendar/page.tsx[.calendar-days] + categories/page.tsx + categories/[categoryId]/page.tsx)
  settings/ (layout.tsx + page.tsx[보안+데이터+단축키 섹션])
  globals.css (.calendar-days 선택박스 스타일)
components/
  providers/ (db-provider, crypto-provider[세션유지+setLockTimeout], auth-gate[+Toaster], sw-register)
  sidebar/ (app-sidebar[+toast], category-tree[삭제버튼 제거됨])
  notes/ (note-list[카테고리 삭제 2단계 컨펌], note-list-item[+toast])
  editor/ (block-editor, block-renderer, block-types, note-title, slash-command-menu, blocks/*)
  dialogs/ (category-dialog)
  lock-screen.tsx
hooks/ (use-notes, use-blocks, use-categories[+deleteCategoryWithNotes])
lib/ (db, types, constants, crypto, fractional-index[방어처리], supabase, sync/engine)
public/
  manifest.json, sw.js
  icons/ (icon.svg[n], icon-192.png, icon-512.png, apple-touch-icon.png)
```
