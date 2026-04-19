# 🕒 Project Checkpoint (2026-04-18)

- **Current Milestone**: Phase 8 완료 — 마스터키/복구키, i18n, UI 대폭 개선

- **Key Achievements**:
  - Phase 1~7: 기존 성과 유지 (기반구축, CRUD+암호화, 블록에디터, Supabase동기화, 뷰시스템, PWA, 설정)
  - **Phase 8 (이번 세션)**:
    - **마스터 키 아키텍처**: 비밀번호 → 래핑키 → 마스터키 → 데이터 암호화. 기존 유저 자동 마이그레이션 (전체 데이터 재암호화)
    - **복구 키**: 최초 설정/마이그레이션 시 자동 생성, 설정 페이지에서 확인/복사, 잠금 화면에서 복구 키로 잠금 해제 + 비밀번호 재설정
    - **비밀번호 변경**: 설정 페이지에서 현재 비밀번호 확인 후 마스터키 재래핑 (데이터 재암호화 불필요)
    - **한/영 전환 (i18n)**: LanguageProvider (localStorage 저장), lib/i18n.ts에 전체 번역 키 정의, 설정에서 한국어/English 전환, 전 컴포넌트 t() 적용
    - **사이드바 개선**: 축소 시 아이콘 표시/펼침 시 텍스트만 (CSS display 토글), 로고 b 박스, 카테고리 카운트 제거, 너비 16rem→14rem
    - **카테고리 UI**: AccordionBlock 불릿 제거 → 폴더 아이콘 하이라이트 (#50e3c2), 미분류 아이콘 활성화, 카운트 타이틀 옆 이동, ⋮ 메뉴로 수정/삭제
    - **노트 리스트**: 카테고리 페이지에서 ⋮ 메뉴 (수정/삭제), 카운트 폰트 크기 조정
    - **노트 상세**: 카테고리명+날짜 상단 라인, 타이틀 아래 배치, 백버튼 정렬
    - **버튼 정리**: mr-2 일괄 제거 (dx-kit Button 내장 gap 활용), 텍스트 간결화 (새 노트→노트, 카테고리 추가→카테고리)
    - **잠금 화면**: 인풋 라벨 제거, 여백 조정
    - **캘린더**: 날짜 선택 시 카운트 배지 제거, 요일 약자 (토요일→토), 한자→한글 수정

- **Pending Tasks**:
  - 설정에 초기화 메뉴 추가: 2단계 컨펌 후 전체 데이터 삭제 + 리셋 (IndexedDB + Supabase)
  - 노트 리스트에 카테고리명 노출
  - 모바일 대응: 블록 에디터 + 버튼 (슬래시 명령 터치 대안)

- **Technical Decisions**:
  - 저장소: Dexie.js (IndexedDB) + Supabase (PostgreSQL, 도쿄 리전)
  - 암호화: Web Crypto API, PBKDF2 600K iterations, AES-256-GCM, **마스터 키 레이어** (비밀번호/복구키 → 래핑키 → 마스터키)
  - 복구 키: 128bit 랜덤 hex (XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX), 마스터키로 암호화 저장
  - 동기화: 로컬 우선 → 변경 시 즉시 push → Supabase Realtime으로 다른 기기에 즉시 전파
  - i18n: localStorage 저장, lib/i18n.ts 단일 파일, LanguageProvider 컨텍스트, useLanguage() 훅
  - 블록 에디터: 커스텀 contentEditable (Tiptap/BlockNote 미사용, dx-kit 규칙 준수)
  - 드래그앤드롭: @dnd-kit + fractional-indexing
  - 배포: Vercel (GitHub 연동 자동 배포)
  - 뷰 전환: 라우트 기반 (/notes, /notes/calendar, /notes/categories)
  - PWA: 수동 Service Worker (next-pwa 미사용)
  - 세션 유지: sessionStorage 기반
  - DB 이름: "SecureNotes" 유지
  - 앱 이름: "basic note"
  - 사이드바 너비: 14rem (펼침), 3rem (축소)
  - 카테고리 아코디언: 불릿 숨김 (CSS), 폴더 아이콘 하이라이트 (#50e3c2)
  - 사이드바 아이콘/텍스트 전환: globals.css display 토글 (.nav-icon, .logo-icon)

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
  layout.tsx (PWA 메타태그+SW등록, basic note, LanguageProvider)
  page.tsx (→ /notes 리다이렉트)
  notes/ (layout.tsx[뷰탭+pt-10] + page.tsx + [noteId]/page.tsx[카테고리명+날짜+타이틀+삭제컨펌+toast] + calendar/page.tsx[.calendar-days+i18n날짜] + categories/page.tsx[⋮수정삭제+폴더하이라이트] + categories/[categoryId]/page.tsx)
  settings/ (layout.tsx + page.tsx[보안+비밀번호변경+복구키+언어+데이터+단축키])
  globals.css (.calendar-days, 사이드바 아이콘토글, AccordionBlock 불릿숨김+폴더하이라이트, 사이드바너비)
components/
  providers/ (db-provider, crypto-provider[마스터키+복구키+비밀번호변경], auth-gate[+Toaster+복구키다이얼로그], sw-register, language-provider[i18n])
  sidebar/ (app-sidebar[축소아이콘+로고전환+i18n], category-tree[i18n])
  notes/ (note-list[⋮수정삭제+i18n], note-list-item[i18n+날짜로케일])
  editor/ (block-editor, block-renderer, block-types, note-title, slash-command-menu, blocks/*)
  dialogs/ (category-dialog[수정지원+useEffect동기화+i18n])
  lock-screen.tsx (복구키모드+라벨제거+i18n)
hooks/ (use-notes, use-blocks, use-categories[+deleteCategoryWithNotes+updateCategory])
lib/ (db, types[AppSettings+마스터키필드], constants, crypto[마스터키+복구키+래핑], i18n[ko/en번역], fractional-index, supabase, sync/engine)
public/
  manifest.json, sw.js
  icons/ (icon.svg[n], icon-192.png, icon-512.png, apple-touch-icon.png)
```
