# 🕒 Project Checkpoint (2026-04-15)

- **Current Milestone**: Phase 6 PWA 완료 + UI 대폭 개선 + 고정 정렬 수정

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
  - **Phase 6 (PWA)**: manifest.json, Service Worker(network-first navigation + cache-first static), 아이콘(192/512/apple-touch, "n" 글자), SW 등록 컴포넌트
  - **앱 이름**: "basic note"로 통일 (metadata, manifest, 사이드바)
  - **세션 유지**: sessionStorage 기반 — 새로고침해도 타임아웃 내 자동 잠금해제, 탭 닫으면 삭제
  - **삭제 컨펌**: 카테고리/노트 삭제 시 AlertDialog 확인창 추가
  - **사이드바 UI 정리**: 로고 아이콘 제거, 경계선 제거, 메뉴 버튼 배경 투명, 네비 아이콘 제거, 탐색 라벨 숨김, 카테고리 라벨→+ 버튼으로 대체
  - **콘텐츠 UI 정리**: 모든 페이지 타이틀 아래 한글 설명 삭제, 노트 상세 좌측 정렬
  - **카테고리 페이지**: 타이틀에 카테고리명 동적 표시
  - **고정(Pin) 정렬 수정**: 고정 노트가 리스트 최상단에 항상 위치
  - **crypto-provider 안전장치**: syncPullSettings catch + 5초 타임아웃 (모바일 로딩 무한 방지)

- **Pending Tasks**:
  - Phase 7: 설정 페이지 (잠금 타임아웃 UI, 내보내기/가져오기, 토스트 알림, 키보드 단축키)
  - 모바일 대응: 블록 에디터 + 버튼 (슬래시 명령 터치 대안)
  - 캘린더 점 표시: 선택 상태에서 z-index 이슈 잔존 가능

- **Technical Decisions**:
  - 저장소: Dexie.js (IndexedDB) + Supabase (PostgreSQL, 도쿄 리전)
  - 암호화: Web Crypto API, PBKDF2 600K iterations, AES-256-GCM
  - 동기화: 로컬 우선 → 변경 시 즉시 push → Supabase Realtime으로 다른 기기에 즉시 전파
  - 블록 에디터: 커스텀 contentEditable (Tiptap/BlockNote 미사용, dx-kit 규칙 준수)
  - 드래그앤드롭: @dnd-kit + fractional-indexing
  - 배포: Vercel (서버리스), 수동 vercel --prod
  - 뷰 전환: 라우트 기반 (/notes, /notes/calendar, /notes/categories) + 헤더 탭 네비게이션
  - 노트 날짜: createdAt을 사용자가 변경 가능 (updateNoteDate 훅)
  - PWA: 수동 Service Worker (next-pwa 미사용), network-first navigation + cache-first static assets
  - 세션 유지: sessionStorage에 비밀번호+타임스탬프 저장, 활동 시 갱신, 잠금/탭닫기 시 삭제
  - DB 이름: "SecureNotes" 유지 (기존 데이터 호환)
  - 앱 이름: "basic note"
  - 모바일 HTTP 환경에서 crypto.subtle 미지원 — HTTPS(Vercel 배포)에서만 정상 동작

- **Agent Notes**:
  - Supabase URL: https://yjguaevkaymidxvllioo.supabase.co
  - Supabase anon key: .env.local에 저장됨
  - Supabase 테이블: encrypted_entities (RLS + Realtime ON), app_settings (RLS ON)
  - Vercel 프로젝트: kihyun-5528s-projects/pro_03_note
  - Vercel 도메인: https://pro03note.vercel.app (유일한 도메인)
  - Vercel 환경변수: NPM_TOKEN, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (production)
  - GitHub 레포: plusxdev/pro-03-note (private)
  - git config: plusxdev / kihyun@plus-ex.com
  - dev 서버 포트: 3003 (3000번 충돌)
  - .npmrc: @minnjii/dx-kit용 NPM_TOKEN 환경변수 참조

## 파일 구조 요약
```
app/
  layout.tsx (PWA 메타태그+SW등록, basic note), page.tsx (→ /notes 리다이렉트)
  notes/ (layout.tsx[뷰탭+pt-10] + page.tsx + [noteId]/page.tsx[좌측정렬+삭제컨펌+날짜+카테고리이동] + calendar/page.tsx + categories/page.tsx + categories/[categoryId]/page.tsx[카테고리명 동적타이틀])
  settings/ (layout.tsx + page.tsx)
  globals.css (사이드바 경계선/버튼배경 오버라이드)
components/
  providers/ (db-provider, crypto-provider[세션유지], auth-gate, sw-register)
  sidebar/ (app-sidebar[아이콘제거,라벨숨김,+버튼], category-tree[삭제컨펌])
  notes/ (note-list[description제거], note-list-item[카테고리이동드롭다운])
  editor/ (block-editor, block-renderer, block-types, note-title, slash-command-menu, blocks/*)
  dialogs/ (category-dialog)
  lock-screen.tsx
hooks/ (use-notes[고정정렬수정+updateNoteDate], use-blocks, use-categories)
lib/ (db, types, constants, crypto, fractional-index, supabase, sync/engine)
public/
  manifest.json, sw.js
  icons/ (icon.svg[n], icon-192.png, icon-512.png, apple-touch-icon.png)
```
