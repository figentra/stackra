/**
 * Stackra file contract:
 * Purpose: `browserLogClient(route, perPage)`, the script the dev server adds to Vite's own client module: it reports
 *          uncaught errors, unhandled promise rejections and `console.error` / `console.warn` calls (which still print)
 *          to `route` in small batches, with the page's origin and path (never its query or fragment) and the stack
 *          when there is one, up to `perPage` entries per page load. A console call's arguments, and a rejection
 *          reason that is not an error, are sent as structured `args` (JSON-safe, at most 4 levels and 50 keys or
 *          items each, an error as `Name: message`), never flattened into text, so the dev server can redact them by
 *          field name before it writes the message.
 * Boundary: returns source text only. The script runs once per page, sends with `fetch` (`keepalive`, a custom header
 *           so a cross-site page cannot post the same way), swallows its own failures so it never logs about itself,
 *           and never changes what the console prints.
 * Runtime: node (the text it returns runs in the browser)
 * Governing contract: ADR 0282 (decision 5); STA-2889.
 */

/**
 * The browser log client's source.
 *
 * @param route - the dev server path to post to, `BROWSER_LOG_ROUTE`.
 * @param perPage - the most entries one page load sends.
 * @example
 * code + browserLogClient(BROWSER_LOG_ROUTE, 200); // appended to Vite's client module
 */
export function browserLogClient(route: string, perPage: number): string {
  return `
;(() => {
  const g = globalThis;
  if (g.__stackraBrowserLog === true || typeof g.addEventListener !== "function") return;
  g.__stackraBrowserLog = true;
  const route = ${JSON.stringify(route)};
  const perPage = ${JSON.stringify(perPage)};
  let sent = 0;
  let queue = [];
  let timer;
  const page = () => {
    try {
      const url = new URL(g.location.href);
      return url.origin + url.pathname;
    } catch {
      return undefined;
    }
  };
  const plain = (value, depth) => {
    if (value instanceof Error) return value.name + ": " + value.message;
    if (value === undefined) return "undefined";
    if (typeof value === "bigint" || typeof value === "symbol" || typeof value === "function") return String(value);
    if (value === null || typeof value !== "object") return value;
    if (depth >= 4) return "[truncated]";
    if (Array.isArray(value)) return value.slice(0, 50).map((item) => plain(item, depth + 1));
    const copy = {};
    for (const key of Object.keys(value).slice(0, 50)) {
      try {
        copy[key] = plain(value[key], depth + 1);
      } catch {
        copy[key] = "[unreadable]";
      }
    }
    return copy;
  };
  const flush = () => {
    if (timer !== undefined) g.clearTimeout(timer);
    timer = undefined;
    const entries = queue;
    queue = [];
    if (entries.length === 0) return;
    try {
      g.fetch(route, {
        method: "POST",
        keepalive: true,
        headers: { "content-type": "application/json", "x-stackra-browser-log": "1" },
        body: JSON.stringify({ entries }),
      }).catch(() => {});
    } catch {}
  };
  const report = (entry) => {
    if (sent >= perPage) return;
    sent += 1;
    const last = sent === perPage;
    queue.push(
      Object.assign(
        last
          ? { kind: "console", level: "warn", message: "stackra: this page reached " + perPage + " browser log entries; later ones are not sent" }
          : entry,
        { url: page(), time: new Date().toISOString() },
      ),
    );
    if (queue.length >= 25 || last) flush();
    else if (timer === undefined) timer = g.setTimeout(flush, 250);
  };
  g.addEventListener("error", (event) => {
    const error = event.error;
    report({
      kind: "error",
      level: "error",
      message: error instanceof Error ? plain(error, 0) : String(event.message),
      stack: error instanceof Error && typeof error.stack === "string" ? error.stack : event.filename ? event.filename + ":" + event.lineno + ":" + event.colno : undefined,
    });
  });
  g.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    report(
      reason instanceof Error
        ? {
            kind: "rejection",
            level: "error",
            message: "Unhandled rejection: " + plain(reason, 0),
            stack: typeof reason.stack === "string" ? reason.stack : undefined,
          }
        : { kind: "rejection", level: "error", args: ["Unhandled rejection:", plain(reason, 0)] },
    );
  });
  for (const [method, level] of [["error", "error"], ["warn", "warn"]]) {
    const original = g.console[method];
    if (typeof original !== "function") continue;
    g.console[method] = function (...args) {
      try {
        const error = args.find((arg) => arg instanceof Error);
        report({
          kind: "console",
          level,
          args: args.slice(0, 50).map((arg) => plain(arg, 0)),
          stack: error !== undefined && typeof error.stack === "string" ? error.stack : undefined,
        });
      } catch {}
      return original.apply(this, args);
    };
  }
  g.addEventListener("pagehide", flush);
})();
`;
}
