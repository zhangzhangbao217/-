const CACHE_NAME = 'love-nest-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo.png',
  '/apple-touch-icon.png'
];

// 安装 Service Worker 并缓存资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 激活 Service Worker 并清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});

// 拦截请求并返回缓存（网络优先策略）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// 处理来自主线程的消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, data } = event.data.payload;
    
    const options = {
      body,
      icon,
      badge: '/logo.png', // 顶部状态栏小图标
      data,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: '去回复' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// 处理点击通知事件
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 如果已经有打开的页面，则聚焦它
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // 否则打开新页面
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
