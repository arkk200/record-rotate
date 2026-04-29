import { resolveAlbum } from "./lib/itunes";
import { parseAlbums, parseDimensions, parseRenderOptions } from "./lib/query";
import { renderSvg } from "./lib/svg";

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const albumQueries = parseAlbums(url);
    const dimensions = parseDimensions(url);
    const renderOptions = parseRenderOptions(url);
    const albums = await Promise.all(albumQueries.map(resolveAlbum));
    const svg = renderSvg(albums, dimensions, renderOptions);

    return new Response(svg, {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "public, max-age=900, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  },
};
