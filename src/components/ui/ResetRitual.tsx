import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, Clock, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Task } from '../../types';

interface ResetRitualProps {
    onReset: (rolloverIncomplete: boolean) => void;
    doneTasks: Task[];
    incompleteTasks: Task[];
}

export const ResetRitual: React.FC<ResetRitualProps> = ({ onReset, doneTasks, incompleteTasks }) => {
    const [step, setStep] = useState<'button' | 'summary' | 'done'>('button');

    const hasTasks = doneTasks.length > 0 || incompleteTasks.length > 0;

    const handleOpen = () => {
        setStep('summary');
    };

    const handleConfirm = () => {
        // Aesthetic confetti burst
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#D1E2C4', '#E8D5C4', '#E1D5E8', '#FDFCF8']
        });

        setStep('done');

        // Call onReset with rollover = true for incomplete tasks
        setTimeout(() => {
            onReset(true);
            setStep('button');
        }, 2500);
    };

    const soothingMessages = [
        "You showed up today, and that's what matters. 🌿",
        "Progress, not perfection. Rest well. 🌙",
        "Tomorrow is a fresh page in your story. ✨",
        "You did your best with what you had. 💚"
    ];
    const randomMessage = soothingMessages[Math.floor(Math.random() * soothingMessages.length)];

    return (
        <>
            {/* Floating Button */}
            <div className="fixed bottom-8 right-8 z-40">
                <AnimatePresence>
                    {step === 'button' && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleOpen}
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

            {/* Summary Modal */}
            <AnimatePresence>
                {step === 'summary' && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setStep('button')}
                            className="fixed inset-0 bg-charcoal/30 backdrop-blur-sm z-[200]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-x-4 bottom-24 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-3xl shadow-2xl z-[201] max-w-md w-full max-h-[70vh] overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-clay/10 flex justify-between items-center">
                                <h3 className="text-xl font-serif font-bold text-charcoal">Today's Wrap Up</h3>
                                <button onClick={() => setStep('button')} className="p-2 hover:bg-charcoal/5 rounded-full">
                                    <X size={20} className="text-charcoal/40" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 overflow-y-auto flex-1">
                                {/* Completed Tasks */}
                                {doneTasks.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-matcha">
                                            <Check size={16} />
                                            <span className="text-[10px] uppercase tracking-widest font-bold">
                                                Completed ({doneTasks.length})
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {doneTasks.map(task => (
                                                <div key={task.id} className="flex items-center gap-2 text-charcoal/60">
                                                    <span className="text-lg">{task.emoji || '✓'}</span>
                                                    <span className="line-through">{task.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Incomplete Tasks */}
                                {incompleteTasks.length > 0 && (
                                    <div className="space-y-3 p-4 rounded-xl bg-clay/5 border border-clay/10">
                                        <div className="flex items-center gap-2 text-clay">
                                            <Clock size={16} />
                                            <span className="text-[10px] uppercase tracking-widest font-bold">
                                                Rolling over to tomorrow ({incompleteTasks.length})
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {incompleteTasks.map(task => (
                                                <div key={task.id} className="flex items-center gap-2 text-charcoal/60">
                                                    <span className="text-lg">{task.emoji || '📝'}</span>
                                                    <span>{task.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-charcoal/40 italic mt-2">
                                            These will appear in tomorrow's flow.
                                        </p>
                                    </div>
                                )}

                                {doneTasks.length === 0 && incompleteTasks.length === 0 && (
                                    <p className="text-charcoal/40 italic text-center py-8">
                                        No tasks to wrap up yet.
                                    </p>
                                )}
                            </div>

                            <div className="p-6 border-t border-clay/10 bg-oat/30">
                                <button
                                    onClick={handleConfirm}
                                    className="w-full py-4 bg-charcoal text-white rounded-2xl font-bold hover:bg-matcha hover:text-charcoal transition-all flex items-center justify-center gap-2"
                                >
                                    <Sparkles size={18} />
                                    Wrap it up
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Done State */}
            <AnimatePresence>
                {step === 'done' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-gradient-to-br from-matcha/20 via-oat to-lavender/20 z-[200] flex items-center justify-center p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center max-w-sm"
                        >
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-6xl mb-6"
                            >
                                🌙
                            </motion.div>
                            <h2 className="text-3xl font-serif font-bold text-charcoal mb-4">Rest well.</h2>
                            <p className="text-charcoal/60 font-serif italic text-lg">
                                {randomMessage}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
