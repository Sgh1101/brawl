import { Vec } from '../core/Vec.js';

export class Bot {
  static think(b, m, dt) {
    if (b.dead) return { x: 0, y: 0 };
    b.brain ??= { strafe: Math.random() < 0.5 ? 1 : -1, strafeT: 0, react: 0.3 + Math.random() * 0.3, seen: 0, stuckT: 0, last: { x: b.x, y: b.y } };
    const br = b.brain;
    const enemies = m.brawlers.filter(e => e.team !== b.team && !e.dead && m.visibleTo(e, b));
    let target = null, td = 1e9;
    for (const e of enemies) { const d = Vec.dist(b, e); if (d < td) { td = d; target = e; } }
    const range = b.def.attack.range;
    let goal = m.mode.objectiveFor(b);
    if (b.hp < b.def.hp * 0.35 && target && td < range * 1.3) goal = { kind: 'retreat', x: b.spawn.x, y: b.spawn.y };
    let want = { x: 0, y: 0 };
    if (target && td < range * 1.1) {
      br.seen += dt;
      const isLob = b.def.attack.type === 'lob';
      if (br.seen > br.react && (isLob || m.arena.lineClear(b, target))) {
        const lead = (b.def.attack.speed ? td / b.def.attack.speed : b.def.attack.flight) * 0.6;
        const ax = target.x + (target.vx || 0) * lead - b.x, ay = target.y + (target.vy || 0) * lead - b.y;
        const dir = Vec.rot(Vec.norm(ax, ay), (Math.random() - 0.5) * 0.25);
        if (isLob) dir.power = Math.min(1, Math.hypot(ax, ay) / b.def.attack.range);
        if (b.superReady && Math.random() < 0.02) m.weapons.superAttack(b, dir);
        else if (b.ammo >= 1 && Math.random() < 0.06) m.weapons.attack(b, dir);
      }
      br.strafeT -= dt; if (br.strafeT <= 0) { br.strafeT = 0.6 + Math.random(); br.strafe *= -1; }
      const to = Vec.norm(target.x - b.x, target.y - b.y);
      const ideal = range * 0.7, push = td > ideal ? 0.6 : -0.6;
      want = { x: to.x * push - to.y * br.strafe, y: to.y * push + to.x * br.strafe };
      if (goal.kind === 'collect' || goal.kind === 'retreat') want = Bot.toward(b, goal, m, 0.7, want);
    } else {
      br.seen = 0;
      if (goal.kind === 'attack') {
        const any = m.brawlers.filter(e => e.team !== b.team && !e.dead).sort((p, q) => Vec.dist(b, p) - Vec.dist(b, q))[0];
        goal = any ? { x: any.x, y: any.y } : { x: m.arena.mine.x, y: m.arena.mine.y };
      }
      want = Bot.toward(b, goal, m, 1);
    }
    return Bot.avoid(b, want, m, dt);
  }
  static toward(b, g, m, w, base = { x: 0, y: 0 }) {
    const d = Math.hypot(g.x - b.x, g.y - b.y);
    if (d < 20) return base;
    return { x: base.x * (1 - w) + (g.x - b.x) / d * w, y: base.y * (1 - w) + (g.y - b.y) / d * w };
  }
  // 막히면 가장 가까운 열린 방향으로 비켜감
  static avoid(b, want, m, dt) {
    const l = Math.hypot(want.x, want.y); if (l < 0.01) return { x: 0, y: 0 };
    const dir = { x: want.x / l, y: want.y / l };
    for (const a of [0, 0.5, -0.5, 1, -1, 1.6, -1.6, 2.3, -2.3]) {
      const v = Vec.rot(dir, a * (b.brain.strafe));
      if (!m.arena.circleHits(b.x + v.x * 40, b.y + v.y * 40, b.r)) return v;
    }
    return dir;
  }
}
