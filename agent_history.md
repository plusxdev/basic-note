# 🕒 Project Checkpoint (2026-04-24, 2nd session)

## Current Milestone
**Phase 10-F · Phase 1 — realtime 누수 차단 + 레거시 블록 UI 제거 + 일괄 마이그레이션 훅 + Supabase env hotfix**

직전 체크포인트(`ccfd273` Phase 10) 이후 4 커밋, 전부 main 푸시 + Vercel 프로덕션 배포 완료. 최신: `8937239`.

Production: https://pro03note.vercel.app · Repo: https://github.com/plusxdev/pro-03-note

---

## Key Achievements

### 1. Realtime sync 누수 차단 (`bff5af2`)
Phase 10 checkpoint에서 "열린 pending 1번"으로 기록돼 있던 이슈.

**문제**: `lib/sync/engine.ts`의 `handleRealtimeChange`가 `LAST_SYNC_KEY` 컷오프를 체크하지 않아, reset 후 pre-reset 암호문이 realtime 이벤트로 재유입될 수 있음.

**해결**: `row.updated_at <= getLastSyncAt()`이면 스킵. `pullAll`의 `.gt("updated_at", lastSyncAt)` 필터와 대칭. 5줄 추가.

### 2. 레거시 블록 에디터 UI 제거 (Phase 1) (`b338c66`)
18 파일 삭제, 1865 lines 감소.

