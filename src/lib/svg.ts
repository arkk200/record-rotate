import { DURATION } from "./config";
import type { Album, Dimensions } from "./types";
import { escapeXml, truncate } from "./utils";

export function renderSvg(albums: Album[], dimensions: Dimensions): string {
  const slots = buildSlots(albums.length);
  const coverDefs = albums.map(renderCoverSymbol).join("\n");
  const items = albums.length > 0 ? renderLayeredCarousel(albums, slots, dimensions) : "";

  return `<svg width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Record Rotate album cover carousel">
  <defs>
    <clipPath id="coverClip" clipPathUnits="objectBoundingBox">
      <rect width="1" height="1" rx="0.08"/>
    </clipPath>
    <linearGradient id="sideFade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#000" stop-opacity="1"/>
      <stop offset="18%" stop-color="#000" stop-opacity="0.55"/>
      <stop offset="38%" stop-color="#000" stop-opacity="0"/>
      <stop offset="62%" stop-color="#000" stop-opacity="0"/>
      <stop offset="82%" stop-color="#000" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#000" stop-opacity="1"/>
    </linearGradient>
    <radialGradient id="spotlight" cx="50%" cy="48%" r="48%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.14"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <filter id="coverShadow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#000000" flood-opacity="0.65"/>
    </filter>
${coverDefs}
  </defs>
  <rect width="${dimensions.width}" height="${dimensions.height}" fill="#000"/>
  <rect width="${dimensions.width}" height="${dimensions.height}" fill="url(#spotlight)"/>
  ${items}
  <rect width="${dimensions.width}" height="${dimensions.height}" fill="url(#sideFade)" pointer-events="none"/>
</svg>`;
}

function renderLayeredCarousel(albums: Album[], slots: number[], dimensions: Dimensions): string {
  return buildDepthLayers(slots)
    .map((layer) => `  <g data-depth-layer="${layer}">
${slots.map((slotOffset, index) => renderCarouselItem(albums, index, slotOffset, slots, layer, dimensions)).join("\n")}
  </g>`)
    .join("\n");
}

function renderCarouselItem(
  albums: Album[],
  itemIndex: number,
  initialSlot: number,
  slots: number[],
  layer: number,
  dimensions: Dimensions,
): string {
  const keyframes = buildKeyframes(initialSlot, slots, layer, dimensions);
  const slot = getSlotStyle(initialSlot, slots);
  const x = dimensions.centerX + initialSlot * dimensions.stepX;
  const albumIndex = itemIndex % albums.length;
  const coverOffset = -dimensions.baseSize / 2;
  const labelY = dimensions.baseSize / 2 + dimensions.labelGap;

  return `    <g transform="translate(${x.toFixed(2)} ${dimensions.centerY})" opacity="${getDepthLayer(initialSlot, slots) === layer ? 1 : 0}" filter="url(#coverShadow)">
      <animate attributeName="opacity" values="${keyframes.layerOpacityValues}" keyTimes="${keyframes.keyTimes}" calcMode="discrete" dur="${DURATION}s" begin="0s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="translate" values="${keyframes.translateValues}" dur="${DURATION}s" begin="0s" repeatCount="indefinite"/>
      <g transform="scale(${slot.scale})">
        <animateTransform attributeName="transform" type="scale" values="${keyframes.scaleValues}" dur="${DURATION}s" begin="0s" repeatCount="indefinite"/>
        ${renderCoverUse(albumIndex, coverOffset, coverOffset, dimensions.baseSize)}
        <rect x="${coverOffset}" y="${coverOffset}" width="${dimensions.baseSize}" height="${dimensions.baseSize}" rx="18" fill="#000" opacity="${slot.shade}">
          <animate attributeName="opacity" values="${keyframes.shadeValues}" dur="${DURATION}s" begin="0s" repeatCount="indefinite"/>
        </rect>
        ${layer === getDepthLayer(0, slots) ? renderLabel(albums[albumIndex], labelY, keyframes.labelOpacityValues) : ""}
      </g>
    </g>`;
}

