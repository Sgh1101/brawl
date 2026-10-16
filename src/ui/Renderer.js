import { CharacterSprite } from './CharacterSprite.js';

// 색 규칙: 내 캐릭터 초록, 아군 파랑, 적 빨강. 보라는 젬 전용.
export const COLORS = { me: '#3dff6e', ally: '#2f7bff', enemy: '#ff3b3b' };
export class Renderer {
  constructor(canvas) { this.c = canvas; this.ctx = canvas.getContext('2d'); this.cam = { x: 0, y: 0, s: 1 }; }
  resize() { const d = devicePixelRatio || 1; this.c.width = innerWidth * d; this.c.height = innerHeight * d; this.dpr = d; }
  toWorld(sx, sy) { const { x, y, s, cy } = this.cam; return { x: (sx - innerWidth / 2) / s + x, y: (sy - cy) / s + y }; }
  static HUD_TOP = 80; // 위 점수판 높이: 화면 중심을 그만큼 아래로 내려 맵이 점수판에 덜 가리게
  // 카메라: 짧은 가로 화면에선 세로로 9칸 이상 보이게 줌아웃. 플레이어를 화면 안에 두면서 focus(젬 광산, 연습장에선 현재 목표) 쪽으로 당김.
  static camera(p, a, T, focus = a.mine) {
    const W = innerWidth, H = innerHeight, s = Math.min(W / (15 * T), H / (9 * T)), cy = (H + Renderer.HUD_TOP) / 2;
    const viewUp = (cy - Renderer.HUD_TOP) / s, viewDown = (H - cy) / s, margin = 70;
    const pull = Math.max(-(viewDown - margin), Math.min(viewUp - margin, (focus ? focus.y - p.y : 0) * 0.5));
    const y = Math.max(viewUp, Math.min(a.h - viewDown, p.y + pull));
    const x = Math.max(W / 2 / s, Math.min(a.w - W / 2 / s, p.x));
    return { x: a.w < W / s ? a.w / 2 : x, y, s, cy };
  }
  draw(m, input) {
    this.frameDt = Math.max(0, Math.min(0.05, m.time - (this.lastT ?? m.time))); this.lastT = m.time;
    const ctx = this.ctx, a = m.arena, T = a.T, p = m.player;
    this.cam = Renderer.camera(p, a, T, m.mode.focus ?? a.mine); const s = this.cam.s;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#16233f'; ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.save(); ctx.translate(innerWidth / 2, this.cam.cy); ctx.scale(s, s); ctx.translate(-this.cam.x, -this.cam.y);
    // 바닥
    for (let y = 0; y < a.rows; y++) for (let x = 0; x < a.cols; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#e8c27a' : '#e2b96c'; ctx.fillRect(x * T, y * T, T, T); }
    if (a.mine) Renderer.mine(ctx, a.mine, T, m.time, m.mode);
    m.mode.drawWorld?.(ctx);
    for (const g of m.mode.gems) Renderer.gem(ctx, g.x, g.y + Math.sin(m.time * 4 + g.x) * 2, 15, true);
    const walls = (pass) => { for (let y = 0; y < a.rows; y++) for (let x = 0; x < a.cols; x++) {
      const c = a.grid[y][x];
      if (pass === 0 && c === '#') {
        ctx.fillStyle = '#5a4632'; ctx.fillRect(x * T, y * T - 8, T, T + 8);
        ctx.fillStyle = '#7a634a'; ctx.fillRect(x * T + 2, y * T - 8, T - 4, T - 6);
      }
      if (pass === 0 && c === 'W') Renderer.fence(ctx, x * T, y * T, T);
      if (pass === 1 && c === 'B') { ctx.fillStyle = '#2f9e44cc'; ctx.beginPath();
        for (let i = 0; i < 4; i++) ctx.arc(x * T + 12 + (i % 2) * 24, y * T + 12 + (i >> 1) * 24, 16, 0, Math.PI * 2); ctx.fill(); }
    } };
    walls(0);
    // 조준선
    if (!p.dead && this.aimPreview) Renderer.aimLine(ctx, p, this.aimPreview);
    // 적이 젬 4개 이상 들고 있으면 수풀 안에서도 흐리게 보임 (그림만, 봇 판단엔 영향 없음)
    const shown = m.brawlers.filter(b => !b.dead && (m.visibleTo(b, p) || b.gems >= Renderer.CARRIER_GLOW)), lift = Renderer.labelLift(shown);
    for (const b of shown) {
      const inBush = a.bushAt(b.x, b.y), ghost = !m.visibleTo(b, p);
      const alpha = ghost ? 0.3 : inBush ? 0.55 : 1;
      if (alpha < 1) CharacterSprite.drawFaded(ctx, b, Renderer.teamColor(b, p), m.time, this.frameDt, alpha);
      else CharacterSprite.draw(ctx, b, Renderer.teamColor(b, p), m.time, this.frameDt);
    }
    walls(1);
    // 수풀 속 나/아군: 수풀 위에 반투명으로 한 번 더 그려서 늘 보이게 (몸통만 반투명, 팀 고리는 불투명 + 테두리) (적은 위 규칙대로 숨김/드러남)
    for (const b of shown) if (b.team === p.team && Renderer.touchesBush(a, b)) CharacterSprite.drawInBush(ctx, b, Renderer.teamColor(b, p), m.time, Renderer.BUSH_ALLY_ALPHA);
    if (a.mine) Renderer.mineRing(ctx, a.mine, T, m.mode); // 다음 젬 타이머 고리는 수풀 위에
    // 체력 막대·젬 수는 캐릭터/수풀 다 그린 뒤 맨 위에 (가려지지 않게)
    for (const b of [...shown.filter(o => o !== p), ...shown.filter(o => o === p)]) { // 내 라벨은 맨 마지막(맨 위)
      ctx.globalAlpha = m.visibleTo(b, p) ? 1 : 0.5; Renderer.bars(ctx, b, Renderer.teamColor(b, p), lift.get(b), b.team !== p.team); }
    ctx.globalAlpha = 1;
    for (const pr of m.weapons.projectiles) {
      ctx.fillStyle = pr.color; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      if (pr.lob) { ctx.fillStyle = '#0004'; ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, 7); ctx.fill(); ctx.fillStyle = pr.color;
        ctx.beginPath(); ctx.arc(pr.x, pr.y - pr.z, pr.r, 0, 7); ctx.fill(); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, 7); ctx.fill(); ctx.stroke(); }
    }
    for (const bl of m.weapons.blasts) { ctx.fillStyle = bl.color + '66'; ctx.beginPath(); ctx.arc(bl.x, bl.y, bl.r, 0, 7); ctx.fill(); }
    ctx.restore();
    if (a.mine) Renderer.mineArrow(ctx, this.cam, a.mine, m.time);
  }
  static teamColor(b, p) { return b === p ? COLORS.me : b.team === p.team ? COLORS.ally : COLORS.enemy; }
  static aimLine(ctx, p, dir) {
    const a = p.def.attack; ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff';
    if (a.type === 'lob') { const pw = dir.power ?? 1; ctx.beginPath(); ctx.arc(p.x + dir.x * a.range * pw, p.y + dir.y * a.range * pw, a.radius, 0, 7); ctx.fill(); }
    else { const ang = Math.atan2(dir.y, dir.x), sp = (a.spread || 0.08) / 2; ctx.beginPath(); ctx.moveTo(p.x, p.y);
      ctx.arc(p.x, p.y, a.range, ang - sp, ang + sp); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  // 젬 광산: 늘 보이는 보라 고리 + 맥동하는 빛 + 다음 젬까지 남은 시간 고리
  static mine(ctx, p, T, t, mode) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, T * 2.2);
    g.addColorStop(0, `rgba(200,107,255,${0.55 + pulse * 0.25})`); g.addColorStop(1, 'rgba(200,107,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, T * 2.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a1f73'; ctx.beginPath(); ctx.arc(p.x, p.y, T * 0.75, 0, 7); ctx.fill();
    ctx.strokeStyle = '#e3b5ff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(p.x, p.y, T * 0.75, 0, 7); ctx.stroke();
    Renderer.gem(ctx, p.x, p.y, 13 + pulse * 2);
  }
  static CARRIER_GLOW = 4;
  static BUSH_ALLY_ALPHA = 0.5;
  // 캐릭터(몸통~팀 고리 아래끝)가 수풀 칸에 조금이라도 걸치면 true. 수풀 그림은 칸보다 4px 넓게 그려지므로 그만큼 여유.
  // 중심이 수풀 밖인 가장자리에서도 수풀이 고리를 덮으니 다시 그려야 함
  static touchesBush(a, b) {
    const T = a.T, m = 4, x0 = b.x - b.r - m, x1 = b.x + b.r + m, y0 = b.y - b.r * 1.2 - m, y1 = b.y + b.r * 1.25 + m;
    for (let y = Math.floor(y0 / T) * T; y <= y1; y += T) for (let x = Math.floor(x0 / T) * T; x <= x1; x += T) if (a.bushAt(x + 1, y + 1)) return true;
    return false;
  }
  // 광산이 화면 밖이면 화면 가장자리(점수판 아래)에 방향 표시 + 젬 아이콘
  static mineArrow(ctx, cam, mine, t) {
    const W = innerWidth, H = innerHeight, sx = W / 2 + (mine.x - cam.x) * cam.s, sy = cam.cy + (mine.y - cam.y) * cam.s;
    const top = Renderer.HUD_TOP + 26, pad = 30;
    if (sx > pad && sx < W - pad && sy > top && sy < H - pad) return;
    const x = Math.max(pad, Math.min(W - pad, sx)), y = Math.max(top, Math.min(H - pad, sy)), ang = Math.atan2(sy - y, sx - x) || -Math.PI / 2;
    const bob = Math.sin(t * 5) * 3;
    ctx.save(); ctx.translate(x + Math.cos(ang) * bob, y + Math.sin(ang) * bob);
    ctx.fillStyle = '#000a'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.fill();
    ctx.rotate(ang); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(19, -8); ctx.lineTo(19, 8); ctx.closePath(); ctx.fill();
    ctx.restore(); Renderer.gem(ctx, x, y, 11, true);
  }
  static mineRing(ctx, p, T, mode) {
    const f = 1 - Math.max(0, mode.spawnT) / mode.constructor.SPAWN_EVERY;
    ctx.strokeStyle = '#0006'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(p.x, p.y, T * 0.95, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(p.x, p.y, T * 0.95, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); ctx.stroke();
  }
  // 부서지는 벽(W): 나무 울타리 (일반 공격으론 안 부서지고 슈퍼로만 부서짐)
  static fence(ctx, x, y, T) {
    ctx.fillStyle = '#0003'; ctx.fillRect(x + 2, y + T - 10, T - 4, 8);
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(x, y + 6, T, 7); ctx.fillRect(x, y + 24, T, 7);
    for (let i = 0; i < 3; i++) { const px = x + 3 + i * 15;
      ctx.fillStyle = '#c98a4b'; ctx.beginPath(); ctx.moveTo(px, y + T - 6); ctx.lineTo(px, y - 4); ctx.lineTo(px + 6, y - 11); ctx.lineTo(px + 12, y - 4); ctx.lineTo(px + 12, y + T - 6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#5e3a17'; ctx.lineWidth = 2; ctx.stroke(); }
  }
  // 체력 숫자 겹침 방지: 가까운 캐릭터끼리는 아래쪽 캐릭터 막대를 위로 올림
  // 체력 숫자 겹침 방지: 가까운 캐릭터끼리 막대(+젬 수) 블록이 겹치면 아래쪽 캐릭터 블록을 위로 올림
  static labelLift(list) {
    const lift = new Map(), placed = [], h = b => 34 + (b.gems ? 34 : 0);
    for (const b of [...list].sort((p, q) => p.y - q.y)) {
      let L = b.y;
      for (let pass = 0; pass < 3; pass++) for (const o of placed)
        if (Math.abs(o.x - b.x) < 66 && L - h(b) < o.L && L > o.L - o.h) L = o.L - o.h;
      placed.push({ x: b.x, L, h: h(b) }); lift.set(b, L - b.y);
    }
    return lift;
  }
  static gem(ctx, x, y, r, glow = false) {
    if (glow) { ctx.fillStyle = '#e9b8ff66'; ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#c86bff'; ctx.strokeStyle = '#2b0a4a'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.8, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.8, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  static bars(ctx, b, col, lift = 0, enemy = false) {
    const w = 54, x = b.x - w / 2, y = b.y - b.r - 22 + lift;
    ctx.fillStyle = '#000'; ctx.fillRect(x - 2, y - 2, w + 4, 11);
    ctx.fillStyle = col; ctx.fillRect(x, y, w * Math.max(0, b.hp / b.def.hp), 7);
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(Math.ceil(b.hp), b.x, y - 4);
    if (b.isPlayer) { for (let i = 0; i < 3; i++) { ctx.fillStyle = '#000'; ctx.fillRect(x + i * 19 - 1, y + 12, 18, 6);
      const f = i < b.ammo ? 1 : i === b.ammo ? b.reloadT / b.def.reload : 0; ctx.fillStyle = '#ff9f1c'; ctx.fillRect(x + i * 19, y + 13, 16 * f, 4); } }
    if (b.gems) { // 젬 수: 적은 크게(눈에 띄게), 아군/나는 보통
      const big = enemy ? 1.5 : 1, gy = y - 16 - 12 * big;
      Renderer.gem(ctx, b.x - 10 * big, gy - 4 * big, 8 * big, enemy);
      ctx.font = `900 ${Math.round(15 * big)}px sans-serif`; ctx.textAlign = 'left'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
      ctx.strokeText(b.gems, b.x + 2, gy + 2 * big); ctx.fillStyle = enemy ? '#ffdede' : '#fff'; ctx.fillText(b.gems, b.x + 2, gy + 2 * big); ctx.textAlign = 'center'; }
  }
}
