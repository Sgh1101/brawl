// 오리지널 캐릭터 정의. 슈퍼셀 이름/디자인 사용 금지.
export class Brawlers {
  static list = [
    { id: 'bolder', name: 'Bolder', role: '탱커', color: '#e07a2e', shape: 'square',
      hp: 5600, speed: 170, reload: 1.5,
      attack: { type: 'spread', pellets: 5, spread: 0.5, range: 230, speed: 900, dmg: 320 },
      superAtk: { type: 'dash', range: 330, dmg: 1400 }, superCost: 4500 },
    { id: 'vexa', name: 'Vexa', role: '원거리', color: '#3fc7c7', shape: 'diamond',
      hp: 3100, speed: 185, reload: 1.3,
      attack: { type: 'bolt', range: 520, speed: 1100, dmg: 1000 },
      superAtk: { type: 'barrage', count: 5, spread: 0.35, range: 600, speed: 1200, dmg: 900, pierce: true }, superCost: 3500 },
    { id: 'pogo', name: 'Pogo', role: '투척', color: '#9b5de5', shape: 'triangle',
      hp: 2900, speed: 175, reload: 1.7,
      attack: { type: 'lob', range: 400, radius: 70, dmg: 1100, flight: 0.7 },
      superAtk: { type: 'lob', range: 450, radius: 130, dmg: 1800, flight: 0.9, breaksWalls: true }, superCost: 3800 },
  ];
  static get(id) { return Brawlers.list.find(b => b.id === id) || Brawlers.list[0]; }
}
