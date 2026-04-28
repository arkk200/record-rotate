import { imageToDataUri } from "./image";
import type { Album, AlbumQuery, ITunesAlbumResult, ITunesArtistResult, ITunesSearchResponse } from "./types";
import { normalizeSearchText } from "./utils";

export async function resolveAlbum(query: AlbumQuery): Promise<Album> {
  const fallback = makeFallbackAlbum(query);

  try {
    const album = query.artist && query.album
      ? await searchAlbumByArtistAndTitle(query)
      : await searchAlbum(query);

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

async function searchAlbum(query: AlbumQuery): Promise<Album | null> {
  const params = new URLSearchParams({
    term: query.term,
    entity: "album",
    limit: "1",
  });

  const data = await fetchITunes<ITunesAlbumResult>(`https://itunes.apple.com/search?${params.toString()}`);
  const result = data.results[0];

  return albumFromResult(result, query.raw);
}

async function searchAlbumByArtistAndTitle(query: AlbumQuery): Promise<Album | null> {
  const artist = await findArtist(query.artist ?? "");
  if (artist?.artistId) {
    const lookupParams = new URLSearchParams({
      id: String(artist.artistId),
      entity: "album",
      limit: "100",
    });
    const lookup = await fetchITunes<ITunesAlbumResult | ITunesArtistResult>(`https://itunes.apple.com/lookup?${lookupParams.toString()}`);
    const result = pickBestAlbumResult(lookup.results.filter(isAlbumResult), query);

    if (result) {
      return albumFromResult(result, query.raw);
    }
  }

  return searchAlbum(query);
}

async function findArtist(artistName: string): Promise<ITunesArtistResult | undefined> {
  const params = new URLSearchParams({
    term: artistName,
    entity: "musicArtist",
    limit: "10",
  });
  const data = await fetchITunes<ITunesArtistResult>(`https://itunes.apple.com/search?${params.toString()}`);
  const normalizedArtist = normalizeSearchText(artistName);

  return data.results
    .map((artist) => ({
      artist,
      score: scoreArtistResult(artist, normalizedArtist),
    }))
    .sort((left, right) => right.score - left.score)[0]?.artist;
}

async function fetchITunes<T>(url: string): Promise<ITunesSearchResponse<T>> {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "record-rotate/0.1",
    },
  });

  if (!response.ok) {
    throw new Error(`iTunes request failed: ${response.status}`);
  }

  return response.json() as Promise<ITunesSearchResponse<T>>;
}

function albumFromResult(result: ITunesAlbumResult | undefined, query: string): Album | null {
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

function pickBestAlbumResult(results: ITunesAlbumResult[], query: AlbumQuery): ITunesAlbumResult | undefined {
  if (!query.artist || !query.album) {
    return results[0];
  }

  const normalizedArtist = normalizeSearchText(query.artist);
  const normalizedAlbum = normalizeSearchText(query.album);

  return results
    .map((result) => ({
      result,
      score: scoreAlbumResult(result, normalizedArtist, normalizedAlbum),
    }))
    .sort((left, right) => right.score - left.score)[0]?.result;
}

function scoreArtistResult(result: ITunesArtistResult, artist: string): number {
  const resultArtist = normalizeSearchText(result.artistName ?? "");
  let score = 0;

  if (resultArtist === artist) score += 100;
  if (resultArtist.includes(artist) || artist.includes(resultArtist)) score += 50;

  return score;
}

function scoreAlbumResult(result: ITunesAlbumResult, artist: string, album: string): number {
  const resultArtist = normalizeSearchText(result.artistName ?? "");
  const resultAlbum = normalizeSearchText(result.collectionName ?? "");
  let score = 0;

  if (resultAlbum === album) score += 100;
  if (resultAlbum.includes(album) || album.includes(resultAlbum)) score += 45;
  if (resultArtist === artist) score += 80;
  if (resultArtist.includes(artist) || artist.includes(resultArtist)) score += 35;

  return score;
}

function isAlbumResult(result: ITunesAlbumResult | ITunesArtistResult): result is ITunesAlbumResult {
  return "collectionName" in result;
}

function upgradeArtworkUrl(url: string): string {
  return url.replace(/\/100x100bb\.(jpg|png|webp)$/i, "/600x600bb.$1");
}

function makeFallbackAlbum(query: AlbumQuery): Album {
  return {
    query: query.raw,
    artist: query.fallbackArtist,
    title: query.fallbackTitle,
  };
}
