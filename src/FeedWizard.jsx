import { useState } from 'react';
import { CUR } from './data.js';
import { Modal, Button, FormRow } from './components.jsx';

export default function FeedWizard({ state, dispatch, onClose, notify, studentIds = [], day = '09-29' }) {
  const [step, setStep] = useState(1);
  const [target, setTarget] = useState(studentIds.length ? `student:${studentIds[0]}` : state.groups[0].id);
  const [curriculum, setCurriculum] = useState('c1');
  const [start, setStart] = useState(`2026-${day}`);
  const [days, setDays] = useState(['월', '수', '금']);
  const [amount, setAmount] = useState(1);
  const [preset, setPreset] = useState('기본 (필수 학습 · 해설 항상)');
  const [error, setError] = useState('');
  const student = target.startsWith('student:') ? state.students.find(s => s.id === Number(target.split(':')[1])) : null;
  const group = state.groups.find(g => student ? g.cls === student.cls : g.id === target);
  const targetLabel = student?.name || `${group.name} 전체 (${state.students.filter(s => s.cls === group.cls).length}명)`;
  const selected = CUR.find(c => c.id === curriculum);
  const next = () => { if (step === 3 && (!start || !Number.isFinite(Date.parse(start)) || start < '2026-09-28' || !days.length || amount < 1 || amount > selected.units)) { setError('9월 28일 이후 시작일, 발송 요일, 올바른 하루 분량을 입력하세요.'); return; } setError(''); setStep(step + 1); };
  const submit = () => {
    const date = new Date(`${start}T12:00:00`); const feeds = []; const weekdays = ['일', '월', '화', '수', '목', '금', '토']; let unit = 1;
    for (let tries = 0; tries < 370 && unit <= selected.units; tries++) {
      const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (days.includes(weekdays[date.getDay()]) && !['10-03', '10-09'].includes(monthDay)) {
        const end = Math.min(selected.units, unit + amount - 1);
        feeds.push({ id: crypto.randomUUID(), d: monthDay, year: date.getFullYear(), g: group.id, c: curriculum, unit: `Day ${unit}${end > unit ? `–${end}` : ''}`, st: 'plan', studentIds: student ? [student.id] : null, preset }); unit = end + 1;
      }
      date.setDate(date.getDate() + 1);
    }
    dispatch({ type: 'feed', feeds }); notify(`${targetLabel} · 피드 ${feeds.length}건을 예약했습니다 (데모)`); onClose();
  };
  return <Modal title="피드 발송" onClose={onClose} actions={<><Button onClick={onClose}>취소</Button>{step > 1 && <Button onClick={() => setStep(step - 1)}>이전</Button>}{step < 4 ? <Button primary onClick={next}>다음</Button> : <Button primary onClick={submit}>발송</Button>}</>}><div className="steps">{['대상', '커리큘럼 · 활동', '일정', '학습 옵션'].map((label, i) => <span className={i + 1 === step ? 'on' : i + 1 < step ? 'done' : ''} key={label}>{i + 1}. {label}</span>)}</div>
    {step === 1 && <><FormRow label="대상"><select className="in" aria-label="발송 대상" value={target} onChange={e => setTarget(e.target.value)}><optgroup label="그룹">{state.groups.map(g => <option key={g.id} value={g.id}>{g.name} 전체</option>)}</optgroup><optgroup label="학생">{state.students.map(s => <option key={s.id} value={`student:${s.id}`}>{s.name} · {s.cls}반</option>)}</optgroup></select></FormRow><FormRow label="범위">{targetLabel}</FormRow></>}
    {step === 2 && CUR.map(c => <label className="opt" key={c.id}><input type="radio" name="curriculum" value={c.id} checked={curriculum === c.id} onChange={() => setCurriculum(c.id)}/>{c.name}<span className="mut">{c.units} 유닛</span></label>)}
    {step === 3 && <><FormRow label="시작일"><input className="in" type="date" min="2026-09-28" aria-label="시작일" value={start} onChange={e => setStart(e.target.value)}/></FormRow><FormRow label="발송 요일">{['월', '화', '수', '목', '금', '토', '일'].map(d => <label key={d}><input type="checkbox" checked={days.includes(d)} onChange={e => setDays(e.target.checked ? [...days, d] : days.filter(x => x !== d))}/>{d}</label>)}</FormRow><FormRow label="하루 분량"><input className="in" type="number" aria-label="하루 분량" min={1} max={selected.units} value={amount} onChange={e => setAmount(Number(e.target.value))}/> Day</FormRow><FormRow label="예외"><span className="mut">10/3 개천절, 10/9 한글날 자동 제외</span></FormRow></>}
    {step === 4 && <><FormRow label="프리셋"><select className="in" aria-label="학습 옵션" value={preset} onChange={e => setPreset(e.target.value)}><option>기본 (필수 학습 · 해설 항상)</option><option>시험 대비 (해설 숨김)</option></select></FormRow><FormRow label="요약"><span><b>{targetLabel}</b>에게 <b>{selected.name}</b>을 {start}부터 {days.join('·')} {amount} Day씩 예약합니다.</span></FormRow><div className="note mut">데모에만 저장됩니다. 실제 학생에게 발송되지 않습니다.</div></>}{error && <p role="alert" className="form-error">{error}</p>}
  </Modal>;
}
