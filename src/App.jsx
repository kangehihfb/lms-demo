import { lazy, Suspense, useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { CLS, STXT } from './data.js';
import { STORAGE_KEY, ROUTES, loadState, reducer, clsState, scopedStudents, sortedAlerts, exportCsv, needOrder, workspaceOrder } from './model.js';
import { Icon, IconButton, Button, Modal, SeverityIcon, WindowTitle } from './components.jsx';
import Board from './Board.jsx';
import StudentWorkspace from './StudentWorkspace.jsx';
import Settings from './Settings.jsx';
import ActionDialog from './ActionDialog.jsx';
import FeedWizard from './FeedWizard.jsx';
import StudentWindow from './StudentWindow.jsx';
import QuickChat from './QuickChat.jsx';
import { useFloatingWindow, useNarrow, useZOrder, snapGeometry, compactGeometry, cascadeGeometry } from './windowing.js';

const StudentsPage = lazy(() => import('./Management.jsx').then(m => ({ default: m.StudentsPage })));
const CalendarPage = lazy(() => import('./Management.jsx').then(m => ({ default: m.CalendarPage })));
const GroupsPage = lazy(() => import('./Management.jsx').then(m => ({ default: m.GroupsPage })));
const ReportsPage = lazy(() => import('./Management.jsx').then(m => ({ default: m.ReportsPage })));
const OperationsPage = lazy(() => import('./Management.jsx').then(m => ({ default: m.OperationsPage })));

function Palette({ state, onClose, onOpen, navigate, setScope, onAction, toggleTheme, toggleMini, openSettings }) {
  const [query, setQuery] = useState(''); const [index, setIndex] = useState(0);
  const commands = [
    ...Object.entries(ROUTES).map(([key, label]) => ({ label, subtitle: '화면', run: () => navigate(key) })),
    { label: '지금 수업', subtitle: 'Ctrl+1', run: () => setScope('now') }, { label: '오늘 전체', subtitle: 'Ctrl+2', run: () => setScope('today') },
    { label: '설정', subtitle: 'Ctrl+,', run: openSettings }, { label: '피드 발송', subtitle: '명령', run: () => onAction('feed') }, { label: '미니 창 열기/닫기', subtitle: 'Ctrl+Shift+M', run: toggleMini }, { label: state.theme === 'day' ? '야간 테마로' : '주간 테마로', subtitle: 'Alt+T', run: toggleTheme },
  ];
  const items = [...state.students.filter(s => !query || s.name.includes(query) || s.cls.includes(query)).slice(0, 6).map(s => ({ label: s.name, subtitle: `${s.cls}반 · ${STXT[s.st]}`, run: () => onOpen(s.id) })), ...commands.filter(c => !query || c.label.includes(query))];
  const execute = item => { onClose(); item.run(); };
  return <Modal title="학생 · 명령 검색" onClose={onClose}><div className="pal-in"><Icon name="find"/><input autoFocus aria-label="학생 이름, 명령 검색" placeholder="학생 이름, 명령 검색" value={query} onChange={e => { setQuery(e.target.value); setIndex(0); }} onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); setIndex(Math.min(items.length - 1, index + 1)); } if (e.key === 'ArrowUp') { e.preventDefault(); setIndex(Math.max(0, index - 1)); } if (e.key === 'Enter' && !e.nativeEvent.isComposing && items[index]) execute(items[index]); }}/><kbd>esc</kbd></div><div className="pal-list">{items.map((item, i) => <button key={`${item.label}-${item.subtitle}`} className={`pal-r ${i === index ? 'cur' : ''}`} onMouseEnter={() => setIndex(i)} onClick={() => execute(item)}><span className="pi">{item.label.slice(0, 1)}</span>{item.label}<span className="s">{item.subtitle}</span></button>)}{!items.length && <div className="empty">결과 없음</div>}</div></Modal>;
}

