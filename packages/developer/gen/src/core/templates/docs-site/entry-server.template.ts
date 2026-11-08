/**
 * Stackra file contract:
 * Purpose: `ENTRY_SERVER_TEMPLATE`, the `app/entry.server.tsx` of a generated Fumadocs site: the server entry React
 *          Router runs only while prerendering, which waits for every suspended page (`allReady`) so each HTML file
 *          holds the whole page. It replaces React Router's default entry, which needs `isbot` and a Node stream
 *          adapter the site has no use for.
 * Boundary: a constant; nothing runs it after the build (`ssr: false`, an assets-only Worker).
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (decisions 1 and 9: prerendered static files); STA-2026.
 */

/** The emitted `app/entry.server.tsx`. */
export const ENTRY_SERVER_TEMPLATE = `import { renderToReadableStream } from "react-dom/server";
import { ServerRouter, type EntryContext } from "react-router";

export default async function handleRequest(
  request: Request,
  status: number,
  headers: Headers,
  context: EntryContext,
) {
  let code = status;
  const body = await renderToReadableStream(<ServerRouter context={context} url={request.url} />, {
    onError(error: unknown) {
      code = 500;
      console.error(error);
    },
  });
  await body.allReady;
  headers.set("Content-Type", "text/html; charset=utf-8");
  return new Response(body, { headers, status: code });
}
`;