**삭제**
- `components/editor/block-editor.tsx`, `block-renderer.tsx`
- `components/editor/slash-command-menu.tsx`, `mobile-block-menu.tsx`
- `components/editor/block-types.ts`, `block-type-items.ts`
- `components/editor/blocks/*.tsx` (8개)
- `hooks/use-blocks.ts`
- `lib/constants.ts`의 `BLOCK_TYPE_CONFIG` / `BLOCK_TYPES` / `MAX_INDENT`
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` 의존성 (+ transitive 4)

**보존** (Phase 2에서 처리할 데이터 레이어)
- `Block` 타입, `db.blocks` 테이블
- `use-notes.ts`의 신규 노트 생성 시 빈 text 블록 추가 + 삭제 시 블록 soft-delete + preview fallback
- `use-categories.ts`의 카테고리 삭제 시 블록 정리
- `plain-editor.tsx` 내 마이그레이션 호출 (모듈로 이관됨)
- `crypto-provider.tsx`의 blocks 재암호화, `reset.ts`의 blocks clear
- `sync/engine.ts`의 block entity case, `settings/page.tsx`의 export/import blocks 필드

### 3. 일괄 블록→content 마이그레이션 훅 (`8faa4aa`)
Phase 2 선행 조건을 자동화.

**신설**: `lib/migrations/blocks-to-content.ts`
- `plaintextToHtml(text)` / `migrateNoteFromBlocks(noteId, decrypt)` — plain-editor에서 공용화
- `migrateAllNotesToContent(encrypt, decrypt)` — 일괄 sweep

**통합**:
- `plain-editor.tsx`: 로컬 함수 전부 제거 후 모듈 import
- `crypto-provider.tsx`: unlock 시점에 백그라운드로 `migrateAllNotesToContent` 호출

**재실행 가드**: `localStorage("bn_blocks_migrated_v1")` = 완료 timestamp. `failed === 0`일 때만 세팅 → 실패 노트 있으면 다음 unlock에 재시도.

**검증 결과** (사용자 측):
- 주 기기 플래그 값 `1776984473906` 확인 → migrated=... failed=0으로 완료
- 모바일에서 캐시된 구 번들이 문제 일으킴 → 사이트 데이터 삭제 후 정상

### 4. Supabase env값 trim — WS 무한 재연결 핫픽스 (`8937239`)
Phase 1 배포 후 프로덕션 console에 WS `failed` 스팸 수초 주기로 반복됨.

**원인 추적**
- URL 쿼리: `apikey=eyJhbGci...NMVI%0A&vsn=2.0.0` — JWT 끝에 `%0A`
- `vercel env pull .env.vercel.prod`로 값 확인 → 양쪽 모두 끝에 `\n`:
  ```
  NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ...NMVI\n"
  NEXT_PUBLIC_SUPABASE_URL="https://...supabase.co\n"
  ```
- Supabase realtime 서버가 개행 포함 토큰/URL에서 WS upgrade를 reject → client reconnect loop

**해결**
- `lib/supabase.ts`에서 `process.env.NEXT_PUBLIC_SUPABASE_URL!.trim()`, `...ANON_KEY!.trim()` 적용 (defensive)
- 사용자가 Vercel 대시보드에서 두 env var 재설정 (개행 제거)

**보너스 보안**: `.gitignore`가 `.env.vercel.prod`를 커버 안 함. pull 직후 수동 `rm`으로 처리. (추후 `.gitignore`에 `.env.vercel.*` 추가 검토)

---

## Technical Decisions

| 결정 | 이유 |
|---|---|
| realtime에도 LAST_SYNC_KEY 컷오프 적용 | `pullAll` 필터와 대칭. reset 후 realtime 이벤트 누수는 구조적 차단이 맞음 |
| Phase 1/2 분리 — UI만 먼저 | 데이터 레이어 제거는 "모든 노트가 note.content 가진 상태" 보장이 선행. 큰 변경은 쪼개서 롤백 여지 확보 |
| 일괄 마이그레이션 훅 자동화 | 사용자가 모든 노트를 수동 open하는 비현실적 작업 회피. localStorage 플래그로 멱등성 |
| `failed === 0`일 때만 flag 세팅 | 일부 실패 시 다음 unlock에 재시도. 성공한 노트는 이미 content 있어 자연스럽게 skip |
| supabase 클라이언트 level trim | Vercel dashboard 수정과 독립적인 방어 레이어. 다른 플랫폼 이식에도 안전 |

---

## Pending Tasks

### 높음
1. **Phase 10-F Phase 2 — 레거시 블록 데이터 레이어 제거**
   - 선행 조건: 사용 중인 **모든 기기**에서 `localStorage("bn_blocks_migrated_v1")` timestamp 확인 (현재 주 기기만 확인됨)
   - 제거 대상:
     - `lib/types.ts`의 `Block`, `BlockType`, `BlockMeta`
     - `lib/db.ts`의 `blocks` 스토어 → Dexie 버전 bump 필수
     - `hooks/use-notes.ts`의 블록 생성/삭제/preview fallback
     - `hooks/use-categories.ts`의 카테고리 삭제 시 블록 정리
     - `lib/sync/engine.ts`의 block entity case (push/pull/realtime/syncPush)
     - `lib/reset.ts`의 `db.blocks.clear()`
     - `components/providers/crypto-provider.tsx`의 blocks 재암호화 루프
     - `components/editor/plain-editor.tsx` / `lib/migrations/blocks-to-content.ts`의 마이그레이션 로직 자체
     - `app/settings/page.tsx`의 export/import blocks 필드 (하위 호환 결정 필요)

### 중간
2. **진단 로깅 실전 확인** — `bn_decrypt_fail_log`가 실제 발동할 때의 덤프 확보 (배포 후 증상 소멸로 대기 중)
3. **다중 노트 선택/일괄 작업** — NoteCard 추상화로 확장 쉬움
4. **헤딩 현재 상태 표시** — 툴바 드롭다운에서 현재 라인 heading level 체크
5. **`.gitignore`에 `.env.vercel.*` 추가** — 향후 `vercel env pull` 실수 방지

### 낮음 (UX)
6. 하이라이트(형광펜), 링크 삽입, 이미지/첨부. execCommand 기반 한계 → 규모 커지면 TipTap 고려
7. 자동 백업 / 버전 히스토리

### 드롭됨
- ~~자동 불릿 변환 (`- ` → `• `) 재구현~~ — 사용자 "안 해도 될 거 같아"로 드롭

---

## Agent Notes

### Director
- 세션 작업량: 4 커밋 / 배포 4회. 모두 안정.
- 커밋 cadence 유지: 수정 → `npm run build` → `git commit` → `git push` → `vercel --prod --yes`.
- `#end` 루틴 첫 실행 — 다음 세션은 이 체크포인트로 즉시 이어감.

