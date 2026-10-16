// 벡터 도형으로 그리는 오리지널 캐릭터 아트
export class BrawlerArt {
  // 캐릭터 몸통 모양 경로 (중심 0,0, 반지름 r). 홈/로드 아이콘과 경기 중 스프라이트가 같이 씀
  static shapePath(ctx, shape, r) {
    ctx.beginPath();
    if (shape === 'square') ctx.roundRect(-r, -r, r * 2, r * 2, r / 3);
    else if (shape === 'diamond') { ctx.moveTo(0, -r * 1.2); ctx.lineTo(r, 0); ctx.lineTo(0, r * 1.1); ctx.lineTo(-r, 0); ctx.closePath(); }
    else if (shape === 'leaf') { ctx.moveTo(0, -r * 1.25); ctx.quadraticCurveTo(r * 1.3, -r * 0.2, 0, r * 1.05); ctx.quadraticCurveTo(-r * 1.3, -r * 0.2, 0, -r * 1.25); }
    else if (shape === 'bolt') { ctx.moveTo(-r * 0.2, -r * 1.25); ctx.lineTo(r * 0.95, -r * 0.1); ctx.lineTo(r * 0.25, r * 0.05);
      ctx.lineTo(r * 0.6, r * 1.1); ctx.lineTo(-r * 0.95, -r * 0.05); ctx.lineTo(-r * 0.25, -r * 0.2); ctx.closePath(); }
    else if (shape === 'hex') { for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 3; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r * 1.08, Math.sin(a) * r * 1.08); } ctx.closePath(); }
    else { ctx.moveTo(0, -r * 1.2); ctx.lineTo(r * 1.05, r * 0.85); ctx.lineTo(-r * 1.05, r * 0.85); ctx.closePath(); }
  }
  static draw(ctx, def, x, y, r, aim = { x: 0, y: -1 }, ring = null) {
    ctx.save(); ctx.translate(x, y);
    if (ring) { ctx.beginPath(); ctx.arc(0, 0, r + 5, 0, Math.PI * 2); ctx.fillStyle = ring; ctx.fill(); }
    ctx.rotate(Math.atan2(aim.y, aim.x) + Math.PI / 2);
    ctx.fillStyle = def.color; ctx.strokeStyle = '#000'; ctx.lineWidth = Math.max(2, r / 8);
    BrawlerArt.shapePath(ctx, def.shape, r);
    ctx.fill(); ctx.stroke();
    if (def.shape === 'leaf') { ctx.strokeStyle = '#2d6a1e'; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r * 0.9); ctx.stroke(); ctx.strokeStyle = '#000'; }
    if (def.shape === 'hex') { ctx.fillStyle = '#333'; ctx.fillRect(-r * 0.12, -r * 1.7, r * 0.24, r * 0.7); ctx.strokeRect(-r * 0.12, -r * 1.7, r * 0.24, r * 0.7); }
    // 눈
    ctx.fillStyle = '#fff';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * r * 0.32, -r * 0.2, r * 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#000';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * r * 0.32, -r * 0.28, r * 0.09, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
}
