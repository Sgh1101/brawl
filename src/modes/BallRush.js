import { Vec } from '../core/Vec.js';
import { COLORS } from '../ui/Renderer.js';

// 볼 러시 (3대3 공차기): 가운데 공을 주워 상대 골대에 넣기. 2골 먼저 넣으면 승리, 시간이 끝나면 골 많은 팀 승리(같으면 무승부).
// 맵의 U = 위쪽 골대(파랑 팀 골대, 빨강이 넣는 곳), D = 아래쪽 골대(빨강 팀 골대), O = 공 시작 위치.
export class BallRush {
  static GOAL = 2; static BALL_R = 12; static KICK = 700; static KICK_DIST = 170; static FRICTION = BallRush.KICK / BallRush.KICK_DIST; static PAUSE = 2; static REPICK = 0.4;
  // FRICTION: 속도가 매초 FRICTION 비율로 줄어 찬 공은 약 KICK / FRICTION = KICK_DIST(170px) 가고 멈춤
  static INTRO_TEXT = ['공을 주워 상대 골대에 넣어!', '공 들고 공격 = 차기 · 2골 먼저 넣으면 승리'];
  static DEATH_TIP = '죽으면 공을 떨어뜨려요';
  constructor(match) {
    const a = match.arena; this.m = match; this.gems = []; this.countdown = null;
    this.score = { blue: 0, red: 0 }; this.goalAt = null; this.scorer = null;
    this.goals = { U: [], D: [] };
    a.grid.forEach((row, y) => row.forEach((c, x) => {
      const p = { x: (x + 0.5) * a.T, y: (y + 0.5) * a.T };
      if (c === 'O') { this.center = p; row[x] = '.'; }
      if (c === 'U' || c === 'D') this.goals[c].push(p);
    }));
    this.ball = { x: 0, y: 0, vx: 0, vy: 0, carrier: null, kickedBy: null, kickT: 0 };
    BallRush.resetBall(this);
  }
  static resetBall(s) { Object.assign(s.ball, { x: s.center.x, y: s.center.y, vx: 0, vy: 0, carrier: null, kickedBy: null, kickT: 0 }); }
  // 팀이 공격하는 골대(상대 골대) 가운데
  static targetGoal(s, team) { const g = s.goals[team === 'blue' ? 'D' : 'U']; return { x: (g[0].x + g[g.length - 1].x) / 2, y: g[0].y }; }
  get focus() { return this.ball.carrier || this.ball; }
  teamGems() { return 0; }
  update(dt) {
    const m = this.m, a = m.arena, ball = this.ball, R = BallRush.BALL_R;
    if (this.goalAt !== null) { // 골 뒤 잠깐 멈췄다가 모두 제자리 + 공 가운데
      if (m.time - this.goalAt >= BallRush.PAUSE) { this.goalAt = null; for (const b of m.brawlers) { b.reset(); b.respawnT = 0; } BallRush.resetBall(this); }
      return;
    }
    ball.kickT -= dt;
    if (ball.carrier) {
      const c = ball.carrier, d = Vec.norm(c.aim.x, c.aim.y);
      ball.x = c.x + d.x * (c.r + 4); ball.y = c.y + d.y * (c.r + 4);
      if (a.circleHits(ball.x, ball.y, R)) { ball.x = c.x; ball.y = c.y; }
    } else {
      const f = Math.max(0, 1 - BallRush.FRICTION * dt);
      ball.vx *= f; ball.vy *= f;
      const nx = ball.x + ball.vx * dt, ny = ball.y + ball.vy * dt;
      if (a.circleHits(nx, ball.y, R)) ball.vx = -ball.vx * 0.7; else ball.x = nx;
      if (a.circleHits(ball.x, ny, R)) ball.vy = -ball.vy * 0.7; else ball.y = ny;
      for (const b of m.brawlers) {
        if (b.dead || b.dummy || (b === ball.kickedBy && ball.kickT > 0)) continue;
        if (Vec.dist(b, ball) < b.r + R) { ball.carrier = b; ball.vx = ball.vy = 0; break; }
      }
    }
    const tile = a.at(ball.x, ball.y);
    if (tile === 'U' || tile === 'D') { // 위(U)는 파랑 골대 → 빨강 득점
      this.scorer = tile === 'U' ? 'red' : 'blue'; this.score[this.scorer]++; this.goalAt = m.time;
      ball.carrier = null; ball.vx = ball.vy = 0;
    }
  }
  // 공 든 캐릭터의 일반 공격 = 조준 방향으로 차기 (true를 돌려주면 원래 공격은 안 나감)
  onAttack(b, dir) {
    const ball = this.ball;
    if (ball.carrier !== b) return false;
    if (b.cd > 0 || this.goalAt !== null) return true;
    const d = Vec.norm(dir.x, dir.y);
    Object.assign(ball, { carrier: null, vx: d.x * BallRush.KICK, vy: d.y * BallRush.KICK, kickedBy: b, kickT: BallRush.REPICK });
    b.cd = 0.35; b.lastAttack = this.m.time; b.aim = d; return true;
  }
  onDeath(b) { if (this.ball.carrier === b) { this.ball.carrier = null; this.ball.vx = this.ball.vy = 0; } }
  result() {
    for (const t of ['blue', 'red']) if (this.score[t] >= BallRush.GOAL && (this.goalAt === null || this.m.time - this.goalAt > 1)) return t;
    if (this.m.timeLeft <= 0 && this.goalAt === null) return this.score.blue > this.score.red ? 'blue' : this.score.red > this.score.blue ? 'red' : 'draw';
    return null;
  }
  // 봇: 공 들었으면 상대 골대로 달리다 가까우면 차기, 공이 떨어져 있으면 팀에서 가장 가까운 한 명이 주우러 감, 상대가 공을 들면 사거리까지 다가감. 그 밖엔 평소처럼 싸움(공 근처로)
  botControl(b) {
    const m = this.m, ball = this.ball;
    if (this.goalAt !== null) return null;
    if (ball.carrier === b) {
      const g = BallRush.targetGoal(this, b.team), d = Vec.dist(b, g);
      if (d < BallRush.KICK_DIST && m.arena.lineClear(b, g)) m.weapons.attack(b, Vec.norm(g.x - b.x, g.y - b.y));
      return Vec.norm(g.x - b.x, g.y - b.y);
    }
    if (ball.carrier && ball.carrier.team !== b.team && Vec.dist(b, ball.carrier) > b.def.attack.range * 0.8) return Vec.norm(ball.carrier.x - b.x, ball.carrier.y - b.y); // 상대가 공을 들면 막으러 감
    if (!ball.carrier) {
      const mates = m.brawlers.filter(o => o.team === b.team && !o.dead && !o.isPlayer).sort((p, q) => Vec.dist(p, ball) - Vec.dist(q, ball));
      if (mates[0] === b) return Vec.norm(ball.x - b.x, ball.y - b.y);
    }
    return null;
  }
  // 봇 조준: 공 든 적이 보이고 사거리 안이면 가장 가까운 적 대신 그 적을 노림
  preferTarget(b, enemies) { const c = this.ball.carrier; return c && c.team !== b.team && enemies.includes(c) && Vec.dist(b, c) <= b.def.attack.range ? c : null; }
  objectiveFor() { return { kind: 'hold', x: this.ball.x, y: this.ball.y }; }
  // 골대 칸 (팀 색으로 칠함, 바닥 위)
  drawWorld(ctx) {
    const T = this.m.arena.T, p = this.m.player;
    for (const [k, team] of [['U', 'blue'], ['D', 'red']]) {
      const col = team === p.team ? COLORS.ally : COLORS.enemy;
      for (const g of this.goals[k]) { ctx.fillStyle = col + '55'; ctx.fillRect(g.x - T / 2, g.y - T / 2, T, T);
        ctx.fillStyle = '#ffffff55'; for (let i = 0; i < 4; i++) ctx.fillRect(g.x - T / 2 + i * 12 + 4, g.y - T / 2, 2, T); }
    }
  }
  // 공 (수풀·캐릭터 위). 숨은 적이 들고 있으면 안 그림
  drawTop(ctx) {
    const ball = this.ball, m = this.m, R = BallRush.BALL_R;
    if (ball.carrier && !m.visibleTo(ball.carrier, m.player)) return;
    ctx.fillStyle = '#0004'; ctx.beginPath(); ctx.ellipse(ball.x, ball.y + R * 0.8, R, R * 0.45, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1a1206'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ball.x, ball.y, R, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1206'; ctx.beginPath(); ctx.arc(ball.x, ball.y, R * 0.38, 0, 7); ctx.fill();
  }
  // 결과 화면에 보일 최종 점수 (HUD와 같은 순서: 우리 팀 : 상대)
  resultSummary() { const mine = this.m.player.team, theirs = mine === 'blue' ? 'red' : 'blue'; return `${this.score[mine]} : ${this.score[theirs]}`; }
  // 위쪽 점수판: 우리 팀 골 : 상대 골 + 시계, 골 직후 "골!"
  board(ctx, W, m, clock, txt) {
    const bw = Math.min(300, W - 24), x0 = W / 2 - bw / 2, mine = m.player.team, theirs = mine === 'blue' ? 'red' : 'blue';
    ctx.fillStyle = '#000a'; ctx.beginPath(); ctx.roundRect(x0, 6, bw, 62, 16); ctx.fill();
    txt(clock, W / 2, 30, 20);
    txt(this.score[mine], W / 2 - bw * 0.3, 54, 36, '#7fb6ff'); txt(this.score[theirs], W / 2 + bw * 0.3, 54, 36, '#ff8a8a');
    txt(`/${BallRush.GOAL}`, W / 2, 58, 14, '#fffa');
    if (this.goalAt !== null) txt(this.scorer === mine ? '골!' : '실점!', W / 2, innerHeight * 0.62, 64, this.scorer === mine ? '#7dff9a' : '#ff4d4d');
  }
}
