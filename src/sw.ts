/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare let self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()
clientsClaim()

// Push Notification Event Listener
self.addEventListener('push', (event) => {
    if (!event.data) return

    try {
        const data = event.data.json()
        const title = data.title || 'Willow'
        const options: NotificationOptions = {
            body: data.body || 'New update from Willow',
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png', // Android small icon usually needs transparency, but using same for now
            data: data.url || '/',
        }

        event.waitUntil(
            self.registration.showNotification(title, options)
        )
    } catch (err) {
        console.error('Error processing push event:', err)
    }
})

// Notification Click Listener
self.addEventListener('notificationclick', (event) => {
    event.notification.close()

    const urlToOpen = event.notification.data || '/'

    event.waitUntil(
        self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true,
        }).then((clientList) => {
            // If a window is already open, focus it
            if (clientList.length > 0) {
                // Cast to WindowClient to access focus()
                const client = clientList[0] as WindowClient
                if (client.focus) {
                    return client.focus()
                }
            }
            // Otherwise open a new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen)
            }
            return null
        })
    )
})
