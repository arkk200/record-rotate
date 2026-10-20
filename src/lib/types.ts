export type Album = {
  query: string;
  title: string;
  artist: string;
  imageDataUri?: string;
};

export type DeezerAlbum = {
  title?: string;
  cover_xl?: string;
  artist?: {
    name?: string;
  };
};

export type DeezerAlbumSearchResponse = {
  data: DeezerAlbum[];
  total: number;
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
