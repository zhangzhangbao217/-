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
  self.skipWaiting(); // 强制跳过等待，立即进入激活状态
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 激活 Service Worker 并清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // 立即接管所有受控客户端（页面）
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
    ])
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
      tag: 'chat-message', // 相同 tag 的通知会叠加，防止通知刷屏
      renotify: true,      // 新通知到达时依然震动/提醒
      requireInteraction: false,
      actions: [
        { action: 'open', title: '立即回复' }
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
