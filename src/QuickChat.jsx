import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { STXT } from './data.js';
import { chatMessages, expandReply, topAlert } from './model.js';
import { Icon, SeverityIcon } from './components.jsx';
import { Composer } from './StudentWorkspace.jsx';

const WIDTH = 300;
const MARGIN = 8;
const RECENT = 4;
const EMPTY = { offline: '아직 접속하지 않았습니다', pre: '수업 전입니다', absent: '결석 처리된 학생입니다' };

/** 카드 옆에 띄우되 화면 밖으로 나가지 않게 접는다. */
function place(anchor) {
  if (!anchor) return { left: MARGIN, top: MARGIN };
  const room = window.innerWidth - anchor.right - MARGIN;
  const left = room >= WIDTH + MARGIN
    ? anchor.right + MARGIN
    : Math.max(MARGIN, anchor.left - WIDTH - MARGIN);
  return { left: Math.min(left, window.innerWidth - WIDTH - MARGIN), top: anchor.top };
}

/**
 * 보드 카드에서 바로 최근 대화를 보고 답장하는 팝오버.
 * 상세 창을 열지 않고 끝낼 수 있는 경우를 위한 가벼운 화면이다.
 */
export default function QuickChat({ state, dispatch, id, anchor, onClose, onOpenDetail, onImage, notify }) {
  const s = state.students.find(x => x.id === id);
  const [draft, setDraft] = useState('');
  const ref = useRef(null);
  const [pos, setPos] = useState(() => place(anchor));

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const base = place(anchor);
    const height = el.offsetHeight;
    const maxTop = window.innerHeight - height - MARGIN - 48; /* 작업 표시줄 */
    setPos({ left: base.left, top: Math.max(MARGIN, Math.min(base.top, maxTop)) });
  }, [anchor, id]);

  /* 최신 메시지가 보이도록 아래로 붙인다. */
  const log = useRef(null);
  useLayoutEffect(() => { const el = log.current; if (el) el.scrollTop = el.scrollHeight; });

  useEffect(() => {
    const keydown = e => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    const pointerdown = e => { if (!ref.current?.contains(e.target) && !e.target.closest('.srow')) onClose(); };
    document.addEventListener('keydown', keydown, true);
    document.addEventListener('pointerdown', pointerdown);
    return () => { document.removeEventListener('keydown', keydown, true); document.removeEventListener('pointerdown', pointerdown); };
  }, [onClose]);

  if (!s) return null;
  const alert = topAlert(state.alerts, s.id);
  const recent = chatMessages(s).slice(-RECENT);
  const send = text => {
    const value = expandReply(s, text);
    if (!value) return;
    dispatch({ type: 'respond', id: s.id, text: value });
    setDraft('');
    notify(`${s.name}에게 메시지를 보냈습니다 (데모)`);
  };

  return <aside ref={ref} className="qchat" style={pos} role="dialog" aria-label={`${s.name} 빠른 답장`}>
    <header className="qchat-t">
      {alert && !alert.waitAt ? <SeverityIcon severity={alert.sev}/> : <span className={`dotn ${s.st === 'live' ? 'on' : ''}`}/>}
      <b>{s.name}</b><span>{s.cls}반 · {STXT[s.st]}</span>
      <span className="sp"/>
      <button className="cap close" aria-label="빠른 답장 닫기" onClick={onClose}><Icon name="close"/></button>
    </header>
    <div className="chat qchat-c" ref={log} aria-label="최근 대화" aria-live="polite">
      {recent.length ? recent.map((m, i) => <div key={i} className={`bub ${m.side}`}>{m.kind === 'image' ? <button className="img" onClick={() => onImage(s.id)}>{m.text}</button> : m.text}<span className="tm">{m.at}</span></div>)
        : <div className="sys">{EMPTY[s.st] || '아직 대화가 없습니다'}</div>}
    </div>
    <Composer student={s} draft={draft} setDraft={setDraft} onSend={send} placeholder="답장 입력   / 상용구" autoFocus/>
    <footer className="qchat-f">
      <button className="lnk" onClick={() => onOpenDetail(s.id)}>상세 열기 ↗</button>
      <span className="sp"/>
      <span className="k">Esc 닫기</span>
    </footer>
  </aside>;
}
