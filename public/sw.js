/**
 * Service worker for Caticorn Cave Rescue.
 *
 * Strategy (so new deploys always win, but the game still works offline):
 * - NAVIGATIONS / HTML (the entry document): network-FIRST, falling back to the
 *   cache only when offline. The HTML references content-hashed asset URLs, so
 *   serving fresh HTML means a returning player always pulls the latest build's
 *   JS/CSS rather than being pinned to a stale shell by the SW.
 * - Everything else same-origin (the hashed /_astro/* bundles, icons, manifest):
 *   cache-FIRST — they're immutable per build (the hash changes when content
 *   changes), so caching them is safe + fast and gives offline support.
 *
 * Versioned cache name; the activate handler purges old versions. Bump
 * CACHE_VERSION on a significant release to force a full refetch.
 */

const CACHE_PREFIX = "caticorn-";
const CACHE_VERSION = "v2";
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

	const cacheable = (response) =>
		response && response.status === 200 && response.type === "basic";
	const store = (response) => {
		const clone = response.clone();
		caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
		return response;
	};

	if (request.mode === "navigate" || request.destination === "document") {
		// Network-first for the entry HTML so fresh builds (new hashed assets)
		// always win; fall back to the cached shell only when offline.
		event.respondWith(
			fetch(request)
				.then((response) => (cacheable(response) ? store(response) : response))
				.catch(() => caches.match(request).then((c) => c ?? caches.match("/"))),
		);
		return;
	}

	// Cache-first for hashed/static assets: immutable per build, fast + offline.
	event.respondWith(
		caches.match(request).then((cached) => {
			if (cached) return cached;
			return fetch(request).then((response) =>
				cacheable(response) ? store(response) : response,
			);
		}),
	);
});
