import { ScreenManager } from './ScreenManager.js';
import { TrophyRoadScreen } from './TrophyRoadScreen.js';
import { Brawlers } from '../data/Brawlers.js';
import { Storage } from '../core/Storage.js';
import { Progress } from '../core/Progress.js';
import { Modes } from '../modes/Modes.js';
import { BrawlerArt } from '../ui/BrawlerArt.js';
import { TrophyRoad } from '../data/TrophyRoad.js';

// 홈/로비: 위 트로피·코인, 왼쪽 메뉴, 가운데 선택 캐릭터(대기 애니메이션), 아래 로스터, 오른쪽 아래 모드 + PLAY
export class HomeScreen {
  static render(root, app) {
    const save = Progress.load(), mode = Modes.registry.gemGrab, total = Progress.total(save);
    let def = Brawlers.get(save.selected);
    if (!Progress.isUnlocked(save, def.id)) def = Brawlers.get(Brawlers.STARTERS[0]);
    const next = TrophyRoad.milestones.find(m => m.at > total);
    const card = b => {
      const open = Progress.isUnlocked(save, b.id), need = TrophyRoad.milestones.find(m => m.unlock === b.id);
      return `<button class="card bounce ${b.id === def.id ? 'sel' : ''} ${open ? '' : 'locked'}" data-id="${b.id}" ${open ? '' : 'disabled'}>
        <canvas width="96" height="96" data-art="${b.id}"></canvas><b>${b.name}</b>
        <small>${open ? `🏆 ${Progress.trophiesOf(save, b.id)} · ${b.role}` : `🔒 🏆${need?.at}`}</small></button>`;
    };
    const el = ScreenManager.el(`<div class="screen" id="home">
      <div class="topbar">
        <button class="pill trophy bounce" id="road">🏆 <b>${total}</b>${next ? `<i style="--p:${Math.min(1, total / next.at)}"></i>` : ''}</button>
        <div class="pill coin">🪙 <b>${save.coins || 0}</b></div></div>
      <div class="side">
        <button class="btn yellow bounce" id="roadBtn">트로피 로드</button>
</div>
      <div class="center"><canvas id="hero" width="440" height="440"></canvas>
        <div class="bname stroke">${def.name}</div><div class="brole stroke">${def.role} · 🏆 ${Progress.trophiesOf(save, def.id)}</div></div>
      <div class="roster">${Brawlers.list.map(card).join('')}</div>
      <div class="bottomright"><div class="mode stroke">${mode.name}<small>${mode.desc}</small></div>
        <button class="btn play bounce" id="play">PLAY</button></div></div>`);
    root.appendChild(el);
    el.querySelectorAll('canvas[data-art]').forEach(c => BrawlerArt.draw(c.getContext('2d'), Brawlers.get(c.dataset.art), 48, 52, 28, { x: 0, y: -1 }));
    HomeScreen.idle(el.querySelector('#hero'), def);
    el.querySelectorAll('.card:not(.locked)').forEach(c => c.onclick = () => { Storage.update(d => d.selected = c.dataset.id); app.screens.show(HomeScreen); });
    el.querySelector('#road').onclick = el.querySelector('#roadBtn').onclick = () => app.screens.show(TrophyRoadScreen);
    el.querySelector('#play').onclick = () => app.startMatch({ mode: 'gemGrab', playerBrawler: def.id });
  }
  // 선택 캐릭터 대기 애니메이션: 숨쉬기(위아래 + 살짝 찌그러짐) + 두리번
  static idle(canvas, def) {
    const ctx = canvas.getContext('2d'), t0 = performance.now();
    const loop = now => {
      if (!canvas.isConnected) return;
      const t = (now - t0) / 1000, bob = Math.sin(t * 3), look = Math.sin(t * 0.9) * 0.35;
      ctx.clearRect(0, 0, 440, 440);
      ctx.fillStyle = '#0004'; ctx.beginPath(); ctx.ellipse(220, 380, 110 - bob * 8, 22, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(220, 240 - bob * 10); ctx.scale(1 + bob * 0.03, 1 - bob * 0.03);
      BrawlerArt.draw(ctx, def, 0, 0, 110, { x: Math.sin(look), y: -Math.cos(look) }); ctx.restore();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
