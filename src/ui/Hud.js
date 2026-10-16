import { Renderer } from './Renderer.js';

export class Hud {
  static draw(ctx, m, input) {
    const W = innerWidth, mode = m.mode;
    ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#000';
    const txt = (t, x, y, size, col = '#fff') => { ctx.font = `900 ${size}px sans-serif`; ctx.strokeText(t, x, y); ctx.fillStyle = col; ctx.fillText(t, x, y); };
    const mm = Math.floor(m.timeLeft / 60), ss = String(Math.floor(m.timeLeft % 60)).padStart(2, '0');
    ctx.fillStyle = '#0008'; ctx.beginPath(); ctx.roundRect(W / 2 - 150, 8, 300, 56, 12); ctx.fill();
    txt(`${mm}:${ss}`, W / 2, 46, 26);
    Renderer.gem(ctx, W / 2 - 110, 36, 12); txt(mode.teamGems('blue'), W / 2 - 80, 46, 26, '#5aa0ff');
    Renderer.gem(ctx, W / 2 + 110, 36, 12); txt(mode.teamGems('red'), W / 2 + 80, 46, 26, '#ff6b6b');
    if (mode.countdown !== null) txt(`${mode.leader === m.player.team ? '승리까지' : '패배까지'} ${Math.ceil(mode.countdown)}`, W / 2, 96, 28, mode.leader === m.player.team ? '#7dff9a' : '#ff6b6b');
    if (m.player.dead) txt(`부활 ${Math.ceil(m.player.respawnT)}`, W / 2, innerHeight / 2, 40);
    const p = m.player;
    if (input.touch) {
      const L = input.layout();
      for (const k of ['move', 'aim']) { const s = input.sticks[k], base = s ? s.base : L[k];
        ctx.fillStyle = '#ffffff22'; ctx.beginPath(); ctx.arc(base.x, base.y, L.R, 0, 7); ctx.fill();
        ctx.fillStyle = k === 'aim' ? '#ffb000aa' : '#ffffff88';
        ctx.beginPath(); ctx.arc(base.x + (s ? s.dx * s.mag * L.R : 0), base.y + (s ? s.dy * s.mag * L.R : 0), L.R * 0.42, 0, 7); ctx.fill(); }
      Hud.superBtn(ctx, L.sup.x, L.sup.y, L.R * 0.7, p, txt);
    } else {
      Hud.superBtn(ctx, W - 70, innerHeight - 70, 44, p, txt); txt('E', W - 70, innerHeight - 62, 22);
      ctx.font = '600 13px sans-serif'; ctx.fillStyle = '#fffa'; ctx.textAlign = 'left';
      ctx.fillText('WASD 이동 · 클릭 공격 · E 슈퍼', 12, innerHeight - 14);
    }
  }
  static superBtn(ctx, x, y, r, p, txt) {
    ctx.fillStyle = '#000a'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.fillStyle = p.superReady ? '#ffd23f' : '#ffd23f66';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.superCharge); ctx.closePath(); ctx.fill();
    if (p.superReady) txt('SUPER', x, y - r - 8, 14, '#ffd23f');
  }
}
