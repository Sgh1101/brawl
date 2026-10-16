import { Storage } from './Storage.js';
import { Brawlers } from '../data/Brawlers.js';
import { TrophyRoad } from '../data/TrophyRoad.js';

// 캐릭터별 트로피, 해금, 트로피 로드 보상. 모두 localStorage(Storage)에 저장.
export class Progress {
  static load() {
    const d = Storage.load();
    d.brawlerTrophies ??= {}; d.claimed ??= []; d.matches ??= 0;
    d.tutorialDone ??= d.matches > 0; // 이미 판을 해 본 세이브는 튜토리얼 완료로 봄
    if (d.trophies && !Object.keys(d.brawlerTrophies).length) d.brawlerTrophies[Brawlers.STARTERS[0]] = d.trophies; // v1 세이브 이전
    d.best = Math.max(d.best || 0, Progress.total(d)); // 최고 기록 트로피: 해금 기준 (옛 세이브는 현재 총합으로 이전)
    return d;
  }
  static trophiesOf(d, id) { return d.brawlerTrophies[id] || 0; }
  static total(d) { return Object.values(d.brawlerTrophies).reduce((s, n) => s + n, 0); }
  static isUnlocked(d, id) {
    if (Brawlers.STARTERS.includes(id)) return true;
    const m = TrophyRoad.milestones.find(x => x.unlock === id);
    return !!m && d.best >= m.at;
  }
  // 승리 +8 (캐릭터 트로피가 높을수록 줄어듦, 최소 +2), 패배 -4 (0 아래로는 안 내려감), 무승부 0
  static delta(trophies, result) {
    if (result === 'win') return Math.max(2, 8 - Math.floor(trophies / 100));
    if (result === 'lose') return -Math.min(4, trophies);
    return 0;
  }
  static applyResult(id, result) {
    const d = Progress.load(), before = d.best, cur = Progress.trophiesOf(d, id), delta = Progress.delta(cur, result);
    d.brawlerTrophies[id] = cur + delta; d.trophies = Progress.total(d); d.best = Math.max(d.best, d.trophies);
    const coins = result === 'win' ? 20 : 8;
    d.coins = (d.coins || 0) + coins; d.matches++;
    const unlocked = TrophyRoad.milestones.filter(m => m.unlock && m.at > before && m.at <= d.best).map(m => m.unlock);
    Storage.save(d);
    return { delta, coins, brawlerTrophies: d.brawlerTrophies[id], total: d.trophies, unlocked };
  }
  // 처음 몇 판은 봇이 덜 공격적 (Bot.EASY_MATCHES 판까지)
  static matchesPlayed() { return Progress.load().matches; }
  static completeTutorial() { const d = Progress.load(); d.tutorialDone = true; Storage.save(d); }
  static claim(at) {
    const d = Progress.load(), m = TrophyRoad.milestones.find(x => x.at === at);
    if (!m || d.claimed.includes(at) || d.best < at) return false;
    d.claimed.push(at); d.coins = (d.coins || 0) + (m.coins || 0); Storage.save(d); return true;
  }
}
