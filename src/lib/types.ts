export type Album = {
  query: string;
  title: string;
  artist: string;
  imageDataUri?: string;
};

export type ITunesAlbumResult = {
  wrapperType?: string;
  collectionType?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
};

export type ITunesArtistResult = {
  wrapperType?: string;
  artistName?: string;
  artistId?: number;
};

export type ITunesSearchResponse<T> = {
  resultCount: number;
  results: T[];
};

export type AlbumQuery = {
  raw: string;
  term: string;
  fallbackArtist: string;
  fallbackTitle: string;
  artist?: string;
  album?: string;
};

export type Dimensions = {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  baseSize: number;
  stepX: number;
  labelGap: number;
};

export type RenderOptions = {
  showTitle: boolean;
};
