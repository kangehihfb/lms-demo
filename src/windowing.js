import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/* 원본 프로토타입의 창 조작(makeTop / makeDrag / makeResize / setGeom / snapSide)을 React로 옮긴 모듈. */

export function deskRect() {
  const el = typeof document === 'undefined' ? null : document.querySelector('.desktop');
  if (el) { const r = el.getBoundingClientRect(); if (r.width && r.height) return r; }
  if (typeof window === 'undefined') return { left: 0, top: 0, width: 1440, height: 852 };
  return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
}

const NO_DRAG = 'button,input,select,textarea,a,.mb-item,.caps,.pop,.seg,.lights,.wtab,.route-code';

let zTop = 100;
export const nextZ = () => ++zTop;

/** 창 사이의 앞뒤 순서. front 는 활성 창 키, z 는 창별 z-index. */
export function useZOrder(initial = 'main') {
  const [front, setFront] = useState(initial);
  const [z, setZ] = useState(() => ({ [initial]: nextZ() }));
  const focus = useCallback(key => {
    setZ(map => ({ ...map, [key]: nextZ() }));
    setFront(key);
  }, []);
  return { front, z, focus };
}

/**
 * 끌기 · 크기 조절 · 더블클릭 최대화를 담당한다.
 * geom 이 null 이면 최대화 상태(.max), 아니면 {x,y,w,h} 의 자유 배치.
 */
export function useFloatingWindow({ minW = 520, minH = 420, initial = null, onInteract } = {}) {
  const [geom, setGeom] = useState(initial);
  const restore = useRef(initial);
  const live = useRef(initial);
  const frame = useRef(0);
  live.current = geom;

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  /* rAF 로 묶어 프레임당 한 번만 반영한다. */
  const commit = useCallback(next => {
    live.current = next;
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => { frame.current = 0; setGeom(live.current); });
  }, []);

  const place = useCallback((x, y, w, h) => { cancelAnimationFrame(frame.current); frame.current = 0; const next = { x, y, w, h }; live.current = next; setGeom(next); }, []);
  const maximize = useCallback(() => { cancelAnimationFrame(frame.current); frame.current = 0; if (live.current) restore.current = live.current; live.current = null; setGeom(null); }, []);
  const toggleMax = useCallback(() => {
    cancelAnimationFrame(frame.current); frame.current = 0;
    if (live.current) { restore.current = live.current; live.current = null; setGeom(null); return; }
    const d = deskRect();
    const next = restore.current || { x: Math.round(d.width * 0.12), y: Math.round(d.height * 0.06), w: Math.round(d.width * 0.76), h: Math.round(d.height * 0.86) };
    live.current = next; setGeom(next);
  }, []);

  const onTitlePointerDown = useCallback(event => {
    if (event.button !== 0 || event.target.closest(NO_DRAG)) return;
    const el = event.currentTarget.closest('.win');
    if (!el) return;
    onInteract?.();
    const d = deskRect();
    let base = live.current;
    if (!base) {
      /* 최대화 상태에서 끌면 커서 위치 비율을 유지한 채 이전 크기로 복원한다. */
      const g = restore.current || { w: Math.round(d.width * 0.7), h: Math.round(d.height * 0.8) };
      const ratio = (event.clientX - d.left) / d.width;
      base = { x: Math.round(event.clientX - d.left - g.w * ratio), y: 0, w: g.w, h: g.h };
      place(base.x, base.y, base.w, base.h);
    }
    const rect = el.getBoundingClientRect();
    const ox = event.clientX - rect.left, oy = event.clientY - rect.top;
    const w = base.w ?? rect.width, h = base.h ?? rect.height;
    const move = ev => commit({
      x: Math.max(-w + 120, Math.min(d.width - 120, ev.clientX - d.left - ox)),
      y: Math.max(0, Math.min(d.height - 34, ev.clientY - d.top - oy)),
      w, h,
    });
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }, [commit, place, onInteract]);

  const onResizePointerDown = useCallback(event => {
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    const el = event.currentTarget.closest('.win');
    if (!el || !live.current) return;
    onInteract?.();
    const { x, y } = live.current;
    const w0 = el.offsetWidth, h0 = el.offsetHeight, x0 = event.clientX, y0 = event.clientY;
    const move = ev => commit({ x, y, w: Math.max(minW, w0 + ev.clientX - x0), h: Math.max(minH, h0 + ev.clientY - y0) });
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }, [commit, minW, minH, onInteract]);

  const style = geom ? { left: geom.x, top: geom.y, width: geom.w, height: geom.h } : undefined;
  return { geom, style, maximized: !geom, place, maximize, toggleMax, titleProps: { onPointerDown: onTitlePointerDown, onDoubleClick: toggleMax }, resizeProps: { onPointerDown: onResizePointerDown } };
}

/** 창 폭에 따라 narrow / xnarrow 를 붙인다 (원본의 ResizeObserver). */
export function useNarrow(ref, narrowAt = 1100, xnarrowAt = 0) {
  const [flags, setFlags] = useState({ narrow: false, xnarrow: false });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      const w = el.offsetWidth;
      setFlags(prev => {
        const next = { narrow: w < narrowAt, xnarrow: xnarrowAt > 0 && w < xnarrowAt };
        return prev.narrow === next.narrow && prev.xnarrow === next.xnarrow ? prev : next;
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, narrowAt, xnarrowAt]);
  return flags;
}

/** 보드 42% | 학생 상세 나머지 (원본 snapSide). */
export function snapGeometry() {
  const d = deskRect();
  const boardWidth = Math.round(d.width * 0.42);
  return { board: { x: 0, y: 0, w: boardWidth, h: d.height }, student: { x: boardWidth, y: 0, w: d.width - boardWidth, h: d.height } };
}

/** 미니 창을 피해 오른쪽 아래에 학생 상세를 놓는다 (원본 placeStuCompact). */
export function compactGeometry() {
  const d = deskRect();
  const w = Math.min(1000, Math.max(640, d.width - 60));
  const h = Math.min(640, Math.max(420, d.height - 30));
  return { x: Math.max(10, d.width - w - 272 - 40), y: Math.max(10, d.height - h - 14), w, h };
}

/** 계단식으로 겹쳐 띄운다 (원본 openWin 의 casc). */
export function cascadeGeometry(index, from) {
  const d = deskRect();
  const w = Math.min(1080, Math.max(820, d.width - 80));
  const h = Math.min(650, Math.max(520, d.height - 60));
  if (from === 'mini') {
    return { x: Math.max(12, d.width - 272 - w - 24 + (index % 3) * 24), y: Math.max(8, d.height - h - 14 - (index % 3) * 24), w, h };
  }
  return { x: Math.max(12, Math.min(d.width - w - 10, 150 + (index % 6) * 30)), y: Math.max(8, Math.min(d.height - h - 10, 40 + (index % 6) * 28)), w, h };
}
