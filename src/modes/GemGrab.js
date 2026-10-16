import { Vec } from '../core/Vec.js';

export class GemGrab {
  static GOAL = 10; static HOLD = 15; static SPAWN_EVERY = 7;
  constructor(match) { this.m = match; this.gems = []; this.spawnT = 3; this.countdown = null; this.leader = null; }
  teamGems(team) { return this.m.brawlers.filter(b => b.team === team).reduce((s, b) => s + b.gems, 0); }
  drop(x, y, n, spreadSpeed = 160) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = spreadSpeed * (0.5 + Math.random());
      this.gems.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, age: 0 });
    }
  }
  update(dt) {
    const m = this.m;
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.gems.length < 29) { this.spawnT = GemGrab.SPAWN_EVERY; this.drop(m.arena.mine.x, m.arena.mine.y, 1, 120); }
    for (const g of this.gems) {
      g.age += dt; const f = Math.max(0, 1 - dt * 3);
      const nx = g.x + g.vx * dt, ny = g.y + g.vy * dt;
      if (!m.arena.solidAt(nx, ny)) { g.x = nx; g.y = ny; } else { g.vx = -g.vx; g.vy = -g.vy; }
      g.vx *= f; g.vy *= f;
      if (g.age < 0.4) continue;
      for (const b of m.brawlers) if (!b.dead && Vec.dist(b, g) < b.r + 14) { b.gems++; g.taken = true; break; }
    }
    this.gems = this.gems.filter(g => !g.taken);
    const blue = this.teamGems('blue'), red = this.teamGems('red');
    const leader = blue >= GemGrab.GOAL && blue > red ? 'blue' : red >= GemGrab.GOAL && red > blue ? 'red' : null;
    if (leader !== this.leader) { this.leader = leader; this.countdown = leader ? GemGrab.HOLD : null; }
    if (this.countdown !== null) this.countdown -= dt;
  }
  onDeath(b) { if (b.gems > 0) { this.drop(b.x, b.y, b.gems); b.gems = 0; } }
  result() {
    if (this.countdown !== null && this.countdown <= 0) return this.leader;
    if (this.m.timeLeft <= 0) { const b = this.teamGems('blue'), r = this.teamGems('red'); return b > r ? 'blue' : r > b ? 'red' : 'draw'; }
    return null;
  }
  // 봇 AI가 쓰는 힌트
  objectiveFor(b) {
    const mine = this.teamGems(b.team), theirs = this.teamGems(b.team === 'blue' ? 'red' : 'blue');
    if (this.leader === b.team && b.gems > 0) return { kind: 'retreat', x: b.spawn.x, y: b.spawn.y };
    let best = null, bd = 1e9;
    for (const g of this.gems) { const d = Vec.dist(b, g); if (d < bd) { bd = d; best = g; } }
    if (best && bd < 700) return { kind: 'collect', x: best.x, y: best.y };
    if (mine < theirs && b.gems === 0) return { kind: 'attack' };
    return { kind: 'hold', x: this.m.arena.mine.x, y: this.m.arena.mine.y + (b.team === 'blue' ? 140 : -140) };
  }
}
