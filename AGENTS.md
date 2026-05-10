<!-- BEGIN:design-system-rules -->
# Project Rules

이 프로젝트는 `@plus-experience/design-system` 디자인 시스템을 사용합니다.
모든 UI 구현 시 아래 룰을 반드시 따르세요.

---

## 가장 중요한 룰

**UI 컴포넌트를 절대 새로 만들지 마세요.**
`@plus-experience/design-system` 패키지에 이미 모든 컴포넌트가 있습니다.
Button, Input, Card, Dialog, Table, Select, Tabs, Badge, Tooltip 등 — 전부 있습니다.
새 컴포넌트 파일을 만드는 대신, 아래 목록에서 찾아서 import하세요.
페이지/기능 컴포넌트만 새로 만드세요 (예: `app/`, `components/` 루트에 비즈니스 로직 컴포넌트).

---

## 프로젝트 초기 세팅

```bash
echo "@plus-experience:registry=https://npm.pkg.github.com" > .npmrc
npx @plus-experience/design-system
```

이 명령어로 의존성, globals.css, CLAUDE.md가 자동 세팅됩니다.

> **중요**: `globals.css`에 `@import "@plus-experience/design-system/styles.css";` 줄이 반드시 있어야 합니다.
> 이 줄이 없으면 design-system 컴포넌트의 Tailwind 스타일이 적용되지 않습니다.
> `npx @plus-experience/design-system` 실행 시 자동으로 추가됩니다.

### 다크 모드 기본 적용

`app/layout.tsx`의 `<html>` 태그에 `dark` 클래스를 추가합니다:

```tsx
<html lang="ko" className="dark" suppressHydrationWarning>
```

---

## 핵심 원칙

1. **네이티브 HTML 대신 항상 시스템 컴포넌트를 사용한다**
2. **인라인 스타일이나 하드코딩된 색상을 사용하지 않는다 — CSS 변수(토큰)를 사용한다**
3. **border 대신 shadow를 사용한다**
4. **패딩은 넉넉하게 — 옹졸하게 만들지 않는다**

---

## 컴포넌트 매핑

| 이것 대신 | 이것을 사용 |
|-----------|------------|
| `<button>` | `<Button>` from `@plus-experience/design-system/ui/button` |
| `<input>` | `<Input>` from `@plus-experience/design-system/ui/input` |
| `<textarea>` | `<Textarea>` from `@plus-experience/design-system/ui/textarea` |
| `<select>` | `<Select>` from `@plus-experience/design-system/ui/select` |
| `<table>` | `<Table>` from `@plus-experience/design-system/ui/table` |
| `<dialog>` | `<Dialog>` from `@plus-experience/design-system/ui/dialog` |
| 커스텀 card div | `<Card>` from `@plus-experience/design-system/ui/card` |
| 커스텀 badge span | `<Badge>` from `@plus-experience/design-system/ui/badge` |
| 커스텀 tooltip | `<Tooltip>` from `@plus-experience/design-system/ui/tooltip` |
| 커스텀 tabs | `<Tabs>` from `@plus-experience/design-system/ui/tabs` |
| 커스텀 dropdown | `<DropdownMenu>` from `@plus-experience/design-system/ui/dropdown-menu` |
| `<hr>` | `<Separator>` from `@plus-experience/design-system/ui/separator` |
| 커스텀 scroll | `<ScrollArea>` from `@plus-experience/design-system/ui/scroll-area` |
| 커스텀 toggle | `<Switch>` from `@plus-experience/design-system/ui/switch` |
| 커스텀 checkbox | `<Checkbox>` from `@plus-experience/design-system/ui/checkbox` |
| 커스텀 spinner | `<Spinner>` from `@plus-experience/design-system/ui/spinner` |
| 커스텀 skeleton | `<Skeleton>` from `@plus-experience/design-system/ui/skeleton` |
| 커스텀 accordion | `<AccordionBlock>` from `@plus-experience/design-system/ui/accordion-block` |
| 커스텀 task list | `<TaskBlock>` from `@plus-experience/design-system/ui/task-block` |
| 커스텀 bullet list | `<BulletBlock>` from `@plus-experience/design-system/ui/bullet-block` |
| 커스텀 content card | `<ContentBlock>` from `@plus-experience/design-system/ui/content-block` |

---

## 전체 컴포넌트 목록

