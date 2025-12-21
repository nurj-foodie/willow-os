import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'
import {
    generateAuthenticationOptions,
    verifyAuthenticationResponse
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
        const { action, response, challenge } = await req.json()

        if (action === 'generate-options') {
            const options = await generateAuthenticationOptions({
                rpID,
                allowCredentials: [], // Allow any credential from this RP
                userVerification: 'preferred',
            })
            return new Response(JSON.stringify(options), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'verify-authentication') {
            // 1. Find the credential in DB
            const { data: credential } = await supabase
                .from('user_credentials')
                .select('*')
                .eq('id', response.id)
                .single()

            if (!credential) throw new Error('Credential not found')

            // 2. Verify assertion
            const verification = await verifyAuthenticationResponse({
                response,
                expectedChallenge: challenge, // <--- Verify against the echoed challenge
                expectedOrigin: origin,
                expectedRPID: rpID,
                authenticator: {
                    credentialID: credential.id,
                    credentialPublicKey: credential.public_key,
                    counter: credential.counter,
                },
            })

            if (verification.verified) {
                // 3. Update counter
                await supabase
                    .from('user_credentials')
                    .update({ counter: verification.authenticationInfo.newCounter })
                    .eq('id', credential.id)

                // 4. Generate a Supabase session (Service Role hack or custom JWT)
                // For Sarah's sake, we'll return a magic link or trigger a custom sign-in
                const { data: magic } = await supabase.auth.admin.generateLink({
                    type: 'magiclink',
                    email: (await supabase.auth.admin.getUserById(credential.user_id)).data.user.email
                })

                return new Response(JSON.stringify({ access_token: magic.properties.access_token }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            return new Response(JSON.stringify({ verified: false }), { status: 401, headers: corsHeaders })
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders })
    } catch (err) {
    })
