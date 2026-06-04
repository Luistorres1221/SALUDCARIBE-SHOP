import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

// Keep the backend alive by pinging every 4 minutes while the app is open.
// This prevents free-tier hosting services (Render, Railway, etc.) from
// suspending the container due to inactivity.
(function startKeepAlive() {
  const url = `${import.meta.env.VITE_API_BASE_URL ?? ""}/api/ping`;
  const ping = () => fetch(url).catch(() => {});
  ping();
  setInterval(ping, 5 * 60 * 1000);
})();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

const router = createRouter({ routeTree, context: {}, scrollRestoration: true });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
