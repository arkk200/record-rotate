export const MAX_ALBUMS = 7;
export const DEFAULT_WIDTH = 760;
export const ASPECT_RATIO = 280 / 760;
export const MIN_WIDTH = 360;
export const MAX_WIDTH = 1200;
export const STEP_DURATION = 6.5;

export const SLOT_OFFSETS = [-4, -3, -2, -1, 0, 1, 2, 3, 4] as const;
export type SlotOffset = (typeof SLOT_OFFSETS)[number];

export const SLOT_STYLE: Record<SlotOffset, { scale: number; opacity: number; shade: number; labelOpacity: number }> = {
  [-4]: { scale: 0.76, opacity: 0, shade: 0.82, labelOpacity: 0 },
  [-3]: { scale: 0.8, opacity: 1, shade: 0.64, labelOpacity: 0 },
  [-2]: { scale: 0.9, opacity: 1, shade: 0.46, labelOpacity: 0 },
  [-1]: { scale: 1.04, opacity: 1, shade: 0.2, labelOpacity: 0 },
  [0]: { scale: 1.2, opacity: 1, shade: 0, labelOpacity: 1 },
  [1]: { scale: 1.04, opacity: 1, shade: 0.2, labelOpacity: 0 },
  [2]: { scale: 0.9, opacity: 1, shade: 0.46, labelOpacity: 0 },
  [3]: { scale: 0.8, opacity: 1, shade: 0.64, labelOpacity: 0 },
  [4]: { scale: 0.76, opacity: 0, shade: 0.82, labelOpacity: 0 },
};
