import { Maps } from '../data/Maps.js';

export class Arena {
  constructor(def) {
    this.T = Maps.T;
    this.grid = Maps.build(def).map(r => r.split(''));
    this.rows = this.grid.length; this.cols = this.grid[0].length;
    this.w = this.cols * this.T; this.h = this.rows * this.T;
    this.spawns = { blue: [], red: [] }; this.mine = null;
    this.grid.forEach((row, y) => row.forEach((c, x) => {
      const p = { x: (x + 0.5) * this.T, y: (y + 0.5) * this.T };
      if (c === 'b') { this.spawns.blue.push(p); row[x] = '.'; }
      if (c === 'r') { this.spawns.red.push(p); row[x] = '.'; }
      if (c === 'G') { this.mine = p; }
    }));
  }
  tile(tx, ty) { return (ty < 0 || tx < 0 || ty >= this.rows || tx >= this.cols) ? '#' : this.grid[ty][tx]; }
  at(x, y) { return this.tile(Math.floor(x / this.T), Math.floor(y / this.T)); }
  static solid(c) { return c === '#' || c === 'W'; }
  solidAt(x, y) { return Arena.solid(this.at(x, y)); }
  bushAt(x, y) { return this.at(x, y) === 'B'; }
  circleHits(x, y, r) {
    const T = this.T;
    for (let ty = Math.floor((y - r) / T); ty <= Math.floor((y + r) / T); ty++)
      for (let tx = Math.floor((x - r) / T); tx <= Math.floor((x + r) / T); tx++) {
        if (!Arena.solid(this.tile(tx, ty))) continue;
        const cx = Math.max(tx * T, Math.min(x, tx * T + T)), cy = Math.max(ty * T, Math.min(y, ty * T + T));
        if ((cx - x) ** 2 + (cy - y) ** 2 < r * r) return { tx, ty };
      }
    return null;
  }
  breakTile(tx, ty) { if (this.tile(tx, ty) === 'W') { this.grid[ty][tx] = '.'; return true; } return false; }
  breakRadius(x, y, r) {
    const T = this.T;
    for (let ty = Math.floor((y - r) / T); ty <= Math.floor((y + r) / T); ty++)
      for (let tx = Math.floor((x - r) / T); tx <= Math.floor((x + r) / T); tx++)
        if (Math.hypot((tx + 0.5) * T - x, (ty + 0.5) * T - y) < r + T / 2) this.breakTile(tx, ty);
  }
  lineClear(a, b) {
    const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.ceil(d / 12);
    for (let i = 1; i < n; i++) if (this.solidAt(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n)) return false;
    return true;
  }
}
