import { initialStudents, initialAlerts, FEEDS, GROUPS, SEV, SGROUP, NOW0 } from './data.js';

export const STORAGE_KEY = 'mildang-react-demo-v1';
export const ROUTES = { board: '학생 보드', students: '학생', calendar: '일정 · 커리큘럼', groups: '그룹', reports: '성과 · 리포트', ops: '운영' };
export const freshState = () => ({ students: structuredClone(initialStudents), alerts: structuredClone(initialAlerts), feeds: FEEDS.map((f, i) => ({ ...f, id: `feed-${i}` })), groups: structuredClone(GROUPS), theme: 'day', notes: { '09-28': '20:30반 오늘 모의고사 안내' }, reports: {}, preferences: {}, version: 1 });
export function loadState(storage) {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY));
    if (saved?.version === 1 && Array.isArray(saved.students) && saved.students.length === 23 && Array.isArray(saved.alerts) && Array.isArray(saved.feeds) && Array.isArray(saved.groups)) return { ...freshState(), ...saved };
  } catch { return freshState(); }
  return freshState();
}
export function reducer(state, action) {
  switch (action.type) {
    case 'student': return { ...state, students: state.students.map(s => s.id === action.id ? { ...s, ...action.patch } : s) };
    case 'respond': return { ...state, students: state.students.map(s => s.id === action.id ? { ...s, sent: [...s.sent, { text: action.text, at: NOW0.toISOString() }] } : s), alerts: state.alerts.filter(a => a.sid !== action.id || a.kind !== 'chat').map(a => a.sid === action.id ? { ...a, waitAt: NOW0.toISOString() } : a) };
    case 'status': return { ...state, students: state.students.map(s => s.id === action.id ? { ...s, st: action.status, endAt: action.status === 'ended' ? NOW0.toISOString() : s.endAt } : s), alerts: state.alerts.filter(a => a.sid !== action.id) };
    case 'feed': return { ...state, feeds: [...state.feeds, ...action.feeds] };
    case 'deleteFeed': return { ...state, feeds: state.feeds.filter(f => f.id !== action.id) };
    case 'updateFeed': return { ...state, feeds: state.feeds.map(f => f.id === action.id ? { ...f, ...action.patch } : f) };
    case 'group': return { ...state, groups: state.groups.map(g => g.id === action.id ? { ...g, ...action.patch } : g) };
    case 'note': return { ...state, notes: { ...state.notes, [action.day]: action.text } };
    case 'theme': return { ...state, theme: action.theme };
    case 'preference': return { ...state, preferences: { ...state.preferences, [action.key]: action.value } };
    case 'report': return { ...state, reports: { ...state.reports, [action.id]: action.report } };
    /* 원본 incoming(ev): 학생 상태와 알림을 갱신한다. 같은 종류의 채팅은 건수만 올린다. */
    case 'incoming': {
      const { sid, msg, cur, kind, sev, text } = action.event;
      const students = state.students.map(s => s.id === sid ? {
        ...s,
        last: msg ? msg : s.last,
        extra: msg ? [...(s.extra || []), { text: msg, at: NOW0.toISOString() }] : s.extra,
        cur: cur ?? s.cur,
      } : s);
      const open = state.alerts.find(a => a.sid === sid && a.kind === kind && !a.waitAt);
      const alerts = open && kind === 'chat'
        ? state.alerts.map(a => a.id === open.id ? { ...a, n: (a.n || 1) + 1, text: `새 채팅 ${(a.n || 1) + 1}건` } : a)
        : [...state.alerts, { id: action.id, sid, sev, kind, n: 1, text, at: NOW0.toISOString() }];
      return { ...state, students, alerts };
    }
    case 'simulate': {
      const id = 3;
      return { ...state, students: state.students.map(s => s.id === id ? { ...s, last: '쌤 8번 답이 2번 맞아요?', extra: [...(s.extra || []), { text: '쌤 8번 답이 2번 맞아요?', at: NOW0.toISOString() }] } : s), alerts: [...state.alerts.filter(a => a.id !== 'demo-chat'), { id: 'demo-chat', sid: id, sev: 'caution', kind: 'chat', text: '새 채팅 1건', n: 1, at: NOW0.toISOString() }] };
    }
    case 'reset': return freshState();
    default: throw new Error(`Unknown action: ${action.type}`);
  }
}
export const clsState = cls => cls === '19:00' ? 'past' : cls === '21:30' ? 'pre' : 'live';
export const scopedStudents = (students, scope) => scope === 'today' ? students : scope.startsWith('cls:') ? students.filter(s => s.cls === scope.slice(4)) : students.filter(s => clsState(s.cls) !== 'past');
export const sortedAlerts = alerts => [...alerts].sort((a, b) => Number(!!a.waitAt) - Number(!!b.waitAt) || SEV[a.sev] - SEV[b.sev] || new Date(a.at) - new Date(b.at));
export const topAlert = (alerts, id) => sortedAlerts(alerts.filter(a => a.sid === id))[0];
/** 대화 내역을 한 줄로 펼친다. side 는 me(선생님) / them(학생). */
export const chatMessages = s => {
  const list = [];
  if (!['pre', 'offline', 'absent'].includes(s.st)) {
    list.push({ side: 'me', text: `오늘은 ${s.unit.split('·')[1]?.trim()} 할게요`, at: s.cls });
    list.push({ side: 'them', text: '넵!', at: s.cls });
  }
  if (s.img) list.push({ side: 'them', kind: 'image', text: '풀이 사진 열기', at: '20:39' });
  if (s.last) list.push({ side: 'them', text: s.last, at: '20:40' });
  (s.extra || []).forEach(m => list.push({ side: 'them', text: m.text, at: '20:41' }));
  s.sent.forEach(m => list.push({ side: 'me', text: m.text, at: '20:41' }));
  return list;
};
/** 상용구를 실제 문장으로 바꾼다. 빈 문자열이면 보내지 않는다. */
export const expandReply = (s, text) => text.trim().replace('/잠깐', `잠깐 볼게요, ${s.name}!`).replace('/다시', `${s.cur || 1}번 다시 한번 풀어볼까?`);
/** 아직 답하지 않은 채팅 수. 0 이면 빠른 답장을 띄울 이유가 없다. */
export const unreadChats = (alerts, id) => alerts.filter(a => a.sid === id && a.kind === 'chat' && !a.waitAt).reduce((n, a) => n + (a.n || 1), 0);
export const rankAlert = (alerts, id) => { const t = topAlert(alerts, id); return t ? t.waitAt ? 5 : SEV[t.sev] : 9; };
/** 학생 상세에서 ↑ ↓ 로 옮겨 다니는 순서 (원본 wsList). */
export const workspaceOrder = (students, alerts, scope) => scopedStudents(students, scope).slice()
  .sort((a, b) => a.cls.localeCompare(b.cls) || rankAlert(alerts, a.id) - rankAlert(alerts, b.id) || a.id - b.id);
