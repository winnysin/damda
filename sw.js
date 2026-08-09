// 담다 PWA 서비스워커 (2026-08-07 신설, 2026-08-08 브랜드 리뉴얼)
// 앱을 홈화면에 설치 가능하게 만들고, 백그라운드(앱이 닫혀있어도) 푸시 알림을 받아
// 실제 OS 알림 배너로 띄워주는 역할을 합니다. 캐싱/오프라인 지원은 이번 파일럿 범위 밖입니다
// (원칙10: 아직 필요하다고 확인되지 않은 기능은 만들지 않음) — 설치 가능성 + 푸시 수신에만 집중.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 서버(Supabase send-push 함수)가 보낸 푸시 메시지를 실제 OS 알림으로 표시합니다.
self.addEventListener('push', (event) => {
  let data = { title: '담다 알림', body: '' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }
  const title = data.title || '담다 알림';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.type || 'damda-notify',
    renotify: true,
    data: { url: '/' },
    ...(data.severity === 'danger' ? { requireInteraction: true } : {})
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// 알림을 탭하면 이미 열려있는 담다 탭이 있으면 그걸로 포커스하고, 없으면 새로 엽니다.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const url = (event.notification.data && event.notification.data.url) || '/';
      const existing = clientsArr.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
