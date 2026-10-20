import { imageToDataUri } from "./image";
import type { Album, AlbumQuery, DeezerAlbum, DeezerAlbumSearchResponse } from "./types";
import { normalizeSearchText } from "./utils";

const DEEZER_SEARCH_URL = "https://api.deezer.com/search/album";

export async function resolveAlbum(query: AlbumQuery): Promise<Album> {
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
  } catch (e) {
    console.error(e);
    return fallback;
  }
}

async function searchAlbum(query: AlbumQuery): Promise<Album | null> {
  const results = await searchAlbums(buildSearchTerm(query));
  const best = pickBestAlbum(results, query);

  return albumFromResult(best, query.raw);
}

function buildSearchTerm(query: AlbumQuery): string {
  if (query.artist && query.album) {
    return `artist:"${escapeQuoted(query.artist)}" album:"${escapeQuoted(query.album)}"`;
  }

  return query.term;
}

async function searchAlbums(term: string): Promise<DeezerAlbum[]> {
  const params = new URLSearchParams({
    q: term,
    limit: "10",
  });

  const data = await fetchJson<DeezerAlbumSearchResponse>(`${DEEZER_SEARCH_URL}?${params.toString()}`);

  return data.data ?? [];
}

function pickBestAlbum(results: DeezerAlbum[], query: AlbumQuery): DeezerAlbum | undefined {
  if (!query.artist || !query.album) {
    return results[0];
  }

  const normalizedArtist = normalizeSearchText(query.artist);
  const normalizedAlbum = normalizeSearchText(query.album);

  return results
    .map((result) => ({
      result,
      score: scoreAlbum(result, normalizedArtist, normalizedAlbum),
    }))
    .sort((left, right) => right.score - left.score)[0]?.result;
}

function scoreAlbum(result: DeezerAlbum, artist: string, album: string): number {
  const resultArtist = normalizeSearchText(result.artist?.name ?? "");
  const resultAlbum = normalizeSearchText(result.title ?? "");
  let score = 0;

  if (resultAlbum === album) score += 100;
  if (resultAlbum.includes(album) || album.includes(resultAlbum)) score += 45;
  if (resultArtist === artist) score += 80;
  if (resultArtist.includes(artist) || artist.includes(resultArtist)) score += 35;

  return score;
}

function albumFromResult(result: DeezerAlbum | undefined, query: string): Album | null {
  if (!result?.title || !result.artist?.name) {
    return null;
  }

  return {
    query,
    title: result.title,
    artist: result.artist.name,
    imageDataUri: result.cover_xl,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Deezer request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function escapeQuoted(value: string): string {
  return value.replace(/"/g, "");
}

function makeFallbackAlbum(query: AlbumQuery): Album {
  return {
    query: query.raw,
    artist: query.fallbackArtist,
    title: query.fallbackTitle,
  };
}
