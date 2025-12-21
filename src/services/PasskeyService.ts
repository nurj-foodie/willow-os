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
    isSupported: () => {
        return (
            window.PublicKeyCredential !== undefined &&
            typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
        );
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
            const { data: options, error: optError } = await supabase.functions.invoke('webauthn-registration', {
                body: { action: 'generate-options', userId }
            });

            if (optError) throw optError;

            // Step 2: Trigger the browser's native Passkey prompt
            const regResponse = await startRegistration(options);

            // Step 3: Verify the response with our Edge Function
            const { data: verification, error: verError } = await supabase.functions.invoke('webauthn-registration', {
                body: { action: 'verify-registration', response: regResponse, userId }
            });

            if (verError) throw verError;
            return verification;
        } catch (err: any) {
            console.error('Passkey Registration Failed:', err);
            // Higher resolution logging for debugging
            if (err.name === 'NotAllowedError') {
                console.warn('Biometrics: User cancelled or timed out.');
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
    login: async () => {
        try {
            // Step 1: Request options
            const { data: options, error: optError } = await supabase.functions.invoke('webauthn-authentication', {
                body: { action: 'generate-options' }
            });

            if (optError) throw optError;

            // Step 2: Trigger Biometrics prompt
            const authResponse = await startAuthentication(options);

            // Step 3: Verify and log in
            const { data: session, error: verError } = await supabase.functions.invoke('webauthn-authentication', {
                body: { action: 'verify-authentication', response: authResponse }
            });

            if (verError) throw verError;

            // Step 4: Manually set the session in Supabase Auth
            if (session?.access_token) {
                await supabase.auth.setSession(session);
            }

            return session;
        } catch (err) {
            console.error('Passkey Login Failed:', err);
            throw err;
        }
    }
};