function buildKeyframes(initialSlot: number, slots: number[], layer: number, dimensions: Dimensions): {
  translateValues: string;
  scaleValues: string;
  shadeValues: string;
  labelOpacityValues: string;
  layerOpacityValues: string;
  keyTimes: string;
} {
  const startIndex = slots.indexOf(initialSlot);
  const rotated = slots.map((_, index) => slots[(startIndex + index) % slots.length]);
  const loopSlots = [...rotated, rotated[0]];
  const maxIndex = loopSlots.length - 1;

  return {
    translateValues: loopSlots.map((slot) => `${(dimensions.centerX + slot * dimensions.stepX).toFixed(2)} ${dimensions.centerY}`).join(";"),
    scaleValues: loopSlots.map((slot) => `${getSlotStyle(slot, slots).scale}`).join(";"),
    shadeValues: loopSlots.map((slot) => `${getSlotStyle(slot, slots).shade}`).join(";"),
    labelOpacityValues: loopSlots.map((slot) => `${slot === 0 ? 1 : 0}`).join(";"),
    layerOpacityValues: loopSlots.map((slot) => `${getDepthLayer(slot, slots) === layer ? 1 : 0}`).join(";"),
    keyTimes: loopSlots.map((_, index) => `${Number((index / maxIndex).toFixed(4))}`).join(";"),
  };
}

function buildSlots(albumCount: number): number[] {
  if (albumCount <= 0) return [];
  const slotCount = albumCount === 1 ? 1 : Math.max(7, albumCount * Math.ceil(7 / albumCount));
  const half = Math.floor(slotCount / 2);
  const slots = Array.from({ length: slotCount }, (_, index) => half - index);

  return slots.includes(0) ? slots : [half + 1, ...slots];
}

function buildDepthLayers(slots: number[]): number[] {
  const maxDepth = Math.max(...slots.map((slot) => getDepthLayer(slot, slots)), 0);

  return Array.from({ length: maxDepth + 1 }, (_, layer) => layer);
}

function getDepthLayer(slot: number, slots: number[]): number {
  const maxDistance = Math.max(...slots.map((value) => Math.abs(value)), 1);

  return maxDistance - Math.min(Math.abs(slot), maxDistance);
}

function getSlotStyle(slot: number, slots: number[]): { scale: number; shade: number } {
  const maxDistance = Math.max(...slots.map((value) => Math.abs(value)), 1);
  const distance = Math.min(Math.abs(slot) / maxDistance, 1);

  return {
    scale: Number((1 - distance * 0.42).toFixed(3)),
    shade: Number((distance * 0.78).toFixed(3)),
  };
}

function renderCoverSymbol(album: Album, index: number): string {
  if (album.imageDataUri) {
    return `    <symbol id="cover-${index}" viewBox="0 0 100 100">
      <image href="${album.imageDataUri}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" clip-path="url(#coverClip)"/>
    </symbol>`;
  }

  return `    <symbol id="cover-${index}" viewBox="0 0 100 100">
      <rect x="0" y="0" width="100" height="100" rx="8" fill="#111"/>
      <rect x="7" y="7" width="86" height="86" rx="7" fill="#1d1d1d" stroke="#333"/>
      <text x="50" y="46" fill="#f5f5f5" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="700" text-anchor="middle">${escapeXml(truncate(album.title, 16))}</text>
      <text x="50" y="61" fill="#8b8b8b" font-family="Arial, Helvetica, sans-serif" font-size="7" text-anchor="middle">${escapeXml(truncate(album.artist, 20))}</text>
    </symbol>`;
}

function renderCoverUse(albumIndex: number, x: number, y: number, size: number): string {
  return `<use href="#cover-${albumIndex}" x="${x}" y="${y}" width="${size}" height="${size}"/>`;
}

function renderLabel(album: Album, y: number, opacityValues: string): string {
  return `<g opacity="0">
      <animate attributeName="opacity" values="${opacityValues}" dur="${DURATION}s" begin="0s" repeatCount="indefinite"/>
      <text x="0" y="${y}" fill="#f6f6f6" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" text-anchor="middle">${escapeXml(truncate(album.title, 34))}</text>
      <text x="0" y="${y + 22}" fill="#8c8c8c" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="middle">${escapeXml(truncate(album.artist, 42))}</text>
    </g>`;
}
