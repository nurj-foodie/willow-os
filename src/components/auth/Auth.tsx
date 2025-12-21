import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Sparkles, Fingerprint } from 'lucide-react';
import { PasskeyService } from '../../services/PasskeyService';

export const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [supportsPasskey, setSupportsPasskey] = useState(false);
    const [usePasskey, setUsePasskey] = useState(true);

    useEffect(() => {
        setSupportsPasskey(PasskeyService.isSupported());
    }, []);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
            }
        });
        if (error) {
            alert(error.message);
        } else {
            setStep('otp');
        }
        setLoading(false);
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

    const handlePasskeyLogin = async () => {
        setLoading(true);
        try {
            await PasskeyService.login();
        } catch (err) {
            console.error(err);
            setUsePasskey(false); // Fallback to email on error
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-16 h-16 rounded-3xl bg-matcha/20 flex items-center justify-center text-3xl mb-6 animate-bounce">
                🌿
            </div>
            <h1 className="text-3xl font-serif font-bold text-charcoal mb-2">
                {step === 'email' ? 'Welcome to your flow.' : 'Verify your vibe.'}
            </h1>
            <div className="space-y-2 mb-8">
                <p className="text-charcoal/50 font-sans italic max-w-xs">
                    {step === 'email'
                        ? 'Enter your space and sync your vibe.'
                        : `Enter the 6-digit code sent to ${email}`}
                </p>
                {step === 'otp' && (
                    <p className="text-[10px] text-orange-600/60 font-medium uppercase tracking-widest">
                        ⚠️ Do not click the link in the email
                    </p>
                )}
            </div>

            {step === 'email' ? (
                <div className="w-full max-w-sm space-y-6">
                    {supportsPasskey && usePasskey ? (
                        <div className="space-y-4">
                            <button
                                onClick={handlePasskeyLogin}
                                disabled={loading}
                                className="w-full py-6 rounded-3xl bg-charcoal text-white font-bold text-lg shadow-xl hover:bg-matcha hover:text-charcoal transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                <Fingerprint size={24} />
                                {loading ? 'Looking for you...' : 'Sign in with FaceID'}
                            </button>
                            <button
                                onClick={() => setUsePasskey(false)}
                                className="text-xs text-charcoal/30 hover:text-charcoal transition-colors underline decoration-dotted"
                            >
                                Use Email instead
                            </button>
                            <div className="pt-2 text-[10px] text-charcoal/30 font-medium">
                                By signing in, you agree to our{' '}
                                <a href="/privacy" className="underline hover:text-matcha">Privacy Policy</a> and{' '}
                                <a href="/terms" className="underline hover:text-matcha">Terms</a>.
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
                                    Enable FaceID login
                                </button>
                            )}
                            <div className="pt-4 text-[10px] text-charcoal/30 font-medium">
                                By continuing, you agree to our{' '}
                                <a href="/privacy" className="underline hover:text-matcha">Privacy Policy</a> and{' '}
                                <a href="/terms" className="underline hover:text-matcha">Terms</a>.
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
