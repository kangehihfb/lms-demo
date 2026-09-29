import { useEffect, useState } from 'react';
import { CUR, PRESETS } from './data.js';
import { Button, FormRow, Modal, DataTable } from './components.jsx';
import { Paper } from './StudentWorkspace.jsx';

function Timer({ onClose }) {
  const [seconds, setSeconds] = useState(300); const [running, setRunning] = useState(false);
  useEffect(() => { if (!running) return; const timer = setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, [running]);
  return <Modal title="학습 타이머" onClose={onClose} actions={<><Button onClick={() => { setSeconds(300); setRunning(false); }}>초기화</Button><Button primary onClick={() => setRunning(!running)} disabled={!seconds}>{running ? '일시 정지' : '시작'}</Button></>}><div className="timer-display" role="timer">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</div>{!seconds && <p role="status">설정한 시간이 끝났습니다.</p>}</Modal>;
}
export default function ActionDialog({ action, state, dispatch, onClose, notify }) {
  const s = state.students.find(s => s.id === action.id); const feed = state.feeds.find(f => f.id === action.id);
  const [text, setText] = useState(action.type === 'memo' ? s?.memo || '' : action.type === 'dayNote' ? state.notes[action.extra] || '' : action.type === 'report' ? state.reports[action.id]?.text || '' : action.type === 'moveFeed' ? `2026-${feed?.d}` : '');
  const [error, setError] = useState('');
  const save = () => {
    if (action.type === 'memo') dispatch({ type: 'student', id: s.id, patch: { memo: text.trim() } });
    if (action.type === 'dayNote') dispatch({ type: 'note', day: action.extra, text: text.trim() });
    if (action.type === 'report') { if (!text.trim()) { setError('리포트 내용을 입력하세요.'); return; } dispatch({ type: 'report', id: s.id, report: { text: text.trim() } }); }
    if (action.type === 'moveFeed') { if (!text || !Number.isFinite(Date.parse(text))) { setError('올바른 날짜를 입력하세요.'); return; } dispatch({ type: 'updateFeed', id: feed.id, patch: { d: text.slice(5), year: Number(text.slice(0, 4)) } }); }
    if (action.type === 'reference') { if (!text.trim()) { setError('보낼 참고 자료를 입력하세요.'); return; } dispatch({ type: 'respond', id: s.id, text: `참고 자료: ${text.trim()}` }); }
    if (action.type === 'reset') dispatch({ type: 'reset' });
    if (action.type === 'absent' || action.type === 'end') dispatch({ type: 'status', id: s.id, status: action.type === 'absent' ? 'absent' : 'ended' });
    notify(action.type === 'reset' ? '데모 데이터를 초기화했습니다' : '저장했습니다 (데모)'); onClose();
  };
  if (action.type === 'timer') return <Timer onClose={onClose}/>;
  if (action.type === 'image') return <Modal title={`${s.name} · 풀이 보기`} onClose={onClose} wide><div className="image-paper"><Paper student={s} question={action.extra || s.cur || 1}/></div><p className="mut">프로토타입의 풀이 예시입니다.</p></Modal>;
  if (action.type === 'curriculum') { const c = CUR.find(c => c.id === action.id); return <Modal title={c.name} onClose={onClose}><FormRow label="과목">{c.subj}</FormRow><FormRow label="유닛">{c.units}개</FormRow><FormRow label="자동 발송">{c.auto}</FormRow><DataTable columns={['순서', '학습']} rows={Array.from({ length: c.units }, (_, i) => [`Day ${i + 1}`, `${c.name} · ${i + 1}일차`])}/></Modal>; }
  if (action.type === 'feedOptions') return <Modal title="학습 옵션" onClose={onClose}><FormRow label="유닛">{feed.unit}</FormRow><FormRow label="프리셋">{feed.preset || '기본 (필수 학습 · 해설 항상)'}</FormRow><FormRow label="발송일">{feed.d}</FormRow></Modal>;
  const title = { memo: `${s?.name} 메모`, dayNote: '공지 · 메모', report: `${s?.name} · 9월 리포트`, moveFeed: '발송 날짜 옮기기', reference: '참고 자료 보내기', absent: '결석 처리', end: '수업 종료', reset: '데모 데이터 초기화', help: '밀당 LMS 데모' }[action.type];
  const editable = ['memo', 'dayNote', 'report', 'reference'].includes(action.type);
  return <Modal title={title} onClose={onClose} actions={<><Button onClick={onClose}>{action.type === 'help' ? '닫기' : '취소'}</Button>{action.type !== 'help' && <Button primary onClick={save}>{action.type === 'reset' ? '초기화' : action.type === 'absent' ? '결석 처리' : action.type === 'end' ? '수업 종료' : '저장'}</Button>}</>}>
    {editable && <>{action.type === 'report' && <div className="quick">{PRESETS.map(p => <Button key={p.n} onClick={() => setText(value => `${value}${value ? '\n' : ''}${p.t}`)}>{p.n}</Button>)}</div>}<textarea autoFocus className="editor" aria-label={title} value={text} onChange={e => setText(e.target.value)} placeholder={action.type === 'reference' ? '자료 이름, 설명 또는 링크를 입력하세요' : '내용을 입력하세요'}/></>}
    {action.type === 'moveFeed' && <FormRow label="발송일"><input type="date" className="in" aria-label="새 발송일" value={text} onChange={e => setText(e.target.value)}/></FormRow>}
    {['absent', 'end'].includes(action.type) && <p>{s.name} 학생을 {action.type === 'absent' ? '결석 처리' : '수업 종료 처리'}합니다. 이 학생의 확인 필요 알림도 정리됩니다.</p>}
    {action.type === 'reset' && <p>이 브라우저에 저장한 데모 채팅, 메모, 예약, 리포트와 설정을 초기화합니다.</p>}
    {action.type === 'help' && <><p>원본 HTML을 React로 옮긴 교사용 LMS 데모입니다.</p><p>학생을 더블클릭하거나 선택 후 Enter를 누르면 학습 화면과 채팅이 열립니다. N은 다음 확인 필요 학생, Ctrl/⌘+K는 검색입니다.</p><p>채팅, 메모, 결석 처리, 수업 종료, 피드 예약은 이 브라우저에 저장됩니다. 실제 학생·계정·서버와는 연결되지 않습니다.</p><p>설정 → 업데이트에서 새 채팅 시뮬레이션과 데이터 초기화를 실행할 수 있습니다.</p></>}
    {error && <p role="alert" className="form-error">{error}</p>}
  </Modal>;
}
