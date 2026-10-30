/**
 * Stackra file contract:
 * Purpose: `BROWSE_SCRIPT`: the registry browser's one script, inlined in every page: in-place page swaps for links on
 *          this host (fetch, parse, swap the body, with the page progress bar and a view transition), the back and
 *          forward buttons, and search as you type.
 * Boundary: a constant only. The pages work without it (plain links and a GET form); it never sends a token, never
 *           reads storage and never loads anything but this host's own pages. The CSP allows it by its SHA-256.
 * Runtime: browser
 * Governing contract: ADR 0453; STA-1608 spec FR-005.
 */

/** The script's source; plain ES2020, no build step. */
export const BROWSE_SCRIPT = `(() => {
  "use strict";
  let current = null;
  const bar = () => document.getElementById("progress");
  const setBar = (state) => {
    const el = bar();
    if (el) el.dataset.state = state;
  };
  const swap = (doc, url, push, focusSearch) => {
    document.title = doc.title;
    document.documentElement.lang = doc.documentElement.lang;
    document.documentElement.dir = doc.documentElement.dir;
    document.body.replaceChildren(...Array.from(doc.body.childNodes));
    if (push === "push") history.pushState(null, "", url);
    if (push === "replace") history.replaceState(null, "", url);
    if (focusSearch) {
      const input = document.querySelector("input[name=q]");
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    } else {
      const target = new URL(url, location.href).hash.slice(1);
      const anchor = target && document.getElementById(target);
      if (anchor) anchor.scrollIntoView();
      else if (push === "push") window.scrollTo(0, 0);
      const heading = document.querySelector("main h1");
      if (heading && push === "push") heading.focus({ preventScroll: true });
    }
  };
  const go = async (url, push, focusSearch) => {
    if (current) current.abort();
    const controller = new AbortController();
    current = controller;
    setBar("loading");
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { accept: "text/html" } });
      const type = response.headers.get("content-type") || "";
      if (!type.startsWith("text/html")) throw new Error("not a page");
      const doc = new DOMParser().parseFromString(await response.text(), "text/html");
      if (controller.signal.aborted) return;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (document.startViewTransition && !reduce && !focusSearch)
        await document.startViewTransition(() => swap(doc, url, push, focusSearch)).updateCallbackDone;
      else swap(doc, url, push, focusSearch);
      setBar("done");
    } catch (error) {
      if (controller.signal.aborted) return;
      location.assign(url);
    } finally {
      if (current === controller) current = null;
    }
  };
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!link || link.target || link.hasAttribute("download")) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
    event.preventDefault();
    go(url.href, "push", false);
  });
  window.addEventListener("popstate", () => go(location.href, null, false));
  const searchUrl = (form) => {
    const url = new URL(form.action, location.href);
    const q = new FormData(form).get("q");
    if (typeof q === "string" && q.trim() !== "") url.searchParams.set("q", q.trim());
    return url.href;
  };
  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.getAttribute("role") !== "search") return;
    event.preventDefault();
    go(searchUrl(form), "push", true);
  });
  let typing = 0;
  document.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.name !== "q" || !input.form) return;
    clearTimeout(typing);
    const form = input.form;
    typing = setTimeout(() => {
      const onList = location.pathname === new URL(form.action, location.href).pathname;
      go(searchUrl(form), onList ? "replace" : "push", true);
    }, 200);
  });
})();
`;
