import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push'

const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Configure VAPID
const vapidKeys = {
    publicKey: Deno.env.get('VAPID_PUBLIC_KEY')!,
    privateKey: Deno.env.get('VAPID_PRIVATE_KEY')!,
    subject: Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@willow.app'
}

webpush.setVapidDetails(
    vapidKeys.subject,
    vapidKeys.publicKey,
    vapidKeys.privateKey
)

Deno.serve(async (req) => {
    try {
        // 1. Find tasks due in the next 10 minutes that haven't been notified
        // We check a window: due_date > now AND due_date < now + 10 mins
        const now = new Date()
        const tenMinutesLater = new Date(now.getTime() + 10 * 60000)

        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*, user_id')
            .eq('status', 'todo')
            .eq('notified', false)
            .gt('due_date', now.toISOString())
            .lt('due_date', tenMinutesLater.toISOString())

        if (tasksError) throw tasksError

        if (!tasks || tasks.length === 0) {
            return new Response(JSON.stringify({ message: 'No tasks to notify' }), {
                headers: { 'Content-Type': 'application/json' },
            })
        }

        console.log(`Found ${tasks.length} tasks to notify.`)
        const results = []

        // 2. Process each task
        for (const task of tasks) {
            // Get subscriptions for this user
            const { data: subs } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', task.user_id)

            if (!subs || subs.length === 0) continue

            const payload = JSON.stringify({
                title: `🌿 Willow: ${task.title}`,
                body: `Due at ${new Date(task.due_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
                url: '/'
            })

            // Send to all user devices
            const promises = subs.map(async (sub) => {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth }
                        },
                        payload
                    )
                    return { success: true, endpoint: sub.endpoint }
                } catch (err) {
                    // If 410 Gone, remove subscription
                    if (err.statusCode === 410) {
                        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
                    }
                    return { success: false, error: err }
                }
            })

            await Promise.all(promises)

            // 3. Mark task as notified
            await supabase.from('tasks').update({ notified: true }).eq('id', task.id)
            results.push(task.id)
        }

        return new Response(JSON.stringify({ processed: results }), {
            headers: { 'Content-Type': 'application/json' },
        })

    } catch (err) {
        console.error(err)
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})
