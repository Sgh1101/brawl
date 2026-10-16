// 트로피 로드 구간: 총 트로피가 at 이상이면 도달. coins 는 수령 버튼으로 받고, unlock 캐릭터는 도달 즉시 해금.
export class TrophyRoad {
  static milestones = [
    { at: 10, coins: 50 },
    { at: 25, unlock: 'mossy' },
    { at: 40, coins: 100 },
    { at: 60, unlock: 'flick' },
    { at: 80, coins: 150 },
    { at: 100, unlock: 'hawke' },
    { at: 130, coins: 200 },
    { at: 170, coins: 300 },
    { at: 220, coins: 500 },
  ];
}
