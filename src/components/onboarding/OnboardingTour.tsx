import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Sparkles, Layout } from 'lucide-react';

interface OnboardingTourProps {
    onComplete: () => void;
}

const STEPS = [
    {
        title: "Willow OS",
        description: "Your minimal interactive Todo List & Personal Finance Tracker. A space to clear your mind.",
        icon: <div className="text-4xl">🌿</div>,
        color: "bg-white"
    },
    {
        title: "The Stream",
        description: "Your interactive task list. Drag items up/down to prioritize. Swipe or click to complete.",
        icon: <Layout className="text-charcoal" size={32} />,
        color: "bg-sage/10"
    },
    {
        title: "Speak Naturally",
        description: "Willow understands time. Type 'Dinner at 7pm' or 'Meeting tomorrow' and we'll handle the scheduling.",
        icon: <Sparkles className="text-amber-400" size={32} />,
        color: "bg-amber-50"
    },
    {
        title: "Parking Lot (Top-Left)",
        description: "Pull up the sidebar to park tasks for 'someday'. Keep your main stream clear for today.",
        icon: <div className="p-2 bg-charcoal/5 rounded-lg"><Layout size={24} className="text-charcoal/40" /></div>,
        color: "bg-clay/5"
    },
    {
        title: "Expenses & Receipts (Top-Right)",
        description: "Track your budget. Open the Ledger to log expenses or scan receipts with AI.",
        icon: <div className="p-2 bg-matcha/20 rounded-lg">🎞️</div>,
        color: "bg-matcha/10"
    }
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep((prev: number) => prev + 1);
        } else {
            onComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep((prev: number) => prev - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-charcoal/40 backdrop-blur-md"
                onClick={onComplete}
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
                {/* Progress bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-charcoal/5 flex">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-full transition-all duration-500 ${i <= currentStep ? 'bg-charcoal' : 'bg-transparent'}`}
                            style={{ width: `${100 / STEPS.length}%` }}
                        />
                    ))}
                </div>

                <div className={`p-8 pt-12 transition-colors duration-500 ${STEPS[currentStep].color}`}>
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6">
                        {STEPS[currentStep].icon}
                    </div>

                    <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">
                        {STEPS[currentStep].title}
                    </h2>
                    <p className="text-charcoal/60 leading-relaxed font-sans min-h-[5rem]">
                        {STEPS[currentStep].description}
                    </p>
                </div>

                <div className="p-6 bg-white flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        className={`text-charcoal/30 hover:text-charcoal transition-colors flex items-center gap-1 text-sm font-bold uppercase tracking-widest ${currentStep === 0 ? 'invisible' : 'visible'}`}
                    >
                        <ChevronLeft size={16} />
                        Back
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={onComplete}
                            className="px-4 py-3 text-charcoal/20 hover:text-charcoal transition-colors text-xs font-bold uppercase tracking-widest"
                        >
                            Skip
                        </button>
                        <button
                            onClick={handleNext}
                            className="bg-charcoal text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-matcha hover:text-charcoal transition-all active:scale-95 font-bold text-sm"
                        >
                            {currentStep === STEPS.length - 1 ? "Let's Roam" : "Next"}
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                <button
                    onClick={onComplete}
                    className="absolute top-4 right-4 p-2 text-charcoal/20 hover:text-charcoal transition-colors"
                >
                    <X size={20} />
                </button>
            </motion.div>
        </div>
    );
};
