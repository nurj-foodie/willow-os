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
        text: "🌱 Let's flow. Type 'Dinner with friends at 7pm' here.",
        subtext: "I'll auto-detect the time.",
        side: 'top'
    },
    {
        targetId: 'calendar-trigger',
        text: "📅 See the dot? That means I caught the date.",
        subtext: "Tap to verify it on your calendar.",
        side: 'bottom'
    },
    {
        targetId: 'tutorial-target-date',
        text: "👇 Here is your date.",
        subtext: "Tap the day to close the calendar.",
        side: 'top' // Top of the cell (so it doesn't block the date itself)
    },
    {
        targetId: 'ledger-trigger',
        text: "💸 Track your budget here.",
        subtext: "Log expenses or scan receipts with AI.",
        side: 'bottom'
    },
    {
        targetId: 'archive-trigger',
        text: "📜 Your History.",
        subtext: "Completed tasks live here.",
        side: 'bottom',
        canSkip: true
    },
    {
        targetId: 'privacy-trigger',
        text: "🛡️ Privacy Shield.",
        subtext: "Blur details when in public.",
        side: 'bottom',
        canSkip: true
    },
    {
        targetId: 'account-actions',
        text: "👤 You own your data.",
        subtext: "Logout or delete anytime.",
        side: 'bottom',
        canSkip: true
    },
    {
        targetId: 'parking-lot-section',
        text: "🚙 The Parking Lot.",
        subtext: "For 'someday' tasks. Keep your mind clear today.",
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
                // Scroll into view if needed
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        // Slight delay to allow DOM to settle
        const timer = setTimeout(updatePosition, 100);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
            clearTimeout(timer);
        };
    }, [step, currentStep]);

    if (!currentStep || !targetRect) return null;

    // Calculate spotlight position
    const spotlightStyle = {
        top: targetRect.top,
        left: targetRect.left,
        width: targetRect.width,
        height: targetRect.height,
        boxShadow: '0 0 0 9999px rgba(30, 30, 30, 0.85)', // The dark overlay
        borderRadius: '16px', // Matching rounded corners
    };

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none transition-all duration-500">
            {/* The Spotlight Hole */}
            <div
                className="absolute transition-all duration-500 ease-in-out border-2 border-matcha/50 shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-pulse"
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
                <div className="w-[300px] bg-white p-6 rounded-2xl shadow-xl border border-white/20 relative">
                    {/* Arrow */}
                    <div
                        className={`absolute w-4 h-4 bg-white transform rotate-45 ${currentStep.side === 'top' ? '-bottom-2 left-1/2 -ml-2' : '-top-2 left-1/2 -ml-2'
                            }`}
                    />

                    <h3 className="text-xl font-serif font-bold text-charcoal mb-2">{currentStep.text}</h3>
                    <p className="text-charcoal/60 text-sm mb-4 font-sans">{currentStep.subtext}</p>

                    <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-charcoal/5 px-2 py-1 rounded-full uppercase tracking-wider font-bold text-charcoal/40">
                            Step {step + 1}/{STEPS.length}
                        </span>
                        {currentStep.canSkip && (
                            <button
                                onClick={onNext}
                                className="bg-charcoal text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-matcha hover:text-charcoal transition-colors"
                            >
                                Next
                            </button>
                        )}
                        {!currentStep.canSkip && (
                            <span className="text-xs text-matcha font-bold animate-pulse">
                                Interact to continue...
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Skip Tutorial Button (Always available) */}
            <button
                onClick={onSkip}
                className="fixed top-8 right-8 pointer-events-auto text-white/40 hover:text-white text-sm font-bold uppercase tracking-widest"
            >
                End Tour
            </button>
        </div>
    );
};
