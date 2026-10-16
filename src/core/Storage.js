// 로컬 진행도 저장 (트로피, 선택 캐릭터). 이후 레벨/상점 데이터도 여기에 추가.
export class Storage {
  static KEY = 'brawl.save.v1';
  static load() {
    try { return { trophies: 0, coins: 0, selected: 'bolder', ...JSON.parse(localStorage.getItem(Storage.KEY) || '{}') }; }
    catch { return { trophies: 0, coins: 0, selected: 'bolder' }; }
  }
  static save(data) { localStorage.setItem(Storage.KEY, JSON.stringify(data)); }
  static update(fn) { const d = Storage.load(); fn(d); Storage.save(d); return d; }
}
