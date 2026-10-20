/**
 * Stackra file contract:
 * Purpose: browser entry of @figentra/{{NAME}} — mounts the code-based React Router 7 router into #root.
 * Owner: the app owner · Secrets: forbidden (everything shipped to the browser is public)
 */
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import { routes } from "./routes";

const root = document.getElementById("root");
if (!root) throw new Error("index.html is missing #root");

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={createBrowserRouter(routes)} />
  </StrictMode>,
);
