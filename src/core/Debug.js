// 테스트용 URL 옵션. ?slow=0.1~1 이면 게임 시간이 그 배율로 흐름 (범위 밖은 0.1~1로 맞춤, 없거나 숫자가 아니면 1)
export class Debug {
  static #slow = null;
  static slow() {
    if (Debug.#slow === null) {
      const v = parseFloat(new URLSearchParams(globalThis.location?.search || '').get('slow'));
      Debug.#slow = Number.isFinite(v) ? Math.min(1, Math.max(0.1, v)) : 1;
    }
    return Debug.#slow;
  }
}
