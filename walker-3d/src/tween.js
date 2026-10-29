export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const clamp01 = (t) => Math.min(1, Math.max(0, t));

/** Eased tweens on numeric properties; starting a new tween on the same property replaces the old one. */
export class Tweener {
  constructor() {
    this.active = [];
  }

  to(target, key, value, duration, ease = easeInOutCubic) {
    this.active = this.active.filter((tween) => !(tween.target === target && tween.key === key));
    return new Promise((resolve) => {
      this.active.push({ target, key, from: target[key], to: value, duration, elapsed: 0, ease, resolve });
    });
  }

  clear() {
    this.active = [];
  }

  update(delta) {
    for (const tween of this.active) {
      tween.elapsed += delta;
      const progress = clamp01(tween.elapsed / tween.duration);
      tween.target[tween.key] = tween.from + (tween.to - tween.from) * tween.ease(progress);
      if (progress >= 1) tween.resolve();
    }
    this.active = this.active.filter((tween) => tween.elapsed < tween.duration);
  }
}
