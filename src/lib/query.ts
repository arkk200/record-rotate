import { ASPECT_RATIO, DEFAULT_WIDTH, MAX_ALBUMS, MAX_WIDTH, MIN_WIDTH } from "./config";
import type { AlbumQuery, Dimensions, RenderOptions } from "./types";

export function parseAlbums(url: URL): AlbumQuery[] {
  const raw = url.searchParams.get("albums");
  const values = raw
    ? raw.split(",").map(parseAlbumQuery).filter((album): album is AlbumQuery => Boolean(album))
    : [];

  return values.slice(0, MAX_ALBUMS);
}

function parseAlbumQuery(value: string): AlbumQuery | undefined {
  const raw = value.trim();
  if (!raw) {
    return undefined;
  }

  const colonParts = splitPair(raw, ":");
  if (colonParts) {
    const [artist, album] = colonParts;

    return {
      raw,
      artist,
      album,
      fallbackArtist: artist,
      fallbackTitle: album,
      term: `${artist} ${album}`,
    };
  }

  const dashParts = splitPair(raw, " - ");
  if (dashParts) {
    const [artist, album] = dashParts;

    return {
      raw,
      fallbackArtist: artist,
      fallbackTitle: album,
      term: raw,
    };
  }

  return {
    raw,
    fallbackArtist: "Unknown Artist",
    fallbackTitle: raw,
    term: raw,
  };
}

function splitPair(value: string, separator: string): [string, string] | undefined {
  const separatorIndex = value.indexOf(separator);
  if (separatorIndex <= 0 || separatorIndex >= value.length - separator.length) {
    return undefined;
  }

  const left = value.slice(0, separatorIndex).trim();
  const right = value.slice(separatorIndex + separator.length).trim();

  return left && right ? [left, right] : undefined;
}

export function parseDimensions(url: URL): Dimensions {
  const width = parseBoundedInteger(url.searchParams.get("width"), DEFAULT_WIDTH, MIN_WIDTH, MAX_WIDTH);
  const height = Math.round(width * ASPECT_RATIO);
  const baseSize = Math.round(Math.min(width * 0.22, height * 0.62));

  return {
    width,
    height,
    centerX: width / 2,
    centerY: Math.round(height * 0.49),
    baseSize,
    stepX: Math.round(width * 0.182),
    labelGap: Math.max(22, Math.round(height * 0.1)),
  };
}

export function parseRenderOptions(url: URL): RenderOptions {
  return {
    showTitle: parseBooleanFlag(url.searchParams.get("title")),
  };
}

function parseBooleanFlag(value: string | null): boolean {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function parseBoundedInteger(value: string | null, fallback: number, min: number, max: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}
