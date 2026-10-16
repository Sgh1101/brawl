import { BrawlerArt } from './BrawlerArt.js';

// 경기 중 캐릭터 그리기 (유사 3D): 바닥 그림자 → 팀 색 고리 → 발 → 둥근 몸통(음영 + 위쪽 하이라이트 + 굵은 외곽선) → 눈.
// 그림만 다루고 게임 상태는 바꾸지 않음. 걷기 위상은 렌더 전용으로 WeakMap에 보관.
export class CharacterSprite {
  static OUTLINE = '#1a1206';
  static anim = new WeakMap();
  static step(b, dt) {
    const a = CharacterSprite.anim.get(b) || { phase: 0, moving: 0 };
    const speed = Math.hypot(b.vx || 0, b.vy || 0), moving = speed > 20 ? 1 : 0;
    a.moving += (moving - a.moving) * Math.min(1, dt * 10); // 걷기↔대기 부드럽게
    a.phase += dt * (moving ? 6 + speed / 60 : 0);
    CharacterSprite.anim.set(b, a); return a;
  }
  static shade(hex, k) { // k>0 밝게, k<0 어둡게
    const n = parseInt(hex.slice(1), 16), f = c => Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }
  // b: Brawler, team: 팀 색, t: 경기 시간, dt: 프레임 시간
  static draw(ctx, b, team, t, dt, front = false) {
    const a = CharacterSprite.step(b, dt), r = b.r * 0.85, def = b.def, w = a.moving;
    const walk = Math.sin(a.phase), breathe = Math.sin(t * 2.6 + b.uid);
    const lift = Math.abs(walk) * r * 0.22 * w;                          // 걸을 때 통통 튐
    const sy = 1 + (walk * walk - 0.5) * 0.12 * w + breathe * 0.035 * (1 - w); // 착지 때 눌림 / 대기 숨쉬기
    const sx = 2 - sy, aim = b.aim || { x: 0, y: -1 }, ang = Math.atan2(aim.y, aim.x);
    ctx.save(); ctx.translate(b.x, b.y);
    // 바닥 그림자 (점프 높이만큼 작고 옅게)
    const gy = r * 0.95, k = 1 - lift / (r * 0.6);
    const g = ctx.createRadialGradient(0, gy, 0, 0, gy, r * 1.25);
    g.addColorStop(0, `rgba(0,0,0,${0.38 * k})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, gy, r * 1.25 * (0.8 + 0.2 * k), r * 0.5, 0, 0, 7); ctx.fill();
    // 팀 색 고리 (그림자 위) + 바라보는 방향 표시
    // 위를 볼 때는 화살표가 몸통 뒤에 가려지므로 몸통 다음에 그림
    const back = aim.y < 0;
    if (team) { CharacterSprite.ring(ctx, team, r, gy, 0, 7);
      if (!back) CharacterSprite.facing(ctx, team, ang, r, gy); }
    // 발: 걸을 때 앞뒤로 엇갈림
    for (const s of [-1, 1]) {
      const swing = walk * s * r * 0.28 * w, fxp = s * r * 0.42 + Math.cos(ang) * swing, fyp = gy - r * 0.12 + Math.sin(ang) * swing * 0.5;
      ctx.fillStyle = CharacterSprite.shade(def.color, -0.55); ctx.strokeStyle = CharacterSprite.OUTLINE; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(fxp, fyp - Math.max(0, walk * s) * r * 0.15 * w, r * 0.26, r * 0.17, 0, 0, 7); ctx.fill(); ctx.stroke();
    }
    ctx.save();
    // 몸통: 위로 띄우고 눌림/늘어남 (발바닥 기준)
    ctx.translate(0, -lift - r * 0.15); ctx.translate(0, r); ctx.scale(sx, sy); ctx.translate(0, -r);
    const body = ctx.createLinearGradient(0, -r * 1.2, 0, r * 1.1);
    body.addColorStop(0, CharacterSprite.shade(def.color, 0.35)); body.addColorStop(0.45, def.color); body.addColorStop(1, CharacterSprite.shade(def.color, -0.45));
    BrawlerArt.shapePath(ctx, def.shape, r); ctx.fillStyle = body; ctx.fill();
    ctx.save(); ctx.clip();
    // 위쪽 초승달 하이라이트 (빛은 위에서)
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = r * 0.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, r * 0.35, r * 1.15, Math.PI * 1.22, Math.PI * 1.62); ctx.stroke();
    if (b.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(-r * 2, -r * 2, r * 4, r * 4); }
    ctx.restore();
    BrawlerArt.shapePath(ctx, def.shape, r); ctx.strokeStyle = CharacterSprite.OUTLINE; ctx.lineWidth = 3.5; ctx.stroke();
    if (def.shape === 'leaf') { ctx.strokeStyle = '#2d6a1e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r * 0.9); ctx.stroke(); }
    // 눈: 바라보는 쪽으로 쏠림 (몸통은 세워 둔 채)
    const ex = aim.x * r * 0.18, ey = aim.y * r * 0.12 - r * 0.2;
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = CharacterSprite.OUTLINE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(s * r * 0.32 + ex * 0.5, ey, r * 0.2, r * 0.24, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(s * r * 0.32 + ex, ey + aim.y * r * 0.06, r * 0.1, 0, 7); ctx.fill();
    }
    // 저격수 총구: 바라보는 방향으로
    if (def.shape === 'hex') { ctx.save(); ctx.rotate(ang + Math.PI / 2); ctx.fillStyle = '#333'; ctx.strokeStyle = CharacterSprite.OUTLINE; ctx.lineWidth = 2;
      ctx.fillRect(-r * 0.12, -r * 1.75, r * 0.24, r * 0.7); ctx.strokeRect(-r * 0.12, -r * 1.75, r * 0.24, r * 0.7); ctx.restore(); }
    ctx.restore();
    if (team && back) CharacterSprite.facing(ctx, team, ang, r, gy);
    if (team && front) { CharacterSprite.ring(ctx, team, r, gy, 0, Math.PI); CharacterSprite.facing(ctx, team, ang, r, gy); }
    ctx.restore();
  }
  // 팀 색 고리 (start~end 호). front일 땐 앞쪽 반원만 몸통 위에 한 번 더
  static ring(ctx, team, r, gy, start, end) {
    ctx.strokeStyle = team; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.ellipse(0, gy, r * 1.15, r * 0.45, 0, start, end); ctx.stroke();
  }
  // 바라보는 방향 화살표 (팀 색, 고리 위)
  static facing(ctx, team, ang, r, gy) {
    ctx.fillStyle = team; ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * r * 1.45, gy + Math.sin(ang) * r * 0.6); ctx.lineTo(Math.cos(ang + 0.35) * r * 1.1, gy + Math.sin(ang + 0.35) * r * 0.43);
    ctx.lineTo(Math.cos(ang - 0.35) * r * 1.1, gy + Math.sin(ang - 0.35) * r * 0.43); ctx.closePath(); ctx.fill();
  }
  // 반투명(수풀·흐림)으로 그릴 때: 한 장으로 그린 뒤 통째로 투명도를 줘서 몸통 아래 고리/화살표가 비쳐 섞이지 않게
  static layer = null;
  static drawFaded(ctx, b, team, t, dt, alpha, front = false) {
    const m = ctx.getTransform(), s = Math.hypot(m.a, m.b), S = Math.ceil(b.r * 5 * s);
    const L = CharacterSprite.layer ||= document.createElement('canvas');
    if (L.width < S) L.width = L.height = S;
    const c = L.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, S, S);
    c.setTransform(s, 0, 0, s, S / 2 - b.x * s, S / 2 - b.y * s);
    CharacterSprite.draw(c, b, team, t, dt, front);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha;
    ctx.drawImage(L, 0, 0, S, S, m.a * b.x + m.c * b.y + m.e - S / 2, m.b * b.x + m.d * b.y + m.f - S / 2, S, S); ctx.restore();
  }
  // 홈/트로피 로드 아이콘: 같은 그리기 경로, 팀 고리 없이. state를 넘기면 걷기/숨쉬기 상태가 이어짐
  static icon(ctx, def, x, y, r, aim = { x: 0, y: -1 }, t = 0, dt = 0, state = {}) {
    Object.assign(state, { def, x, y, r: r / 0.85, aim, vx: 0, vy: 0, flash: 0, uid: 0 });
    CharacterSprite.draw(ctx, state, null, t, dt);
  }
}
