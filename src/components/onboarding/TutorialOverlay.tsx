import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TutorialOverlayProps {
    step: number;
    onNext: () => void;
    onSkip: () => void;
}

const STEPS = [
    {
        targetId: 'smart-input-container',
        text: "Let's plant something 🌱",
        subtext: "Try typing 'Coffee date at 3pm' — I'll catch the time.",
        side: 'top'
    },
    {
        targetId: 'calendar-trigger',
        text: "I caught that ✨",
        subtext: "The dot means time detected. Tap to peek at your calendar.",
        side: 'bottom'
    },
    {
        targetId: 'tutorial-target-date',
        text: "Right here, babe 📅",
        subtext: "Your schedule, visualized. Tap the day to close.",
        side: 'top'
    },
    {
        targetId: 'ledger-trigger',
        text: "Money moves 💸",
        subtext: "Paper Trail lives here. Scan receipts or log manually.",
        side: 'bottom'
    },
    {
        targetId: 'archive-trigger',
        text: "Your wins 🏆",
        subtext: "Everything you've done lives here. Celebrate the small stuff.",
        side: 'bottom',
        canSkip: true
    },
    {
        targetId: 'privacy-trigger',
        text: "Safe mode 🛡️",
        subtext: "Blur your screen in public. No peeking allowed.",
        side: 'bottom',
        canSkip: true
    },
    {
        targetId: 'account-actions',
        text: "You're in control 👑",
        subtext: "Logout, delete — your data, your rules.",
        side: 'bottom',
        canSkip: true
    },
    {
        targetId: 'parking-lot-section',
        text: "The Waiting Room 🚙",
        subtext: "Someday tasks live here. Today's stream stays clean.",
        side: 'right',
        canSkip: true
    }
];

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ step, onNext, onSkip }) => {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const currentStep = STEPS[step];

    useEffect(() => {
        if (!currentStep) return;

        const updatePosition = () => {
            const el = document.getElementById(currentStep.targetId);
            if (el) {
                const rect = el.getBoundingClientRect();
                setTargetRect(rect);
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        const timer = setTimeout(updatePosition, 100);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
            clearTimeout(timer);
        };
    }, [step, currentStep]);

    if (!currentStep || !targetRect) return null;

    const spotlightStyle = {
        top: targetRect.top,
        left: targetRect.left,
        width: targetRect.width,
        height: targetRect.height,
        boxShadow: '0 0 0 9999px rgba(20, 20, 25, 0.85)',
        borderRadius: '16px',
    };

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none transition-all duration-500">
            {/* The Spotlight Hole */}
            <div
                className="absolute transition-all duration-500 ease-in-out border-2 border-matcha/40 shadow-[0_0_40px_rgba(180,200,160,0.3)]"
                style={spotlightStyle}
            />

            {/* The Tooltip */}
            <motion.div
                key={step}
                initial={{ opacity: 0, y: 10, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -10, x: '-50%' }}
                transition={{ duration: 0.3 }}
                className="absolute pointer-events-auto"
                style={{
                    top: currentStep.side === 'top' ? undefined : targetRect.bottom + 24,
                    bottom: currentStep.side === 'top' ? window.innerHeight - targetRect.top + 24 : undefined,
                    left: targetRect.left + (targetRect.width / 2),
                }}
            >
                <div className="w-[300px] bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-xl border border-white/20 dark:border-white/10 relative">
                    {/* Arrow */}
                    <div
                        className={`absolute w-4 h-4 bg-white dark:bg-neutral-900 transform rotate-45 ${currentStep.side === 'top' ? '-bottom-2 left-1/2 -ml-2' : '-top-2 left-1/2 -ml-2'
                            }`}
                    />

                    <h3 className="text-xl font-serif font-bold text-charcoal mb-2">{currentStep.text}</h3>
                    <p className="text-charcoal/60 text-sm mb-4 font-sans">{currentStep.subtext}</p>

                    <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-matcha/10 px-3 py-1 rounded-full uppercase tracking-wider font-bold text-matcha">
                            {step + 1} of {STEPS.length}
                        </span>
                        {currentStep.canSkip && (
                            <button
                                onClick={onNext}
                                className="bg-charcoal text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-matcha hover:text-charcoal transition-colors"
                            >
                                Got it
                            </button>
                        )}
                        {!currentStep.canSkip && (
                            <span className="text-xs text-matcha font-bold animate-pulse">
                                Try it ✨
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Skip Tutorial Button */}
            <button
                onClick={onSkip}
                className="fixed top-8 right-8 pointer-events-auto text-white/40 hover:text-white text-sm font-bold uppercase tracking-widest"
            >
                End Tour
            </button>
        </div>
    );
};
