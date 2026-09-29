# Mildang LMS React demo

## 1. Direction and reference
The supplied lms-board-proto HTML is the visual contract. Preserve its Windows 11 desktop metaphor, compact Korean teacher workspace, content, semantic alarm colors, split panes, and day/dusk themes. This is a local interactive demo; no real student service or external messaging is connected.

## 2. Color and material
Reuse the reference CSS custom properties verbatim: bg, surface, global, section, outline, divider, tx/tx2/tx3, accent/accent-soft, mica, selbg, alarm/warning/caution with corresponding foreground and tint tokens. Day surface is white, background rgb(247,247,247), accent rgb(45,84,139). Dusk surface is rgb(33,33,33), text rgb(247,247,247). Preserve native window elevation and subtle inset button borders.

## 3. Typography
Reference font stack: Segoe UI Variable Text, Segoe UI, Malgun Gothic, Pretendard, Apple SD Gothic Neo, sans-serif. Body 13px/18px; metadata 11px; row details 12px; toolbar titles 14px; KPI numbers 20px. Tabular numerals for counts, time, and progress. Korean prose uses keep-all with overflow-wrap for long user input.

## 4. Layout and spacing
Titlebar 34px, toolbar 46px, status scope 52px, board controls 40px, statusbar 24px, taskbar 48px. Sidebar 212px. Lanes use minmax(212px,1fr), gap 10px. Detail uses student rail, flexible paper stage, and 360px chat. Main shell owns no page scroll; lane bodies and route panes independently scroll. Retain the reference's 4/6/8px radii and 4/6/8/10/12/14/16/20px spacing values in extracted CSS.

## 5. Primitives and states
Icon, SeverityIcon, Button, SegmentedControl, SearchField, SelectField, Tabs, DataTable, Progress, KPI, FormRow, Toggle, Modal, WindowFrame, StudentCard. States: idle, hover, focus-visible, selected, disabled, empty, alarm/warning/caution, responded, live, ended. Components render real React DOM; no iframe or HTML application embedding. SVG paths and source CSS are reusable reference assets.

## 6. Interaction and motion
Reference interactions: select then double-click/Enter opens a student; N opens next alert; Ctrl/Cmd+K searches; Ctrl/Cmd+B toggles navigation; Alt+T switches theme. Student question navigation, chat, attendance and ending update shared state. Preserve brief 140–200ms state feedback, no decorative animation. Reduced-motion disables transitions. Feed wizard validates inputs and creates visible local reservations. Window minimize/restore, free drag/resize, side-by-side snap and maximize stay within the browser viewport; windows clamp so a titlebar is always reachable.

## 7. Responsive and accessibility
Desktop is the exact reference target. Tablet collapses navigation and student rail; smaller widths use horizontally scrolling board lanes, compact toolbar and stacked detail/chat. Semantic buttons, labels, accessible icon names, keyboard handling, visible focus, dialog focus trap and Escape dismiss. Keep charts, status, selection understandable without color alone.

## 8. Accepted demo boundaries and verification
Mock data is dated 2026-09-28 20:41. Simulated events are explicit demo controls rather than an actual server connection. Local persistence is versioned and safely falls back if unavailable. Browser cannot provide OS-level always-on-top or native desktop windows; window controls simulate these inside the page. Board, student detail and settings windows drag by their titlebar, resize from the bottom-right grip, maximize on titlebar double-click, and stack by click order, matching the reference's makeTop/makeDrag/makeResize. Students can additionally open as independent cascading windows (the reference's openWin), reachable from the student context menu, the 창 menu and the taskbar. Diagnostic results are fixtures, not live queries. Verify board counts, grouping, search, student work/chat, attendance, schedule reservation, all management routes, themes, reload, keyboard, and narrow widths. Preserve original design rather than introducing a new brand direction.
