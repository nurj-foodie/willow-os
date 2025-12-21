import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Sparkles, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';
import { PasskeyService } from '../../services/PasskeyService';

interface AuthProps {
    onOpenLegal: (type: 'privacy' | 'terms') => void;
}

export const Auth: React.FC<AuthProps> = ({ onOpenLegal }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [supportsPasskey, setSupportsPasskey] = useState(false);
    const [scanStatus, setScanStatus] = useState<'idle' | 'preparing' | 'scanning' | 'success'>('idle');
    const [usePasskey, setUsePasskey] = useState(true);
    const [demoMode, setDemoMode] = useState(false);

    useEffect(() => {
        const checkSupport = async () => {
            const supported = await PasskeyService.isSupported();
            setSupportsPasskey(supported);
        };
        checkSupport();
    }, []);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: true,
                }
            });
            if (error) {
                console.error('OTP Error:', error);
                alert(`Could not send OTP: ${error.message}`);
            } else {
                setStep('otp');
            }
        } catch (err) {
            console.error('OTP Exception:', err);
            alert('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'email'
        });
        if (error) {
            alert(error.message);
        }
        setLoading(false);
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

    const handlePasskeyLogin = async () => {
        setLoading(true);
        setScanStatus('preparing');
        try {
            await PasskeyService.login(() => setScanStatus('scanning'));
            setScanStatus('success');
            // Small delay to show success state before redirect happens
            await new Promise(resolve => setTimeout(resolve, 800));
        } catch (err: any) {
            console.error(err);
            setScanStatus('idle');
            alert(`Login failed: ${err.message}`);
            // Do NOT hide the button on error, let them try again
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-16 h-16 rounded-3xl bg-matcha/20 flex items-center justify-center text-3xl mb-6 animate-bounce">
                {demoMode ? '🎭' : '🌿'}
            </div>
            <h1 className="text-3xl font-serif font-bold text-charcoal mb-2">
                {demoMode ? 'Demo Mode' : (step === 'email' ? 'Welcome to your flow.' : 'Verify your vibe.')}
            </h1>
            <div className="space-y-2 mb-8">
                <p className="text-charcoal/50 font-sans italic max-w-xs">
                    {demoMode
                        ? 'Try Willow without signing up. All data stays on your device.'
                        : (step === 'email'
                            ? 'Enter your space and sync your vibe.'
                            : `Enter the 6-digit code sent to ${email}`)}
                </p>
                <button
                    onClick={() => setDemoMode(!demoMode)}
                    className="text-[10px] text-charcoal/30 hover:text-matcha transition-colors underline"
                >
                    {demoMode ? '← Back to Login' : 'Try Demo Mode'}
                </button>
                {step === 'otp' && (
                    <p className="text-[10px] text-orange-600/60 font-medium uppercase tracking-widest">
                        ⚠️ Do not click the link in the email
                    </p>
                )}
            </div>

            {step === 'email' && demoMode ? (
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
            ) : step === 'email' ? (
                <div className="w-full max-w-sm space-y-6">
                    {supportsPasskey && usePasskey ? (
                        <div className="space-y-4">
                            <motion.button
                                onClick={handlePasskeyLogin}
                                disabled={loading || scanStatus === 'success' || scanStatus === 'preparing'}
                                animate={scanStatus === 'scanning' ? { scale: [1, 0.98, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className={`w-full py-6 rounded-3xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all ${scanStatus === 'success'
                                    ? 'bg-matcha text-charcoal'
                                    : scanStatus === 'scanning'
                                        ? 'bg-charcoal/80 text-white'
                                        : 'bg-charcoal text-white hover:bg-matcha hover:text-charcoal'
                                    }`}
                            >
                                <div className="relative">
                                    {scanStatus === 'scanning' && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 1 }}
                                            animate={{ opacity: 0.5, scale: 2 }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                            className="absolute inset-0 bg-white rounded-full z-0"
                                        />
                                    )}
                                    <Fingerprint size={24} className="relative z-10" />
                                </div>
                                <span>
                                    {scanStatus === 'idle' && "Sign in with Biometrics"}
                                    {scanStatus === 'preparing' && "Connecting securely..."}
                                    {scanStatus === 'scanning' && "Scan Fingerprint on Device..."}
                                    {scanStatus === 'success' && "Verified! Entering..."}
                                </span>
                            </motion.button>
                            <button
                                onClick={() => setUsePasskey(false)}
                                className="text-xs text-charcoal/30 hover:text-charcoal transition-colors underline decoration-dotted"
                            >
                                Use Email instead
                            </button>
                            <div className="pt-2 text-[10px] text-charcoal/30 font-medium">
                                By signing in, you agree to our{' '}
                                <button onClick={() => onOpenLegal('privacy')} className="underline hover:text-matcha">Privacy Policy</button> and{' '}
                                <button onClick={() => onOpenLegal('terms')} className="underline hover:text-matcha">Terms</button>.
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSendOtp} className="space-y-4">
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
                                {loading ? 'Sending magic...' : 'Send Magic Link ✨'}
                            </button>
                            {supportsPasskey && (
                                <button
                                    type="button"
                                    onClick={() => setUsePasskey(true)}
                                    className="text-xs text-charcoal/30 hover:text-charcoal transition-colors"
                                >
                                    Use Biometrics instead
                                </button>
                            )}
                            <div className="pt-4 text-[10px] text-charcoal/30 font-medium">
                                By continuing, you agree to our{' '}
                                <button onClick={() => onOpenLegal('privacy')} className="underline hover:text-matcha">Privacy Policy</button> and{' '}
                                <button onClick={() => onOpenLegal('terms')} className="underline hover:text-matcha">Terms</button>.
                            </div>
                        </form>
                    )}
                </div>
            ) : (
                <form onSubmit={handleVerifyOtp} className="w-full max-w-sm space-y-4">
                    <div className="relative group">
                        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/20 group-focus-within:text-matcha transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            className="w-full pl-12 pr-6 py-4 rounded-full bg-white border border-clay/10 focus:border-matcha focus:ring-4 focus:ring-matcha/5 outline-none transition-all font-sans text-charcoal tracking-[0.3em] text-center font-bold"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || otp.length < 6}
                        className="w-full py-4 rounded-full bg-charcoal text-white font-medium hover:bg-matcha hover:text-charcoal transition-all disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Verify Code ✨'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep('email')}
                        className="text-sm text-charcoal/30 hover:text-charcoal transition-colors mt-4"
                    >
                        Didn't get a code? Try again
                    </button>
                </form>
            )}
        </div>
    );
};
