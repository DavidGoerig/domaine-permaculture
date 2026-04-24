export const SCALE_PX_PER_M = 760 / 200;

export function mToPx(meters: number): number {
  return meters * SCALE_PX_PER_M;
}

export function pxToM(pixels: number): number {
  return pixels / SCALE_PX_PER_M;
}

export function pxToM2(widthPx: number, heightPx: number): number {
  return pxToM(widthPx) * pxToM(heightPx);
}
