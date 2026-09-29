import { useEffect, useRef, useState } from 'react';
import { useNarrow } from './windowing.js';
import { QM, QE, CH_M, CH_E, INK, STXT, CLS, WAIT } from './data.js';
import { elapsed, sortedAlerts, topAlert, tagFor, phone, chatMessages, expandReply } from './model.js';
import { Icon, IconButton, SeverityIcon, Button, Segmented, FormRow, WindowTitle, SelectField } from './components.jsx';

export function Paper({ student: s, question, explanation = 'always' }) {
  const isMath = s.unit.startsWith('수학');
  const done = question < s.cur || ['done', 'ended'].includes(s.st) && question <= s.cur;
  const wrong = s.wrong.includes(question) && question <= s.cur;
  const current = question === s.cur && s.st === 'live';
  const answer = (question * 3) % 5;
  const pick = wrong ? (answer + 2) % 5 : answer;
  return <div className="paper"><div className="unit">{s.unit}</div><div className="qn">문항 {question}</div><div className="qt">{(isMath ? QM : QE)[(question - 1) % 10]}</div><div className="ch">{(isMath ? CH_M : CH_E).map((choice, i) => <div key={choice} className={`${(done || current && question % 2 === 1) && i === pick ? `pick${wrong ? ' wr' : ''}` : ''} ${done && wrong && i === answer ? 'ans' : ''}`}><b/>{choice}</div>)}</div><div className="work">{(done || current) && <svg viewBox="0 0 560 120" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" aria-label="학생 풀이 필기 예시" role="img">{INK.slice(0, current ? 2 + s.cur % 3 : 4).map(path => <path key={path} d={path}/>)}</svg>}<span className="lbl">학생 필기{current ? ' · 실시간 데모' : ''}</span></div>{done && (explanation === 'always' || explanation === 'correct' && !wrong) && <div className="expl"><b>해설</b> · {isMath ? '완전제곱식으로 바꾸면 꼭짓점에서 최댓값을 가집니다.' : '선행사와 문장 안에서의 역할을 확인하여 알맞은 관계사를 고릅니다.'}</div>}</div>;
}

export function Chat({ student: s, onSend, onImage }) {
  const [draft, setDraft] = useState('');
  const ref = useRef(null);
  const messages = chatMessages(s);
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight }); }, [s.sent.length, s.extra?.length]);
  const send = text => { const value = expandReply(s, text); if (value) { onSend(value); setDraft(''); } };
  return <div className="side-pane on chat-pane">
    <div className="chat" ref={ref} aria-label="대화 내역" aria-live="polite">
      <div className="sys">{s.cls} 수업 · 데모 대화</div>
      {messages.map((m, i) => <div key={i} className={`bub ${m.side}`}>{m.kind === 'image' ? <button className="img" onClick={onImage}>{m.text}</button> : m.text}<span className="tm">{m.at}</span></div>)}
      {['ended', 'absent'].includes(s.st) && <div className="sys">{STXT[s.st]} 처리됨</div>}
    </div>
    <Composer student={s} draft={draft} setDraft={setDraft} onSend={send}/>
  </div>;
}

/** 상용구 칩 + 입력줄. 학생 상세와 빠른 답장이 같이 쓴다. */
export function Composer({ student: s, draft, setDraft, onSend, placeholder = '메시지 입력   / 상용구', autoFocus = false }) {
  return <div className="composer">
    <div className="quick">{['💖', '👍', '✅', '/ 잠깐 볼게요', '/ 다시 풀어볼까?'].map(text => <button key={text} className="qk" onClick={() => onSend(text.replace(/^\/\s*/, ''))}>{text}</button>)}</div>
    <form className="inp" onSubmit={e => { e.preventDefault(); onSend(draft); }}>
      <input autoFocus={autoFocus} aria-label={`${s.name}에게 보낼 메시지`} placeholder={placeholder} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault(); }}/>
      <button className="send" type="submit" disabled={!draft.trim()} aria-label="메시지 전송"><Icon name="send"/></button>
    </form>
  </div>;
}


