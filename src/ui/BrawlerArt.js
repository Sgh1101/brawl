// 벡터 도형으로 그리는 오리지널 캐릭터 아트
export class BrawlerArt {
  // 캐릭터 몸통 모양 경로 (중심 0,0, 반지름 r). CharacterSprite가 씀
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
}
