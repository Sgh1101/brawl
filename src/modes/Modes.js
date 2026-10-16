import { GemGrab } from './GemGrab.js';
import { Tutorial } from './Tutorial.js';
import { BallRush } from './BallRush.js';
// 모드 레지스트리. Showdown / Brawl Ball / Bounty 는 같은 인터페이스로 추가:
// constructor(match), update(dt), onDeath(brawler), result() -> 'blue'|'red'|'draw'|null, hud(ctx, ...)
export class Modes {
  static registry = { gemGrab: { name: 'Gem Grab', desc: '젬 10개를 모아 버텨라', cls: GemGrab, map: 'gemGrab' },
    ballRush: { name: '볼 러시', desc: '공을 차 넣어 2골 먼저', cls: BallRush, map: 'ballRush' },
    tutorial: { name: '연습', desc: '', cls: Tutorial, map: 'practice' } };
  static PLAYABLE = ['gemGrab', 'ballRush']; // 홈에서 고를 수 있는 모드 (순서대로 돌아감)
  static create(id, match) { return new Modes.registry[id].cls(match); }
}
