import { precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
