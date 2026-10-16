import { Arena } from './Arena.js';
import { Brawler } from './Brawler.js';
import { Weapons } from './Weapons.js';
import { Bot } from './Bot.js';
import { Maps } from '../data/Maps.js';
import { Brawlers } from '../data/Brawlers.js';
import { Modes } from '../modes/Modes.js';

export class Match {
  static DURATION = 150; // 2분 30초
  constructor({ mode = 'gemGrab', playerBrawler = 'bolder', easy = false }) {
    this.easy = easy; // 처음 몇 판: 봇이 덜 공격적
    const tutorial = mode === 'tutorial';
    this.arena = new Arena(tutorial ? Maps.practice : Maps.gemGrab);
    this.time = 0; this.timeLeft = Match.DURATION; this.over = null; this.stats = { kills: 0, deaths: 0 };
    this.weapons = new Weapons(this);
    const ids = Brawlers.list.map(b => b.id), shuffle = a => [...a].sort(() => Math.random() - 0.5);
    const blue = [playerBrawler, ...shuffle(ids.filter(i => i !== playerBrawler)).slice(0, 2)], red = shuffle(ids).slice(0, 3);
    this.brawlers = tutorial ? [new Brawler(playerBrawler, 'blue', this.arena.spawns.blue[0], true)] : [
      ...blue.map((id, i) => new Brawler(id, 'blue', this.arena.spawns.blue[i], i === 0)),
      ...red.map((id, i) => new Brawler(id, 'red', this.arena.spawns.red[i])),
    ];
    this.feed = []; // 처치 알림: { killer, victim, t }
    this.player = this.brawlers[0];
    this.mode = Modes.create(mode, this);
  }
  visibleTo(target, viewer) {
    if (target.team === viewer.team) return true;
    if (!this.arena.bushAt(target.x, target.y)) return true;
    if (this.time - target.lastAttack < 1 || this.time - target.lastHurt < 0.5) return true;
    return this.brawlers.some(v => v.team === viewer.team && !v.dead && Math.hypot(v.x - target.x, v.y - target.y) < 110);
  }
  onDeath(b, killer) {
    this.mode.onDeath(b);
    if (killer && killer !== b) this.feed.push({ killer, victim: b, t: this.time });
    if (b === this.player) this.stats.deaths++;
    if (killer === this.player) this.stats.kills++;
  }
  update(dt, playerMove) {
    if (this.over) return;
    this.time += dt; this.timeLeft = Math.max(0, Match.DURATION - this.time);
    for (const b of this.brawlers) {
      const move = b === this.player ? playerMove : b.dummy ? { x: 0, y: 0 } : Bot.think(b, this, dt);
      const ox = b.x, oy = b.y;
      b.update(dt, this, move);
      b.vx = (b.x - ox) / dt; b.vy = (b.y - oy) / dt;
    }
    this.weapons.update(dt);
    this.mode.update(dt);
    const r = this.mode.result();
    if (r) this.over = { winner: r, playerWon: r === this.player.team };
  }
}
