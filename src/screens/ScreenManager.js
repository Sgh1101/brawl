// DOM 오버레이 화면 전환. 새 화면(컬렉션, 상점, 설정, 트로피 로드)은 render(root, app)만 구현하면 됨.
export class ScreenManager {
  constructor(root, app) { this.root = root; this.app = app; this.current = null; }
  show(screen, props = {}) { this.root.innerHTML = ''; this.current = screen; if (screen) screen.render(this.root, this.app, props); }
  static el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
}
