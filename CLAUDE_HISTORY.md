# CLAUDE_HISTORY — Project Checkpoints

<!-- 최신 체크포인트가 위, 과거가 아래. 신규 엔트리는 항상 상단에 prepend. -->

---

## 🕒 Checkpoint — 2026-05-10 (사용 현황 카드 + Markdown 백업 전환 + 영구 제외 백로그 명문화)

**Current Milestone**: 설정 페이지 데이터 카드 개편(사용 현황 + 진행 막대), 25/50/75% 임계값 토스트, 백업 형식을 JSON → 평문 Markdown(.md)로 전환, import 기능 폐기. 1 커밋(`0678692`), prod 수동 배포 1회.

**Key Achievements**

- **설정 사용 현황 카드 (`0678692`)** — `app/settings/page.tsx` 데이터 카드에 신규 섹션. 노트 수 / 카테고리 수 / 저장공간 사용량(`navigator.storage.estimate()`)과 quota 대비 % + 1.5px 진행 막대 표시. `db.notes.filter(!deletedAt).count()` + `db.categories.filter(!deletedAt).count()`로 직접 측정(NotesCountProvider 의존 회피, settings layout이 그 provider 밑에 없음).

- **저장공간 임계값 알림 (`0678692`)** — `hooks/use-storage-warning.ts` 신설. 25/50/75% monotonic dedup 패턴: `bn_storage_warned_v1` localStorage에 마지막 알림 임계값 저장, 줄어들어도 같은 임계값 다시 안 띄움. CryptoProvider `isUnlocked` guard + `ran` ref로 마운트당 1회만 측정. `app/notes/layout.tsx`에 빈 `<StorageWatcher />` 컴포넌트로 트리거(노트 영역 진입 시 fire, 설정 직행 시 skip — 의도).

- **백업 형식 JSON → Markdown 전환 (`0678692`)** — 사용자 결정: "저장용 백업인데 잘 읽히지는 않네" → 단일 .md 파일. `lib/export-markdown.ts` 신설, DOMParser 기반 HTML→MD 변환(의존성 0). 매핑: h1~h6, b/strong, i/em, a[href], `<mark>`→`==text==`, code/pre, blockquote, ul/ol/li, br, p/div, hr. `<u>`는 표준 없어 인라인 HTML 유지. 출력: 헤더 메타(내보낸 시각·노트 수) + 노트별 `# 제목` + `*카테고리* · *작성일* · *수정일* · 📌` 메타 라인 + 본문 + `---` 구분. updatedAt 내림차순 정렬.

- **import 기능 통째 제거 (`0678692`)** — handleImport, importing state, fileInputRef, hidden input, Upload 아이콘, ImportData/LegacyImportV1 타입, i18n.import* 8개 키 제거. 평문 Markdown은 사람이 읽기 위한 백업이지 복원 용도가 아님 — 영구 제외.

- **영구 제외 백로그 명문화 (메모리)** — `project_permanent_exclusions.md` 신설. 이미지·다중선택·자동백업·버전히스토리·import·Tauri 6개 항목. MEMORY 색인 갱신. + Tauri 항목 색인 갱신(stale 1순위 → "Tauri 백로그 제거, 앱스토어 배포 결심 시에만 재검토").

- **prod 배포** — `vercel --prod` 수동 배포(`dpl_3KM6P8hPR47q7iVzW9DkpSxEHJvc`). https://pro03note.vercel.app 에서 동작 확인 OK.

**Pending Tasks**

- 라이트 모드 톤·대비 직접 점검 (carry-over from 2026-05-06 밤)
- `<meta name="theme-color">` 다크색 하드코드 → 동적 분기 (carry-over)
- 모바일 헤더에 SidebarTrigger 추가 (메모리 `project_mobile_navigation_gap.md`)
- crypto-provider.tsx 추가 분할 — 신규 lifecycle 추가 시 함께
- 헤딩 현재 상태 표시(caret 위치의 H1/H2/H3 툴바 반영) — 우선순위 낮음

**Known Gaps** (Negative Space)

- **GitHub→Vercel Git Integration 끊김** — 이번 세션 새로 인지. `git push origin main` 후 자동 prod 배포 안 됨. `vercel ls`상 자동 배포 흔적 10일 이상 부재. 다음 세션 진입 시 Vercel 대시보드에서 GitHub 연결 상태 점검 필요.
- **prod 첫 hydration race** (carry-over) — 한계로 수용
- **라이트 모드 검증 미실시** (carry-over)
- **dx-kit 후행 utility 충돌 패턴** (carry-over) — 발견 시 `<span className="contents md:hidden">` wrapper

**Technical Decisions**

- **백업 형식: 평문 Markdown(.md) 단일 파일 확정** — JSON 폐기, import 폐기. 사람이 읽기 위함 + 안전한 곳 보관 책임은 사용자.
- **HTML→MD 변환 의존성 0 원칙** — DOMParser + 직접 walk. turndown 등 라이브러리 회피. `<mark>` 같은 비표준 매핑은 Pandoc/Obsidian 호환 문법(`==text==`) 채택.
- **임계값 알림 monotonic dedup** — localStorage 키 마지막 임계값 저장, 줄어들어도 같은 임계값 재알림 X. reset 시 `localStorage.clear()`로 자연 초기화(별도 청소 코드 불필요).
- **StorageWatcher 위치 = `/notes` layout** — 노트 작업 흐름에서 알림 받는 게 자연스러움. 설정 직행 시 알림 skip은 의도.
- **영구 제외 백로그 명문화** — 메모리 `project_permanent_exclusions.md`로 박음. 다음 세션이 다시 꺼내지 않게.

**Agent Notes**

- **Director**: 1 커밋(`0678692`, 6 files +317/-133) + prod 수동 배포. Git Integration 끊김은 큰 갭이지만 다음 세션 우선 큐로. 분할 vs 단일 커밋 — 사용 현황·임계값·Markdown 전환·import 제거가 모두 "데이터 카드 개편" 한 묶음이라 단일 커밋 합리적.
- **Frontend**: HTML→MD 변환 패턴(`lib/export-markdown.ts`)은 미래 export 형식 변형(예: 노트별 다운로드, ZIP) 시 재사용 가능. DOMParser walk + tag→md 매핑 dispatcher. `<u>` 같은 표준 부재 태그는 인라인 HTML 유지가 깔끔.
- **사용자 피드백**:
  - "JSON이 최선인가? 잘 읽히지 않네" — 형식 선택지 4개 제시(MD/HTML/ZIP/JSON) → MD 채택. 사용자 의도 짚기 + 선택지 + preview 패턴 효과적.
  - "타우리가 뭐라했지?" — MEMORY 색인 stale 인용으로 잘못된 답변. 정정 + 색인 갱신. **메모리는 본문이 진실, 색인은 stale 가능** 룰 재확인.
  - "콘솔에 입력해야해?" — 콘솔 입력 부담. 디버그를 코드 우회로 친화적 재구성. 향후 동작 확인 시 사용자 손 안 가게 코드 쪽에서 강제 트리거.
  - "안뜨는데" → "오 ... 떴어" — 임시 임계값 0% + 디버그 로그로 동작 확인. 검증 후 즉시 원복.
