// 벡터 도형으로 그리는 오리지널 캐릭터 아트
export class BrawlerArt {
  static draw(ctx, def, x, y, r, aim = { x: 0, y: -1 }, ring = null) {
    ctx.save(); ctx.translate(x, y);
    if (ring) { ctx.beginPath(); ctx.arc(0, 0, r + 5, 0, Math.PI * 2); ctx.fillStyle = ring; ctx.fill(); }
    ctx.rotate(Math.atan2(aim.y, aim.x) + Math.PI / 2);
    ctx.fillStyle = def.color; ctx.strokeStyle = '#000'; ctx.lineWidth = Math.max(2, r / 8);
    ctx.beginPath();
    if (def.shape === 'square') ctx.roundRect(-r, -r, r * 2, r * 2, r / 3);
    else if (def.shape === 'diamond') { ctx.moveTo(0, -r * 1.2); ctx.lineTo(r, 0); ctx.lineTo(0, r * 1.1); ctx.lineTo(-r, 0); ctx.closePath(); }
    else { ctx.moveTo(0, -r * 1.2); ctx.lineTo(r * 1.05, r * 0.85); ctx.lineTo(-r * 1.05, r * 0.85); ctx.closePath(); }
    ctx.fill(); ctx.stroke();
    // 눈
    ctx.fillStyle = '#fff';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * r * 0.32, -r * 0.2, r * 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#000';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * r * 0.32, -r * 0.28, r * 0.09, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
}
