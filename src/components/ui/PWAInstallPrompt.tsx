import React, { useState, useEffect } from 'react';
import { Share, X, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PWAInstallPrompt: React.FC = () => {
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if running in standalone mode (PWA installed)
        // Check if running in standalone mode (PWA installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        // Check if iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);

        // Check if previously dismissed
        const dismissed = localStorage.getItem('willow_pwa_prompt_dismissed');

        // Show prompt if:
        // 1. Not installed (standalone)
        // 2. On iOS (since Android has native prompts usually)
        // 3. Not previously dismissed
        if (!isStandalone && isIOSDevice && !dismissed) {
            // Delay asking to not annoy immediately
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('willow_pwa_prompt_dismissed', 'true');
    };

    if (!showPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-6 left-4 right-4 z-50 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-5 overflow-hidden"
            >
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1 rounded-full bg-black/5 hover:bg-black/10 transition-colors"
                >
                    <X size={16} className="text-charcoal/60" />
                </button>

                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-matcha/20 rounded-xl flex items-center justify-center shrink-0">
                            <PlusSquare size={24} className="text-matcha" />
                        </div>
                        <div>
                            <h3 className="font-serif font-bold text-charcoal text-lg">Install Willow</h3>
                            <p className="text-charcoal/60 text-sm leading-relaxed">
                                Add to Home Screen for the best fullscreen experience.
                            </p>
                        </div>
                    </div>

                    <div className="bg-charcoal/5 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-3 text-sm text-charcoal/80">
                            <span className="flex items-center justify-center w-6 h-6 bg-white rounded-lg shadow-sm shrink-0">
                                <Share size={14} className="text-blue-500" />
                            </span>
                            <span>1. Tap the <span className="font-bold">Share</span> button in Safari menu</span>
                        </div>
                        <div className="w-full h-px bg-charcoal/5" />
                        <div className="flex items-center gap-3 text-sm text-charcoal/80">
                            <span className="flex items-center justify-center w-6 h-6 bg-white rounded-lg shadow-sm shrink-0">
                                <PlusSquare size={14} className="text-charcoal" />
                            </span>
                            <span>2. Scroll down & tap <span className="font-bold">Add to Home Screen</span></span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
