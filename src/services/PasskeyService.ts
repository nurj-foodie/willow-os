import { supabase } from '../lib/supabase';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

/**
 * Service to manage WebAuthn (Passkey) ceremonies.
 * This bridges the browser's biometric prompts with our Supabase Edge Functions.
 */
export const PasskeyService = {
    /**
     * Check if the current device/browser supports WebAuthn Passkeys.
     */
    isSupported: async () => {
        if (!window.PublicKeyCredential) return false;

        // Basic check for the API functions
        if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
            return false;
        }

        try {
            // Actual check for hardware/platform support (Promise)
            const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            return available;
        } catch (e) {
            console.warn('WebAuthn availability check failed:', e);
            // Fallback: if API exists, assume true to be safe and let user try
            return true;
        }
    },

    /**
     * Sarah's Journey: Registration (Setup Biometrics)
     * 1. Get registration options from Edge Function.
     * 2. Trigger browser's Biometrics prompt.
     * 3. Send result back to Edge Function for verification and storage.
     */
    register: async (userId: string) => {
        try {
            // Step 1: Request options from our future Edge Function
            // Note: Replace with actual function URL once deployed
            // Step 1: Request options (Direct fetch)
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const functionUrl = 'https://upfhsnupdfyzqzdwwqmt.supabase.co/functions/v1/webauthn-registration';

            console.log('Fetching registration options from:', functionUrl);

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${anonKey}`
                },
                body: JSON.stringify({ action: 'generate-options', userId })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Edge Function Error (${response.status}): ${text}`);
            }

            const options = await response.json();




            // Step 2: Trigger the browser's native Passkey prompt
            const regResponse = await startRegistration(options);

            // Step 3: Verify the response with our Edge Function
            // Note: We pass the challenge back because our Edge Functions are stateless (simplification for personal app)
            // Step 3: Verify the response (Direct fetch)
            console.log('Verifying registration with server...');

            const verifyResponse = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${anonKey}`
                },
                body: JSON.stringify({
                    action: 'verify-registration',
                    response: regResponse,
                    userId,
                    challenge: options.challenge
                })
            });

            if (!verifyResponse.ok) {
                const text = await verifyResponse.text();
                throw new Error(`Registration Verification Failed (${verifyResponse.status}): ${text}`);
            }

            const verification = await verifyResponse.json();



            return verification;
        } catch (err: any) {
            console.error('Passkey Registration Failed:', err);
            // Higher resolution logging for debugging
            if (err.name === 'NotAllowedError') {
                console.warn('Biometrics: User cancelled or timed out.');
            } else if (err.message?.includes('Failed to send a request')) {
                throw new Error("Cannot reach Edge Function. Sila pastikan abang dah run 'npx supabase functions deploy webauthn-registration' kat terminal!");
            } else if (err.message?.includes('invoke')) {
                console.error('Biometrics: Edge Function connection failed. Check Supabase deployment.');
            }
            throw err;
        }
    },

    /**
     * Sarah's Journey: Login (Instant Entry)
     * 1. Get authentication options from Edge Function.
     * 2. Trigger browser's Biometrics prompt.
     * 3. Send result back to Edge Function to get a Supabase Auth session.
     */
    login: async (onReady?: () => void) => {
        try {
            // Step 1: Request options (Direct fetch to bypass client hang)
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const functionUrl = 'https://upfhsnupdfyzqzdwwqmt.supabase.co/functions/v1/webauthn-authentication';

            console.log('Fetching options from:', functionUrl);

            // Manual Fetch to guarantee network control
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${anonKey}`
                },
                body: JSON.stringify({ action: 'generate-options' })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Edge Function Error (${response.status}): ${text}`);
            }

            const options = await response.json();

            // Step 2: Trigger Biometrics prompt
            if (onReady) onReady();

            // DEBUG: Alert before starting auth to confirm options
            console.log('Starting Auth with options:', options);
            if (options.allowCredentials?.length === 0) {
                console.warn('Warning: allowCredentials is empty. This might prevent prompting on some devices.');
            }

            const authResponse = await startAuthentication(options);
            console.log('Auth Response received:', authResponse);

            // Step 3: Verify and log in (Direct fetch)
            console.log('Verifying assertion with server...');

            const verifyResponse = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${anonKey}`
                },
                body: JSON.stringify({
                    action: 'verify-authentication',
                    response: authResponse,
                    challenge: options.challenge
                })
            });

            if (!verifyResponse.ok) {
                const text = await verifyResponse.text();
                throw new Error(`Verification Failed (${verifyResponse.status}): ${text}`);
            }

            const session = await verifyResponse.json();

            // Step 4: Manually set the session in Supabase Auth
            if (session?.access_token) {
                await supabase.auth.setSession(session);
            }

            return session;
        } catch (err: any) {
            console.error('Passkey Login Failed:', err);

            // DEBUG: Explicit alert for failure
            alert(`DEBUG: Auth Failed. Error Name: ${err.name}, Message: ${err.message}`);

            if (err.message?.includes('Failed to send a request')) {
                throw new Error("Cannot reach Edge Function. Sila pastikan abang dah run 'npx supabase functions deploy webauthn-authentication' kat terminal!");
            }
            throw err;
        }
    }
};