function Sidebar({ state, route, options, setScope, navigate, openSettings }) {
  return <aside className="sidebar" aria-label="탐색"><nav className="sb-scroll"><div className="sb-h">학생 보드</div>{[['now', 'now', '지금 수업'], ['today', 'today', '오늘 전체']].map(([key, icon, title]) => <button key={key} className={`sb-i ${route === 'board' && options.scope === key ? 'on' : ''}`} onClick={() => setScope(key)}><Icon name={icon}/>{title}<span className="bd">{scopedStudents(state.students, key).length}</span></button>)}<div className="sb-h">오늘 수업 · 9월 28일</div>{Object.keys(CLS).map(cls => <button className={`sb-i ${route === 'board' && options.scope === `cls:${cls}` ? 'on' : ''} ${clsState(cls) === 'past' ? 'dim' : ''}`} key={cls} onClick={() => setScope(`cls:${cls}`)}><span className="cdot" style={{ background: state.alerts.some(a => !a.waitAt && a.sev === 'alarm' && state.students.find(s => s.id === a.sid)?.cls === cls) ? 'var(--alarm)' : clsState(cls) === 'live' ? 'var(--running)' : 'var(--sym)' }}/>{cls}반{clsState(cls) !== 'live' && <small className="mut"> · {clsState(cls) === 'past' ? '종료' : '49분 후'}</small>}<span className="bd">{state.students.filter(s => s.cls === cls).length}</span></button>)}<div className="sb-h">관리</div>{[['students', 'people'], ['calendar', 'cal'], ['groups', 'group'], ['reports', 'chart'], ['ops', 'cal']].map(([key, icon]) => <button key={key} className={`sb-i ${route === key ? 'on' : ''}`} onClick={() => navigate(key)}><Icon name={icon}/>{ROUTES[key]}</button>)}<div className="sb-h">앱</div><button className="sb-i" onClick={openSettings}><Icon name="settings"/>설정</button></nav><div className="sb-foot"><div className="av">강</div><div><div className="n">강은화 선생님</div><div className="s"><span className="gdot"/>온라인 · 알림 켜짐</div></div></div></aside>;
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => { try { return loadState(window.localStorage); } catch { return loadState({ getItem: () => null }); } });
  const [route, setRoute] = useState(() => { const key = location.hash.replace('#/', '').split('?')[0]; return ROUTES[key] ? key : 'board'; });
  const [options, setOptions] = useState({ scope: 'now', filter: 'all', group: 'time', view: 'card', sort: 'alert', query: '' });
  const [selected, setSelected] = useState(null); const [tabs, setTabs] = useState([]); const [active, setActive] = useState(null); const [studentVisible, setStudentVisible] = useState(false);
  const [hidden, setHidden] = useState(false); const [sidebar, setSidebar] = useState(() => typeof window === 'undefined' || window.innerWidth > 760);
  const [windows, setWindows] = useState([]); const [arrange, setArrange] = useState('split-view'); const cascade = useRef(0); const placed = useRef(false);
  const { front, z, focus } = useZOrder('main');
  const boardRef = useRef(null);
  const board = useFloatingWindow({ minW: 520, minH: 420, onInteract: () => focus('main') });
  const student = useFloatingWindow({ minW: 640, minH: 420, onInteract: () => focus('student') });
  const { narrow: boardNarrow } = useNarrow(boardRef, 1100);
  const [mini, setMini] = useState(false); const [palette, setPalette] = useState(false); const [settings, setSettings] = useState(null); const [action, setAction] = useState(null); const [menu, setMenu] = useState(null);
  const [message, setMessage] = useState(''); const [storageError, setStorageError] = useState(false); const [quick, setQuick] = useState(null);
  const messageTimer = useRef(null);
  const notify = useCallback(text => { setMessage(text); clearTimeout(messageTimer.current); messageTimer.current = setTimeout(() => setMessage(''), 4000); }, []);
  useEffect(() => () => clearTimeout(messageTimer.current), []);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { setStorageError(true); } }, [state]);
  useEffect(() => { document.documentElement.dataset.theme = state.theme; document.documentElement.dataset.density = state.preferences.density || 'normal'; document.documentElement.dataset.fontSize = state.preferences.fontSize || 'normal'; }, [state.theme, state.preferences.density, state.preferences.fontSize]);
  useEffect(() => { document.title = `${ROUTES[route]} - 밀당 LMS 데모`; }, [route]);
  useEffect(() => { const listener = () => { const key = location.hash.replace('#/', '').split('?')[0]; if (ROUTES[key]) setRoute(key); }; window.addEventListener('hashchange', listener); return () => window.removeEventListener('hashchange', listener); }, []);
  const navigate = key => { setRoute(key); location.hash = `/${key}`; setHidden(false); setMenu(null); };
  const setScope = scope => { setOptions(o => ({ ...o, scope, filter: 'all' })); navigate('board'); };
  const snapSide = () => { const g = snapGeometry(); board.place(g.board.x, g.board.y, g.board.w, g.board.h); student.place(g.student.x, g.student.y, g.student.w, g.student.h); };
  const openStudent = id => {
    setQuick(null);
    setTabs(previous => previous.includes(id) ? previous : [...previous, id]);
    setActive(id); setSelected(id);
    if (!studentVisible) {
      if (hidden) { const c = compactGeometry(); student.place(c.x, c.y, c.w, c.h); }
      else if (!placed.current) snapSide();
      placed.current = true;
    }
    setStudentVisible(true); focus('student'); setMenu(null);
  };
  const openWindow = (id, from) => {
    setWindows(list => list.some(w => w.sid === id) ? list : [...list, { sid: id, geom: cascadeGeometry(cascade.current++, from) }]);
    focus(`w${id}`); setMenu(null);
    notify(`${state.students.find(x => x.id === id).name} 학생 창을 열었습니다`);
  };
  /* 보드 카드 옆에 붙는 빠른 답장. 같은 학생을 다시 누르거나 id 가 null 이면 닫는다. */
  const openQuickChat = (id, rect) => setQuick(current => id == null || current?.id === id ? null : { id, rect: rect ?? current?.rect });
  const openSettings = tab => { setSettings(tab); focus('settings'); setMenu(null); };
  const closeWindow = id => { setWindows(list => list.filter(w => w.sid !== id)); focus('main'); };
  const setMode = kind => {
    setArrange(kind);
    if (kind === 'split-view') snapSide();
    else if (kind === 'maximized') { board.maximize(); student.maximize(); }
    else { const c = compactGeometry(); board.maximize(); student.place(c.x, c.y, c.w, c.h); }
    placed.current = true; focus(studentVisible ? 'student' : 'main');
  };
  const closeStudent = () => { setStudentVisible(false); setTabs([]); setActive(null); setHidden(false); placed.current = false; board.maximize(); focus('main'); };
  const closeTab = id => { const next = tabs.filter(t => t !== id); setTabs(next); if (!next.length) closeStudent(); else if (active === id) setActive(next[Math.max(0, tabs.indexOf(id) - 1)]); };
  const nextStudent = () => { const ids = needOrder(state.alerts); if (!ids.length) { notify('확인할 학생이 없습니다'); return; } const current = studentVisible && front === 'student' ? active : selected; openStudent(ids[(ids.indexOf(current) + 1) % ids.length]); };
  /* 보드에서 ↑ ↓ 로 확인 필요 학생 사이를 옮긴다 (원본 moveSel).
     원본과 달리 지금 보드에 보이는 학생만 훑는다 — 다른 반 학생을 고르면 선택 표시가 사라져 버린다. */
  const moveSelection = step => {
    const visible = new Set(scopedStudents(state.students, options.scope).map(x => x.id));
    const ids = needOrder(state.alerts).filter(id => visible.has(id));
    if (!ids.length) return;
    const i = ids.indexOf(selected);
    setSelected(ids[Math.max(0, Math.min(ids.length - 1, i < 0 ? 0 : i + step))]);
    focus('main');
  };
  /* 학생 상세에서 ↑ ↓ 로 옆 학생으로 옮긴다 (원본 wsStep). */
  const stepStudent = step => { const list = workspaceOrder(state.students, state.alerts, options.scope); const i = list.findIndex(x => x.id === active); const next = list[Math.max(0, Math.min(list.length - 1, i + step))]; if (next) openStudent(next.id); };
  /* Ctrl/Cmd+W — 앞에 있는 창을 닫는다 (원본 closeFront). */
  const closeFront = () => {
    if (front.startsWith('w')) { closeWindow(Number(front.slice(1))); return; }
    if (front === 'settings' && settings) { setSettings(null); focus('main'); return; }
    if (front === 'student' && studentVisible && active != null) { closeTab(active); return; }
    setHidden(true); notify('아래 밀당 아이콘을 누르면 다시 열립니다');
  };
  const toggleTheme = () => dispatch({ type: 'theme', theme: state.theme === 'day' ? 'dusk' : 'day' });
  const onAction = (type, id, extra) => { setMenu(null); if (type === 'profile') { setSelected(id); navigate('students'); setStudentVisible(false); return; } setAction({ type, id, extra }); };
  const copy = async text => { try { await navigator.clipboard.writeText(text); notify('클립보드에 복사했습니다'); } catch { notify('클립보드 접근이 차단되었습니다. 텍스트를 직접 선택해 복사해주세요.'); } };
  useEffect(() => {
    const listener = e => {
      if (document.querySelector('dialog[open]') || e.isComposing) return;
      const mod = e.metaKey || e.ctrlKey; const key = e.key.toLowerCase();
      /* 글자를 입력하는 중에만 단축키를 비운다. 버튼에 포커스가 있어도 단축키는 살아 있어야 한다. */
      const target = e.target instanceof Element ? e.target : null;
      const typing = target?.closest('input,textarea,select,[contenteditable="true"]');
      /* e.code 로 본다 — macOS 에서 Alt+1 은 e.key 가 '\u00a1' 이라 숫자로 읽히지 않는다. */
      if (mod && e.code === 'KeyK') { e.preventDefault(); setPalette(true); return; }
      if (mod && key === ',') { e.preventDefault(); openSettings('account'); return; }
      if (mod && !e.shiftKey && e.code === 'KeyB') { e.preventDefault(); setSidebar(value => !value); return; }
      if (mod && e.shiftKey && e.code === 'KeyM') { e.preventDefault(); setMini(value => !value); return; }
      if (mod && e.code === 'KeyW') { e.preventDefault(); closeFront(); return; }
      if (mod && (e.code === 'Digit1' || e.code === 'Digit2')) { e.preventDefault(); setScope(e.code === 'Digit1' ? 'now' : 'today'); return; }
      if (e.altKey && e.code === 'KeyT') { e.preventDefault(); toggleTheme(); return; }
      if (e.altKey && /^Digit[1-9]$/.test(e.code)) { const i = Number(e.code.slice(5)) - 1; if (tabs[i] != null) { e.preventDefault(); openStudent(tabs[i]); } return; }
      if (e.key === 'Escape') { setMenu(null); setSettings(null); if (typing) e.target.blur(); return; }
      if (typing || mod || e.altKey) return;
      if (key === 'n' || key === '\u315c') { e.preventDefault(); nextStudent(); return; }
      if ((key === 'c' || key === '\u3148') && selected != null && route === 'board' && !hidden) {
        e.preventDefault();
        openQuickChat(selected, document.querySelector('.srow.sel')?.getBoundingClientRect());
        return;
      }
      if (front === 'student' && studentVisible) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); stepStudent(e.key === 'ArrowDown' ? 1 : -1); }
        return;
      }
      if (front !== 'main' || hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); moveSelection(-1); return; }
      /* 행이나 버튼에 포커스가 있으면 그쪽 Enter 처리에 맡긴다. */
      if (e.key === 'Enter' && selected != null && !target?.closest('button,[role="button"]')) { e.preventDefault(); openStudent(selected); }
    };
    window.addEventListener('keydown', listener); return () => window.removeEventListener('keydown', listener);
  });
  useEffect(() => { const narrow = matchMedia('(max-width:760px)'); const apply = e => setSidebar(!e.matches); narrow.addEventListener('change', apply); return () => narrow.removeEventListener('change', apply); }, []);
  useEffect(() => { if (!menu) return; const close = e => { if (!e.target.closest('.menu,.mb-item')) setMenu(null); }; document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close); }, [menu]);
  const studentMenu = (id, x, y) => { const s = state.students.find(s => s.id === id); setSelected(id); setMenu({ x, y, items: [{ label: `${s.name} · ${STXT[s.st]}`, heading: true }, { label: '열기', run: () => openStudent(id) }, { label: '새 창으로 열기', run: () => openWindow(id) }, { label: '빠른 답장  C', run: () => openQuickChat(id, document.querySelector(`.srow.sel`)?.getBoundingClientRect()) }, { label: '학생 상세 보기', run: () => onAction('profile', id) }, { label: '메모 추가…', run: () => onAction('memo', id) }, { label: '피드 발송…', run: () => onAction('feed', id) }, { label: '결석 처리', disabled: s.st !== 'offline', run: () => onAction('absent', id) }, { label: '수업 종료', disabled: ['ended', 'absent', 'pre'].includes(s.st), run: () => onAction('end', id) }] }); };
  const showMenu = (key, event) => {
    if (menu?.key === key) { setMenu(null); return; }
    const r = event.currentTarget.getBoundingClientRect();
    const items = {
      file: [{ label: '학생 열기', run: () => selected != null ? openStudent(selected) : setPalette(true) }, { label: '대화 내보내기…', run: () => { const s = state.students.find(s => s.id === (active ?? selected)); if (!s) { notify('학생을 먼저 선택하세요'); return; } exportCsv(`${s.name}-대화.csv`, [['학생', '내용', '시간'], ...s.sent.map(m => [s.name, m.text, m.at])]); } }, { label: '창 닫기', run: () => studentVisible ? closeStudent() : setHidden(true) }],
      edit: [{ label: '찾기…', run: () => setPalette(true) }, { label: '선택 학생 이름 복사', disabled: selected == null, run: () => copy(state.students.find(s => s.id === selected).name) }],
      view: [{ label: '지금 수업', run: () => setScope('now') }, { label: '오늘 전체', run: () => setScope('today') }, ...[['time', '수업 시간별 묶기'], ['status', '상태별 묶기'], ['none', '묶기 없음']].map(([group, label]) => ({ label, run: () => setOptions(o => ({ ...o, group })) })), { label: '카드로 보기', run: () => setOptions(o => ({ ...o, view: 'card' })) }, { label: '표로 보기', run: () => setOptions(o => ({ ...o, view: 'table' })) }, { label: '사이드바 열기/닫기', run: () => setSidebar(!sidebar) }, { label: '주간 · 야간', run: toggleTheme }],
      student: [{ label: '다음 확인 필요 학생', run: nextStudent }, { label: '학생 찾기', run: () => setPalette(true) }, { label: '피드 발송', run: () => onAction('feed', selected) }],
      window: [{ label: '미니 창 열기/닫기', run: () => setMini(!mini) }, { label: '보드 창', run: () => { setHidden(false); setStudentVisible(false); focus('main'); } }, { label: '학생 상세 창', disabled: active == null, run: () => { setStudentVisible(true); focus('student'); } }, { label: '나란히 보기 (보드 | 학생)', disabled: active == null, run: () => { setHidden(false); setStudentVisible(true); snapSide(); focus('student'); } }, { label: '보드 창 최대화', run: () => { setHidden(false); board.maximize(); focus('main'); } }, { label: `${selected != null ? state.students.find(x => x.id === selected).name : '선택한 학생'}을 새 창으로`, disabled: selected == null, run: () => openWindow(selected) }, ...(windows.length ? [{ label: '열린 학생 창', heading: true }, ...windows.map(w => ({ label: `${state.students.find(x => x.id === w.sid).name} · ${state.students.find(x => x.id === w.sid).cls}반`, run: () => focus(`w${w.sid}`) })), { label: '학생 창 모두 닫기', run: () => { setWindows([]); focus('main'); } }] : [])],
      help: [{ label: '키보드 단축키', run: () => openSettings('keys') }, { label: '밀당 LMS 도움말', run: () => onAction('help') }, { label: '새 채팅 시뮬레이션', run: () => { dispatch({ type: 'simulate' }); notify('최지우의 새 채팅을 추가했습니다'); } }],
    };
    setMenu({ key, x: r.left, y: r.bottom + 2, items: items[key] });
  };
  const scoped = scopedStudents(state.students, options.scope); const scopeLabel = options.scope === 'now' ? '지금 수업' : options.scope === 'today' ? '오늘 전체' : `${options.scope.slice(4)}반`;
  const todo = sortedAlerts(state.alerts.filter(a => !a.waitAt)); const count = severity => todo.filter(a => a.sev === severity).length;
  return <><main className="desktop" aria-label="밀당 LMS 데모">
    {!hidden && <section ref={boardRef} className={`win main topw ${board.maximized ? 'max' : ''} ${!sidebar ? 'nosb' : ''} ${boardNarrow ? 'narrow' : ''} ${front === 'main' ? '' : 'inactive'}`} style={{ ...board.style, zIndex: z.main }} onPointerDown={() => focus('main')} aria-label="학생 보드 창"><WindowTitle title={`${ROUTES[route]} - 밀당 LMS`} {...board.titleProps} onMinimize={() => setHidden(true)} onMaximize={board.toggleMax} onClose={() => { setHidden(true); notify('아래 밀당 아이콘을 누르면 다시 열립니다'); }}>{[['file', '파일'], ['edit', '편집'], ['view', '보기'], ['student', '학생'], ['window', '창'], ['help', '도움말']].map(([key, label]) => <button className={`mb-item ${menu?.key === key ? 'open' : ''}`} key={key} onClick={e => showMenu(key, e)}>{label}</button>)}</WindowTitle><div className="wbody"><Sidebar state={state} route={route} options={options} setScope={setScope} navigate={navigate} openSettings={() => openSettings('account')}/><div className="maincol"><header className="toolbar"><IconButton icon="menu" title="탐색 창 열기/닫기 Ctrl+B" onClick={() => setSidebar(!sidebar)}/><div className="tb-title"><b>{route === 'board' ? `학생 보드 · ${scopeLabel}` : ROUTES[route]}</b><span>{route === 'board' ? `${scoped.length}명 · 수업 중 ${scoped.filter(s => s.st === 'live').length}명` : { students: '학생 상세 · 학습과 계정', calendar: '피드 발송 · 커리큘럼', groups: '그룹 · 멤버 · 모둠', reports: '완강률 · 학습 분석 · 리포트', ops: '진단고사' }[route]}</span></div><div className="sp"/><IconButton icon="mini" title="미니 창 Ctrl+Shift+M" aria-pressed={mini} onClick={() => setMini(!mini)}/><IconButton icon={state.theme === 'day' ? 'moon' : 'sun'} title="주간·야간 Alt+T" onClick={toggleTheme}/><div className="tsep"/><button className="search" onClick={() => setPalette(true)}><Icon name="find"/><span>학생·명령 검색</span><span className="sp"/><kbd>Ctrl+K</kbd></button></header><div className="panes"><section className={`content ${route !== 'board' ? 'management-content' : ''}`}><Suspense fallback={<div className="empty" role="status">화면을 불러오는 중…</div>}>
      {route === 'board' && <Board state={state} options={options} setOptions={setOptions} selected={selected} onSelect={setSelected} onOpen={openStudent} onContext={studentMenu} onQuickChat={openQuickChat} quickId={quick?.id ?? null}/>}
      {route === 'students' && <StudentsPage state={state} selected={selected} onSelect={setSelected} onOpen={openStudent} onAction={onAction} navigate={navigate} onCopy={copy}/>}
      {route === 'calendar' && <CalendarPage state={state} dispatch={dispatch} onAction={onAction}/>}
      {route === 'groups' && <GroupsPage state={state} dispatch={dispatch} onAction={onAction} onOpen={openStudent} setScope={setScope} notify={notify}/>}
      {route === 'reports' && <ReportsPage state={state} onAction={onAction} onCopy={copy}/>}
      {route === 'ops' && <OperationsPage onCopy={copy} notify={notify}/>}
    </Suspense></section></div><footer className="statusbar"><span><span className="gdot"/> {storageError ? '저장 불가 · 세션만 유지' : '데모 · 로컬 저장'}</span><span className={`msg ${message ? 'flash' : ''}`} role="status">{message}</span><span className="sp"/><span className="shortcut-hint">더블클릭·Enter 열기 · N 다음 확인 필요 · Ctrl+K 검색</span><span className="route-code">/{route}{route === 'board' ? `?scope=${options.scope}&group=${options.group}&view=${options.view}` : ''}</span></footer>{!board.maximized && <div className="rs" {...board.resizeProps} role="presentation"/>}</div></div></section>}
    {hidden && !studentVisible && <div className="desktop-welcome"><div className="tk-app">밀</div><p>밀당 LMS 데모</p><Button onClick={() => setHidden(false)}>학생 보드 열기</Button></div>}
    {studentVisible && active != null && <StudentWorkspace key={active} state={state} dispatch={dispatch} tabs={tabs} active={active} onOpen={openStudent} onCloseTab={closeTab} onClose={closeStudent} onBack={() => { setHidden(false); setStudentVisible(false); }} onMinimize={() => setStudentVisible(false)} onAction={onAction} notify={notify} onCopy={copy} arrange={arrange} setMode={setMode} keysActive={front === 'student'} win={{ ...student, z: z.student, active: front === 'student', onFocus: () => focus('student') }}/>}
    {windows.map(w => <StudentWindow key={w.sid} state={state} dispatch={dispatch} sid={w.sid} initial={w.geom} z={z[`w${w.sid}`]} active={front === `w${w.sid}`} onFocus={() => focus(`w${w.sid}`)} onClose={() => closeWindow(w.sid)} onAction={onAction} notify={notify} onCopy={copy}/>)}
    {mini && <section className="mini on" aria-label="처리 대기 미니 창"><div className="mini-t"><div className="appic-s">밀</div>처리 대기<span className="pin">데모</span><span className="sp"/><button className="cap" aria-label="미니 창 닫기" onClick={() => setMini(false)}><Icon name="close"/></button></div><div className="mini-c">{['alarm', 'warning', 'caution'].map(sev => <span key={sev} className="num"><SeverityIcon severity={sev}/>{count(sev)}</span>)}</div><div className="mini-l">{todo.map(a => <button className="mini-r" key={a.id} onClick={() => openStudent(a.sid)}><SeverityIcon severity={a.sev}/><span className="d"><b>{state.students.find(s => s.id === a.sid).name}</b> {a.text}</span></button>)}{!todo.length && <div className="empty">할 일 없음</div>}</div><div className="mini-f">{todo.length ? `처리 대기 ${todo.length}건 · 누르면 화면 + 채팅` : '학생을 누르면 화면 + 채팅'}</div></section>}
    {settings && <Settings key={settings} state={state} dispatch={dispatch} onClose={() => { setSettings(null); focus('main'); }} notify={notify} onAction={onAction} initialTab={settings} setMode={setMode} z={z.settings} active={front === 'settings'} onFocus={() => focus('settings')}/>}
  </main>
  <footer className="taskbar" aria-label="데모 작업 표시줄"><div className="tb-center"><button className="tk" title="앱 메뉴" aria-label="앱 메뉴" onClick={() => setPalette(true)}><span className="windows-mark"><i/><i/><i/><i/></span></button><button className="tk-search" onClick={() => setPalette(true)}><Icon name="find"/>검색</button><span className="tk decorative-app" title="파일 탐색기 (장식)"><Icon name="folder" size={22}/></span><span className="tk decorative-app browser-mark" title="브라우저 (장식)"><i/></span><button className="tk on" title="밀당 LMS" aria-label="밀당 LMS 창 복원" onClick={() => { setHidden(false); if (active != null) setStudentVisible(value => !value); }}><span className="tk-app">밀</span>{todo.length > 0 && <span className="tk-bd num">{todo.length}</span>}</button>{windows.map(w => { const st = state.students.find(x => x.id === w.sid); return <button key={w.sid} className={`tk ${front === `w${w.sid}` ? 'on' : ''}`} title={`${st.name} 학생 창`} aria-label={`${st.name} 학생 창으로 전환`} onClick={() => focus(`w${w.sid}`)}><span className="tk-app">{st.name.slice(-2)}</span></button>; })}<span className="tk decorative-app" title="메신저 (장식)"><span className="messenger-mark"><Icon name="chat" size={19}/></span></span></div><div className="tray"><button className="tr-i tr-lms" aria-label="처리 대기 보기" onClick={() => setMini(!mini)}>{['alarm', 'warning'].filter(sev => count(sev)).map(sev => <span className="tray-severity" key={sev}><SeverityIcon severity={sev}/><span className="num">{count(sev)}</span></span>)}</button><span className="tr-i system-icons"><Icon name="wifi"/><Icon name="volume"/></span><div className="tr-clock">오후 8:41<br/>2026-09-28</div></div></footer>
  {menu && <div className="menu" role="menu" style={{ left: Math.max(4, Math.min(menu.x, innerWidth - 240)), top: Math.max(4, Math.min(menu.y, innerHeight - menu.items.length * 30 - 20)) }}>{menu.items.map((item, i) => item.heading ? <div className="mh" key={i}>{item.label}</div> : <button role="menuitem" className="mi" key={i} disabled={item.disabled} onClick={() => { setMenu(null); item.run(); }}>{item.label}</button>)}</div>}
  {quick && route === 'board' && !hidden && <QuickChat state={state} dispatch={dispatch} id={quick.id} anchor={quick.rect} onClose={() => setQuick(null)} onOpenDetail={openStudent} onImage={sid => { setQuick(null); onAction('image', sid); }} notify={notify}/>}
  {palette && <Palette state={state} onClose={() => setPalette(false)} onOpen={openStudent} navigate={navigate} setScope={setScope} onAction={onAction} toggleTheme={toggleTheme} toggleMini={() => setMini(!mini)} openSettings={() => openSettings('account')}/>}
  {action?.type === 'feed' ? <FeedWizard state={state} dispatch={dispatch} onClose={() => setAction(null)} notify={notify} studentIds={action.id != null ? [action.id] : []} day={action.extra || '09-29'}/> : action && <ActionDialog key={`${action.type}-${action.id}-${action.extra}`} action={action} state={state} dispatch={dispatch} onClose={() => setAction(null)} notify={notify}/>}
  {(hidden || studentVisible) && message && <div className="toast" role="status">{message}</div>}
  </>;
}
