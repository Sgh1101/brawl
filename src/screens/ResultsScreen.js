import { ScreenManager } from './ScreenManager.js';
import { HomeScreen } from './HomeScreen.js';

export class ResultsScreen {
  static render(root, app, { result, trophyDelta, stats }) {
    const [cls, label] = result === 'win' ? ['win', '승리!'] : result === 'lose' ? ['lose', '패배'] : ['draw', '무승부'];
    const el = ScreenManager.el(`<div class="screen results">
      <h1 class="stroke ${cls}">${label}</h1>
      <div class="stroke">🏆 ${trophyDelta >= 0 ? '+' : ''}${trophyDelta} · 처치 ${stats.kills} · 사망 ${stats.deaths}</div>
      <div class="row"><button class="btn blue" id="again">다시 하기</button><button class="btn gray" id="home">홈</button></div></div>`);
    root.appendChild(el);
    el.querySelector('#again').onclick = () => app.startMatch(app.lastOpts);
    el.querySelector('#home').onclick = () => app.goHome();
  }
}
