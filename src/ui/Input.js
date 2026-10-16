// 키보드/마우스 + 터치 조이스틱 입력
export class Input {
  constructor(canvas) {
    this.canvas = canvas; this.keys = new Set(); this.mouse = { x: 0, y: 0, down: false };
    this.touch = matchMedia('(pointer: coarse)').matches;
    this.sticks = { move: null, aim: null }; this.events = [];
    addEventListener('keydown', e => { this.keys.add(e.code); if (e.code === 'KeyE') this.events.push({ type: 'super' }); });
    addEventListener('keyup', e => this.keys.delete(e.code));
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('pointerdown', e => this.down(e));
    addEventListener('pointermove', e => this.move(e));
    addEventListener('pointerup', e => this.up(e)); addEventListener('pointercancel', e => this.up(e));
  }
  layout() { const w = innerWidth, h = innerHeight, s = Math.min(w, h);
    return { move: { x: s * 0.22, y: h - s * 0.24 }, aim: { x: w - s * 0.24, y: h - s * 0.24 }, sup: { x: w - s * 0.48, y: h - s * 0.14 }, R: s * 0.13 }; }
  down(e) {
    if (e.pointerType === 'touch') this.touch = true;
    if (!this.touch) { this.mouse.down = true; this.mouse.x = e.clientX; this.mouse.y = e.clientY; return; }
    const L = this.layout();
    if (Math.hypot(e.clientX - L.sup.x, e.clientY - L.sup.y) < L.R * 0.8) { this.events.push({ type: 'super' }); return; }
    const key = e.clientX < innerWidth / 2 ? 'move' : 'aim';
    const base = key === 'move' ? { x: e.clientX, y: e.clientY } : { ...L.aim };
    this.sticks[key] = { id: e.pointerId, base, dx: 0, dy: 0, mag: 0 };
    this.move(e);
  }
  move(e) {
    this.mouse.x = e.clientX; this.mouse.y = e.clientY;
    const R = this.layout().R;
    for (const s of Object.values(this.sticks)) if (s && s.id === e.pointerId) {
      const dx = e.clientX - s.base.x, dy = e.clientY - s.base.y, l = Math.hypot(dx, dy);
      s.mag = Math.min(1, l / R); s.dx = l ? dx / l : 0; s.dy = l ? dy / l : 0;
    }
  }
  up(e) {
    this.mouse.down = false;
    for (const k of ['move', 'aim']) { const s = this.sticks[k]; if (s && s.id === e.pointerId) {
      if (k === 'aim') this.events.push(s.mag > 0.25 ? { type: 'fire', dir: { x: s.dx, y: s.dy, power: s.mag } } : { type: 'fire', auto: true });
      this.sticks[k] = null; } }
  }
  moveVector() {
    const s = this.sticks.move; if (s && s.mag > 0.15) return { x: s.dx, y: s.dy };
    let x = 0, y = 0; const k = this.keys;
    if (k.has('KeyW') || k.has('ArrowUp')) y--; if (k.has('KeyS') || k.has('ArrowDown')) y++;
    if (k.has('KeyA') || k.has('ArrowLeft')) x--; if (k.has('KeyD') || k.has('ArrowRight')) x++;
    const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l };
  }
  drain() { const e = this.events; this.events = []; return e; }
}
