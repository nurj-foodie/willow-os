import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { DeviceVerification } from './DeviceVerification';

interface AuthProps {
    onOpenLegal: (type: 'privacy' | 'terms') => void;
}

export const Auth: React.FC<AuthProps> = ({ onOpenLegal }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [demoMode, setDemoMode] = useState(false);
    const [needsDeviceVerification, setNeedsDeviceVerification] = useState(false);
    const [pendingEmail, setPendingEmail] = useState('');

    // Check if this is a new device after successful OAuth
    useEffect(() => {
        const checkAuthState = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                // Check if device is recognized
                const deviceId = localStorage.getItem('willow_device_id');

                if (!deviceId) {
                    // New device - need OTP verification
                    setNeedsDeviceVerification(true);
                    setPendingEmail(session.user.email || '');

                    // Send OTP
                    await supabase.auth.signInWithOtp({
                        email: session.user.email!,
                        options: { shouldCreateUser: false }
                    });
                } else {
                    // Device recognized - user will be logged in automatically by App.tsx
                }
            }
        };

        checkAuthState();
    }, []);

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                }
            });

            if (error) {
                console.error('Google OAuth Error:', error);
                alert(`Could not sign in with Google: ${error.message}`);
                setLoading(false);
            }
            // Don't set loading to false - we're redirecting
        } catch (err: any) {
            console.error('Google OAuth Exception:', err);
            alert('Network error. Please check your connection.');
            setLoading(false);
        }
    };

    const handleDemoLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        // Store demo email in localStorage
        localStorage.setItem('willow_demo_email', email);
        // Trigger page reload to load app with demo user
        window.location.reload();
    };

    const handleDeviceVerified = () => {
        // Device verification complete - reload to enter app
        window.location.reload();
    };

    // Show device verification screen if needed
    if (needsDeviceVerification) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <DeviceVerification
                    email={pendingEmail}
                    onVerified={handleDeviceVerified}
                    onBack={() => {
                        setNeedsDeviceVerification(false);
                        supabase.auth.signOut();
                    }}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-16 h-16 rounded-3xl bg-matcha/20 flex items-center justify-center text-3xl mb-6 animate-bounce">
                {demoMode ? '🎭' : '🌿'}
            </div>
            <h1 className="text-3xl font-serif font-bold text-charcoal mb-2">
                {demoMode ? 'Demo Mode' : 'Welcome to your flow.'}
            </h1>
            <div className="space-y-2 mb-8">
                <p className="text-charcoal/50 font-sans italic max-w-xs">
                    {demoMode
                        ? 'Try Willow without signing up. All data stays on your device.'
                        : 'Sign in with Google to sync across devices.'}
                </p>
                <button
                    onClick={() => setDemoMode(!demoMode)}
                    className="text-[10px] text-charcoal/30 hover:text-matcha transition-colors underline"
                >
                    {demoMode ? '← Back to Login' : 'Try Demo Mode'}
                </button>
            </div>

            {demoMode ? (
                <form onSubmit={handleDemoLogin} className="w-full max-w-sm space-y-4">
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/20 group-focus-within:text-matcha transition-colors" size={20} />
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 rounded-full bg-white border border-clay/10 focus:border-matcha focus:ring-4 focus:ring-matcha/5 outline-none transition-all font-sans text-charcoal"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-full bg-charcoal text-white font-medium hover:bg-matcha hover:text-charcoal transition-all disabled:opacity-50"
                    >
                        {loading ? 'Entering...' : 'Enter Demo 🎭'}
                    </button>
                    <div className="pt-4 text-[10px] text-charcoal/30 font-medium">
                        Demo mode stores data locally. No account needed.
                    </div>
                </form>
            ) : (
                <div className="w-full max-w-sm space-y-6">
                    <motion.button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-5 rounded-3xl bg-white border-2 border-charcoal/10 text-charcoal font-bold text-lg shadow-md hover:shadow-xl hover:border-matcha transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={24} className="animate-spin" />
                                Connecting...
                            </>
                        ) : (
                            <>
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </>
                        )}
                    </motion.button>

                    <div className="pt-2 text-[10px] text-charcoal/30 font-medium">
                        By signing in, you agree to our{' '}
                        <button onClick={() => onOpenLegal('privacy')} className="underline hover:text-matcha">Privacy Policy</button> and{' '}
                        <button onClick={() => onOpenLegal('terms')} className="underline hover:text-matcha">Terms</button>.
                    </div>
                </div>
            )}
        </div>
    );
};