/** 확인 필요 순서 (원본 needOrder). */
export const needOrder = alerts => [...new Set(sortedAlerts(alerts.filter(a => !a.waitAt)).map(a => a.sid))];
export const needsAttention = (alerts, id) => alerts.some(a => a.sid === id && !a.waitAt);
export function boardGroups(students, alerts, options) {
  let list = scopedStudents(students, options.scope).filter(s => s.name.includes(options.query));
  list = list.filter(s => options.filter === 'all' || (options.filter === 'need' ? needsAttention(alerts, s.id) : SGROUP[s.st] === options.filter));
  const rank = s => { const a = topAlert(alerts, s.id); return a ? a.waitAt ? 5 : SEV[a.sev] : 9; };
  list.sort((a, b) => options.sort === 'name' ? a.name.localeCompare(b.name, 'ko') : options.sort === 'progress' ? a.cur / a.total - b.cur / b.total : options.sort === 'cls' ? a.cls.localeCompare(b.cls) || rank(a) - rank(b) : rank(a) - rank(b) || Number(SGROUP[a.st] === 'fin') - Number(SGROUP[b.st] === 'fin') || a.id - b.id);
  if (options.group === 'none' || options.filter === 'need') return [{ key: 'all', title: '', students: list }];
  const keys = options.group === 'status' ? ['live', 'off', 'pre', 'fin'] : [...new Set(list.map(s => s.cls))].sort();
  const labels = { live: '수업 중', off: '미접속 · 결석', pre: '수업 전', fin: '끝남' };
  return keys.map(key => ({ key, title: options.group === 'time' ? `${key}반` : labels[key], students: list.filter(s => options.group === 'time' ? s.cls === key : SGROUP[s.st] === key) }));
}
export const tagFor = (s, a) => a?.waitAt ? '응대함' : s.st === 'offline' ? '미접속' : s.st === 'absent' ? '결석' : a?.kind === 'stuck' ? '멈춤' : a?.kind === 'nostart' ? '미시작' : a?.kind === 'wrong' ? '연속 오답' : a?.kind === 'chat' && a.sev === 'warning' ? '미응답' : s.st === 'done' ? '완료' : s.st === 'ended' ? '종료' : '';
export const elapsed = s => {
  if (s.st === 'pre') return `${s.cls} 시작`;
  if (s.st === 'absent') return '';
  if (s.st === 'ended') return '20:00 종료';
  const seconds = Math.max(0, Math.floor((NOW0 - new Date(s.since || NOW0)) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};
export const weekProgress = s => 60 + ((s.id * 37) % 35);
export const attendance = s => s.st === 'absent' ? '2/4' : s.st === 'offline' ? '3/4' : '4/4';
export const phone = (s, guardian = false) => guardian ? `010-9876-${2000 + s.id * 53}` : `010-1234-${1000 + s.id * 37}`;
export function exportCsv(filename, rows) {
  const csv = '\uFEFF' + rows.map(row => row.map(value => '"' + String(value).replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"').join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 데모가 켜진 뒤 예약된 수신 이벤트 (원본 EVENTS). t 는 초. */
export const EVENTS = [
  { t: 6, sid: 3, kind: 'chat', sev: 'caution', text: '새 채팅 1건', msg: '쌤 8번 답이 2번 맞아요?' },
  { t: 18, sid: 5, kind: 'chat', sev: 'caution', text: '새 채팅 1건', msg: '다 풀었어요! 다음 거 해요?' },
  { t: 30, sid: 10, kind: 'stuck', sev: 'alarm', text: '3번 문항에서 10분째 멈춤' },
  { t: 42, sid: 12, kind: 'chat', sev: 'caution', text: '새 채팅 1건', msg: '이거 사진으로 보낼게요' },
  { t: 55, sid: 7, kind: 'chat', sev: 'caution', text: '새 채팅 1건', msg: '쌤 잠깐 화장실 다녀올게요' },
];
