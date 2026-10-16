import { BrawlerArt } from './BrawlerArt.js';

// 색 규칙: 내 캐릭터 초록, 아군 파랑, 적 빨강. 보라는 젬 전용.
export const COLORS = { me: '#3dff6e', ally: '#2f7bff', enemy: '#ff3b3b' };
export class Renderer {
  constructor(canvas) { this.c = canvas; this.ctx = canvas.getContext('2d'); this.cam = { x: 0, y: 0, s: 1 }; }
  resize() { const d = devicePixelRatio || 1; this.c.width = innerWidth * d; this.c.height = innerHeight * d; this.dpr = d; }
  toWorld(sx, sy) { const { x, y, s } = this.cam; return { x: (sx - innerWidth / 2) / s + x, y: (sy - innerHeight / 2) / s + y }; }
  draw(m, input) {
    const ctx = this.ctx, a = m.arena, T = a.T, p = m.player;
    const s = Math.max(innerWidth, innerHeight * 1.3) / (15 * T);
    this.cam = { x: p.x, y: Math.max(innerHeight / 2 / s, Math.min(a.h - innerHeight / 2 / s, p.y - 40)), s };
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#16233f'; ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.save(); ctx.translate(innerWidth / 2, innerHeight / 2); ctx.scale(s, s); ctx.translate(-this.cam.x, -this.cam.y);
    // 바닥
    for (let y = 0; y < a.rows; y++) for (let x = 0; x < a.cols; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#e8c27a' : '#e2b96c'; ctx.fillRect(x * T, y * T, T, T); }
    Renderer.mine(ctx, a.mine, T, m.time, m.mode);
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
    const shown = m.brawlers.filter(b => !b.dead && m.visibleTo(b, p)), lift = Renderer.labelLift(shown);
    for (const b of shown) {
      const inBush = a.bushAt(b.x, b.y);
      ctx.globalAlpha = inBush ? 0.55 : 1;
      ctx.fillStyle = '#0003'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 18, 22, 9, 0, 0, Math.PI * 2); ctx.fill();
      BrawlerArt.draw(ctx, b.def, b.x, b.y, b.r * 0.85, b.aim, Renderer.teamColor(b, p));
      if (b.flash > 0) { ctx.fillStyle = '#fff8'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
      Renderer.bars(ctx, b, Renderer.teamColor(b, p), lift.get(b));
    }
    walls(1);
    for (const pr of m.weapons.projectiles) {
      ctx.fillStyle = pr.color; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      if (pr.lob) { ctx.fillStyle = '#0004'; ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, 7); ctx.fill(); ctx.fillStyle = pr.color;
        ctx.beginPath(); ctx.arc(pr.x, pr.y - pr.z, pr.r, 0, 7); ctx.fill(); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, 7); ctx.fill(); ctx.stroke(); }
    }
    for (const bl of m.weapons.blasts) { ctx.fillStyle = bl.color + '66'; ctx.beginPath(); ctx.arc(bl.x, bl.y, bl.r, 0, 7); ctx.fill(); }
    ctx.restore();
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
    const f = 1 - Math.max(0, mode.spawnT) / mode.constructor.SPAWN_EVERY;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, T * 0.95, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); ctx.stroke();
    Renderer.gem(ctx, p.x, p.y, 13 + pulse * 2);
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
  static labelLift(list) {
    const lift = new Map(), placed = [];
    for (const b of [...list].sort((p, q) => p.y - q.y)) {
      let L = b.y;
      for (const o of placed) if (Math.abs(o.x - b.x) < 62 && Math.abs(L - o.L) < 34) L = o.L - 34;
      placed.push({ x: b.x, L }); lift.set(b, L - b.y);
    }
    return lift;
  }
  static gem(ctx, x, y, r, glow = false) {
    if (glow) { ctx.fillStyle = '#e9b8ff66'; ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#c86bff'; ctx.strokeStyle = '#2b0a4a'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.8, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.8, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  static bars(ctx, b, col, lift = 0) {
    const w = 54, x = b.x - w / 2, y = b.y - b.r - 22 + lift;
    ctx.fillStyle = '#000'; ctx.fillRect(x - 2, y - 2, w + 4, 11);
    ctx.fillStyle = col; ctx.fillRect(x, y, w * Math.max(0, b.hp / b.def.hp), 7);
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(Math.ceil(b.hp), b.x, y - 4);
    if (b.isPlayer) { for (let i = 0; i < 3; i++) { ctx.fillStyle = '#000'; ctx.fillRect(x + i * 19 - 1, y + 12, 18, 6);
      const f = i < b.ammo ? 1 : i === b.ammo ? b.reloadT / b.def.reload : 0; ctx.fillStyle = '#ff9f1c'; ctx.fillRect(x + i * 19, y + 13, 16 * f, 4); } }
    if (b.gems) { Renderer.gem(ctx, b.x - 8, y - 24, 7); ctx.fillStyle = '#fff'; ctx.fillText(b.gems, b.x + 6, y - 20); }
  }
}
