import { Vec } from '../core/Vec.js';

export class Weapons {
  constructor(match) { this.m = match; this.projectiles = []; this.blasts = []; }
  attack(b, dir) {
    if (this.m.mode.onAttack?.(b, dir)) return true; // 모드가 공격을 가로챔 (예: 볼 러시에서 공 차기)
    if (!b.canAttack()) return false;
    b.ammo -= 1; b.cd = 0.35; b.lastAttack = this.m.time; b.aim = dir;
    this.fire(b, b.def.attack, dir, false); return true;
  }
  superAttack(b, dir) {
    if (b.dead || !b.superReady || b.dash) return false;
    b.superCharge = 0; b.lastAttack = this.m.time; b.aim = dir;
    this.fire(b, b.def.superAtk, dir, true); return true;
  }
  fire(b, a, dir, isSuper) {
    const mk = (d, extra = {}) => this.projectiles.push({ x: b.x + d.x * 24, y: b.y + d.y * 24, vx: d.x * a.speed, vy: d.y * a.speed,
      travelled: 0, range: a.range, dmg: a.dmg, team: b.team, owner: b, r: isSuper ? 10 : 7, hit: new Set(), color: b.def.color, heal: a.heal || 0, ...extra });
    if (a.type === 'bolt') mk(dir, { pierce: !!a.pierce, r: a.size || (isSuper ? 10 : 7) });
    else if (a.type === 'spread' || a.type === 'barrage') {
      const n = a.pellets || a.count;
      for (let i = 0; i < n; i++) mk(Vec.rot(dir, -a.spread / 2 + a.spread * i / (n - 1)), { pierce: !!a.pierce, breaks: isSuper });
    } else if (a.type === 'lob') {
      const tx = b.x + dir.x * a.range * (dir.power ?? 1), ty = b.y + dir.y * a.range * (dir.power ?? 1);
      this.projectiles.push({ lob: true, sx: b.x, sy: b.y, tx, ty, t: 0, dur: a.flight, x: b.x, y: b.y, radius: a.radius,
        dmg: a.dmg, heal: a.heal || 0, team: b.team, owner: b, breaks: !!a.breaksWalls, color: b.def.color, r: isSuper ? 14 : 9 });
    } else if (a.type === 'dash') {
      b.dash = { dir, left: a.range, dmg: a.dmg, speed: a.speed || 750, hit: new Set() };
    }
  }
  updateDash(b, dt) {
    const d = b.dash, step = Math.min(d.left, d.speed * dt);
    const arena = this.m.arena, T = arena.T;
    arena.breakRadius(b.x + d.dir.x * (b.r + 6), b.y + d.dir.y * (b.r + 6), 6);
    const ox = b.x, oy = b.y; b.moveBy(arena, d.dir.x * step, d.dir.y * step);
    d.left -= step;
    for (const e of this.m.brawlers) if (e.team !== b.team && !e.dead && !d.hit.has(e) && Vec.dist(e, b) < e.r + b.r + 6) {
      d.hit.add(e); e.damage(d.dmg, b, this.m);
    }
    if (d.left <= 0 || (Math.abs(b.x - ox) + Math.abs(b.y - oy) < 1)) {
      this.blasts.push({ x: b.x, y: b.y, r: 60, t: 0.3, color: b.def.color }); b.dash = null;
    }
  }
  update(dt) {
    const m = this.m, arena = m.arena;
    for (const p of this.projectiles) {
      if (p.lob) {
        p.t += dt; const k = Math.min(1, p.t / p.dur);
        p.x = p.sx + (p.tx - p.sx) * k; p.y = p.sy + (p.ty - p.sy) * k; p.z = Math.sin(k * Math.PI) * 80;
        if (k >= 1) {
          p.dead = true; this.blasts.push({ x: p.x, y: p.y, r: p.radius, t: 0.35, color: p.color });
          if (p.breaks) arena.breakRadius(p.x, p.y, p.radius);
          for (const e of m.brawlers) if (!e.dead && Vec.dist(e, p) < p.radius + e.r) {
            if (e.team !== p.team) e.damage(p.dmg, p.owner, m); else if (p.heal) e.heal(p.heal, p.owner);
          }
        }
        continue;
      }
      const sx = p.vx * dt, sy = p.vy * dt;
      p.x += sx; p.y += sy; p.travelled += Math.hypot(sx, sy);
      if (p.travelled >= p.range) { p.dead = true; continue; }
      if (arena.solidAt(p.x, p.y)) {
        // 부서지는 벽(W)만 뚫고, # 벽·맵 테두리에서는 사라짐
        if (!(p.breaks && arena.breakTile(Math.floor(p.x / arena.T), Math.floor(p.y / arena.T)))) { p.dead = true; continue; }
      }
      for (const e of m.brawlers) {
        if (e.dead || p.hit.has(e) || e === p.owner) continue;
        if (e.team === p.team) { // 힐 탄은 아군을 회복시키고 계속 날아감
          if (p.heal && e.hp < e.def.hp && Vec.dist(e, p) < e.r + p.r) { p.hit.add(e); e.heal(p.heal, p.owner); }
          continue;
        }
        if (Vec.dist(e, p) < e.r + p.r) { p.hit.add(e); e.damage(p.dmg, p.owner, m); if (!p.pierce) { p.dead = true; break; } }
      }
    }
    this.projectiles = this.projectiles.filter(p => !p.dead);
    for (const b of this.blasts) b.t -= dt;
    this.blasts = this.blasts.filter(b => b.t > 0);
  }
}