### Frontend
- **큰 변경은 쪼개기**: Phase 10-F를 Phase 1(UI) / Phase 2(데이터 레이어)로 분리한 게 옳았음. Phase 1 직후 WS hotfix 긴급 개입이 있었는데 Phase 2까지 포함했다면 혼란 가중.
- **Edit 툴 한계**: 긴 old_string은 중간 한 문자만 어긋나도 silent fail. 분할 삭제 + DELETEME 플레이스홀더 우회로 해결. 다음에도 동일 패턴 유용.

### Security
- Vercel env var 개행 문제 — **defensive trim이 근본 수정보다 먼저 배포**된 게 정답. 사용자 대시보드 작업은 비동기이고 그동안에도 서비스는 동작해야 함. 패턴으로 기억.
- realtime WS 무한 재연결은 관측 가능한 증상이라 다행. 조용히 실패하는 경우는 더 위험 — future-proof로 Supabase 클라이언트 주변에 diagnostic 추가 여지.

### Performance
- 일괄 마이그레이션은 background(`void`)로 fire-and-forget. UI 블로킹 없음.
- `isRunning` in-memory guard로 useEffect 의존성 재트리거 방어.

---

## 주요 커밋 이력

```
8937239 Supabase env값 trim — realtime WS 무한 재연결 차단
8faa4aa 일괄 블록→content 마이그레이션 훅 추가
b338c66 레거시 블록 에디터 UI 제거 (Phase 10-F Phase 1)
bff5af2 realtime sync 누수 차단: LAST_SYNC_KEY 컷오프 추가
```

---

## Deployment Cadence (유지)
수정 → 로컬 `npm run build` → `git commit` → `git push` → `vercel --prod --yes`. 전부 자동 한 묶음.

## 환경 참고 (이전 체크포인트에서 계승)
- Supabase URL: https://yjguaevkaymidxvllioo.supabase.co (dev/prod 공유, SYNC_ENABLED 가드로 dev 차단)
- Vercel 프로젝트: kihyun-5528s-projects/pro_03_note
- Vercel 도메인: https://pro03note.vercel.app
- dev 서버: 3003 포트, Node 25 (`/opt/homebrew/opt/node@25/bin`)
- dev sync 필요 시: `.env.local`에 `NEXT_PUBLIC_ENABLE_SYNC=true`
- **주의**: Vercel env var 수정 시 값 끝 trailing newline 조심. `lib/supabase.ts`에 trim 방어층 있지만 근본 값은 깔끔하게 유지

## 메모리 인덱스
- `project_securenote.md` — 프로젝트 개요
- `project_crypto_multitab.md` — 다중탭 방어 패턴 (Phase 10 핵심, 절대 되돌리지 말 것)
- `project_plain_editor.md` — PlainEditor 단일 에디터. 이번 세션에서 마이그레이션 함수는 `lib/migrations/blocks-to-content.ts`로 공용화됨
- `project_block_editor.md` — legacy 블록 에디터 패턴 (Phase 10-F Phase 1에서 UI 레이어 삭제됨. 레퍼런스 용도)
- `project_note_card.md` — NoteCard 래퍼
- `user_profile.md` — 한국어, 보안 중시, 간결 답변
- `feedback_port.md` — dev 3003 포트

## Phase 요약 (축약)
- Phase 1~8: 기반 구축, 마스터키 아키텍처, i18n, UI 전반
- Phase 9: 이중 암호화 버그 수정, dev/prod sync 분리, 모바일 UX
- Phase 10: 블록 에디터 → PlainEditor 전환, 크립토 다중탭 방어, NoteCard 추상화
- **Phase 10-F (진행 중)**: 레거시 정리. Phase 1(UI) 완료, Phase 2(데이터 레이어) 대기.
