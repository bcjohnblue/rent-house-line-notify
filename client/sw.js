/* eslint-disable */
self.addEventListener('push', event => {
  const data = event.data && event.data.json();

  const title = data.title ?? "a default message if nothing was passed to us";
  const body = data.body ?? "We have received a push message";
  const tag = data.tag ?? "push-simple-demo-notification-tag";
  const icon = data.icon ?? '/icon.png';

  event.waitUntil(
    self.registration.showNotification(title, { body, icon, tag })
  )

  // self.registration.showNotification(data.title, {
  //   body: 'Yay it works!',
  // });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  let clickResponsePromise = Promise.resolve();
    clickResponsePromise = clients.openWindow("https://github.com/thedamian/Web-Push-Example.git");

  event.waitUntil(
    Promise.all([
      clickResponsePromise,
      self.analytics.trackEvent('notification-click'),
    ])
  );
});

self.addEventListener('notificationclose', function(event) {
  event.waitUntil(
    Promise.all([
      self.analytics.trackEvent('notification-close'),
    ])
  );
});