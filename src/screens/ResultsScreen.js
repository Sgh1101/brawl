import { ScreenManager } from './ScreenManager.js';
import { Brawlers } from '../data/Brawlers.js';

export class ResultsScreen {
  static LOCK_MS = 1200;
  static render(root, app, { result, trophyDelta, forfeit = false, coins = 0, stats, unlocked = [] }) {
    const [cls, label] = result === 'win' ? ['win', '승리!'] : result === 'lose' ? ['lose', '패배'] : ['draw', '무승부'];
    const el = ScreenManager.el(`<div class="screen results">
      <h1 class="stroke ${cls}">${label}</h1>${forfeit ? '<div class="note">경기를 나가서 패배 처리됐어요</div>' : ''}
      <div class="stroke">🏆 ${trophyDelta >= 0 ? "+" : ""}${Math.abs(trophyDelta) === 0 ? 0 : trophyDelta} · 🪙 +${coins} · 처치 ${stats.kills} · 사망 ${stats.deaths}</div>
      ${result === 'lose' && trophyDelta === 0 ? '<div class="note">트로피 0에서는 안 깎여요</div>' : ''}
      ${unlocked.map(id => `<div class="unlock stroke">🔓 새 캐릭터 해금: ${Brawlers.get(id).name}</div>`).join('')}
      <div class="row"><button class="btn blue" id="again">다시 하기</button><button class="btn gray" id="home">홈</button></div></div>`);
    root.appendChild(el);
    // 경기 중 연타하던 클릭/탭이 결과 화면 버튼에 바로 눌리지 않게 잠깐 잠금
    const btns = el.querySelectorAll('.row .btn'); btns.forEach(b => b.disabled = true);
    setTimeout(() => btns.forEach(b => b.disabled = false), ResultsScreen.LOCK_MS);
    el.querySelector('#again').onclick = () => app.startMatch(app.lastOpts);
    el.querySelector('#home').onclick = () => app.goHome();
  }
}
