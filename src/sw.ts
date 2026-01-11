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

        let body = data.body || 'New update from Willow'

        // Format time locally if due_date is present
        if (data.due_date) {
            try {
                const date = new Date(data.due_date)
                const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                body = `Due at ${timeStr}`
            } catch (e) {
                console.error('Date formatting error:', e)
            }
        }

        const options: NotificationOptions = {
            body: body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            data: data.url || '/',
            vibrate: [200, 100, 200], // Vibration pattern
            tag: 'willow-task', // Grouping tag
            renotify: true, // Force notification/sound even if tag exists
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
