import { Vec } from '../core/Vec.js';
import { Brawler } from '../game/Brawler.js';

// 첫 실행 연습장: 이동(표시까지) → 허수아비 쏘기 → 궁극기로 허수아비 맞히기. 각 단계는 성공해야 다음으로.
export class Tutorial {
  static DONE_HOLD = 1.5; // 마지막 단계 성공 후 "완료" 문구를 보여 주는 시간
  static REACH = 40;
  static STEPS = [
    { id: 'move', text: { desk: 'WASD로 노란 표시까지 가 봐', touch: '왼쪽 스틱으로 노란 표시까지 가 봐' } },
    { id: 'shoot', text: { desk: '클릭해서 허수아비를 맞혀 봐', touch: '오른쪽 화면을 탭해서 허수아비를 맞혀 봐' } },
    { id: 'super', text: { desk: '궁극기가 찼어! E로 허수아비에 써 봐', touch: '궁극기가 찼어! 번개 버튼으로 허수아비에 써 봐' } },
  ];
  constructor(match) {
    const a = match.arena; this.m = match; this.tutorial = true; this.gems = []; this.countdown = null;
    a.grid.forEach((row, y) => row.forEach((c, x) => {
      const p = { x: (x + 0.5) * a.T, y: (y + 0.5) * a.T };
      if (c === 'M') { this.marker = p; row[x] = '.'; }
      if (c === 'D') { this.dummySpawn = p; row[x] = '.'; }
    }));
    this.dummy = new Brawler('bolder', 'red', this.dummySpawn); this.dummy.dummy = true;
    match.brawlers.push(this.dummy);
    this.step = 0; this.stepStart = 0; this.superUsedAt = null; this.doneAt = null;
  }
  // 카메라가 당겨질 현재 목표
  get focus() { return this.current?.id === 'move' ? this.marker : this.dummy; }
  get current() { return Tutorial.STEPS[this.step] || null; }
  next() { this.step++; this.stepStart = this.m.time; if (this.current?.id === 'super') this.m.player.superCharge = 1; if (!this.current) this.doneAt = this.m.time; }
  update() {
    const m = this.m, p = m.player, d = this.dummy, s = this.current;
    if (!s) return;
    if (s.id === 'move' && Vec.dist(p, this.marker) < Tutorial.REACH) return this.next();
    if (s.id === 'shoot' && d.lastHurt > this.stepStart) { p.superCharge = 0; return this.next(); }
    if (s.id === 'super') {
      if (this.superUsedAt === null && !p.superReady) this.superUsedAt = m.time;
      if (this.superUsedAt !== null && d.lastHurt >= this.superUsedAt) return this.next();
      if (this.superUsedAt !== null && m.time - this.superUsedAt > 2) { p.superCharge = 1; this.superUsedAt = null; } // 빗나가면 다시 채워 줌
    }
  }
  onDeath() {}
  result() { return this.doneAt !== null && this.m.time - this.doneAt > Tutorial.DONE_HOLD ? this.m.player.team : null; }
  teamGems() { return 0; }
  // 이동 단계의 목표 표시 (월드 좌표, 바닥 위)
  drawWorld(ctx) {
    if (this.current?.id !== 'move') return;
    const { x, y } = this.marker, r = 26 + Math.sin(this.m.time * 5) * 4;
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    ctx.fillStyle = '#ffd23f55'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  // 위쪽 한 줄 안내 + 단계 표시
  drawHud(ctx, touch, txt) {
    const W = innerWidth, n = Tutorial.STEPS.length, s = this.current, size = Math.max(16, Math.min(28, W / 30));
    const line = s ? s.text[touch ? 'touch' : 'desk'] : '완료! 이제 실전이야';
    ctx.fillStyle = '#000b'; ctx.fillRect(0, 10, W, size * 2.6);
    txt(`연습 ${Math.min(this.step + 1, n)}/${n}`, W / 2, 10 + size * 0.95, size * 0.6, '#ffd23f');
    txt(line, W / 2, 10 + size * 2.05, size, s ? '#fff' : '#7dff9a');
  }
}
