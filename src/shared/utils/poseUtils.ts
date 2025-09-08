import type { NormalizedLandmark } from "@mediapipe/pose";

// Угол между 3 точками
export function getAngle(
  a: NormalizedLandmark, 
  b: NormalizedLandmark, 
  c: NormalizedLandmark
): number {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const cb = { x: b.x - c.x, y: b.y - c.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const abLen = Math.hypot(ab.x, ab.y);
  const cbLen = Math.hypot(cb.x, cb.y);
  
  const angleRad = Math.acos(dot / (abLen * cbLen));
  return (angleRad * 180) / Math.PI;
}

// Счётчик повторений
export class RepCounter {
  private count = 0;
  private goingDown = false;
  private downAngle: number;
  private upAngle: number;

  constructor(downAngle: number = 60, upAngle: number = 160) {
    this.downAngle = downAngle;
    this.upAngle = upAngle;
  }

  update(angle: number): number {
    if (!this.goingDown && angle < this.downAngle) {
      this.goingDown = true;
    } else if (this.goingDown && angle > this.upAngle) {
      this.goingDown = false;
      this.count++;
    }
    return this.count;
  }

  getCount() {
    return this.count;
  }

  reset() {
    this.count = 0;
    this.goingDown = false;
  }
}