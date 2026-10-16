import { ScreenManager } from './ScreenManager.js';
import { TrophyRoadScreen } from './TrophyRoadScreen.js';
import { Brawlers } from '../data/Brawlers.js';
import { Storage } from '../core/Storage.js';
import { Progress } from '../core/Progress.js';
import { Modes } from '../modes/Modes.js';
import { CharacterSprite } from '../ui/CharacterSprite.js';
import { TrophyRoad } from '../data/TrophyRoad.js';

// 홈/로비: 위 트로피·코인, 왼쪽 메뉴, 가운데 선택 캐릭터(대기 애니메이션), 아래 로스터, 오른쪽 아래 모드 + PLAY
export class HomeScreen {
  static render(root, app) {
    const save = Progress.load(), modeId = Modes.PLAYABLE.includes(save.mode) ? save.mode : 'gemGrab', mode = Modes.registry[modeId], total = Progress.total(save);
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
      <div class="bottomright"><button class="mode stroke bounce" id="mode">${mode.name} 🔄<small>${mode.desc}</small></button>
        <button class="btn play bounce" id="play">PLAY</button></div></div>`);
    root.appendChild(el);
    el.querySelectorAll('canvas[data-art]').forEach(c => CharacterSprite.icon(c.getContext('2d'), Brawlers.get(c.dataset.art), 48, 50, 28));
    HomeScreen.idle(el.querySelector('#hero'), def);
    el.querySelectorAll('.card:not(.locked)').forEach(c => c.onclick = () => { Storage.update(d => d.selected = c.dataset.id); app.screens.show(HomeScreen); });
    el.querySelector('#road').onclick = el.querySelector('#roadBtn').onclick = () => app.screens.show(TrophyRoadScreen);
    el.querySelector('#play').onclick = () => app.startMatch({ mode: modeId, playerBrawler: def.id });
    el.querySelector('#mode').onclick = () => { const L = Modes.PLAYABLE; Storage.update(d => d.mode = L[(L.indexOf(modeId) + 1) % L.length]); app.screens.show(HomeScreen); };
  }
  // 선택 캐릭터 대기 애니메이션: CharacterSprite 숨쉬기 + 두리번
  static idle(canvas, def) {
    const ctx = canvas.getContext('2d'), t0 = performance.now(), state = {};
    let last = t0;
    const loop = now => {
      if (!canvas.isConnected) return;
      const t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000), look = Math.sin(t * 0.9) * 0.35; last = now;
      ctx.clearRect(0, 0, 440, 440);
      CharacterSprite.icon(ctx, def, 220, 230, 110, { x: Math.sin(look), y: -Math.cos(look) }, t, dt, state);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
