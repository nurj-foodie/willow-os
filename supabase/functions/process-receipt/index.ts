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

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // 1. Download image from Storage
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('receipts')
            .download(filePath)

        if (downloadError) throw downloadError

        // 2. Convert to base64 (chunked to avoid stack overflow on large images)
        const arrayBuffer = await fileData.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        // Convert in chunks to avoid "Maximum call stack size exceeded"
        const chunkSize = 8192
        let binaryString = ''
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize)
            binaryString += String.fromCharCode(...chunk)
        }
        const base64Image = btoa(binaryString)

        // 3. Send to Gemini 2.0 Flash (upgraded from 1.5 - obsolete)
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`

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

        const result = await response.json()
        const text = result.candidates[0].content.parts[0].text
        const extractedData = JSON.parse(text)

        // 4. Return result
        return new Response(JSON.stringify(extractedData), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        })
    }
})
