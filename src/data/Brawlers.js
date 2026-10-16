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
    { id: 'mossy', name: 'Mossy', role: '서포트', color: '#7bd44a', shape: 'leaf',
      hp: 3300, speed: 180, reload: 1.4,
      attack: { type: 'bolt', range: 470, speed: 950, dmg: 700, heal: 650, pierce: true },
      superAtk: { type: 'lob', range: 420, radius: 140, dmg: 600, heal: 2200, flight: 0.6 }, superCost: 3000 },
    { id: 'flick', name: 'Flick', role: '암살', color: '#ff4f8b', shape: 'bolt',
      hp: 3000, speed: 205, reload: 1.1,
      attack: { type: 'spread', pellets: 2, spread: 0.18, range: 190, speed: 1000, dmg: 720 },
      superAtk: { type: 'dash', range: 420, dmg: 1100, speed: 1100 }, superCost: 2600 },
    { id: 'hawke', name: 'Hawke', role: '저격', color: '#f2d14b', shape: 'hex',
      hp: 2500, speed: 170, reload: 2.1,
      attack: { type: 'bolt', range: 780, speed: 1600, dmg: 1350 },
      superAtk: { type: 'bolt', range: 950, speed: 2000, dmg: 2600, pierce: true, size: 14 }, superCost: 3200 },
  ];
  static STARTERS = ['bolder', 'vexa', 'pogo'];
  static get(id) { return Brawlers.list.find(b => b.id === id) || Brawlers.list[0]; }
}
