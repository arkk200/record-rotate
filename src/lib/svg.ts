import { SLOT_OFFSETS, SLOT_STYLE, STEP_DURATION, type SlotOffset } from "./config";
import type { Album, Dimensions, RenderOptions } from "./types";
import { escapeXml, truncate } from "./utils";

const CENTER_LAYER = 3;
const COVER_RADIUS_RATIO = 0.08;
const BUFFER_OFFSET = Math.max(...SLOT_OFFSETS.map((offset) => Math.abs(offset)));
const CURVE_DEPTH_RATIO = 0.36;
const CURVE_EASE_POWER = 1.35;
const INTRO_DURATION = 1.35;
const INTRO_START_SPEED_MULTIPLIER = 36;
const INTRO_DECAY_POWER = 2;
const INTRO_KEY_TIME_VALUES = [0, 0.08, 0.18, 0.32, 0.5, 0.68, 0.82, 0.93, 1] as const;
const INTRO_KEY_TIMES = INTRO_KEY_TIME_VALUES.map(formatKeyTime).join(";");
const INTRO_SAMPLE_OFFSETS = INTRO_KEY_TIME_VALUES.map(getIntroTrackOffset);

type TrackStyle = {
  scale: number;
  opacity: number;
  shade: number;
  labelOpacity: number;
};

type TrackPoint = {
  x: number;
  y: number;
};

type Keyframes = {
  duration: number;
  introTranslateValues: string;
  loopTranslateValues: string;
  introScaleValues: string;
  loopScaleValues: string;
  introShadeValues: string;
  loopShadeValues: string;
  introLabelOpacityValues: string;
  loopLabelOpacityValues: string;
  introLayerOpacityValues: string;
  loopLayerOpacityValues: string;
  layerOpacityKeyTimes: string;
  keyTimes: string;
};