```
@plus-experience/design-system/ui/accordion       @plus-experience/design-system/ui/alert
@plus-experience/design-system/ui/alert-dialog     @plus-experience/design-system/ui/aspect-ratio
@plus-experience/design-system/ui/avatar           @plus-experience/design-system/ui/badge
@plus-experience/design-system/ui/breadcrumb       @plus-experience/design-system/ui/button
@plus-experience/design-system/ui/button-group     @plus-experience/design-system/ui/calendar
@plus-experience/design-system/ui/card             @plus-experience/design-system/ui/carousel
@plus-experience/design-system/ui/checkbox         @plus-experience/design-system/ui/collapsible
@plus-experience/design-system/ui/combobox         @plus-experience/design-system/ui/command
@plus-experience/design-system/ui/context-menu     @plus-experience/design-system/ui/dialog
@plus-experience/design-system/ui/drawer           @plus-experience/design-system/ui/dropdown-menu
@plus-experience/design-system/ui/hover-card       @plus-experience/design-system/ui/input
@plus-experience/design-system/ui/input-otp        @plus-experience/design-system/ui/kbd
@plus-experience/design-system/ui/label            @plus-experience/design-system/ui/menubar
@plus-experience/design-system/ui/navigation-menu  @plus-experience/design-system/ui/pagination
@plus-experience/design-system/ui/popover          @plus-experience/design-system/ui/progress
@plus-experience/design-system/ui/radio-group      @plus-experience/design-system/ui/resizable
@plus-experience/design-system/ui/scroll-area      @plus-experience/design-system/ui/select
@plus-experience/design-system/ui/separator        @plus-experience/design-system/ui/sheet
@plus-experience/design-system/ui/showcase-card    @plus-experience/design-system/ui/skeleton
@plus-experience/design-system/ui/slider           @plus-experience/design-system/ui/sonner
@plus-experience/design-system/ui/spinner          @plus-experience/design-system/ui/switch
@plus-experience/design-system/ui/table            @plus-experience/design-system/ui/tabs
@plus-experience/design-system/ui/textarea         @plus-experience/design-system/ui/toggle
@plus-experience/design-system/ui/toggle-group     @plus-experience/design-system/ui/tooltip
@plus-experience/design-system/ui/accordion-block  @plus-experience/design-system/ui/task-block
@plus-experience/design-system/ui/showcase-card    @plus-experience/design-system/ui/bullet-block
@plus-experience/design-system/ui/color-picker     @plus-experience/design-system/ui/status-item
@plus-experience/design-system/ui/rating
```

---

## 디자인 토큰

### 색상 — 반드시 CSS 변수 사용

```
bg-background        /* 페이지 배경 */
text-foreground       /* 기본 텍스트 */
bg-card               /* 카드/컨테이너 배경 */
bg-primary            /* 주요 액션 (라이트: #000, 다크: #f0f0f0) */
text-primary-foreground /* 주요 액션 위 텍스트 */
bg-secondary          /* 보조 배경 */
bg-muted              /* 비활성 배경 */
text-muted-foreground /* 보조/설명 텍스트 */
bg-destructive        /* 위험/삭제 */
```

### 금지

```tsx
// BAD
<div className="bg-[#1a1a1a] text-[#fff]">
<div style={{ backgroundColor: '#000' }}>

// GOOD
<div className="bg-card text-card-foreground">
<div className="bg-muted text-muted-foreground">
```

---

## 스타일 규칙

### Border 대신 Shadow

```tsx
// BAD
<div className="border border-gray-200">

// GOOD
<Card>
// 또는
<div className="shadow-sm shadow-black/5 dark:shadow-black/40">
```

### Border Radius

```
rounded-lg     /* 8px — 버튼, 인풋 */
rounded-xl     /* 카드, 다이얼로그 */
rounded-2xl    /* 큰 카드 */
rounded-full   /* 아바타, 배지 */
```

### Typography

```
tracking-[-0.03em]     /* 큰 제목 */
tracking-tight         /* 소제목 */
leading-relaxed        /* 본문 */
text-muted-foreground  /* 설명 텍스트 */
```

### 간격

패딩은 넉넉하게:
- 카드 내부: `p-6` 이상
- 섹션 간격: `gap-6` 이상, 큰 섹션 `py-16` 이상
- 버튼: 시스템 Button 사용 (넉넉한 패딩 내장)

---

## 주요 컴포넌트 사용법

### Button

```tsx
import { Button } from "@plus-experience/design-system/ui/button"

<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="xs">XS</Button>      // h-8
<Button size="sm">SM</Button>      // h-10
<Button>Default</Button>           // h-11
<Button size="lg">LG</Button>      // h-13

// Link
<Button asChild><Link href="/path">Go</Link></Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@plus-experience/design-system/ui/card"

<Card>
  <CardHeader>
    <CardTitle>제목</CardTitle>
    <CardDescription>설명</CardDescription>
  </CardHeader>
  <CardContent>본문</CardContent>
</Card>
```

