import { Match } from './game/Match.js';
import { Bot } from './game/Bot.js';
import { Input } from './ui/Input.js';
import { Renderer } from './ui/Renderer.js';
import { Hud } from './ui/Hud.js';
import { Vec } from './core/Vec.js';
import { Progress } from './core/Progress.js';
import { ScreenManager } from './screens/ScreenManager.js';
import { HomeScreen } from './screens/HomeScreen.js';
import { ResultsScreen } from './screens/ResultsScreen.js';

class App {
  constructor() {
    this.canvas = document.getElementById('game');
    this.renderer = new Renderer(this.canvas); this.input = new Input(this.canvas);
    this.screens = new ScreenManager(document.getElementById('screens'), this);
    this.match = null; this.last = performance.now();
    addEventListener('resize', () => this.renderer.resize()); this.renderer.resize();
    this.canvas.tabIndex = 0; // 키 입력이 바로 먹도록 경기 시작 시 캔버스에 포커스
    // 경기 중 페이지를 떠나는 경로(뒤로 가기 버튼/제스처, 새로고침, 탭 닫기)는 결과 없이 홈으로 돌아가므로 막거나 확인을 받음
    addEventListener('beforeunload', e => { if (this.match) { e.preventDefault(); e.returnValue = ''; } });
    addEventListener('popstate', () => {
      if (!this.match) return;
      if (confirm('경기를 나갈까요? 나가면 패배로 처리돼요.')) this.forfeit(); else history.pushState({ inMatch: true }, '');
    });
    this.goHome(); requestAnimationFrame(t => this.frame(t));
  }
  goHome() { this.match = null; this.screens.show(HomeScreen); }
  startMatch(opts) {
    if (!history.state?.inMatch) history.pushState({ inMatch: true }, '');
    this.lastOpts = opts; this.match = new Match({ ...opts, easy: Progress.matchesPlayed() < Bot.EASY_MATCHES }); this.input.drain(); this.screens.show(null); this.canvas.focus({ preventScroll: true }); }
  // 경기 포기: 결과 화면을 거쳐서 나감 (결과 없이 홈으로 가는 길을 없앰)
  forfeit() { const m = this.match; if (!m || m.over) return; m.over = { winner: m.player.team === 'blue' ? 'red' : 'blue', playerWon: false, forfeit: true }; }
  aimDir(isSuper = false) {
    const p = this.match.player, s = this.input.sticks.aim;
    if (s && s.mag > 0.25) return { x: s.dx, y: s.dy, power: s.mag };
    if (this.input.touch) return null;
    const w = this.renderer.toWorld(this.input.mouse.x, this.input.mouse.y);
    const d = Vec.norm(w.x - p.x, w.y - p.y), range = (isSuper ? p.def.superAtk.range : p.def.attack.range) || 1;
    return { ...d, power: Math.min(1, Math.hypot(w.x - p.x, w.y - p.y) / range) };
  }
  autoAim(isSuper = false) {
    const m = this.match, p = m.player;
    const t = m.brawlers.filter(e => e.team !== p.team && !e.dead && m.visibleTo(e, p)).sort((a, b) => Vec.dist(a, p) - Vec.dist(b, p))[0];
    if (!t) return { ...p.aim, power: 1 };
    const range = (isSuper ? p.def.superAtk.range : p.def.attack.range) || 1;
    return { ...Vec.norm(t.x - p.x, t.y - p.y), power: Math.min(1, Vec.dist(t, p) / range) };
  }
  frame(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t;
    const m = this.match;
    if (m) {
      const aim = this.aimDir();
      for (const e of this.input.drain()) {
        if (e.type === 'super') m.weapons.superAttack(m.player, this.aimDir(true) || this.autoAim(true));
        if (e.type === 'fire') m.weapons.attack(m.player, e.auto ? this.autoAim() : e.dir);
      }
      if (!this.input.touch && this.input.mouse.down && aim) m.weapons.attack(m.player, aim);
      if (aim && !m.player.dash) m.player.aim = aim;
      this.renderer.aimPreview = aim;
      m.update(dt, this.input.moveVector());
      this.renderer.draw(m, this.input); Hud.draw(this.renderer.ctx, m, this.input);
      if (m.over) this.finish(m);
    } else {
      const ctx = this.renderer.ctx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    requestAnimationFrame(tt => this.frame(tt));
  }
  finish(m) {
    const result = m.over.winner === 'draw' ? 'draw' : m.over.playerWon ? 'win' : 'lose';
    const r = Progress.applyResult(m.player.def.id, result);
    this.match = null;
    if (history.state?.inMatch) history.replaceState(null, '');
    this.screens.show(ResultsScreen, { result, trophyDelta: r.delta, forfeit: !!m.over.forfeit, coins: r.coins, unlocked: r.unlocked, stats: m.stats });
  }
}
window.app = new App();
