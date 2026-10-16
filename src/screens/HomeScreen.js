import { ScreenManager } from './ScreenManager.js';
import { Brawlers } from '../data/Brawlers.js';
import { Storage } from '../core/Storage.js';
import { Modes } from '../modes/Modes.js';
import { BrawlerArt } from '../ui/BrawlerArt.js';

// 홈/로비: 왼쪽 위 프로필·트로피, 오른쪽 위 재화, 왼쪽 메뉴, 가운데 선택 캐릭터, 오른쪽 아래 모드 + PLAY
export class HomeScreen {
  static render(root, app) {
    const save = Storage.load(), def = Brawlers.get(save.selected), mode = Modes.registry.gemGrab;
    const el = ScreenManager.el(`<div class="screen" id="home">
      <div class="topbar"><div class="profile stroke">🏆 ${save.trophies}</div>
        <div class="currency"><span class="stroke">🪙 ${save.coins}</span></div></div>
      <div class="side">
        <button class="btn gray disabled" title="곧 추가">상점</button>
        <button class="btn gray disabled" title="곧 추가">캐릭터</button>
        <button class="btn gray disabled" title="곧 추가">설정</button></div>
      <div class="center"><canvas width="440" height="440"></canvas>
        <div class="bname stroke">${def.name}</div><div class="stroke">${def.role}</div>
        <div class="roster">${Brawlers.list.map(b => `<div class="card ${b.id === def.id ? 'sel' : ''}" data-id="${b.id}">${b.name}<br>${b.role}</div>`).join('')}</div></div>
      <div class="bottomright"><div class="mode stroke">${mode.name}<small>${mode.desc}</small></div>
        <button class="btn play" id="play">PLAY</button></div></div>`);
    root.appendChild(el);
    const ctx = el.querySelector('canvas').getContext('2d');
    BrawlerArt.draw(ctx, def, 220, 230, 120, { x: 0, y: -1 });
    el.querySelectorAll('.card').forEach(c => c.onclick = () => { Storage.update(d => d.selected = c.dataset.id); app.screens.show(HomeScreen); });
    el.querySelector('#play').onclick = () => app.startMatch({ mode: 'gemGrab', playerBrawler: def.id });
  }
}
