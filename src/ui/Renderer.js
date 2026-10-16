import { BrawlerArt } from './BrawlerArt.js';

const TEAM = { blue: '#2f7bff', red: '#ff3b3b' };
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
    ctx.fillStyle = '#7a4fd0'; ctx.beginPath(); ctx.arc(a.mine.x, a.mine.y, T * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1a55'; ctx.beginPath(); ctx.arc(a.mine.x, a.mine.y, T * 0.4, 0, Math.PI * 2); ctx.fill();
    for (const g of m.mode.gems) Renderer.gem(ctx, g.x, g.y, 11);
    const walls = (pass) => { for (let y = 0; y < a.rows; y++) for (let x = 0; x < a.cols; x++) {
      const c = a.grid[y][x];
      if (pass === 0 && (c === '#' || c === 'W')) {
        ctx.fillStyle = c === '#' ? '#5a4632' : '#b5703a'; ctx.fillRect(x * T, y * T - 8, T, T + 8);
        ctx.fillStyle = c === '#' ? '#7a634a' : '#d68b4e'; ctx.fillRect(x * T + 2, y * T - 8, T - 4, T - 6);
        if (c === 'W') { ctx.strokeStyle = '#7a4520'; ctx.lineWidth = 2; ctx.strokeRect(x * T + 8, y * T, T - 16, T - 22); }
      }
      if (pass === 1 && c === 'B') { ctx.fillStyle = '#2f9e44cc'; ctx.beginPath();
        for (let i = 0; i < 4; i++) ctx.arc(x * T + 12 + (i % 2) * 24, y * T + 12 + (i >> 1) * 24, 16, 0, Math.PI * 2); ctx.fill(); }
    } };
    walls(0);
    // 조준선
    if (!p.dead && this.aimPreview) Renderer.aimLine(ctx, p, this.aimPreview);
    for (const b of m.brawlers) {
      if (b.dead || !m.visibleTo(b, p)) continue;
      const inBush = a.bushAt(b.x, b.y);
      ctx.globalAlpha = inBush ? 0.55 : 1;
      ctx.fillStyle = '#0003'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 18, 22, 9, 0, 0, Math.PI * 2); ctx.fill();
      BrawlerArt.draw(ctx, b.def, b.x, b.y, b.r * 0.85, b.aim, b === p ? '#3dff6e' : TEAM[b.team]);
      if (b.flash > 0) { ctx.fillStyle = '#fff8'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
      Renderer.bars(ctx, b, b === p ? '#3dff6e' : TEAM[b.team]);
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
  static aimLine(ctx, p, dir) {
    const a = p.def.attack; ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff';
    if (a.type === 'lob') { const pw = dir.power ?? 1; ctx.beginPath(); ctx.arc(p.x + dir.x * a.range * pw, p.y + dir.y * a.range * pw, a.radius, 0, 7); ctx.fill(); }
    else { const ang = Math.atan2(dir.y, dir.x), sp = (a.spread || 0.08) / 2; ctx.beginPath(); ctx.moveTo(p.x, p.y);
      ctx.arc(p.x, p.y, a.range, ang - sp, ang + sp); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  static gem(ctx, x, y, r) {
    ctx.fillStyle = '#c86bff'; ctx.strokeStyle = '#2b0a4a'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.8, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.8, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  static bars(ctx, b, col) {
    const w = 54, x = b.x - w / 2, y = b.y - b.r - 22;
    ctx.fillStyle = '#000'; ctx.fillRect(x - 2, y - 2, w + 4, 11);
    ctx.fillStyle = col; ctx.fillRect(x, y, w * Math.max(0, b.hp / b.def.hp), 7);
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(Math.ceil(b.hp), b.x, y - 4);
    if (b.isPlayer) { for (let i = 0; i < 3; i++) { ctx.fillStyle = '#000'; ctx.fillRect(x + i * 19 - 1, y + 12, 18, 6);
      const f = i < b.ammo ? 1 : i === b.ammo ? b.reloadT / b.def.reload : 0; ctx.fillStyle = '#ff9f1c'; ctx.fillRect(x + i * 19, y + 13, 16 * f, 4); } }
    if (b.gems) { Renderer.gem(ctx, b.x - 8, y - 24, 7); ctx.fillStyle = '#fff'; ctx.fillText(b.gems, b.x + 6, y - 20); }
  }
}
