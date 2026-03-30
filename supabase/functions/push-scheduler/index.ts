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
        // Early exit: check if ANY push subscriptions exist at all
        const { count: subCount } = await supabase
            .from('push_subscriptions')
            .select('id', { count: 'exact', head: true })

        if (!subCount || subCount === 0) {
            return new Response(JSON.stringify({ message: 'No push subscriptions registered, skipping' }), {
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // 1. Find tasks due in the next 30 minutes (upcoming)
        const now = new Date()
        const thirtyMinutesLater = new Date(now.getTime() + 30 * 60000)

        const { data: upcomingTasks, error: upcomingError } = await supabase
            .from('tasks')
            .select('id, title, user_id, due_date')
            .eq('status', 'todo')
            .eq('notified', false)
            .gt('due_date', now.toISOString())
            .lt('due_date', thirtyMinutesLater.toISOString())
            .limit(50)

        if (upcomingError) throw upcomingError

        // 2. Find overdue tasks — BOUNDED to last 24 hours only
        // Tasks older than 24h overdue are no longer notified to avoid noise
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60000)

        const { data: overdueTasks, error: overdueError } = await supabase
            .from('tasks')
            .select('id, title, user_id, due_date')
            .eq('status', 'todo')
            .eq('notified', false)
            .lt('due_date', now.toISOString())
            .gt('due_date', twentyFourHoursAgo.toISOString())
            .limit(50)

        if (overdueError) throw overdueError

        // Combine both lists with a type tag
        const allTasks = [
            ...(upcomingTasks || []).map(t => ({ ...t, _type: 'upcoming' })),
            ...(overdueTasks || []).map(t => ({ ...t, _type: 'overdue' })),
        ]

        if (allTasks.length === 0) {
            return new Response(JSON.stringify({ message: 'No tasks to notify' }), {
                headers: { 'Content-Type': 'application/json' },
            })
        }

        console.log(`[push-scheduler] Found ${allTasks.length} tasks (${upcomingTasks?.length || 0} upcoming, ${overdueTasks?.length || 0} overdue). Active subs: ${subCount}`)
        const results = []

        // 3. Process each task
        for (const task of allTasks) {
            // Get subscriptions for this user
            const { data: subs } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', task.user_id)

            if (!subs || subs.length === 0) continue

            const isOverdue = task._type === 'overdue'

            const payload = JSON.stringify({
                title: isOverdue
                    ? `⏰ Overdue: ${task.title}`
                    : `🌿 Willow: ${task.title}`,
                body: isOverdue ? 'This task is overdue!' : 'Time to flow',
                due_date: task.due_date,
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