export default function StudentWorkspace({ state, dispatch, tabs, active, onOpen, onCloseTab, onClose, onBack, onMinimize, onAction, notify, onCopy, arrange, setMode, keysActive = true, win }) {
  const ref = useRef(null);
  const { narrow, xnarrow } = useNarrow(ref, 1100, 860);
  const s = state.students.find(student => student.id === active);
  const [question, setQuestion] = useState(null);
  const [side, setSide] = useState('chat');
  const [explanation, setExplanation] = useState('always');
  const q = question ?? (s.cur || 1);
  useQuestionKeys(s, q, setQuestion, keysActive);
  return <section ref={ref} className={`win topw stuw student-window ${win.maximized ? 'max' : ''} ${narrow ? 'narrow' : ''} ${xnarrow ? 'xnarrow' : ''} ${win.active ? '' : 'inactive'}`} style={{ ...win.style, zIndex: win.z }} onPointerDown={win.onFocus} aria-label={`학생 상세 ${s.name}`}>
    <WindowTitle title={`학생 상세 · ${s.name} (${s.cls}반) - 밀당 LMS`} {...win.titleProps} onMinimize={onMinimize} onMaximize={win.toggleMax} onClose={onClose}/>
    <div className="workspace" style={{ display: 'flex' }}><div className="ws-tabs"><button className="backbtn" onClick={onBack}><Icon name="prev"/>보드</button>{tabs.map((id, i) => { const student = state.students.find(x => x.id === id); const a = topAlert(state.alerts, id); return <div className={`wtab ${active === id ? 'on' : ''}`} key={id}><button className="wtab-select" onClick={() => onOpen(id)}>{a && !a.waitAt ? <SeverityIcon severity={a.sev}/> : <span className={`dotn ${student.st === 'live' ? 'on' : ''}`}/>}<span className="nm">{student.name}</span><span className="k">Alt+{i + 1}</span></button><button className="x" aria-label={`${student.name} 탭 닫기`} onClick={() => onCloseTab(id)}>×</button></div>; })}<span className="sp"/><SelectField label="창 배치" value={arrange} onChange={setMode} options={ [['split-view', '나란히'], ['maximized', '최대화'], ['floating', '작게']] }/></div>
    <div className="ws-body"><aside className="ws-rail">{Object.keys(CLS).map(cls => <div key={cls}><div className="rh"><b>{cls}반</b>{CLS[cls].range}</div>{state.students.filter(x => x.cls === cls).map(x => { const a = topAlert(state.alerts, x.id); return <button className={`rr ${x.id === active ? 'sel' : ''} ${a && !a.waitAt ? `s-${a.sev}` : ''}`} key={x.id} onClick={() => onOpen(x.id)}>{a ? <SeverityIcon severity={a.sev}/> : <span className={`dotn ${x.st === 'live' ? 'on' : ''}`}/>}<span className="nm">{x.name}<em>{tagFor(x, a)}</em></span><span className="el">{x.cur}/{x.total}</span></button>; })}</div>)}</aside>
    <StudentScreen student={s} alerts={state.alerts} q={q} setQuestion={setQuestion} explanation={explanation} setExplanation={setExplanation} dispatch={dispatch} notify={notify} onAction={onAction} onCopy={onCopy}/>
    <StudentSide student={s} side={side} setSide={setSide} dispatch={dispatch} notify={notify} onAction={onAction}/></div>
    <StudentFoot student={s} onAction={onAction}/></div><div className="statusbar"><span className="route-code">/student/{s.id}?tab={side}</span><span className="sp"/><span>← → 문항 · F 따라가기</span></div>
    {!win.maximized && <div className="rs" {...win.resizeProps} role="presentation"/>}
  </section>;
}

