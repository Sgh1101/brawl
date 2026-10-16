// 타일 맵: # 벽, W 부서지는 벽, B 수풀, G 젬 광산, r/b 스폰. 위쪽 절반만 적고 아래로 대칭.
export class Maps {
  static T = 48;
  static gemGrab = {
    id: 'crystal-pit', name: 'Crystal Pit',
    half: [
      '#####################',
      '#.......r.r.r.......#',
      '#...................#',
      '#..BBB.........BBB..#',
      '#..BBB...WWW...BBB..#',
      '#.......#...#.......#',
      '#..WW...........WW..#',
      '#..WW..BBBBBBB..WW..#',
      '#.......BBBBB.......#',
      '#BB...............BB#',
      '#BB...##.....##...BB#',
      '#.....W.......W.....#',
      '#..BB...........BB..#',
      '#..BB.....W.....BB..#',
      '#......W.....W......#',
      '#...................#',
    ],
    center: '#.........G.........#',
  };
  static build(def) {
    const swap = r => r.replace(/r/g, 'b');
    return [...def.half, def.center, ...def.half.slice().reverse().map(swap)];
  }
}
