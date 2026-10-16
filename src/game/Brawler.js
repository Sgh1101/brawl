import { Brawlers } from '../data/Brawlers.js';

export class Brawler {
  static nextId = 1;
  constructor(defId, team, spawn, isPlayer = false) {
    this.uid = Brawler.nextId++;
    this.def = Brawlers.get(defId); this.team = team; this.spawn = spawn; this.isPlayer = isPlayer;
    this.r = 22; this.gems = 0; this.superCharge = 0;
    this.aim = { x: 0, y: team === 'blue' ? -1 : 1 };
    this.reset();
  }
  reset() {
    this.x = this.spawn.x; this.y = this.spawn.y; this.hp = this.def.hp; this.ammo = 3;
    this.reloadT = 0; this.cd = 0; this.dead = false; this.respawnT = 0;
    this.lastHurt = -99; this.lastAttack = -99; this.dash = null; this.flash = 0;
  }
  get superReady() { return this.superCharge >= 1; }
  canAttack() { return !this.dead && this.ammo >= 1 && this.cd <= 0 && !this.dash; }
  update(dt, match, move) {
    if (this.dead) { this.respawnT -= dt; if (this.respawnT <= 0) this.reset(); return; }
    this.cd -= dt; this.flash -= dt;
    if (this.ammo < 3) { this.reloadT += dt; if (this.reloadT >= this.def.reload) { this.reloadT = 0; this.ammo++; } }
    if (match.time - Math.max(this.lastHurt, this.lastAttack) > 3 && this.hp < this.def.hp)
      this.hp = Math.min(this.def.hp, this.hp + this.def.hp * 0.13 * dt);
    if (this.dash) return match.weapons.updateDash(this, dt);
    const speed = this.def.speed * 1.4;
    this.moveBy(match.arena, move.x * speed * dt, move.y * speed * dt);
  }
  moveBy(arena, dx, dy) {
    if (!arena.circleHits(this.x + dx, this.y, this.r)) this.x += dx;
    if (!arena.circleHits(this.x, this.y + dy, this.r)) this.y += dy;
  }
  damage(amount, source, match) {
    if (this.dead) return;
    this.hp -= amount; this.lastHurt = match.time; this.flash = 0.12;
    if (source && !source.dead) source.superCharge = Math.min(1, source.superCharge + amount / source.def.superCost);
    if (this.hp <= 0) { this.dead = true; this.respawnT = 4; this.dash = null; match.onDeath(this, source); }
  }
}