### Dialog

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@plus-experience/design-system/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>제목</DialogTitle>
      <DialogDescription>설명</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button>확인</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Input + Label

```tsx
import { Input } from "@plus-experience/design-system/ui/input"
import { Label } from "@plus-experience/design-system/ui/label"

<div className="grid gap-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>
```

### Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@plus-experience/design-system/ui/tabs"

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">내용 1</TabsContent>
  <TabsContent value="tab2">내용 2</TabsContent>
</Tabs>
```

### Accordion Block

카드형 아코디언. 각 아이템이 개별 shadow 카드로 분리됨.

```tsx
import { AccordionBlock, AccordionBlockItem, AccordionBlockTrigger, AccordionBlockContent } from "@plus-experience/design-system/ui/accordion-block"
import { Button } from "@plus-experience/design-system/ui/button"

<AccordionBlock type="single" collapsible>
  <AccordionBlockItem value="1">
    <AccordionBlockTrigger action={<Button size="xs">Edit</Button>}>
      프로젝트 설정
    </AccordionBlockTrigger>
    <AccordionBlockContent>
      콘텐츠 영역
    </AccordionBlockContent>
  </AccordionBlockItem>
</AccordionBlock>
```

- chevron은 좌측에 위치
- `action` prop으로 우측에 버튼 추가 가능 (아코디언 토글과 독립)

### Task Block

카테고리별 체크리스트 블록. Accordion Block 안에 넣어서 사용.

```tsx
import { TaskBlock } from "@plus-experience/design-system/ui/task-block"

<TaskBlock
  category="BX"
  badge="6"
  tasks={[
    { id: "1", label: "브랜드 전략 수립", checked: true },
    { id: "2", label: "아이덴티티 개발", checked: false },
    { id: "3", label: "BI/CI 디자인", checked: false },
  ]}
/>
```

- 체크하면 취소선 + 흐리게 처리
- `badge`로 개수 표시
- `onCheckedChange`로 상태 관리

### Showcase Card

이미지 위에 텍스트 오버레이가 있는 카드.

```tsx
import { ShowcaseCard } from "@plus-experience/design-system/ui/showcase-card"

<ShowcaseCard
  imageSrc="/images/preview.jpg"
  badge="New"
  category="COMPONENT"
  title="Button variants with glow effect"
/>
```

### Rating

별점을 표시하거나 선택할 수 있는 레이팅.

```tsx
import { Rating } from "@plus-experience/design-system/ui/rating"

<Rating defaultValue={3} />
<Rating defaultValue={4} size="lg" />
<Rating defaultValue={5} readOnly />

// 제어 모드
const [rating, setRating] = useState(0)
<Rating value={rating} onChange={setRating} />
```

### Color Picker

색상을 선택할 수 있는 팝오버 컬러 피커.

```tsx
import { ColorPicker } from "@plus-experience/design-system/ui/color-picker"

// 스왓치만
<ColorPicker defaultValue="#50e3c2" onChange={(hex) => console.log(hex)} />

// hex 입력 포함
<ColorPicker defaultValue="#50e3c2" showInput />

// 제어 모드
const [color, setColor] = useState("#50e3c2")
<ColorPicker value={color} onChange={setColor} showInput />
```

---

## 금지 사항

1. 네이티브 `<button>`, `<input>`, `<select>` 직접 사용 금지
2. `border` 대신 `shadow` 사용
3. 하드코딩 색상 (`#fff`, `bg-[#xxx]`) 금지
4. 패딩 `p-1`, `p-2` 등 좁은 값 지양 — 최소 `p-4`
5. `ring-1 ring-foreground/10` 금지 → `shadow-md shadow-black/5`
6. footer `border-t bg-muted` 분리 패턴 금지
7. 자체 모달/스피너/로더 구현 금지 → 시스템 컴포넌트 사용
8. `@/components/ui/` 경로 사용 금지 → `@plus-experience/design-system/ui/` 사용

---

## design-system 업데이트 반영

디자인 시스템이 업데이트되면:

```bash
npm update @plus-experience/design-system
```

업데이트 후 `app/globals.css`에 아래 줄이 없으면 추가:

```css
@import "@plus-experience/design-system/styles.css";
```

---

## 기술 스택

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui (Radix Nova)
- Geist Font (Sans + Mono)
- 다크 모드 기본

<!-- END:design-system-rules -->
