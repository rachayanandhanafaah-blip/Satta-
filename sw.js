// Satta7 service worker: ใช้แบบออฟไลน์ได้ · ไฟล์แอปดึงจากเน็ตก่อน (อัปเดตอัตโนมัติเมื่อวาง satta7.js ใหม่) ถ้าไม่มีเน็ตใช้ของที่เก็บไว้
const CACHE = "satta7-web-1";
const FILES = ["./", "index.html", "host.js", "satta7.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET" || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; })
    .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match("index.html"))));
});
