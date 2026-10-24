/**
 * Stackra file contract:
 * Purpose: `bundleFileUrl`, how the `app://` handler maps a request to a file of the built renderer: `app://bundle/x`
 *          to `<rendererDir>/x`, and the bare origin to `index.html`.
 * Boundary: pure. Any host but `bundle`, and any path that resolves outside the renderer folder (`..`, encoded or not),
 *           maps to nothing, so a page can never read a file beside the bundle. Not exported.
 * Runtime: node
 * Governing contract: ADR 0251 (decision 3: hardening); ADR 0249 (the desktop target serves the web bundle).
 */

/**
 * The file URL `requestUrl` names inside `rendererDir`, or undefined.
 *
 * @example
 * bundleFileUrl("app://bundle/assets/app.js", new URL("file:///app/renderer/")); // file:///app/renderer/assets/app.js
 */
export function bundleFileUrl(requestUrl: string, rendererDir: URL): URL | undefined {
  const url = new URL(requestUrl);
  if (url.host !== "bundle") return undefined;
  let path: string;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    return undefined;
  }
  const base = rendererDir.href.endsWith("/") ? rendererDir.href : `${rendererDir.href}/`;
  const file = new URL(`.${path === "/" ? "/index.html" : path}`, base);
  return file.href.startsWith(base) ? file : undefined;
}
