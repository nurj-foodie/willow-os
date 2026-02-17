import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
    // CORS headers
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        })
    }

    try {
        const { filePath } = await req.json()
        if (!filePath) throw new Error('No file path provided')

        // Validate env vars
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured')
        if (!SUPABASE_URL) throw new Error('SUPABASE_URL not configured')
        if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // 1. Download image from Storage
        console.log('[process-receipt] Downloading:', filePath)
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('receipts')
            .download(filePath)

        if (downloadError) throw new Error(`Storage download failed: ${downloadError.message}`)

        // 2. Convert to base64 (chunked to avoid stack overflow on large images)
        const arrayBuffer = await fileData.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        console.log('[process-receipt] File size:', uint8Array.length, 'bytes')

        // Convert in chunks to avoid "Maximum call stack size exceeded"
        const chunkSize = 8192
        let binaryString = ''
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize)
            binaryString += String.fromCharCode(...chunk)
        }
        const base64Image = btoa(binaryString)

        // 3. Send to Gemini 2.0 Flash (stable)
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

        console.log('[process-receipt] Calling Gemini API...')
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Extract receipt data. Return ONLY a JSON object with: { \"amount\": number, \"merchant\": string, \"category\": \"Food & Drink\" | \"Transport\" | \"Wellness\" | \"Shopping\" | \"bills\" | \"Other\", \"date\": \"ISO date string\" }. If category is unclear, use 'Other'." },
                        { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                    ]
                }],
                generationConfig: {
                    response_mime_type: "application/json"
                }
            })
        })

        console.log('[process-receipt] Gemini status:', response.status)

        if (!response.ok) {
            const errorBody = await response.text()
            console.error('[process-receipt] Gemini error:', errorBody)
            throw new Error(`Gemini API error (${response.status}): ${errorBody.substring(0, 200)}`)
        }

        const result = await response.json()

        if (!result.candidates || !result.candidates[0]?.content?.parts?.[0]?.text) {
            console.error('[process-receipt] Unexpected Gemini response:', JSON.stringify(result).substring(0, 500))
            throw new Error('Gemini returned unexpected response format')
        }

        const text = result.candidates[0].content.parts[0].text
        console.log('[process-receipt] Gemini text:', text)
        const extractedData = JSON.parse(text)

        // 4. Return result
        return new Response(JSON.stringify(extractedData), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        })

    } catch (error) {
        console.error('[process-receipt] Error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        })
    }
})
