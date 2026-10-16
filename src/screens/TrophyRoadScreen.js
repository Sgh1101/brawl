import { ScreenManager } from './ScreenManager.js';
import { TrophyRoad } from '../data/TrophyRoad.js';
import { Brawlers } from '../data/Brawlers.js';
import { Progress } from '../core/Progress.js';
import { BrawlerArt } from '../ui/BrawlerArt.js';

// 트로피 로드: 총 트로피 구간별 보상(코인 수령) + 캐릭터 해금
export class TrophyRoadScreen {
  static render(root, app) {
    const d = Progress.load(), total = Progress.total(d), ms = TrophyRoad.milestones;
    // 노드가 같은 간격이라 막대도 구간별로 채움 (노드 i 의 중심 = (i + 0.5) / n)
    let fill = 0; ms.forEach((m, i) => { const prev = i ? ms[i - 1].at : 0;
      if (total >= m.at) fill = i + 0.5; else if (total > prev) fill = Math.max(fill, (i ? i - 0.5 : 0) + (total - prev) / (m.at - prev) * (i ? 1 : 0.5)); });
    const node = m => {
      const reached = Math.max(d.best || 0, total) >= m.at, claimed = d.claimed.includes(m.at);
      const reward = m.unlock ? `<canvas width="80" height="80" data-art="${m.unlock}"></canvas><b>${Brawlers.get(m.unlock).name}</b><small>${reached ? '해금됨' : '새 캐릭터'}</small>`
        : `<div class="big">🪙</div><b>${m.coins}</b><small>코인</small>`;
      const action = m.unlock ? '' : claimed ? '<span class="done">받음 ✓</span>'
        : reached ? `<button class="btn yellow small bounce" data-claim="${m.at}">받기</button>` : '';
      return `<div class="node ${reached ? 'on' : ''}"><div class="at stroke">🏆 ${m.at}</div><div class="reward">${reward}</div>${action}</div>`;
    };
    const el = ScreenManager.el(`<div class="screen road">
      <div class="topbar"><button class="btn blue bounce" id="back">◀ 홈</button>
        <h2 class="stroke">트로피 로드</h2><div class="pill trophy">🏆 <b>${total}</b></div><div class="pill trophy">⭐ 최고 <b>${d.best}</b></div></div>
      <div class="track"><div class="bar"><i style="width:${Math.min(100, fill / ms.length * 100)}%"></i></div>
        <div class="nodes">${TrophyRoad.milestones.map(node).join('')}</div></div></div>`);
    root.appendChild(el);
    el.querySelectorAll('canvas[data-art]').forEach(c => {
      const ctx = c.getContext('2d'); if (Math.max(d.best || 0, total) < TrophyRoad.milestones.find(m => m.unlock === c.dataset.art).at) ctx.filter = 'brightness(0.15)';
      BrawlerArt.draw(ctx, Brawlers.get(c.dataset.art), 40, 44, 24, { x: 0, y: -1 });
    });
    el.querySelectorAll('[data-claim]').forEach(b => b.onclick = () => { Progress.claim(+b.dataset.claim); app.screens.show(TrophyRoadScreen); });
    el.querySelector('#back').onclick = () => app.goHome();
  }
}
