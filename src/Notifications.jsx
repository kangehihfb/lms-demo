import { useEffect, useRef, useState } from 'react';
import { expandReply } from './model.js';
import { Icon, SeverityIcon } from './components.jsx';

const LINGER = 10000; /* 경보가 아닌 알림은 10초 뒤 사라진다 */

/** 원본 notify() 의 Windows 11 알림 토스트. 본문을 누르면 학생이 열리고, 그 자리에서 답장할 수 있다. */
function Toast({ student: s, body, severity, onOpen, onReply, onClose }) {
  const [draft, setDraft] = useState('');
  const [shown, setShown] = useState(false);
  const hold = useRef(false);
  const timer = useRef(0);

  useEffect(() => { const id = requestAnimationFrame(() => setShown(true)); return () => cancelAnimationFrame(id); }, []);
  /* onClose 는 부모가 다시 그릴 때마다 새로 만들어지므로, 참조로 잡아 타이머가 초기화되지 않게 한다. */
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    if (severity === 'alarm') return; /* 경보는 직접 닫을 때까지 남는다 */
    timer.current = setTimeout(() => { if (!hold.current) close.current(); }, LINGER);
    return () => clearTimeout(timer.current);
  }, [severity]);

  const send = () => { onReply(expandReply(s, draft) || '👍'); onClose(); };
  const pause = () => { hold.current = true; clearTimeout(timer.current); };

  return <div
    className={`nt ${shown ? 'in' : ''} ${severity === 'alarm' ? 'alarm' : ''}`}
    role="alert"
    onMouseEnter={pause}
    onFocusCapture={pause}
  >
    <div className="nt-h">
      <span className="appic-s">밀</span>밀당 LMS
      <span className="sp"/>
      <button className="nt-x" aria-label="알림 닫기" onClick={onClose}>✕</button>
    </div>
    <div className="nt-b">
      <div className="av sm">{s.name[0]}</div>
      <div>
        <div className="h">{severity && severity !== 'caution' && <SeverityIcon severity={severity}/>}{s.name} · {s.cls}반</div>
        <div className="b">{body}</div>
      </div>
    </div>
    <form className="ri" onSubmit={e => { e.preventDefault(); send(); }}>
      <input
        aria-label={`${s.name}에게 답장`}
        placeholder="답장 입력"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault(); e.stopPropagation(); }}
      />
      <button className="send" type="submit" aria-label="답장 보내기"><Icon name="send"/></button>
    </form>
    <div className="acts">
      <button onClick={onOpen}>열기</button>
      <button onClick={onClose}>닫기</button>
    </div>
  </div>;
}

export default function Notifications({ state, items, onOpen, onReply, onClose }) {
  if (!items.length) return null;
  return <div className="notifs" aria-label="알림" aria-live="polite">
    {items.map(item => {
      const s = state.students.find(x => x.id === item.sid);
      if (!s) return null;
      return <Toast
        key={item.id}
        student={s}
        body={item.body}
        severity={item.sev}
        onOpen={() => { onClose(item.id); onOpen(item.sid); }}
        onReply={text => onReply(item.sid, text)}
        onClose={() => onClose(item.id)}
      />;
    })}
  </div>;
}
