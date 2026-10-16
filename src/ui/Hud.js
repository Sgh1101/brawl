import { Renderer, COLORS } from './Renderer.js';

export class Hud {
  static draw(ctx, m, input) {
    const W = innerWidth, mode = m.mode;
    ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#000';
    const txt = (t, x, y, size, col = '#fff') => { ctx.font = `900 ${size}px sans-serif`; ctx.strokeText(t, x, y); ctx.fillStyle = col; ctx.fillText(t, x, y); };
    const mm = Math.floor(m.timeLeft / 60), ss = String(Math.floor(m.timeLeft % 60)).padStart(2, '0');
    Hud.gemBoard(ctx, W, m, `${mm}:${ss}`, txt);
    Hud.intro(ctx, m, txt); Hud.tip(ctx, m, txt);
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
      Hud.superBtn(ctx, W - 70, innerHeight - 70, 44, p, txt); txt('E', W - 70, innerHeight - 124, 16);
      ctx.font = '600 13px sans-serif'; ctx.fillStyle = '#fffa'; ctx.textAlign = 'left';
      ctx.fillText('WASD 이동 · 클릭 공격 · E 슈퍼', 12, innerHeight - 14);
    }
  }
  // 위쪽 젬 점수판: 팀별 젬 수를 크게 + 목표(10) 막대
  static gemBoard(ctx, W, m, clock, txt) {
    const mode = m.mode;
    const G = mode.constructor.GOAL, bw = Math.min(440, W - 24), x0 = W / 2 - bw / 2;
    ctx.fillStyle = '#000a'; ctx.beginPath(); ctx.roundRect(x0, 6, bw, 70, 16); ctx.fill();
    txt(clock, W / 2, 34, 22);
    const mine = m.player.team, theirs = mine === 'blue' ? 'red' : 'blue';
    for (const [team, side, col, bg] of [[mine, -1, '#7fb6ff', COLORS.ally], [theirs, 1, '#ff8a8a', COLORS.enemy]]) {
      const n = mode.teamGems(team), cx = W / 2 + side * bw * 0.3;
      ctx.fillStyle = bg + '99'; ctx.beginPath(); ctx.roundRect(side < 0 ? x0 + 4 : W / 2 + bw * 0.1, 10, bw * 0.4 - 4, 62, 12); ctx.fill();
      Renderer.gem(ctx, cx - 30, 38, 16, true); txt(n, cx + 12, 52, 40, col);
      const barW = bw * 0.36, bx = W / 2 + (side < 0 ? -bw * 0.48 : bw * 0.12);
      ctx.fillStyle = '#ffffff22'; ctx.fillRect(bx, 66, barW, 5); ctx.fillStyle = col; ctx.fillRect(bx, 66, barW * Math.min(1, n / G), 5);
    }
    txt(`/${G}`, W / 2, 60, 14, '#fffa');
  }
  // 경기 시작 안내 (처음 7초 크게, 마지막 0.8초 페이드아웃)
  static INTRO = 7;
  static intro(ctx, m, txt) {
    if (m.time > Hud.INTRO) return;
    ctx.save(); ctx.globalAlpha = Math.min(1, (Hud.INTRO - m.time) / 0.8);
    const W = innerWidth, y = innerHeight * 0.36, size = Math.max(20, Math.min(40, W / 22));
    ctx.fillStyle = '#000b'; ctx.fillRect(0, y - size * 1.4, W, size * 2.9);
    txt('가운데에서 젬을 모아!', W / 2, y, size, '#e9b8ff');
    txt('10개 들고 15초 버티면 승리', W / 2, y + size * 1.2, size * 0.8, '#fff');
    ctx.restore();
  }
  // 짧은 팁: 처음 죽었을 때 / 처음 궁극기가 차기 시작할 때 (경기당 한 번씩, 3초)
  static TIP_SEC = 3;
  static tip(ctx, m, txt) {
    const p = m.player; m.tips ??= { shown: new Set(), text: null, until: 0 };
    const t = m.tips, show = (key, text) => { if (!t.shown.has(key)) { t.shown.add(key); t.text = text; t.until = m.time + Hud.TIP_SEC; } };
    if (p.dead) show('death', '죽으면 젬을 떨어뜨려요');
    else if (p.superCharge > 0 && m.time > Hud.INTRO) show('super', '적을 맞히면 궁극기가 차요');
    if (!t.text || m.time > t.until) return;
    const W = innerWidth, y = Renderer.HUD_TOP + 90, size = Math.max(16, Math.min(26, W / 32));
    ctx.save(); ctx.globalAlpha = Math.min(1, (t.until - m.time) / 0.5);
    ctx.font = `900 ${size}px sans-serif`; const w = ctx.measureText(t.text).width + 40;
    ctx.fillStyle = '#000b'; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2, y - size * 1.1, w, size * 1.7, 12); ctx.fill();
    txt('💡 ' + t.text, W / 2, y + size * 0.15, size, '#ffe28a'); ctx.restore();
  }
  // 슈퍼 버튼: 번개 아이콘 + 충전 고리. 충전 전에도 아이콘이 흐리게 보임
  static superBtn(ctx, x, y, r, p, txt) {
    const ready = p.superReady, c = Math.min(1, p.superCharge || 0);
    ctx.fillStyle = ready ? '#ffb000' : '#1b1b2acc'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ffffff33'; ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.arc(x, y, r * 0.88, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x, y, r * 0.88, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * c); ctx.stroke();
    const s = r * 0.5; ctx.fillStyle = ready ? '#fff' : '#ffd23f88'; ctx.beginPath();
    ctx.moveTo(x + s * 0.15, y - s); ctx.lineTo(x - s * 0.55, y + s * 0.12); ctx.lineTo(x - s * 0.02, y + s * 0.12);
    ctx.lineTo(x - s * 0.15, y + s); ctx.lineTo(x + s * 0.55, y - s * 0.12); ctx.lineTo(x + s * 0.02, y - s * 0.12); ctx.closePath(); ctx.fill();
    // 충전 %는 버튼 안쪽 아래에 (위로 띄우면 모바일에서 캐릭터와 겹침)
    if (ready) txt('SUPER!', x, y + r * 0.8, Math.max(11, r * 0.3), '#fff'); else txt(`${Math.floor(c * 100)}%`, x, y + r * 0.78, Math.max(10, r * 0.3), '#fff');
  }
}
