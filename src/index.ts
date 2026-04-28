type Album = {
  query: string;
  title: string;
  artist: string;
  imageDataUri?: string;
};

type ITunesSearchResponse = {
  resultCount: number;
  results: Array<{
    wrapperType?: string;
    collectionType?: string;
    artistName?: string;
    collectionName?: string;
    artworkUrl100?: string;
  }>;
};

const DEFAULT_ALBUMS = [
  "Travis Scott - Rodeo",
  "Kanye West - Graduation",
  "Kendrick Lamar - DAMN.",
  "Drake - Take Care",
  "Playboi Carti - Die Lit",
  "Travis Scott - Utopia",
];

const MAX_ALBUMS = 7;
const WIDTH = 760;
const HEIGHT = 280;
const CENTER_X = WIDTH / 2;
const CENTER_Y = 138;
const BASE_SIZE = 164;
const STEP_X = 138;
const DURATION = 46;

const SLOT_OFFSETS = [3, 2, 1, 0, -1, -2, -3] as const;
type SlotOffset = (typeof SLOT_OFFSETS)[number];

const SLOT_STYLE: Record<SlotOffset, { scale: number; opacity: number; shade: number }> = {
  [-3]: { scale: 0.58, opacity: 0.18, shade: 0.72 },
  [-2]: { scale: 0.68, opacity: 0.38, shade: 0.5 },
  [-1]: { scale: 0.82, opacity: 0.72, shade: 0.26 },
  [0]: { scale: 1, opacity: 1, shade: 0 },
  [1]: { scale: 0.82, opacity: 0.72, shade: 0.26 },
  [2]: { scale: 0.68, opacity: 0.38, shade: 0.5 },
  [3]: { scale: 0.58, opacity: 0.18, shade: 0.72 },
};

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const albumQueries = parseAlbums(url);
    const albums = await Promise.all(albumQueries.map(resolveAlbum));
    const svg = renderSvg(albums);

    return new Response(svg, {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "public, max-age=900, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  },
};

function parseAlbums(url: URL): string[] {
  const raw = url.searchParams.get("albums");
  const values = raw
    ? raw.split(",").map((album) => album.trim()).filter(Boolean)
    : DEFAULT_ALBUMS;

  return values.slice(0, MAX_ALBUMS);
}

async function resolveAlbum(query: string): Promise<Album> {
  const fallback = makeFallbackAlbum(query);

  try {
    const album = await searchAlbum(query);
    if (!album) {
      return fallback;
    }

    return {
      ...album,
      imageDataUri: await imageToDataUri(album.imageDataUri ?? ""),
    };
  } catch {
    return fallback;
  }
}

async function searchAlbum(query: string): Promise<Album | null> {
  const params = new URLSearchParams({
    term: query,
    entity: "album",
    limit: "1",
  });

  const response = await fetch(`https://itunes.apple.com/search?${params.toString()}`, {
    headers: {
      accept: "application/json",
      "user-agent": "record-rotate/0.1",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as ITunesSearchResponse;
  const result = data.results[0];

  if (!result?.collectionName || !result.artistName || !result.artworkUrl100) {
    return null;
  }

  return {
    query,
    title: result.collectionName,
    artist: result.artistName,
    imageDataUri: upgradeArtworkUrl(result.artworkUrl100),
  };
}

function upgradeArtworkUrl(url: string): string {
  return url.replace(/\/100x100bb\.(jpg|png|webp)$/i, "/600x600bb.$1");
}

async function imageToDataUri(imageUrl: string): Promise<string | undefined> {
  if (!imageUrl) {
    return undefined;
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    return undefined;
  }

  const contentType = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  const buffer = await response.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);

  return `data:${contentType};base64,${base64}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function makeFallbackAlbum(query: string): Album {
  const [artist, title] = query.includes(" - ")
    ? query.split(" - ", 2).map((part) => part.trim())
    : ["Unknown Artist", query];

  return {
    query,
    artist: artist || "Unknown Artist",
    title: title || query,
  };
}

function renderSvg(albums: Album[]): string {
  const safeAlbums = albums.length > 0 ? albums : DEFAULT_ALBUMS.map(makeFallbackAlbum);
  const items = SLOT_OFFSETS.map((slotOffset, index) => renderCarouselItem(safeAlbums, index, slotOffset)).join("\n");

  return `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Record Rotate album cover carousel">
  <defs>
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
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#000"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#spotlight)"/>
  ${items}
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sideFade)" pointer-events="none"/>
</svg>`;
}

function renderCarouselItem(albums: Album[], itemIndex: number, initialSlot: SlotOffset): string {
  const keyframes = buildKeyframes(initialSlot);
  const slot = SLOT_STYLE[initialSlot];
  const x = CENTER_X + initialSlot * STEP_X;
  const album = albums[itemIndex % albums.length];
  const labelY = CENTER_Y + BASE_SIZE / 2 + 28;
  const showLabel = initialSlot === 0;

  return `  <g transform="translate(${x.toFixed(2)} ${CENTER_Y}) scale(${slot.scale})" opacity="${slot.opacity}" filter="url(#coverShadow)">
    <animate attributeName="transform" values="${keyframes.transformValues}" dur="${DURATION}s" begin="-${itemIndex * (DURATION / SLOT_OFFSETS.length)}s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="${keyframes.opacityValues}" dur="${DURATION}s" begin="-${itemIndex * (DURATION / SLOT_OFFSETS.length)}s" repeatCount="indefinite"/>
    ${renderCover(album, -BASE_SIZE / 2, -BASE_SIZE / 2, BASE_SIZE)}
    <rect x="${-BASE_SIZE / 2}" y="${-BASE_SIZE / 2}" width="${BASE_SIZE}" height="${BASE_SIZE}" rx="18" fill="#000" opacity="${slot.shade}">
      <animate attributeName="opacity" values="${keyframes.shadeValues}" dur="${DURATION}s" begin="-${itemIndex * (DURATION / SLOT_OFFSETS.length)}s" repeatCount="indefinite"/>
    </rect>
    ${showLabel ? renderLabel(album, labelY - CENTER_Y, itemIndex) : ""}
  </g>`;
}

function buildKeyframes(initialSlot: SlotOffset): {
  transformValues: string;
  opacityValues: string;
  shadeValues: string;
} {
  const startIndex = SLOT_OFFSETS.indexOf(initialSlot);
  const rotated = SLOT_OFFSETS.map((_, index) => SLOT_OFFSETS[(startIndex + index) % SLOT_OFFSETS.length]);
  const slots = [...rotated, rotated[0]];

  return {
    transformValues: slots.map((slot) => {
      const style = SLOT_STYLE[slot];
      return `${(CENTER_X + slot * STEP_X).toFixed(2)} ${CENTER_Y} scale(${style.scale})`;
    }).join(";"),
    opacityValues: slots.map((slot) => `${SLOT_STYLE[slot].opacity}`).join(";"),
    shadeValues: slots.map((slot) => `${SLOT_STYLE[slot].shade}`).join(";"),
  };
}

function renderCover(album: Album, x: number, y: number, size: number): string {
  if (album.imageDataUri) {
    return `<image href="${album.imageDataUri}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" clip-path="inset(0 round 18px)"/>`;
  }

  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="18" fill="#111"/>
      <rect x="${x + 12}" y="${y + 12}" width="${size - 24}" height="${size - 24}" rx="14" fill="#1d1d1d" stroke="#333"/>
      <text x="0" y="${y + 74}" fill="#f5f5f5" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" text-anchor="middle">${escapeXml(truncate(album.title, 16))}</text>
      <text x="0" y="${y + 102}" fill="#8b8b8b" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="middle">${escapeXml(truncate(album.artist, 20))}</text>`;
}

function renderLabel(album: Album, y: number, itemIndex: number): string {
  return `<g opacity="0">
      <animate attributeName="opacity" values="1;0;0;0;0;0;1;1" dur="${DURATION}s" begin="-${itemIndex * (DURATION / SLOT_OFFSETS.length)}s" repeatCount="indefinite"/>
      <text x="0" y="${y}" fill="#f6f6f6" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" text-anchor="middle">${escapeXml(truncate(album.title, 34))}</text>
      <text x="0" y="${y + 22}" fill="#8c8c8c" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="middle">${escapeXml(truncate(album.artist, 42))}</text>
    </g>`;
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
