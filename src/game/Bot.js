import { Vec } from '../core/Vec.js';

export class Bot {
  static EASY_MATCHES = 3;
  // 쉬운 판: 반응 느림, 덜 쏨, 조준 흔들림 큼, 먼저 쳐들어가지 않음
  static tuning(m) { return m.easy ? { react: 0.9, fire: 0.025, spread: 0.6, superP: 0.008, push: false } : { react: 0, fire: 0.06, spread: 0.25, superP: 0.02, push: true }; }
  static think(b, m, dt) {
    if (b.dead) return { x: 0, y: 0 };
    b.brain ??= { strafe: Math.random() < 0.5 ? 1 : -1, strafeT: 0, react: 0.3 + Math.random() * 0.3, seen: 0, stuckT: 0, last: { x: b.x, y: b.y } };
    const br = b.brain, k = Bot.tuning(m);
    const enemies = m.brawlers.filter(e => e.team !== b.team && !e.dead && m.visibleTo(e, b));
    let target = null, td = 1e9;
    const role = b.def.role;
    // 암살: 체력 낮은 적 우선 / 그 외: 가장 가까운 적
    const score = e => Vec.dist(b, e) * (role === '암살' ? 0.4 + e.hp / e.def.hp : 1);
    for (const e of enemies) { const d = score(e); if (d < td) { td = d; target = e; } }
    if (target) td = Vec.dist(b, target);
    if (role === '서포트') { const w = Bot.support(b, m, dt); if (w) return Bot.avoid(b, w, m, dt); }
    if (role === '암살' && k.push && target && b.superReady && td < b.def.superAtk.range * 0.9 && m.arena.lineClear(b, target)
        && target.hp < target.def.hp * 0.7) { m.weapons.superAttack(b, Vec.norm(target.x - b.x, target.y - b.y)); }
    const range = b.def.attack.range;
    let goal = m.mode.objectiveFor(b);
    if (!k.push && goal.kind === 'attack') goal = { kind: 'hold', x: m.arena.mine.x, y: m.arena.mine.y + (b.team === 'blue' ? 200 : -200) };
    if (b.hp < b.def.hp * 0.35 && target && td < range * 1.3) goal = { kind: 'retreat', x: b.spawn.x, y: b.spawn.y };
    let want = { x: 0, y: 0 };
    if (target && td < range * 1.1) {
      br.seen += dt;
      const isLob = b.def.attack.type === 'lob';
      if (br.seen > br.react + k.react && (isLob || m.arena.lineClear(b, target))) {
        const lead = (b.def.attack.speed ? td / b.def.attack.speed : b.def.attack.flight) * 0.6;
        const ax = target.x + (target.vx || 0) * lead - b.x, ay = target.y + (target.vy || 0) * lead - b.y;
        const dir = Vec.rot(Vec.norm(ax, ay), (Math.random() - 0.5) * k.spread);
        if (isLob) dir.power = Math.min(1, Math.hypot(ax, ay) / b.def.attack.range);
        if (b.superReady && Math.random() < k.superP) m.weapons.superAttack(b, dir);
        else if (b.ammo >= 1 && Math.random() < k.fire) m.weapons.attack(b, dir);
      }
      br.strafeT -= dt; if (br.strafeT <= 0) { br.strafeT = 0.6 + Math.random(); br.strafe *= -1; }
      const to = Vec.norm(target.x - b.x, target.y - b.y);
      const ideal = range * (role === '저격' ? 0.92 : role === '암살' ? 0.4 : 0.7), push = td > ideal ? 0.6 : -0.6;
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
  // 서포트: 다친 아군이 근처에 있으면 그쪽으로 붙어서 힐 탄/힐 슈퍼를 쏨
  static support(b, m, dt) {
    const hurt = m.brawlers.filter(a => a.team === b.team && a !== b && !a.dead && a.hp < a.def.hp * 0.75 && Vec.dist(a, b) < 650)
      .sort((p, q) => p.hp / p.def.hp - q.hp / q.def.hp)[0];
    if (!hurt) return null;
    const d = Vec.dist(b, hurt), dir = Vec.norm(hurt.x - b.x, hurt.y - b.y);
    if (d < b.def.attack.range * 0.9 && m.arena.lineClear(b, hurt)) {
      if (b.superReady && d < b.def.superAtk.range) m.weapons.superAttack(b, { ...dir, power: d / b.def.superAtk.range });
      else if (b.ammo >= 1 && Math.random() < 0.08) m.weapons.attack(b, dir);
    }
    return d > 220 ? dir : { x: -dir.y * b.brain.strafe * 0.5, y: dir.x * b.brain.strafe * 0.5 };
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