- **환경**: Node v25.8.1 + PATH `/opt/homebrew/bin` prefix. dev :3003 PID 90108 살아있음. Vercel CLI 51.2.1 → 53.2.0 outdated 경고(업그레이드 권장 메시지 떴으나 미실행).

---

## 🕒 Checkpoint — 2026-05-06 (밤 세션: 에디터 기능 + 테마 토글 + 헤더 정리)

**Current Milestone**: PlainEditor에 링크·하이라이트 추가, 다크/라이트/시스템 테마 토글 도입, 글로벌 헤더 탭 추출 + sidebar trigger md:hidden fix. 1 커밋(`24dea57`), prod 미배포.

**Key Achievements**

- **링크 활성화 (`24dea57`)** — PlainEditor에 `createLink`/`unlinkAtCaret`/`isLinkAtCaret` 핸들. URL 자동 인식(Space/Enter 시 직전 토큰이 URL이면 wrap), Cmd/Ctrl+클릭으로 새탭 열기, `target=_blank rel=noopener noreferrer` 강제. 툴바 링크 버튼 — 캐럿이 링크 위면 unlink, 아니면 prompt URL 입력. `--link` 토큰 도입(라이트 #0066cc, 다크 #00d2ff). contentEditable 안 anchor는 평소 `cursor: text`, 모디파이어 누른 동안만 pointer(window keydown/keyup 리스너로 `data-mod` 토글).

- **하이라이트(형광펜) (`24dea57`)** — `mark.bn-highlight` wrap/unwrap 토글. `range.surroundContents` → 경계 가로지르면 `extractContents` fallback. 색은 라이트/다크 무관 단일 `#ffe040` + 글자색 강제 `#000`. 사용자 직접 색 결정(불투명 + 검정 글자가 형광펜 표준 멘탈모델).

- **다크/라이트/시스템 테마 토글 (`24dea57`)** — root `<html>`의 `dark` 하드코드 제거, `next-themes ThemeProvider`(`attribute="class"`, `defaultTheme="dark"`, `enableSystem`) 연결. settings에 라이트/다크/시스템 셀렉터(SSR 안전 `mounted` 가드). 기존 사용자 시각 변화 없음(default=dark).

- **단축키 가이드 카드 (`24dea57`)** — settings에 키보드 단축키 카드 신설. 6행: Bold/Italic/Underline/Undo/Redo + 에디터 내 링크 열기(Cmd+클릭). Mac/Windows 모디파이어 키 자동 분기(`navigator.userAgent`).

- **글로벌 헤더 탭 + SidebarTrigger 정리 (`24dea57`)** — 3개 탭 네비를 `components/layout/global-nav-tabs.tsx`로 추출, notes/settings layout 공유. SidebarTrigger 정렬: 1번(사이드바 안) `mt-[0.5px]`, 2번(콘텐츠 헤더) `mt-[3px]`. dx-kit `.inline-flex` 후행 정의 때문에 `md:hidden`이 무력화되는 이슈를 `<span className="contents md:hidden">` wrapper로 회피.

- **노트 상세 우측 정렬 (`24dea57`)** — 1080 이하 우측 여백 시각 비대칭. `... 메뉴` + `날짜 버튼`에 `translate-x-[13px]`. 좌측 "← 뒤로" 버튼 변경 없음.

**Pending Tasks**

- 다중 노트 선택/일괄 작업, 헤딩 현재 상태 표시(caret 위치의 H1/H2/H3 툴바 반영), 자동 백업/버전 히스토리 — 우선순위 낮음.
- crypto-provider.tsx 추가 분할 — 신규 lifecycle 추가 시 함께.

**Known Gaps** (Negative Space)

- **라이트 모드 디자인 미검증** — 토글만 붙였고, 라이트에서 톤·대비 깨지는 화면은 직접 점검 안 함. 다음 세션 우선 큐.
- **`<meta name="theme-color" content="#09090b">` 다크색 하드코드** — 라이트 모드 PWA 상단 색 어색 가능. 동적 분기 필요시.
- **dx-kit 후행 utility 충돌 패턴** — `.inline-flex` 외에 다른 utility도 충돌 가능성. 미래 비슷한 증상 시 `dx-kit/dist/dx-kit.css` 확인 후 contents wrapper 패턴.

**Technical Decisions**

- **사용자 명시 요청 없이 알파/투명도 임의 도입 금지** — 형광펜 사건에서 학습. 다크모드 contrast 걱정으로 alpha 도입하면 본문 배경과 섞여 칙칙해짐. 모드 무관 강제 색(예: `color: #000`) 패턴이 더 자연스러움. 메모리에 박힘.
- **시각 디테일은 토스 전 직접 점검 (강화)** — 색·커서·호버는 코드 작성 후 사용자 토스 *전*에 본인이 점검. 검증 못 하면 명시적으로 "검증 못 함" 고지하고 토스. 메모리에 박힘(`feedback_visual_check.md`).
- **한국어 존댓말 룰** — 모든 대화 응답에 존댓말. 메모리에 박힘(`feedback_tone.md`).
- **dx-kit utility 충돌 회피 패턴** — `<span className="contents md:hidden">` wrapper. dx-kit 후행 base 룰을 회피하면서 layout 영향 0.
- **공통 UI 컴포넌트 추출 = layout context 패턴 확장** — `GlobalNavTabs` 추출은 이전 `NotesCountProvider` 패턴의 또 다른 사례(공유 UI를 layout 단위로 응집).

**Agent Notes**

- **Director**: 1 커밋(`24dea57`, 10 files +471/-56), prod 미배포. 사용자 검증 후 push 예정. 본래 5묶음 분할 제안했으나 파일 교차로 비용 컸음 → 단일 commit + 메시지 분리로 git log 가독성 보완.
- **Frontend**: PlainEditor에 링크·하이라이트 패턴 정립. `mark` 태그 wrap 시 `surroundContents` → `extractContents` fallback 패턴은 다른 인라인 wrap(예: 미래 색상 변경)에 재사용 가능. `URL_TRAILING_RE`는 추가 토큰(이메일·멘션) 인식 시 확장 포인트.
- **Designer/Publisher**: `--link`, `--highlight` 토큰화로 미래 색 변경은 globals.css 한 줄로 가능. 라이트 모드 톤 검증 다음 세션 우선.
- **사용자 피드백**:
  - "왜 반말이야?" — 존댓말 룰 즉시 메모리화.
  - "진작에 이렇게 해야지" (링크 색·커서) — 시각 디테일 토스 전 점검 룰 강화.
  - "알파값 만졌지?" — 형광펜은 불투명 + 검정 글자. 임의 alpha 도입 금지 룰.
  - "처음으로 돌려봐" → "그냥 이렇게하자" — 베이스라인에서 다시 판단하려는 신호 인지.
  - "뭔짓이지" — 한 종류 버튼만 만지라는 명확한 표현.
  - "확대하면 1,2번 얼라인 안 맞음" — 다른 부모 컨테이너 baseline 차이 인지. 정공법보다 미세 보정 선호.
  - "피씨 1500인데 보임" — 라이브러리 후행 utility 충돌 인지. 빠른 fix 받음.
- **환경**: Node v25.8.1 (PATH `/opt/homebrew/bin` prefix 필수). dev :3003 살아있음(PID 90108). prod push 미실행.

---

## 🕒 Checkpoint — 2026-05-06 (준비완료 신호 + 앱 이름 정리 + 카운트 깜빡임 다층 fix)

**Current Milestone**: 세션 시작 프로토콜 보강 → 앱 이름(`basic note`) 통일 검증(코드 변경 0) → 카운트 `(N)` 깜빡임을 4단 층위로 fix(layout context + sessionStorage hot cache + 트리 노드 + 옛 cache 호환). 4 커밋 / 4 prod 푸시. prod 첫 hydration race는 한계로 수용.

**Key Achievements**

- **준비완료 신호 (`4d341f2`)** — `CLAUDE.md` 0번 섹션 5번째 항목 추가. 세션 시작 자동 복구 1~3단계 후 응답 첫 줄에 `✅ 준비완료` 출력. 인사·확인성 질문엔 직전 세션 핵심 상태 3~5줄 첨부, 작업 명령엔 곧바로 진입.

- **앱 이름 정리 (코드 변경 0)** — 사용자 표면(`title`/`manifest`/사이드바/i18n/백업 파일명) 모두 이미 `basic note`로 통일돼있어 변경 없음. 잔존 `SecureNote` 식별자(`lib/db.ts` Dexie name `"SecureNotes"`, `lib/constants.ts` `VERIFIER_PLAINTEXT = "SecureNote-verified"`, `securenote_last_sync` localStorage 키)는 **데이터 호환성 마커**라 변경 시 모든 기존 사용자 데이터 증발/unlock 불가 — 절대 금지 룰 메모리에 박음. `MEMORY.md` + `project_securenote.md` 갱신.

- **카운트 깜빡임 다층 fix (`21fa1f0`, `00508de`, `e4aa2fb`)** — 직전 세션 R1.2의 known issue. 4 layer:
  1. `NotesCountProvider` (`components/providers/notes-count-provider.tsx`) — `notes/layout.tsx`에 단일 useLiveQuery로 `{total, uncategorized, byCategory}` 컨텍스트 제공. NoteList/CategoryBranch 재마운트되어도 layout이 살아있어 카운트 즉시 hit, 페이지 전환 race 구조적 제거.
  2. **count sessionStorage hot cache** (`bn_notes_count_cache_v1`) — 새로고침 첫 프레임에서 직전 카운트 즉시 표시. 정수만이라 보안 영향 0.
  3. **카테고리 이름 sessionStorage hot cache** (`hooks/use-categories.ts`, `bn_categories_decrypted_v1`) — 새로고침 후 카테고리 페이지 헤더 깜빡 0. **평문 노출 트레이드오프** — 사용자 결정으로 수용. 잠금/리셋 시 invalidate. 노트 본문은 ciphertext 유지.
  4. **`/notes/categories` 트리 노드 카운트 보강** — `useNotesCount(node.id)` 컨텍스트 우선, useNotes 디크립트 결과 fallback. + 옛 cache 형식(uncategorized 누락) 호환 — 검증 너무 엄격하면 새 배포 직후 cache invalid로 깜빡 노출.
  - 부수: `categories/[categoryId]/page.tsx`의 fallback `"카테고리"` → `""`로 변경.

**Pending Tasks**

- **링크 활성화** — 사용자 우선 백로그. PlainEditor에서 URL 자동 인식 또는 수동 입력. execCommand `createLink` 시도 → 한계 시 TipTap 검토.
- **단축키 가이드 복구** — 사용자 우선 백로그. Phase 2B-1(`e840fe0`)에서 settings의 *블록 에디터 시절* 단축키/슬래시 카드를 통째 제거. PlainEditor용 새 가이드 필요(Ctrl+B/I/U/Z 등).
- **하이라이트** — 사용자 우선 백로그. 텍스트 배경색(형광펜). execCommand `hiliteColor` 또는 inline style span.
- **이미지 — 명시적 보류** — 사용자 결정: 초경량 노트 컨셉 유지를 위해 이미지 백로그에서 **제거**.
- 다중 노트 선택/일괄 작업, 헤딩 현재 상태 표시, 자동 백업/버전 히스토리 — 우선순위 낮음.
- crypto-provider.tsx 추가 분할 — 신규 lifecycle 추가 시 함께. 단독 진행 비추.

**Known Gaps** (Negative Space)

- **PlainEditor용 단축키 가이드 없음** — 블록 에디터 시절 가이드를 Phase 2B-1에서 제거한 후, PlainEditor 전환에 맞춰 새로 만들 계획이 백로그에 없었음. 사용자가 이번 세션에 인지(원래 있다가 사라진 게 아니라 *PlainEditor 시대의 가이드는 처음부터 없었다*는 의미의 갭). 위 Pending Tasks로 이동.
- **prod 첫 hydration race**: NotesCountProvider 마운트 + 첫 useLiveQuery resolve 사이의 ms 단위 race. sessionStorage 평문 노출 비용 늘리는 것 vs ROI 검토 후 한계로 수용. 사용자 합의("이 정도면 괜찮은 거 같기도").

**Technical Decisions**

- **layout context + sessionStorage hot cache 패턴 표준화** — 디크립트 race가 보이는 곳마다 동일 패턴 적용 가능. (a) 컨텍스트로 페이지 전환 race 제거, (b) sessionStorage로 새로고침 첫 프레임 hit, (c) cache 검증은 *느슨하게* — 형식 변경 시 누락 필드 default 제공해 옛 cache도 받아들임.
- **앱 이름 통일 — 내부 식별자 절대 금지 룰** — `basic note`(표면) vs `SecureNote`(내부 데이터 마커). Dexie DB name·VERIFIER_PLAINTEXT·`securenote_last_sync` 변경 시 모든 사용자 unlock 불가 또는 데이터 증발. 룰 메모리에 박힘.
- **sessionStorage 평문 노출 보안 한계선** — 카테고리 이름은 평문 OK(라벨, 같은 도메인 XSS만 위험), 노트 본문은 ciphertext 유지 절대. 미래에 비슷한 결정 시 "사용자 보이는 라벨 vs 실제 콘텐츠" 기준.
- **dev/prod 환경 차이 인지** — Next dev는 RSC fetch + HMR + 컴파일이 IndexedDB보다 느려 race 가시화. prod는 SW + IDB hot. dev에서 보이는 race는 prod 보험 가치 있지만, prod에서 안 보이면 추가 비용은 가치 비례 검토 후 멈출 것.
- **단계적 채워짐 vs 한 번에 등장** — title fallback 빈 문자열은 *한 박자씩 채워지는 단계적 표시*가 사용자 인지 부담 큼. 한 번에 채워지는 fade-in이 자연스러움. 미래 비슷한 race 처리 시 동시 등장 우선 검토.

**Agent Notes**

- **Director**: 4 커밋 / 4 prod 푸시. 카운트 깜빡임 fix는 dev 가시화 race + prod 보험. prod 첫 hydration race는 한계 인정 — 합리적 멈춤. 단축키/링크/하이라이트 3개를 다음 세션 진입 시 우선 큐.
- **Frontend**: layout context + sessionStorage hot cache 패턴 정립. NotesCountProvider가 첫 사례, 비슷한 카운트성 데이터(예: 캘린더 일자별 카운트) 추가 시 동일 패턴 그대로. cache 검증은 미래 형식 변경 시 *받아들이는 방향*으로(누락 필드 default).
- **사용자 피드백**:
  - "지금까지는 깜빡임 체크 안 하고 뭐한 거야?" — 정당한 지적. 코드 변경 후 dev에서 직접 체감 검증을 안 하고 패턴만 보고 fix함. 향후 UI 관련 변경은 dev 띄워서 직접 보고 확인할 것.
  - "ㅂㅅ같아" — 한 박자씩 채워지는 단계적 표시 짜증. 한 번에 채워지는 fade-in 선호.
  - "데브에만 있는 버그 아니냐" — 정직한 분석 요구. dev/prod 차이를 명시적으로 설명할 것.
  - "이 정도면 괜찮은 거 같기도" — 합리적 멈춤 기준. 비용 vs ROI 인지 양호. 사용자가 OK 사인 주면 더 손대지 말 것.
  - "이미지는 안 넣을 거고" — 초경량 노트 컨셉 명시적 확정. 백로그에서 이미지 영구 제거.
- **환경 회귀 인지**: `/usr/local/bin/node@v16.13.1`이 PATH 우선 → 셸 비대화형(`!`) 진입 시 nvm 함수 미로드로 v16 잡힘. `PATH="/opt/homebrew/bin:$PATH"` prefix로 v25.8.1 사용. 다음 세션에 빌드/테스트 명령 시 동일 prefix 필요.

---

## 🕒 Checkpoint — 2026-05-04 (인수인계 시스템 보강 + R1 리팩토링 완주 + R2 PWA로 결정)

**Current Milestone**: Known Gaps 슬롯 도입으로 인수인계 시스템 보강 → R1 전체 4개 서브 완주 → R2 진입 시점에 PWA 이미 완비 상태 발견(negative space) → Tauri 백로그 제거. 4개 prod 푸시.

**Key Achievements**

- **인수인계 시스템 보강 (`c045485`)** — `CLAUDE.md` 세션 시작 프로토콜·종료 룰·HISTORY 템플릿에 Known Gaps (Negative Space) 슬롯 추가. "변경된 것"이 아니라 "원래 없었던 것"을 기록하는 영역. 이 세션에서 즉시 효과 발휘(R2의 PWA 이미 완비 발견 인계 가능).

- **R1.1 테스트 인프라 (`b07388d`)** — vitest 4 devDep + `vitest.config.ts` + `npm test` 스크립트. `lib/crypto.test.ts` 18 케이스 (encrypt/decrypt round-trip, IV 랜덤성, 잘못된 키 거부, 마스터키 export·wrap·unwrap, recovery key 형식 8그룹×4hex, createMasterKeySetup→verifyAndUnwrapMasterKey end-to-end, recoverMasterKey, rewrapMasterKey, verifyPasswordLegacy). `lib/fractional-index.test.ts` 10 케이스 (정렬 키 생성·삽입·경계 보정·50회 deep insertion 무충돌). 28 통과 / 1.17초.

- **R1.2 useLiveQuery 중첩 정리 + 마운트 race 보강 (`e1562d1`)** — useNotes/useCategories의 두 번째 useLiveQuery(복호화 변환)를 useState+useEffect (cancelled flag) 패턴으로 교체. `set-state-in-effect` 룰 회피 위해 동기 분기는 derived 변수로 분리. useNotes는 rawResult를 `{key, notes}`로 wrap해 categoryId 전환 race를 setState-in-effect 없이 처리. useCategories는 페이지 마운트 race(카테고리명 placeholder 깜빡임)를 module-level `decryptedCategoriesCache`로 해소(잠금 시 invalidate). NoteList 헤더 카운트 `(N)`은 isLoading 동안 숨김.

- **R1.3 sync 분리 (이미 완료 인지)** — `lib/sync/engine.ts` 한 파일에 push/pull/realtime/cursor/auto-sync 모두 응집 잘 돼있어 추가 분리 가치 적음. 별도 작업 없이 done 처리.

- **R1.4 crypto-provider 분할 (`a563e95`)** — 632 → 535줄 (-97). 응집도별 추출: `lib/crypto-session.ts` (saveSession/loadSession/clearSession + touchSessionTimestamp), `lib/migrate-master-key.ts` (legacy → master key 재암호화), `lib/crypto-broadcast.ts` (CRYPTO_BROADCAST_CHANNEL 상수 + CryptoBroadcastMessage 타입), `hooks/use-idle-auto-lock.ts` (idle timer + activity event listener를 hook으로, ref-during-render 룰 회피용 useEffect로 onTimeoutRef 갱신). Provider 본체 동작 동일성 보존(soft-lock = broadcast/stopAutoSync 없음 의도 유지).

- **R2 PWA 진입 → 이미 완비 발견** — manifest.json (standalone, icon 192/512 maskable), sw.js (precache `/`/`/notes`, navigate=network-first, 정적 자산=cache-first, Supabase=always-network), apple-touch-icon, sw-register(prod-only) 모두 prod에서 살아있음. iOS Safari/Chrome/Sonoma Safari 즉시 설치 가능. Tauri는 백로그 제거(앱스토어 정식 배포 욕심날 때만 재검토).

- **선결 검증** — Dexie v2 마이그레이션 데스크탑·모바일 양쪽 정상(데스크탑 IndexedDB 버전 20 직접 확인, 모바일 정상 동작 확인). `bn_decrypt_fail_log` null(실전 0건). 진단 인프라는 두고 감.

**Pending Tasks**

- 카운트 `(N)` 깜빡임 — useNotes의 마운트 race. R1.2의 known issue. layout context로 노트 수 한 번만 fetch하면 자연 해소. 사용자 호소 시 우선.
- crypto-provider.tsx 535줄 추가 분할 — settings 로드/auto-unlock/external re-key 감지/cross-tab broadcast 4개 useEffect가 cryptoKey state·settings에 강결합. 단독 분할은 prop drilling 비용 큼. 새 lifecycle 추가 시 함께 손대는 식.
- 앱 이름 정리 — manifest/메타가 "basic note", 메모리/대화에선 SecureNote. 사용자 결정 필요.

**Known Gaps** (Negative Space)

- **PWA 이미 완비 상태가 인계되지 않음** — 이번 세션에 Known Gaps 슬롯이 없었다면 Tauri 정식 진입했을 가능성. 발견 후 R2 결정 즉시 변경. *원래 없었던 것이 아니라 *원래 있었는데 인지 못 한 것*에 가까움 — 갭 정의를 "현 상태 인지 누락"까지 확장 적용함.
- 단축키 표시·하이라이트·이미지 등 에디터 기능은 "원래 없는" 상태로 백로그에 살아있음(이전 체크포인트의 UX 큐). negative space로 새로 잡지 않음(이미 인지된 미결).

**Technical Decisions**

- **Tauri 백로그 제거** — PWA로 사용자 요구 충족 확인. Tauri는 앱스토어 정식 배포 욕심날 때만 재검토.
- **비동기 hook 표준 패턴** — useState + useEffect (cancelled flag) + tagged async result(`{key, notes}`) + derived state. `set-state-in-effect` 룰 회피 위해 동기 분기는 derived로. 향후 비슷한 hook에 그대로 적용.
- **module-level cache** — 페이지 마운트 race 보강용. `decryptedCategoriesCache`. 잠금(isUnlocked=false) 감지 시 invalidate 필수(cryptoKey rotation 안전). 글로벌 변수지만 "use client" hook이라 SSR 우려 없음.
- **crypto-provider 분할 깊이 제한** — 단순 추출만. cryptoKey state·settings에 강결합된 useEffect/콜백은 분할 시 prop drilling 비용이 응집도 이득보다 큼. 응집도 우선 보존.
- **vitest 환경** — `environment: "node"`. Node 25 webcrypto 최적화로 PBKDF2 600K iter 다수 호출에도 1.17초. 별도 jsdom 불필요.
- **`useIdleAutoLock` ref 패턴** — onTimeout을 ref로 보관(deps 안정화), ref 갱신은 useEffect 안에서(react-hooks/refs 룰 회피). enabled/timeoutMinutes만 deps로.

**Agent Notes**

- **Director**: 한 세션에 4 커밋 / 4 prod 푸시(R1 통합 푸시 1회). 인수인계 시스템 보강이 즉시 효과를 본 첫 사례 — Known Gaps 슬롯이 없었으면 Tauri 본격 진입했을 것. 다음 세션은 새 기능 추가 vs 잔여 백로그 트리아지 모드. 카운트 깜빡임은 layout context 도입할 때 자연스럽게.
- **Frontend**: hook 리팩토링 표준 패턴 정립. cancelled flag + tagged async result + derived state. crypto-provider 분할 패턴: 모듈 레벨 helper → 별도 파일, useEffect 덩어리 → hook, cryptoKey state·settings에 강결합된 부분은 응집도 보존. 미래 lifecycle 추가 시 그 부분도 함께 분할 검토.
- **Backend(Sync)**: `lib/sync/engine.ts`가 이미 응집도 높아 추가 분리 가치 적다고 판정. 새 sync 시나리오(예: 다중 사용자) 추가 시 그 때 재검토. dev gate(`SYNC_ENABLED`)는 prod-leak 방지 핵심 — 절대 약화 금지.
- **Designer/Publisher**: PWA 자산 완비 — apple-touch-icon, manifest standalone, theme-color 다크, sw-register prod-only. 추가 디자인 작업 0. 다만 manifest의 "basic note" name은 SecureNote와 불일치. 사용자 결정 후 확정.
- **사용자 피드백**:
  - "카테고리(0) 깜빡임" 회귀 즉시 보고 → A+B 옵션 합의 후 fix → 카운트 (2) 잔존 깜빡임 후속 보고 → "다 가본 다음 종합" 합의. 트레이드오프 즉석 이해도 높음.
  - "tauri가 뭐냐 / pwa로도 아이콘 진입 가능하지 않냐" — 비기술 명료한 질문. PWA로 결정 즉시.
  - 작업 전체에 "응" 페이스로 진행 승인. 길게 설명하면 줄여서 다시 요청 패턴.

---

## 🕒 Checkpoint — 2026-04-29 (Phase 10-F 종결 + 모바일 진입점 + 인수인계 갭 인지)

**Current Milestone**: 레거시 blocks 시스템 완전 제거. 모바일 사이드바 진입점 누락 보강. 메모리/히스토리 인수인계 시스템의 한계(negative space 미기록) 노출.

세 커밋 모두 main push + prod 배포 완료.

**Key Achievements**
- **Phase 2B-1 (`e840fe0`)** — 코드 잔여물·i18n·백업 포맷 정리. settings에서 `Block` import / `ExportData.blocks` 제거, 백업 v1→v2 bump (v1은 `LegacyImportV1`로 호환 import). 단축키/슬래시 가이드 카드 UI 통째 제거. 한·영 i18n에서 `block.*`/`shortcut.*Block`/`placeholder.*` 등 34개 dead key 제거. 3 files, +17/-172.
- **모바일 사이드바 진입점 (`e2f3a56`)** — `notes/layout.tsx`·`settings/layout.tsx` 헤더에 `<SidebarTrigger className="md:hidden -ml-2" />` 추가. 그 전엔 `SidebarTrigger`가 `app-sidebar.tsx` L64 사이드바 내부에만 있어, 모바일에서 사이드바가 닫혀있으면 잠금/설정 메뉴 진입 자체가 불가능했음. 처음부터 빠진 갭(원래 있다가 깨진 게 아님). 2 files, +14/-3.
- **Phase 2B-2 (`dd20b17`)** — 스키마/타입/모듈 완전 제거. `lib/db.ts`에 `db.version(2).stores({ blocks: null })` 추가로 blocks 스토어 drop, `Block`/`BlockType`/`BlockMeta` 타입 삭제, `lib/migrations/blocks-to-content.ts` 모듈+디렉토리 삭제, `crypto-provider.tsx`의 `migrateAllNotesToContent` 호출 + `migrateData` blocks 루프 제거 (대신 note.content도 재암호화하도록 보강), `plain-editor.tsx`의 `migrateNoteFromBlocks` 제거 + `plaintextToHtml` 인라인 흡수, `lib/reset.ts`의 `db.blocks.clear()` 제거. 6 files, +39/-254.
- **선결 조건 검증 완료** — 데스크탑·모바일 모두에서 `localStorage("bn_blocks_migrated_v1")` 값 확인. 모바일은 이번 세션 중 자동 sweep으로 `1777459581357` 기록됨. 데이터 증발 0 리스크 상태에서 2B-2 진입.

**Pending Tasks**
- **인수인계 시스템(마크다운) 재설계** — 사용자 지시. `CLAUDE.md`/`MEMORY.md` 구조에 *negative space*(원래 빠져있던 갭) 기록 영역이 없어, 모바일 메뉴 부재 같은 누락이 다음 세션으로 인계되지 않는 한계 노출. 다음 세션 시작 시 우선 처리.
- Dexie v2 마이그레이션 사이드이펙트 실전 관찰 — 데스크탑·모바일에서 한 번씩 unlock 시 v1→v2 upgrade 자동 실행 후 정상 동작 확인.
- 진단 로깅 실전 확인 (`bn_decrypt_fail_log` 덤프, 배포 후 증상 소멸로 대기).
- UX 백로그: 다중 노트 선택/일괄 작업, 헤딩 현재 상태 표시, 하이라이트·링크·이미지 (execCommand 한계 시 TipTap), 자동 백업 / 버전 히스토리.
- 중장기 R1(리팩토링: useLiveQuery 중첩 제거, sync 모듈 분리, crypto-provider 훅 분할, unit test 도입) / R2(Tauri 1순위로 데스크탑·모바일 설치 배포).

**Technical Decisions**
- **Dexie v2 stores config 형식**: drop만 명시 (`{ blocks: null }`)하고 v1 stores 그대로 보존 — 신규 install 사용자도 v1→v2 경로를 그대로 타고 와서 결과적으로 blocks 스토어 없는 상태로 도착. 깨끗한 single-step.
- **백업 v1 호환**: 자동 변환 대신 `LegacyImportV1` 타입으로 받아 blocks 필드 무시. 단순하고 미래에 v3 도입해도 안전.
- **`plaintextToHtml` 인라인 결정**: 별도 모듈 의존성 끊되 legacy 평문 노트 (HTML이 아닌 plaintext로 저장된 옛 note.content) 호환은 유지. 옛 노트 수가 적어도 0 비용 안전망.
- **`migrateData` 보강**: master key 마이그레이션 시 categories.name + notes.title만 재암호화하던 기존 코드를 notes.content도 함께 재암호화하도록 확장. blocks 의존 제거하면서 본문 보존 경로 보강.
- **모바일 트리거 클래스**: `md:hidden -ml-2`. dx-kit/shadcn sidebar는 `useIsMobile()` 기반으로 자동 Sheet 모드 전환되므로 trigger만 노출하면 됨. `-ml-2`로 px-6 패딩 시각 정렬.
- **인수인계 누락 인지**: "원래 빠져있던 갭(negative space)" 같은 항목은 변경 결정·미결 과업 카테고리에 안 잡힘 → 명시적 기록 슬롯 필요.

**Agent Notes**
- **Director**: 세션 작업량 — 3 커밋 / 3 prod 배포 / 메모리 2개 갱신·1개 신규. Phase 10-F를 한 세션에 종결까지 끌고 갈 수 있었던 건 Phase 2B-1/2B-2 분리로 위험 분산했기 때문. 다음 세션은 마크다운 설계 재정비부터 시작 권장. CLAUDE.md에 *negative space* 슬롯 추가가 핵심 과제.
- **Frontend**: 데이터 마이그레이션 3단계 패턴(코드 정리 → 모든 클라이언트 sweep 확인 → 스키마 drop)이 standardized. 다음 비슷한 작업(예: 추후 데이터 모델 변경)에 그대로 적용 가능. Dexie v1→v2 upgrade가 cryptoKey 없는 시점에 자동 실행되는 제약이 핵심 — 이 때문에 sweep을 unlock 이후로 미루는 안전망이 필수. 이번엔 모든 기기에서 sweep 완료 후 진행해서 안전망 자체를 제거할 수 있었음.
- **Publisher / Designer**: 모바일 햄버거 패턴은 dx-kit sidebar의 자동 Sheet 모드에 맡기고 trigger만 layout 헤더에 노출하면 충분. 노트 상세 페이지는 "뒤로가기 동선 우선"이라 이번에 손대지 않음. 향후 노트 상세에서도 메뉴 진입이 필요해지면 별도 검토.
- **사용자 피드백**: "인수인계 제대로 안하네" — 옳은 지적. 모바일 메뉴 갭이 이전 어느 메모리·히스토리에도 없었음. negative space 기록 룰이 부재했던 시스템 한계. 다음 세션 마크다운 재설계로 해결.

---

## 🕒 Checkpoint — 2026-04-28 (문서 체계 재편: CLAUDE.md 추상화 + DESIGN/HISTORY 분리)

**Current Milestone**: 운영 문서 인프라 리팩토링 — 프로젝트 무관 추상 모델과 프로젝트 고유 룰 분리, 누적 히스토리 컨벤션 확립.

**Key Achievements**
- `CLAUDE.md`를 도메인 무관 운영 프로토콜로 재작성 — 세션 시작 루틴, 멀티 에이전트 체계(v2.0), 응답 스타일 공통 수칙, 히스토리 포맷
- `CLAUDE_DESIGN.md` 신설 — `@minnjii/dx-kit` 컴포넌트 매핑·디자인 토큰·금지 사항·기술 스택 분리
- `agent_history.md` → `CLAUDE_HISTORY.md` 리네임 + 누적 prepend 컨벤션 적용 (최신이 위, 과거가 아래)
- `AGENTS.md` 제거 (멀티 에이전트 체계 내용은 `CLAUDE.md`에 흡수)
- 세션 시작 시 `CLAUDE_HISTORY.md` 부재면 즉시 빈 템플릿 생성하는 룰 추가
- 단일 커밋 `2b48f6d` (5 files, +467/-657) → main push 완료

**Pending Tasks**
- Phase 10-F Phase 2B (레거시 blocks 스키마 완전 제거) — 모바일 기기 `bn_blocks_migrated_v1` 확인 선행
- 진단 로깅 실전 확인 (`bn_decrypt_fail_log` 덤프, 배포 후 증상 소멸로 대기)
- 다중 노트 선택/일괄 작업, 헤딩 현재 상태 표시 (UX 개선 큐)

**Technical Decisions**
- 문서 분리 컨벤션: `CLAUDE.md`(추상) / `CLAUDE_DESIGN.md`(프로젝트 룰) / `CLAUDE_HISTORY.md`(누적 체크포인트). 다른 프로젝트로 이식 시 `CLAUDE.md`만 그대로 복사하고 `CLAUDE_DESIGN.md`만 갈아끼움.
- 히스토리는 단일 파일 누적(prepend). 3개월 이상 된 항목은 압축·요약 허용.
- 시작 프로토콜에 "히스토리 없으면 즉시 생성" 명시 — 첫 세션부터 일관성 확보.

**Agent Notes**
- Director: 이번 세션은 메타·문서 작업이라 코드 변경 없음. 다음 세션은 Phase 2B 본격 진입(파괴적 변경 포함, 별도 브랜치 권장).
- Designer: 이제 `CLAUDE_DESIGN.md`를 최우선 참조 문서로 취급. dx-kit 외 디자인 시스템 도입 시 이 파일 전체 교체.
- 사용자 피드백: 추상화 모델에 프로젝트 상세 데이터를 박지 말 것 — 템플릿/예시는 placeholder 유지. (이번 세션에서 실수 1회 후 수정)

---

## 🕒 Checkpoint — 2026-04-24 (Phase 10-F Phase 2A — 레거시 blocks 코드 레이어 제거 + UX 안정화)

**Current Milestone**: Phase 10-F · Phase 2A — 레거시 blocks 코드 레이어 제거 + UX 안정화 (삭제 race, 리스트 깜빡임, 잠금화면 플리커)

직전 체크포인트(`8937239`) 이후 4 커밋, 전부 main 푸시. 최신: `ffb66dd`. 3회 prod 배포(gitignore 커밋은 소스 영향 없어 skip).

Production: https://pro03note.vercel.app · Repo: https://github.com/plusxdev/pro-03-note

---

## Key Achievements

### 1. Phase 10-F Phase 2A — blocks 코드 레이어 제거 (`fb1e55f`)
Dexie 스키마/타입은 보존하고 **코드에서만** 블록 read/write 로직 전부 제거. 미확인 기기 안전망 유지.

**제거**
- `lib/types.ts`: `SyncEntityType`에서 `"block"` 제거
- `lib/sync/engine.ts`: push/pull/realtime의 block entity case 전부 삭제, `syncPush`의 blocks 루프 제거, `pushEntity`/`syncPushEntity` 시그니처에서 `Block` 제거
- `hooks/use-notes.ts`: createNote의 빈 block 생성 + `db.transaction(blocks)` 제거, deleteNote의 blocks soft-delete 제거, preview fallback 제거
- `hooks/use-categories.ts`: `deleteCategoryWithNotes`의 blocks 처리 제거

**보존 (Phase 2B에서 처리)**
- `Block` / `BlockType` / `BlockMeta` 타입 (db.ts / crypto-provider migrateData / settings export-import가 참조)
- Dexie `blocks` 스토어
- `lib/migrations/blocks-to-content.ts` 및 unlock 시점 자동 sweep
- `lib/reset.ts`의 `db.blocks.clear()`
- `app/settings/page.tsx`의 export/import blocks 필드

**부수 효과**: sync에서 `"block"` entity 빠졌으므로 미마이그레이션 기기의 blocks는 Supabase로 더 이상 push되지 않음. 로컬 blocks는 `migrateAllNotesToContent`가 unlock 시 흡수.

### 2. 카테고리 리스트 삭제 race 수정 (`0792330`)
증상: `/notes/categories` 리스트에서 카테고리 삭제 다이얼로그 2단계 → "삭제" 눌러도 무반응. 상세 페이지(NoteList)에서는 정상.

**원인**: Step 1 → Step 2 전환 시 Step 1 dialog의 `open={!!deleteTarget && !showSecondConfirm}`이 false가 되며 닫힘. Step 1의 `onOpenChange(false)` 콜백에서 **state closure race**로 `showSecondConfirm`은 아직 stale(false) — `setDeleteTarget(null)`이 실행. handleFinalDelete가 `if (!deleteTarget) return`으로 early-return.

**해결**: `useRef`로 "Step 2 진행 중" 플래그를 동기적으로 표시. handleFirstConfirm에서 ref=true → Step 1 onOpenChange가 ref를 보고 skip, 그 외 경로(Cancel/Outside click)에서만 setDeleteTarget(null).

NoteList(상세)는 categoryId가 prop이라 state 꼬임 없어 영향 없었음.

### 3. 로딩 UX 개선 (`6168bcb`)
3개 문제를 한 커밋에 묶어 처리.

**A. 새로고침 시 잠금화면 깜빡임**
- crypto-provider의 `useLiveQuery(settings)`가 로드되는 순간 `isLoading=false`로 풀려 AuthGate가 LockScreen 먼저 렌더 → 세션 자동 언락 완료 → 본문.
- 수정: settings 로드 후에도 saved session이 있으면 isLoading 유지. 자동 언락 `finally`에서 isLoading=false로 풀도록 이관.

**B. 전역 로딩 인디케이터**
- 신설 `components/providers/global-loading.tsx`: 여러 페이지/컴포넌트의 로딩 상태를 Set으로 집계, 하나라도 loading이면 전역 `isLoading=true`. `useLoadingIndicator(id, isLoading)`으로 자동 register/unregister.
- `app/notes/layout.tsx`의 탭 네비 헤더 우측(`ml-auto`)에 `HeaderLoadingIndicator` 고정 배치. 페이지마다 위치 흔들림 없음.
- NoteList / CategoriesPage / CalendarPage 에서 `useLoadingIndicator` 호출.

**C. 리스트 깜빡임 ("노트 없음"이 잠깐 떴다 사라짐)**
- 원인: dexie-react-hooks의 `useLiveQuery`가 deps 변경 시 **이전 결과를 그대로 유지**하는 stale-while-revalidate 동작. categoryId A→B 이동 시 rawNotes는 여전히 A의 결과로 평가되어 empty state 조기 판정.
- 또 한 층: notes decrypt 쿼리가 rawNotes 도착 후에도 이전 default(`[]`)를 유지하면 "rawNotes는 있는데 notes는 비었음" 중간 상태가 empty로 보임.
- 수정:
  - `useNotes`에 `fetchedKey` state 추가. 최신 결과가 어느 categoryId에 대한 것인지 추적.
  - isLoading 공식: `rawNotes === undefined || fetchedKey !== currentKey || notes === undefined || (rawNotes.length > 0 && notes.length === 0)`
  - `useCategories`에도 `isLoading` 반환 (rawCategories/categories/noteCounts 상태 조합)

### 4. `.gitignore` 정비 (`ffb66dd`)
`.env.vercel.*` 추가. 지난 세션 `vercel env pull`로 `.env.vercel.prod` 생성 후 수동 rm했던 재발 방지.

---

## Technical Decisions

| 결정 | 이유 |
|---|---|
| Phase 2 를 2A(코드)/2B(스키마) 로 쪼갬 | 모바일 기기 `bn_blocks_migrated_v1` 플래그 미확인. Dexie upgrade 시점엔 cryptoKey가 없어 decrypt→re-encrypt 불가 → 안전망으로 blocks 스토어 유지하고 unlock 시 자동 sweep |
| 카테고리 삭제 fix 로 ref 선택 | state closure race를 state 조건으로 풀려면 flushSync 등 지저분. ref는 동기적 → onOpenChange 호출 시점에 즉시 반영 |
| 전역 로딩 Context 도입 | 페이지마다 header 구성이 달라 로컬 Spinner 위치가 흔들리는 문제. Set 기반 집계는 여러 훅이 동시에 loading=true일 때도 깔끔 |
| notes decrypt 쿼리 stale 보정에 `rawNotes.length > 0 && notes.length === 0` 추가 | fetchedKey만으로는 "rawNotes 도착했는데 notes 쿼리가 아직 이전 빈 결과"를 못 잡음. 단순한 길이 불일치로 대부분 커버 |
| 크립토 provider: 자동 언락 중 isLoading 유지 | 세션 자동 언락은 수백 ms~수초 걸릴 수 있음. 그 사이 LockScreen 깜빡임보다 Spinner가 나음 |

---

## Pending Tasks

### 높음
1. **Phase 10-F Phase 2B — 레거시 blocks 스키마 완전 제거**
   - 선행 조건: **모바일 기기**에서 `localStorage("bn_blocks_migrated_v1")` timestamp 확인 (이번 세션에도 "로컬 연결 안 됨"으로 확인 불가)
   - 제거 대상:
     - `lib/db.ts`: blocks 스토어 drop (Dexie v2 bump, 마이그레이션 핸들러에서 "이미 sweep 완료된 기기만" 가정)
     - `lib/types.ts`: `Block`, `BlockType`, `BlockMeta` 제거
     - `lib/migrations/blocks-to-content.ts` 모듈 자체 제거 + unlock hook의 `migrateAllNotesToContent` 호출 제거
     - `components/providers/crypto-provider.tsx`: `migrateData`의 blocks 재암호화 루프 제거
     - `lib/reset.ts`: `db.blocks.clear()` 및 transaction 참조 제거
     - `app/settings/page.tsx`: `ExportData.blocks`, export/import 로직 제거 (백업 파일 v1 호환 결정 필요 — 자동 마이그레이션 or 버전 번호 bump)
     - `plain-editor.tsx`의 `migrateNoteFromBlocks`/`plaintextToHtml` 호출 지점 정리

### 중간
2. **진단 로깅 실전 확인** — `bn_decrypt_fail_log` 덤프 확보 (배포 후 증상 소멸로 대기)
3. **다중 노트 선택/일괄 작업** — NoteCard 추상화로 확장 쉬움
4. **헤딩 현재 상태 표시** — 툴바 드롭다운에서 현재 라인 heading level 체크 표시

### 낮음 (UX)
5. 하이라이트(형광펜), 링크, 이미지/첨부. execCommand 한계 → 규모 커지면 **TipTap** 고려
6. 자동 백업 / 버전 히스토리

---

## 중장기 로드맵

### R1. 전반 리팩토링
Phase 10-F Phase 2B 완료 후 착수. 범위 후보:
- hooks 레이어: useNotes/useCategories 내부 useLiveQuery 중첩을 "rawQuery + local state decrypt" 구조로 단순화 (stale-while-revalidate race 근본 제거)
- sync/engine.ts 모듈 분리 (push/pull/realtime/cursor 각각)
- crypto-provider 거대해짐 — setup/unlock/change-password/recovery 훅 분리 검토
- 테스트 없음 — 최소한 crypto + migration + sync의 unit test 레이어
- 타입 중복/any 감사

### R2. 데스크탑/모바일 설치 배포
"다운받아 설치해서 사용" 목표. 옵션:
- **Tauri**: Rust 기반, 번들 경량(~10MB), 시스템 웹뷰 사용. macOS/Windows/Linux. 추천 1순위.
- **Electron**: 생태계 성숙, 번들 무거움(~100MB). 2순위.
- **PWA + installable**: 가장 가벼움. 브라우저 install. "다운로드" 느낌은 약함.
- **iOS/Android**: Capacitor 또는 Tauri mobile.

**결정 필요 (착수 전)**:
- 타겟 OS — 데스크탑만? 모바일 포함?
- 동기화 유지 — 설치판도 Supabase realtime 계속 쓰는가 (사용자별 supabase 계정 문제)
- 배포 채널 — GitHub Releases? 자체 도메인? 자동 업데이트(Tauri/Electron updater)?
- 코드 서명 — macOS는 Apple Developer ID 필요($99/y). Windows도 signing cert 권장.

**선결 작업**:
- 정식 앱 아이콘/brand 확정
- 민감정보(env) bundle 전략. Supabase URL/anon key는 client-bundled — 설치판도 동일. 단 서비스 역할(anon) 제한 재확인.
- Service Worker/오프라인 시나리오 (이미 Dexie 로컬 우선이라 유리)
- 자동 업데이트 채널

### 드롭됨
- ~~자동 불릿 변환 (`- ` → `• `) 재구현~~

---

## Agent Notes

### Director
- 세션 작업량: 4 커밋 / 배포 3회 (gitignore는 소스 영향 없어 skip). 전부 안정.
- 커밋 cadence: Phase 2A → Phase 2A 배포 후 버그 발견 → 수정 + UX 개선 묶음 → 마무리 gitignore.
- `#end` 루틴 유지.

### Frontend
- **state closure race 패턴 기억**: Radix UI의 controlled AlertDialog에서 한 render cycle 안에 open prop을 flip하면, onOpenChange 콜백 내부에서 참조하는 state는 stale closure. useRef로 동기 표시가 정답.
- **dexie-react-hooks의 stale-while-revalidate**: `useLiveQuery`는 deps 변경 시 이전 결과를 그대로 반환하며 새 결과 도착까지 바뀌지 않음. 이게 리스트 깜빡임의 근본. 쿼리 결과의 "어떤 key에 대한 것인지"를 별도 추적해야 UI가 정확함.
- **Spinner 위치는 전역 슬롯이 정답**: 페이지마다 header 버튼 구성이 다르면 로컬 Spinner가 시각적으로 흔들림. `ml-auto` 고정 슬롯 + Context로 상태 주입이 깔끔.

### Security
- 지난 세션 Vercel env trailing newline 이슈의 후속 방어로 `.env.vercel.*` gitignore 추가. `vercel env pull` 실수 커밋 방지.

---

## 주요 커밋 이력

```
ffb66dd .env.vercel.* gitignore 추가
6168bcb 로딩 상태 전역 헤더 표시 + 리스트 깜빡임 차단
0792330 카테고리 리스트 삭제 동작 복구
fb1e55f 레거시 blocks 코드 레이어 제거 (Phase 10-F Phase 2A)
```

---

## Deployment Cadence (유지)
수정 → 로컬 `npm run build` → `git commit` → `git push` → `vercel --prod --yes`. 소스 무관 변경(.gitignore 등)은 배포 skip.

## 환경 참고 (이전 체크포인트에서 계승)
- Supabase URL: https://yjguaevkaymidxvllioo.supabase.co (dev/prod 공유, SYNC_ENABLED 가드로 dev 차단)
- Vercel 프로젝트: kihyun-5528s-projects/pro_03_note
- Vercel 도메인: https://pro03note.vercel.app
- dev 서버: 3003 포트, Node 25 (`/opt/homebrew/opt/node@25/bin`)
- dev sync 필요 시: `.env.local`에 `NEXT_PUBLIC_ENABLE_SYNC=true`
- **주의**: `192.168.0.37:3003`로 접속하면 HMR cross-origin 차단. `localhost:3003` 권장. 필요하면 `next.config.js`에 `allowedDevOrigins: ['192.168.0.37']` 추가.

## 메모리 인덱스
- `project_securenote.md` — 프로젝트 개요
- `project_crypto_multitab.md` — 다중탭 방어 패턴 (Phase 10 핵심, 절대 되돌리지 말 것)
- `project_plain_editor.md` — PlainEditor 단일 에디터
- `project_block_editor.md` — legacy 블록 에디터 (레퍼런스 용도)
- `project_note_card.md` — NoteCard 래퍼
- `project_block_cleanup_phase.md` — Phase 10-F 정리 진행. 2A(코드) 완료, 2B(스키마) 대기
- `project_vercel_env_lf.md` — Supabase env trailing LF 이슈
- `user_profile.md` — 한국어, 보안 중시, 간결 답변
- `feedback_port.md` — dev 3003 포트

## Phase 요약 (축약)
- Phase 1~8: 기반 구축, 마스터키 아키텍처, i18n, UI 전반
- Phase 9: 이중 암호화 버그 수정, dev/prod sync 분리, 모바일 UX
- Phase 10: 블록 에디터 → PlainEditor 전환, 크립토 다중탭 방어, NoteCard 추상화
- **Phase 10-F (진행 중)**: 레거시 정리. Phase 1(UI) · Phase 2A(코드) 완료, Phase 2B(스키마) 대기.
