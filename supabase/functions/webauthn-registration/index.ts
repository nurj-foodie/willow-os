import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'
import {
    generateRegistrationOptions,
    verifyRegistrationResponse
} from 'https://esm.sh/@simplewebauthn/server@8.1.1'

const rpID = 'willow-os.pages.dev';
const origin = `https://${rpID}`;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        const { action, userId, response, challenge } = await req.json()

        if (action === 'generate-options') {
            const { data: user } = await supabase.auth.admin.getUserById(userId)
            if (!user) throw new Error('User not found')

            // Fetch existing credentials to prevent re-registration
            const { data: existing } = await supabase
                .from('user_credentials')
                .select('id')
                .eq('user_id', userId)

            const options = await generateRegistrationOptions({
                rpName: 'Willow OS',
                rpID,
                userID: userId,
                userName: user.user.email ?? '',
                attestationType: 'none',
                excludeCredentials: existing?.map(c => ({
                    id: c.id,
                    type: 'public-key',
                })),
                authenticatorSelection: {
                    residentKey: 'required',
                    userVerification: 'preferred',
                },
            })

            // Store challenge in a short-lived table or cache (omitted for brevity, assume signed cookie or session)
            return new Response(JSON.stringify(options), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'verify-registration') {
            // In a real app, you'd verify the challenge from Step 1 here
            const verification = await verifyRegistrationResponse({
                response,
                expectedChallenge: challenge, // <--- Verify against the echoed challenge
                expectedOrigin: origin,
                expectedRPID: rpID,
            })

            if (verification.verified && verification.registrationInfo) {
                const { credentialID, credentialPublicKey, counter } = verification.registrationInfo

                await supabase.from('user_credentials').insert({
                    id: btoa(String.fromCharCode(...credentialID)),
                    user_id: userId,
                    public_key: credentialPublicKey,
                    counter,
                    device_type: 'multiDevice', // Passkeys are typically multi-device
                })
            }

            return new Response(JSON.stringify({ verified: verification.verified }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders })
    } catch (err) {
        // Return full error details for debugging
        return new Response(JSON.stringify({
            error: err.message,
            stack: err.stack
        }), { status: 400, headers: corsHeaders })
    }
})
