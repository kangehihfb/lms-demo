import { useRef, useState } from 'react';
import { STXT } from './data.js';
import { Icon } from './components.jsx';
import { StudentScreen, StudentSide, StudentFoot, useQuestionKeys } from './StudentWorkspace.jsx';
import { useFloatingWindow, useNarrow } from './windowing.js';

/**
 * 원본의 openWin(sid) 에 해당하는 독립 학생 창.
 * 보드와 별개로 여러 개를 띄워 끌고 크기를 바꿀 수 있다.
 */
export default function StudentWindow({ state, dispatch, sid, initial, z, active, onFocus, onClose, onAction, notify, onCopy }) {
  const s = state.students.find(student => student.id === sid);
  const ref = useRef(null);
  const [question, setQuestion] = useState(null);
  const [side, setSide] = useState('chat');
  const [explanation, setExplanation] = useState('always');
  const win = useFloatingWindow({ minW: 820, minH: 520, initial, onInteract: onFocus });
  const { narrow } = useNarrow(ref, 980);
  const q = question ?? (s.cur || 1);
  const hasScreen = !['pre', 'offline', 'absent'].includes(s.st);
  useQuestionKeys(s, q, setQuestion, active);

  return <section
    ref={ref}
    className={`win sw in ${narrow ? 'narrow' : ''} ${active ? '' : 'inactive'}`}
    style={{ ...win.style, zIndex: z }}
    onPointerDown={onFocus}
    aria-label={`${s.name} 학생 창`}
  >
    <div className="sw-title" {...win.titleProps}>
      <div className="appic-s">밀</div>
      <div className="sw-t"><b>{s.name}</b><span>{s.cls}반 · {STXT[s.st]} · {s.unit}</span></div>
      <div className="sp"/>
      <span className="sw-hint" style={{ fontSize: 11, color: 'var(--tx3)' }}>{hasScreen ? '← → 문항 이동 · F 따라가기' : ''}</span>
      <div className="caps">
        <button className="cap" title="최소화" aria-label={`${s.name} 창 최소화`} onClick={onClose}><Icon name="min"/></button>
        <button className="cap" title="최대화/이전 크기" aria-label={`${s.name} 창 최대화`} onClick={win.toggleMax}><Icon name="max"/></button>
        <button className="cap close" title="닫기" aria-label={`${s.name} 창 닫기`} onClick={onClose}><Icon name="close"/></button>
      </div>
    </div>
    <div className="sw-body">
      <StudentScreen student={s} alerts={state.alerts} q={q} setQuestion={setQuestion} explanation={explanation} setExplanation={setExplanation} dispatch={dispatch} notify={notify} onAction={onAction} onCopy={onCopy}/>
      <StudentSide student={s} side={side} setSide={setSide} dispatch={dispatch} notify={notify} onAction={onAction}/>
    </div>
    <StudentFoot student={s} onAction={onAction}/>
    {!win.maximized && <div className="rs" {...win.resizeProps} role="presentation"/>}
  </section>;
}
