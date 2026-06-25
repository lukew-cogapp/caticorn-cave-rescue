/**
 * Service worker for Caticorn Cave Rescue.
 *
 * Strategy: cache-first for same-origin GETs, with a versioned cache name so
 * old entries are purged on activate. Keeps the game launchable offline after
 * the first visit.
 *
 * Cache version: bump CACHE_VERSION when you want all clients to refetch assets
 * (e.g. after a significant release). The activate handler deletes any cache
 * whose name starts with CACHE_PREFIX but doesn't match the current version.
 */

const CACHE_PREFIX = "caticorn-";
const CACHE_VERSION = "v1";
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;

/** Resources to pre-cache on install (the app shell). */
const PRECACHE_URLS = ["/", "/favicon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(PRECACHE_URLS))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
						.map((k) => caches.delete(k)),
				),
			)
			.then(() => self.clients.claim()),
	);
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	// Only intercept same-origin GETs. Let cross-origin (CDN, analytics) fall
	// through to the network unmodified.
	if (request.method !== "GET") return;
	try {
		const url = new URL(request.url);
		if (url.origin !== self.location.origin) return;
	} catch {
		return;
	}

	event.respondWith(
		caches.match(request).then((cached) => {
			if (cached) return cached;
			return fetch(request).then((response) => {
				// Only cache successful same-origin responses (skip 4xx, opaque, etc.).
				if (!response || response.status !== 200 || response.type !== "basic") {
					return response;
				}
				const clone = response.clone();
				caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
				return response;
			});
		}),
	);
});
