import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, reducer, boardGroups, needsAttention, scopedStudents, loadState } from '../src/model.js';

test('scope keeps upcoming classes and excludes ended classes', () => {
  const state = freshState();
  assert.equal(scopedStudents(state.students, 'now').length, 19);
  assert.equal(scopedStudents(state.students, 'today').length, 23);
  assert.equal(scopedStudents(state.students, 'cls:20:30').length, 7);
});
test('responding clears chat and marks an unresolved learning alert as student turn', () => {
  const initial = freshState();
  const state = reducer(initial, { type: 'respond', id: 0, text: '<img src=x onerror=alert(1)>' });
  assert.equal(state.students[0].sent[0].text, '<img src=x onerror=alert(1)>');
  assert.equal(state.alerts.some(a => a.sid === 0 && a.kind === 'chat'), false);
  assert.ok(state.alerts.find(a => a.sid === 0 && a.kind === 'stuck').waitAt);
  assert.equal(needsAttention(state.alerts, 0), false);
  assert.equal(needsAttention(initial.alerts, 0), true);
  assert.equal(initial.students[0].sent.length, 0);
});
test('attendance resolves alerts while preserving learning history', () => {
  const initial = freshState();
  const state = reducer(initial, { type: 'status', id: 2, status: 'absent' });
  assert.equal(state.students[2].st, 'absent');
  assert.equal(state.alerts.some(a => a.sid === 2), false);
  assert.deepEqual(state.students[0], initial.students[0]);
});
test('board filters and sorts apply within scope', () => {
  const state = freshState();
  const options = { scope: 'now', filter: 'need', group: 'time', query: '', sort: 'alert' };
  const groups = boardGroups(state.students, state.alerts, options);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].students.length, 7);
  assert.equal(groups[0].students[0].id, 0);
  assert.deepEqual(boardGroups(state.students, state.alerts, { ...options, query: '없는이름' })[0].students, []);
});
test('reservations can be edited and removed without touching unrelated feeds', () => {
  let state = freshState(); const n = state.feeds.length;
  state = reducer(state, { type: 'feed', feeds: [{ id: 'new', d: '09-29', c: 'c1', g: 'g1', studentIds: [0], st: 'plan' }] });
  assert.equal(state.feeds.length, n + 1);
  state = reducer(state, { type: 'updateFeed', id: 'new', patch: { d: '09-30' } });
  assert.equal(state.feeds.find(f => f.id === 'new').d, '09-30');
  state = reducer(state, { type: 'deleteFeed', id: 'new' }); assert.equal(state.feeds.length, n);
});
test('invalid or unavailable persisted storage recovers to fixture state', () => {
  for (const storage of [{ getItem: () => '{invalid' }, { getItem: () => '{"version":8}' }, { getItem: () => { throw new Error('blocked'); } }]) assert.equal(loadState(storage).students.length, 23);
});

test('window geometry helpers keep windows inside the desktop', async () => {
  const { snapGeometry, cascadeGeometry, compactGeometry, deskRect } = await import('../src/windowing.js');
  const d = deskRect();
  const snap = snapGeometry();
  assert.equal(snap.board.w + snap.student.w, d.width);
  assert.equal(snap.student.x, snap.board.w);
  assert.equal(snap.board.h, d.height);

  const first = cascadeGeometry(0), second = cascadeGeometry(1);
  assert.equal(second.x - first.x, 30);
  assert.equal(second.y - first.y, 28);
  for (const g of [first, second, cascadeGeometry(0, 'mini'), compactGeometry()]) {
    assert.ok(g.x >= 0 && g.y >= 0, 'window starts inside the desktop');
    assert.ok(g.w >= 640 && g.h >= 420, 'window is at least usable size');
  }
});

test('keyboard navigation orders skip responded alerts and keep a stable sequence', async () => {
  const { needOrder, workspaceOrder, rankAlert, freshState } = await import('../src/model.js');
  const state = freshState();

  const queue = needOrder(state.alerts);
  assert.ok(queue.length > 0);
  assert.equal(new Set(queue).size, queue.length, 'no student appears twice');
  const responded = state.alerts.find(a => !a.waitAt);
  const after = needOrder(state.alerts.map(a => a.id === responded.id ? { ...a, waitAt: '2026-09-28T20:41:00.000Z' } : a));
  assert.ok(after.length <= queue.length, '응대한 알림은 순서에서 빠진다');

  const order = workspaceOrder(state.students, state.alerts, 'now');
  assert.equal(new Set(order.map(s => s.id)).size, order.length);
  for (let i = 1; i < order.length; i += 1) {
    const [a, b] = [order[i - 1], order[i]];
    const cls = a.cls.localeCompare(b.cls);
    assert.ok(cls <= 0, '반 순서가 유지된다');
    if (cls === 0) assert.ok(rankAlert(state.alerts, a.id) <= rankAlert(state.alerts, b.id), '같은 반 안에서는 확인 필요가 먼저');
  }
});
