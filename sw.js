/* Service worker mínimo da Lírio das Águas.
   NÃO faz cache (zero risco de versão velha) — existe só para habilitar a instalação do app (PWA).
   Toda requisição vai direto pra rede; se estiver offline, responde 504 (o app é online). */
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function(e){
  e.respondWith(fetch(e.request).catch(function(){ return new Response('', { status: 504, statusText: 'offline' }); }));
});
