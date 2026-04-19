# 🕒 Project Checkpoint (2026-04-19)

- **Current Milestone**: Phase 9 — 데이터 안정성 복구, 환경 분리, 블록 에디터 UX 재작업

- **Key Achievements**:
  - Phase 1~8: 기존 성과 유지 (기반구축, 마스터키 아키텍처, i18n, 모든 UI 개선)
  - **Phase 9 (이번 세션)**:
    - **이중 암호화 버그 수정**: 마이그레이션 시 decrypt 실패 아이템을 재암호화 대상에서 제외 (기존엔 ciphertext를 또 encrypt해서 영구 손상시킴)
    - **복호화 실패 폴백**: `looksLikeCiphertext()` 헬퍼로 base64 패턴 40자↑ 감지, i18n 번역으로 리스트/상세 라벨 통일 (`tr()` 함수 추가)
    - **데이터 리셋 기능**: 설정 → 위험 구역 → "초기화" 입력 확인 후 Supabase + IndexedDB + storage + SW + Cache 전면 삭제, `bn_reset_pending` 플래그로 옛 설정 복원 차단, `lastSyncAt=now`로 옛 엔티티 재유입 차단
    - **dev ↔ prod 환경 분리**: dev에서 같은 Supabase로 push하던 유출 차단. `NODE_ENV === "production"` 또는 `NEXT_PUBLIC_ENABLE_SYNC === "true"`만 sync 실행. dev는 IndexedDB-only
    - **모바일 스크롤 프리징 해결**: html/body `100dvh + h-full + overflow-hidden`, sidebar-wrapper `100dvh`, main `min-h-0 overscroll-contain`
    - **모바일 블록 에디터**: 우하단 FAB(+) + dx-kit Drawer 바텀시트 8개 블록 타입 선택. `block-type-items.ts` 공유 모듈 + slash-command-menu i18n 전환
    - **블록 에디터 커서 복구**: 8개 블록 + NoteTitle useEffect에 `document.activeElement` 포커스 가드 → 편집 중 DOM 리셋으로 커서가 맨앞 튀던 현상 제거
    - **Enter IME 처리**: `preventDefault` 항상 실행, 조합 중엔 action만 스킵 → 한글 빈 라인 누적 방지
    - **Enter 분할**: `getCaretOffset()`으로 커서 위치 기준 텍스트 분리, 뒤쪽을 새 블록으로 이동 (Notion 방식)
    - **세로 이동 UX**: line-height 기반 첫/끝 라인 판정 + `caretRangeFromPoint`로 컬럼 보존, `stickyXRef`로 연속 세로 이동 시 X 유지
    - **ArrowUp/Down IME 가드**: 조합 중 세로 이동 스킵 (한글 이주 버그 방지)
    - **Backspace 커서 위치**: 이전 블록 **끝**으로 이동
    - **기타 UI**: DropdownMenuItem `variant="destructive"` 적용 (삭제 호버 시 아이콘 빨강 유지), dev 환경 SW 자동 해제 (Turbopack 캐시 충돌 방지)

- **Pending Tasks**:
  - 노트 리스트에 카테고리명 노출 (카테고리 섞여있을 때 소속 확인용)
  - GitHub → Vercel 자동 배포 재연결 (현재는 `vercel --prod` 수동 배포 중)
  - 별도 Supabase dev 프로젝트 (선택): dev에서도 sync 테스트 필요 시 생성 + `.env.local` 교체

- **Technical Decisions**:
  - 저장소: Dexie.js (IndexedDB) + Supabase (PostgreSQL, 도쿄 리전)
  - **환경 분리**: dev는 local-only, prod만 Supabase sync (하드 가드)
  - 암호화: Web Crypto API, PBKDF2 600K iterations, AES-256-GCM, 마스터 키 레이어
  - 복구 키: 128bit 랜덤 hex, 마스터키로 암호화 저장
  - 동기화: 로컬 우선 → 변경 시 즉시 push → Realtime으로 전파 (prod only)
  - 블록 에디터: 커스텀 contentEditable (Tiptap/BlockNote 미사용)
  - 커서 로직: Selection API + caretRangeFromPoint (컬럼 보존), stickyXRef (세로 연속 이동)
  - IME 전략: Enter/ArrowUp/Down 모두 `isComposing || keyCode === 229` 가드
  - 모바일 대응: FAB + Drawer (슬래시 명령 대안), `100dvh` 뷰포트 고정
  - 배포: Vercel 수동 배포 (`vercel --prod`), GitHub auto 연결 끊김

- **Agent Notes**:
  - Supabase URL: https://yjguaevkaymidxvllioo.supabase.co (dev/prod 공유 중 — 문제였으나 sync 가드로 해결)
  - Vercel 프로젝트: kihyun-5528s-projects/pro_03_note
  - Vercel 도메인: https://pro03note.vercel.app
  - dev 서버: 3003 포트, Node 25 (`/opt/homebrew/opt/node@25/bin`), `npm run dev -- -p 3003`
  - `/usr/local/bin/node`는 v16.13.1 — Next.js 16 호환 불가, `/opt/homebrew/opt/node@25` 사용
  - dev 환경에서 sync 테스트 필요 시: `.env.local`에 `NEXT_PUBLIC_ENABLE_SYNC=true` 추가

## 파일 구조 요약
```
app/
  layout.tsx (h-full flex flex-col overflow-hidden, PWA, i18n, dark)
  notes/ (layout.tsx[min-h-0 overscroll-contain] + page.tsx + [noteId]/page.tsx[제목 IME+ciphertext감지] + calendar/ + categories/)
  settings/ (page.tsx[보안+비번변경+복구키+언어+데이터+단축키+위험구역 초기화])
  globals.css (.calendar-days, sidebar 100dvh, AccordionBlock 불릿숨김, 사이드바 아이콘 토글)
components/
  providers/ (db, crypto[이중암호화 수정, 리셋플래그 처리], auth-gate, sw-register[dev 해제], language)
  sidebar/ (app-sidebar, category-tree)
  notes/ (note-list[⋮메뉴+destructive variant], note-list-item)
  editor/
    block-editor.tsx (포커스가드, IME가드, Enter분할, stickyX, caretRangeFromPoint, FAB+Drawer)
    block-renderer.tsx, block-types.ts
    block-type-items.ts (공유 BLOCK_ITEMS + ICON_MAP + i18n 키)
    mobile-block-menu.tsx (dx-kit Drawer 바텀시트)
    slash-command-menu.tsx (i18n 적용)
    note-title.tsx (포커스가드 + IME가드)
    blocks/ (text/heading/bullet/numbered/todo/quote/code/divider — 전부 포커스가드)
  dialogs/ (category-dialog)
  lock-screen.tsx
hooks/ (use-notes[looksLikeCiphertext+tr], use-blocks[동일], use-categories[동일])
lib/
  db, types, constants
  crypto.ts (+ looksLikeCiphertext)
  i18n.ts (+ tr() 헬퍼 + 리셋/블록추가 번역키)
  reset.ts (전면 리셋 + RESET_PENDING_KEY + LAST_SYNC_KEY)
  sync/engine.ts (SYNC_ENABLED 가드 — dev에서 sync 차단)
  fractional-index, supabase
public/
  manifest.json, sw.js, icons/
```
