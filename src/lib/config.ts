export const MAX_ALBUMS = 7;
export const DEFAULT_WIDTH = 760;
export const ASPECT_RATIO = 280 / 760;
export const MIN_WIDTH = 360;
export const MAX_WIDTH = 1200;
export const DURATION = 46;

export const SLOT_OFFSETS = [3, 2, 1, 0, -1, -2, -3] as const;
export type SlotOffset = (typeof SLOT_OFFSETS)[number];

export const SLOT_STYLE: Record<SlotOffset, { scale: number; opacity: number; shade: number; labelOpacity: number }> = {
  [-3]: { scale: 0.58, opacity: 1, shade: 0.78, labelOpacity: 0 },
  [-2]: { scale: 0.68, opacity: 1, shade: 0.6, labelOpacity: 0 },
  [-1]: { scale: 0.82, opacity: 1, shade: 0.34, labelOpacity: 0 },
  [0]: { scale: 1, opacity: 1, shade: 0, labelOpacity: 1 },
  [1]: { scale: 0.82, opacity: 1, shade: 0.34, labelOpacity: 0 },
  [2]: { scale: 0.68, opacity: 1, shade: 0.6, labelOpacity: 0 },
  [3]: { scale: 0.58, opacity: 1, shade: 0.78, labelOpacity: 0 },
};
