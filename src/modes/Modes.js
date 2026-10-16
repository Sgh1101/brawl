import { GemGrab } from './GemGrab.js';
import { Tutorial } from './Tutorial.js';
// 모드 레지스트리. Showdown / Brawl Ball / Bounty 는 같은 인터페이스로 추가:
// constructor(match), update(dt), onDeath(brawler), result() -> 'blue'|'red'|'draw'|null, hud(ctx, ...)
export class Modes {
  static registry = { gemGrab: { name: 'Gem Grab', desc: '젬 10개를 모아 버텨라', cls: GemGrab },
    tutorial: { name: '연습', desc: '', cls: Tutorial } };
  static create(id, match) { return new Modes.registry[id].cls(match); }
}
