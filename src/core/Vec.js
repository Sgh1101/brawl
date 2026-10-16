export class Vec {
  static len(x, y) { return Math.hypot(x, y); }
  static dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  static norm(x, y) { const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l }; }
  static rot(v, a) { const c = Math.cos(a), s = Math.sin(a); return { x: v.x * c - v.y * s, y: v.x * s + v.y * c }; }
  static clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
}