export function renderSvg(albums: Album[], dimensions: Dimensions, renderOptions: RenderOptions): string {
  const coverDefs = albums.map(renderCoverSymbol).join("\n");
  const items = albums.length > 0 ? renderLayeredCarousel(albums, dimensions, renderOptions) : "";

  return `<svg width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Record Rotate album cover carousel">
  <defs>
    <clipPath id="coverClip" clipPathUnits="objectBoundingBox">
      <rect width="1" height="1" rx="${COVER_RADIUS_RATIO}"/>
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

function renderLayeredCarousel(albums: Album[], dimensions: Dimensions, renderOptions: RenderOptions): string {
  const trackPositions = buildTrackPositions(albums.length);

  return buildDepthLayers()
    .map((layer) => `  <g data-depth-layer="${layer}">
${trackPositions.map((trackPosition) => renderCarouselItem(albums, trackPosition, layer, dimensions, renderOptions)).join("\n")}
  </g>`)
    .join("\n");
}

function renderCarouselItem(
  albums: Album[],
  trackPosition: number,
  layer: number,
  dimensions: Dimensions,
  renderOptions: RenderOptions,
): string {
  const albumIndex = getAlbumIndex(trackPosition, albums.length);
  const album = albums[albumIndex];
  const keyframes = buildKeyframes(trackPosition, albums.length, layer, dimensions);
  const initialPosition = getTrackPosition(trackPosition + INTRO_SAMPLE_OFFSETS[0], dimensions);
  const initialStyle = getTrackStyle(trackPosition + INTRO_SAMPLE_OFFSETS[0]);
  const initialOpacity = getLayerOpacity(trackPosition + INTRO_SAMPLE_OFFSETS[0], layer);
  const coverOffset = -dimensions.baseSize / 2;
  const labelY = dimensions.baseSize / 2 + dimensions.labelGap;
  const cornerRadius = Number((dimensions.baseSize * COVER_RADIUS_RATIO).toFixed(2));

  return `    <g transform="translate(${initialPosition.x.toFixed(2)} ${initialPosition.y.toFixed(2)})" opacity="${initialOpacity}" filter="url(#coverShadow)">
      <animate attributeName="opacity" values="${keyframes.introLayerOpacityValues}" keyTimes="${INTRO_KEY_TIMES}" calcMode="discrete" dur="${INTRO_DURATION}s" begin="0s" fill="freeze"/>
      <animate attributeName="opacity" values="${keyframes.loopLayerOpacityValues}" keyTimes="${keyframes.layerOpacityKeyTimes}" calcMode="discrete" dur="${keyframes.duration}s" begin="${INTRO_DURATION}s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="translate" values="${keyframes.introTranslateValues}" keyTimes="${INTRO_KEY_TIMES}" dur="${INTRO_DURATION}s" begin="0s" calcMode="linear" fill="freeze"/>
      <animateTransform attributeName="transform" type="translate" values="${keyframes.loopTranslateValues}" keyTimes="${keyframes.keyTimes}" dur="${keyframes.duration}s" begin="${INTRO_DURATION}s" repeatCount="indefinite"/>
      <g transform="scale(${initialStyle.scale})">
        <animateTransform attributeName="transform" type="scale" values="${keyframes.introScaleValues}" keyTimes="${INTRO_KEY_TIMES}" dur="${INTRO_DURATION}s" begin="0s" calcMode="linear" fill="freeze"/>
        <animateTransform attributeName="transform" type="scale" values="${keyframes.loopScaleValues}" keyTimes="${keyframes.keyTimes}" dur="${keyframes.duration}s" begin="${INTRO_DURATION}s" repeatCount="indefinite"/>
        ${renderCoverUse(albumIndex, coverOffset, coverOffset, dimensions.baseSize)}
        <rect x="${coverOffset}" y="${coverOffset}" width="${dimensions.baseSize}" height="${dimensions.baseSize}" rx="${cornerRadius}" fill="#000" opacity="${initialStyle.shade}">
          <animate attributeName="opacity" values="${keyframes.introShadeValues}" keyTimes="${INTRO_KEY_TIMES}" dur="${INTRO_DURATION}s" begin="0s" calcMode="linear" fill="freeze"/>
          <animate attributeName="opacity" values="${keyframes.loopShadeValues}" keyTimes="${keyframes.keyTimes}" dur="${keyframes.duration}s" begin="${INTRO_DURATION}s" repeatCount="indefinite"/>
        </rect>
        ${renderOptions.showTitle && layer === CENTER_LAYER ? renderLabel(album, labelY, keyframes.introLabelOpacityValues, keyframes.loopLabelOpacityValues, keyframes.keyTimes, keyframes.duration) : ""}
      </g>
    </g>`;
}

function buildKeyframes(trackPosition: number, albumCount: number, layer: number, dimensions: Dimensions): Keyframes {
  const introPositions = INTRO_SAMPLE_OFFSETS.map((offset) => trackPosition + offset);
  const loopPositions = Array.from({ length: albumCount + 1 }, (_, index) => trackPosition - index);
  const duration = Number((STEP_DURATION * albumCount).toFixed(2));

  return {
    duration,
    introTranslateValues: introPositions.map((position) => formatTrackPoint(getTrackPosition(position, dimensions))).join(";"),
    loopTranslateValues: loopPositions.map((position) => formatTrackPoint(getTrackPosition(position, dimensions))).join(";"),
    introScaleValues: introPositions.map((position) => `${getTrackStyle(position).scale}`).join(";"),
    loopScaleValues: loopPositions.map((position) => `${getTrackStyle(position).scale}`).join(";"),
    introShadeValues: introPositions.map((position) => `${getTrackStyle(position).shade}`).join(";"),
    loopShadeValues: loopPositions.map((position) => `${getTrackStyle(position).shade}`).join(";"),
    introLabelOpacityValues: introPositions.map((position) => `${getTrackStyle(position).labelOpacity}`).join(";"),
    loopLabelOpacityValues: loopPositions.map((position) => `${getTrackStyle(position).labelOpacity}`).join(";"),
    introLayerOpacityValues: introPositions.map((position) => `${getLayerOpacity(position, layer)}`).join(";"),
    loopLayerOpacityValues: buildLoopLayerOpacityValues(trackPosition, albumCount, layer),
    layerOpacityKeyTimes: buildLayerOpacityKeyTimes(albumCount),
    keyTimes: loopPositions.map((_, index) => `${Number((index / albumCount).toFixed(4))}`).join(";"),
  };
}

function buildLayerOpacityKeyTimes(albumCount: number): string {
  const keyTimes = [0];

  for (let index = 0; index < albumCount; index += 1) {
    keyTimes.push(Number(((index + 0.5) / albumCount).toFixed(4)));
    keyTimes.push(Number(((index + 1) / albumCount).toFixed(4)));
  }

  return keyTimes.map((value) => `${value}`).join(";");
}

function buildLoopLayerOpacityValues(trackPosition: number, albumCount: number, layer: number): string {
  const values: number[] = [getLayerOpacity(trackPosition, layer)];

  for (let index = 0; index < albumCount; index += 1) {
    const nextPosition = trackPosition - index - 1;
    const nextOpacity = getLayerOpacity(nextPosition, layer);

    values.push(nextOpacity);
    values.push(nextOpacity);
  }

  return values.map((value) => `${value}`).join(";");
}

function buildTrackPositions(albumCount: number): number[] {
  return Array.from({ length: SLOT_OFFSETS.length + albumCount }, (_, index) => SLOT_OFFSETS[0] + index);
}

function buildDepthLayers(): number[] {
  return [0, 1, 2, CENTER_LAYER];
}

function getLayerOpacity(trackPosition: number, layer: number): number {
  const style = getTrackStyle(trackPosition);

  if (style.opacity === 0) {
    return 0;
  }

  return getDepthLayer(trackPosition) === layer ? style.opacity : 0;
}

function getDepthLayer(trackPosition: number): number {
  const discreteDistance = Math.min(Math.round(Math.abs(trackPosition)), BUFFER_OFFSET);

  if (discreteDistance >= BUFFER_OFFSET) {
    return -1;
  }

  return CENTER_LAYER - discreteDistance;
}

function getTrackStyle(trackPosition: number): TrackStyle {
  const clampedPosition = Math.max(-BUFFER_OFFSET, Math.min(BUFFER_OFFSET, trackPosition));

  if (Number.isInteger(clampedPosition)) {
    return SLOT_STYLE[clampedPosition as SlotOffset];
  }

  const lowerPosition = Math.floor(clampedPosition) as SlotOffset;
  const upperPosition = Math.ceil(clampedPosition) as SlotOffset;

  if (lowerPosition === upperPosition) {
    return SLOT_STYLE[lowerPosition];
  }

  const lowerStyle = SLOT_STYLE[lowerPosition];
  const upperStyle = SLOT_STYLE[upperPosition];
  const ratio = clampedPosition - lowerPosition;

  return {
    scale: interpolate(lowerStyle.scale, upperStyle.scale, ratio),
    opacity: interpolate(lowerStyle.opacity, upperStyle.opacity, ratio),
    shade: interpolate(lowerStyle.shade, upperStyle.shade, ratio),
    labelOpacity: interpolate(lowerStyle.labelOpacity, upperStyle.labelOpacity, ratio),
  };
}

function interpolate(start: number, end: number, ratio: number): number {
  return Number((start + (end - start) * ratio).toFixed(4));
}

function getIntroTrackOffset(keyTime: number): number {
  // Integrate a decaying speed curve so the intro ends at the normal loop speed.
  const remainingTime = 1 - keyTime;
  const normalTravel = remainingTime;
  const decayedTravel = (INTRO_START_SPEED_MULTIPLIER - 1) * remainingTime ** (INTRO_DECAY_POWER + 1) / (INTRO_DECAY_POWER + 1);

  return Number(((INTRO_DURATION / STEP_DURATION) * (normalTravel + decayedTravel)).toFixed(4));
}

function formatKeyTime(value: number): string {
  return `${Number(value.toFixed(4))}`;
}

function getAlbumIndex(trackPosition: number, albumCount: number): number {
  return ((trackPosition % albumCount) + albumCount) % albumCount;
}

function getTrackPosition(trackPosition: number, dimensions: Dimensions): TrackPoint {
  const normalizedDistance = Math.min(Math.abs(trackPosition) / BUFFER_OFFSET, 1);
  const curveDepth = dimensions.baseSize * CURVE_DEPTH_RATIO;
  const curveLift = normalizedDistance ** CURVE_EASE_POWER;

  return {
    x: dimensions.centerX + trackPosition * dimensions.stepX,
    y: dimensions.centerY - curveDepth * curveLift,
  };
}

function formatTrackPoint(point: TrackPoint): string {
  return `${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
}

function renderCoverSymbol(album: Album, index: number): string {
  if (album.imageDataUri) {
    return `    <symbol id="cover-${index}" viewBox="0 0 100 100">
      <image href="${album.imageDataUri}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" clip-path="url(#coverClip)"/>
    </symbol>`;
  }

  return `    <symbol id="cover-${index}" viewBox="0 0 100 100">
      <rect x="0" y="0" width="100" height="100" rx="8" fill="#111"/>
      <rect x="7" y="7" width="86" height="86" rx="8" fill="#1d1d1d" stroke="#333"/>
      <text x="50" y="46" fill="#f5f5f5" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="700" text-anchor="middle">${escapeXml(truncate(album.title, 16))}</text>
      <text x="50" y="61" fill="#8b8b8b" font-family="Arial, Helvetica, sans-serif" font-size="7" text-anchor="middle">${escapeXml(truncate(album.artist, 20))}</text>
    </symbol>`;
}

function renderCoverUse(albumIndex: number, x: number, y: number, size: number): string {
  return `<use href="#cover-${albumIndex}" x="${x}" y="${y}" width="${size}" height="${size}"/>`;
}

function renderLabel(
  album: Album,
  y: number,
  introOpacityValues: string,
  loopOpacityValues: string,
  keyTimes: string,
  duration: number,
): string {
  return `<g opacity="0">
      <animate attributeName="opacity" values="${introOpacityValues}" keyTimes="${INTRO_KEY_TIMES}" dur="${INTRO_DURATION}s" begin="0s" calcMode="linear" fill="freeze"/>
      <animate attributeName="opacity" values="${loopOpacityValues}" keyTimes="${keyTimes}" dur="${duration}s" begin="${INTRO_DURATION}s" repeatCount="indefinite"/>
      <text x="0" y="${y}" fill="#f6f6f6" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" text-anchor="middle">${escapeXml(truncate(album.title, 34))}</text>
      <text x="0" y="${y + 22}" fill="#8c8c8c" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="middle">${escapeXml(truncate(album.artist, 42))}</text>
    </g>`;
}