export function StudentScreen({ student: s, alerts, q, setQuestion, explanation, setExplanation, dispatch, notify, onAction, onCopy }) {
  const hasScreen = !['pre', 'offline', 'absent'].includes(s.st);
  const following = q === s.cur;
  const mine = sortedAlerts(alerts.filter(a => a.sid === s.id && a.kind !== 'chat'));
  return <div className="sw-screen"><div className="ss-bar"><span className={`ss-live ${s.st === 'live' && following ? '' : 'off'}`}><span className="gdot"/>{s.st === 'live' ? following ? '실시간 데모' : '다른 문항 보는 중' : '기록'}</span>{hasScreen && <span className="ss-q">{q}번<span>/ {s.total} · {elapsed(s)}</span></span>}<span className="sp"/>{hasScreen && <><IconButton title="이전 문항" icon="prev" disabled={q <= 1} onClick={() => setQuestion(q - 1)}/><IconButton title="다음 문항" icon="next" disabled={q >= s.total} onClick={() => setQuestion(q + 1)}/><SelectField label="해설" value={explanation} onChange={setExplanation} options={ [['always', '항상'], ['correct', '정답일 때'], ['none', '숨김']] }/></>}</div>
    {mine.map(a => <div className={`ss-banner ${a.waitAt ? 'waiting' : a.sev}`} key={a.id}><SeverityIcon severity={a.sev}/><span>{a.text}{a.waitAt && ` · 20:41 ${WAIT[a.kind] || '응대함'}`}</span></div>)}
    {hasScreen && !following && <div className="ss-banner follow"><span>지금 <b>{q}번</b>을 보고 있어요. 학생은 <b>{s.cur}번</b>에 있습니다.</span><span className="sp"/>{s.st === 'live' && <Button onClick={() => { dispatch({ type: 'student', id: s.id, patch: { cur: q } }); setQuestion(null); notify(`${q}번 문항으로 이동했습니다`); }}>학생을 {q}번으로 이동</Button>}<Button onClick={() => setQuestion(null)}>따라가기</Button></div>}
    <div className="ss-stage">{hasScreen ? <Paper student={s} question={q} explanation={explanation}/> : <div className="stage-empty"><b>{s.st === 'pre' ? '수업 전입니다' : s.st === 'absent' ? '결석 처리된 학생입니다' : '학생이 접속하지 않았습니다'}</b>{s.st === 'pre' ? `${s.cls}에 시작해요 · 49분 후` : s.memo || `${s.cls} 수업 시작 후 ${elapsed(s)} 지남`}{s.st === 'offline' && <div className="acts"><Button onClick={() => onAction('absent', s.id)}>결석 처리</Button><Button onClick={() => onCopy(phone(s, true))}>학부모 연락처 복사</Button></div>}</div>}</div>
    {hasScreen && <div className="ss-nav"><div className="qs">{Array.from({ length: s.total }, (_, i) => i + 1).map(n => <button key={n} className={`${n < s.cur || ['done', 'ended'].includes(s.st) && n <= s.cur ? 'd' : ''} ${n === s.cur && s.st === 'live' ? 'c' : ''} ${s.wrong.includes(n) && n <= s.cur ? 'w' : ''} ${n === q ? 'v' : ''}`} aria-label={`${n}번 문항`} aria-pressed={n === q} onClick={() => setQuestion(n)}>{n}</button>)}</div><div className="lg">푼 문항 · 지금 · 오답</div></div>}</div>;
}

export function StudentSide({ student: s, side, setSide, dispatch, notify, onAction }) {
  const hasScreen = !['pre', 'offline', 'absent'].includes(s.st);
  return <div className="sw-side"><div className="side-tabs"><Segmented label="학생 상세 탭" value={side} onChange={setSide} options={ [['chat', '채팅'], ['log', '활동 기록'], ['info', '정보']] }/></div>{side === 'chat' ? <Chat key={s.id} student={s} onSend={text => { dispatch({ type: 'respond', id: s.id, text }); notify(`${s.name}에게 메시지를 보냈습니다 (데모)`); }} onImage={() => onAction('image', s.id)}/> : side === 'log' ? <div className="side-pane on log">{hasScreen ? Array.from({ length: s.cur }, (_, i) => i + 1).reverse().map(n => <div key={n} className={s.wrong.includes(n) ? 'bad' : ''}><span>{s.cls}</span>{n}번 {n === s.cur && s.st === 'live' ? '풀이 중' : s.wrong.includes(n) ? '오답' : '정답'}</div>) : <div>오늘 활동 없음</div>}</div> : <div className="side-pane on info"><div className="grp"><div className="h">오늘</div><FormRow label="수업">{s.cls}반</FormRow><FormRow label="진도">{s.cur}/{s.total} 문항</FormRow><FormRow label="오답">{s.wrong.length}개</FormRow></div><div className="grp"><div className="h">이번 주</div><FormRow label="완강률">72%</FormRow><FormRow label="출석">3 / 4</FormRow></div>{s.memo && <div className="memo">{s.memo}</div>}<Button onClick={() => onAction('profile', s.id)}>학생 상세 열기</Button></div>}</div>;
}

export function StudentFoot({ student: s, onAction }) {
  return <div className="sw-foot">{s.st === 'offline' && <Button onClick={() => onAction('absent', s.id)}>결석 처리</Button>}{[['timer', '타이머'], ['feed', '피드 발송'], ['reference', '참고 자료'], ['memo', '메모']].map(([action, title]) => <Button key={action} onClick={() => onAction(action, s.id)}>{title}</Button>)}<span className="sp"/><Button onClick={() => onAction('image', s.id)}>이미지 뷰어 ↗</Button><Button primary disabled={['ended', 'absent', 'pre'].includes(s.st)} onClick={() => onAction('end', s.id)}>수업 종료</Button></div>;
}

/* ← → 문항 이동, F 따라가기. active 가 거짓이면(뒤쪽 창) 무시한다. */
export function useQuestionKeys(student, q, setQuestion, active = true) {
  useEffect(() => {
    if (!active) return;
    const keydown = e => {
      if (e.target instanceof Element && e.target.closest('input,textarea,select,dialog') || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); setQuestion(Math.max(1, q - 1)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setQuestion(Math.min(student.total, q + 1)); }
      if (e.key.toLowerCase() === 'f') setQuestion(null);
    };
    window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown);
  }, [q, student.total, setQuestion, active]);
}
