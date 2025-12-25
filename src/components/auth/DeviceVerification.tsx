import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface DeviceVerificationProps {
    email: string;
    onVerified: () => void;
    onBack: () => void;
}

export const DeviceVerification: React.FC<DeviceVerificationProps> = ({ email, onVerified, onBack }) => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const generateDeviceId = (): string => {
        // Create a fingerprint from browser/device characteristics
        const ua = navigator.userAgent;
        const screen = `${window.screen.width}x${window.screen.height}`;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const fingerprint = `${ua}|${screen}|${tz}`;

        // Simple hash function
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return `device_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'email'
            });

            if (error) {
                alert(`Verification failed: ${error.message}`);
                setLoading(false);
                return;
            }

            // Store device ID in localStorage
            const deviceId = generateDeviceId();
            localStorage.setItem('willow_device_id', deviceId);
            localStorage.setItem('willow_device_verified_at', new Date().toISOString());

            onVerified();
        } catch (err: any) {
            console.error('OTP verification error:', err);
            alert(`Error: ${err.message}`);
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setResending(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { shouldCreateUser: false }
            });

            if (error) {
                alert(`Could not resend: ${error.message}`);
            } else {
                alert('✨ New code sent! Check your email.');
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setResending(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm space-y-6"
        >
            <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-orange-100 flex items-center justify-center text-3xl mx-auto mb-4">
                    🔐
                </div>
                <h2 className="text-2xl font-serif font-bold text-charcoal">
                    Verify This Device
                </h2>
                <p className="text-sm text-charcoal/60 italic">
                    We sent a 6-digit code to <strong>{email}</strong>
                </p>
                <p className="text-[10px] text-orange-600/60 font-medium uppercase tracking-widest">
                    ⚠️ Do not click the link in the email
                </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="relative group">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/20 group-focus-within:text-matcha transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full pl-12 pr-6 py-4 rounded-full bg-white border border-clay/10 focus:border-matcha focus:ring-4 focus:ring-matcha/5 outline-none transition-all font-sans text-charcoal tracking-[0.3em] text-center font-bold text-xl"
                        required
                        maxLength={6}
                        autoFocus
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full py-4 rounded-full bg-charcoal text-white font-medium hover:bg-matcha hover:text-charcoal transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        'Verify Device ✨'
                    )}
                </button>

                <div className="flex flex-col gap-2 items-center">
                    <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resending}
                        className="text-xs text-charcoal/40 hover:text-matcha transition-colors underline decoration-dotted disabled:opacity-50"
                    >
                        {resending ? 'Sending...' : 'Resend Code'}
                    </button>
                    <button
                        type="button"
                        onClick={onBack}
                        className="text-xs text-charcoal/30 hover:text-charcoal transition-colors"
                    >
                        ← Back to Login
                    </button>
                </div>
            </form>

            <div className="pt-2 text-[10px] text-charcoal/30 font-medium text-center leading-relaxed">
                This is a one-time verification for security. You won't need to do this again on this device.
            </div>
        </motion.div>
    );
};
