import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, ShieldCheck } from 'lucide-react';
import { PasskeyService } from '../../services/PasskeyService';

interface PasskeyBannerProps {
    userId: string;
}

export const PasskeyBanner: React.FC<PasskeyBannerProps> = ({ userId }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [status, setStatus] = useState<'invite' | 'loading' | 'success' | 'hidden'>('invite');

    useEffect(() => {
        // Persistent prompt: removed dismissal check
        if (PasskeyService.isSupported()) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleRegister = async () => {
        alert("Initializing Biometric setup... Please keep your screen active.");
        setStatus('loading');
        try {
            const result = await PasskeyService.register(userId);
            console.log('Registration Result:', result);
            setStatus('success');
            setTimeout(() => {
                setIsVisible(false);
                setStatus('hidden');
            }, 3000);
        } catch (err: any) {
            console.error('Registration Error:', err);
            alert(`Setup failed: ${err.message || 'Unknown error'}.\n\nCommon fixes:\n1. Ensure your device has Screen Lock (Pin/Fingerprint) enabled.\n2. Ensure you are using Chrome or Samsung Internet.\n3. Make sure you haven't blocked biometrics for this site.`);
            setStatus('invite');
            setIsVisible(false);
        }
    };



    if (status === 'hidden') return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4"
                >
                    <div className="bg-white/80 backdrop-blur-md border border-matcha/20 shadow-xl rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
                        {status === 'loading' && (
                            <motion.div
                                className="absolute bottom-0 left-0 h-1 bg-matcha"
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 2 }}
                            />
                        )}

                        <div className="w-10 h-10 rounded-full bg-matcha/10 flex items-center justify-center text-matcha shrink-0">
                            {status === 'success' ? <ShieldCheck size={20} /> : <Fingerprint size={20} />}
                        </div>

                        <div className="flex-grow">
                            <h3 className="text-sm font-bold text-charcoal">
                                {status === 'invite' && "Secure this app with Biometrics?"}
                                {status === 'loading' && "Setting up Passkey..."}
                                {status === 'success' && "Success! Biometrics enabled."}
                            </h3>
                            {status === 'invite' && (
                                <p className="text-[10px] text-charcoal/50 font-medium">Next time, use your glance or fingerprint to log in.</p>
                            )}
                        </div>

                        {status === 'invite' ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleRegister}
                                    className="bg-charcoal text-white text-[10px] font-bold px-4 py-2 rounded-full hover:bg-matcha hover:text-charcoal transition-colors shadow-sm active:scale-95"
                                >
                                    Setup Now
                                </button>
                            </div>
                        ) : null}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
