import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResetRitualProps {
    onReset: () => void;
    hasTasks: boolean;
}

export const ResetRitual: React.FC<ResetRitualProps> = ({ onReset, hasTasks }) => {
    const [isResetting, setIsResetting] = useState(false);

    const handleReset = async () => {
        setIsResetting(true);

        // Aesthetic confetti burst
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#D1E2C4', '#E8D5C4', '#E1D5E8', '#FDFCF8']
        });

        // Simulate animation delay
        setTimeout(() => {
            onReset();
            setIsResetting(false);
        }, 2000);
    };

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <AnimatePresence>
                {isResetting ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-clay/20 flex flex-col items-center text-center max-w-xs"
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="text-4xl mb-4"
                        >
                            🌙
                        </motion.div>
                        <h3 className="text-xl font-serif font-bold text-charcoal mb-2">Rest well.</h3>
                        <p className="text-charcoal/60 text-sm italic font-sans">
                            "You did enough today. Your tasks are safe."
                        </p>
                    </motion.div>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleReset}
                        disabled={!hasTasks}
                        className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-lg transition-all ${hasTasks
                            ? 'bg-charcoal text-oat hover:shadow-charcoal/20'
                            : 'bg-charcoal/5 text-charcoal/20 cursor-not-allowed'
                            }`}
                    >
                        <Sparkles size={18} />
                        <span className="font-sans font-medium">Wrap up today</span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};
