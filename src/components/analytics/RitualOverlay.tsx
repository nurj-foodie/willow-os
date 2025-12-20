import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, Calendar } from 'lucide-react';

interface RitualOverlayProps {
    userName: string | null;
    onComplete: (name: string) => void;
    yesterdayPriorities?: string[];
    isNewUser?: boolean;
}

export const RitualOverlay: React.FC<RitualOverlayProps> = ({
    userName,
    onComplete,
    yesterdayPriorities = [],
    isNewUser = false
}) => {
    const [step, setStep] = useState(isNewUser ? 'naming' : 'greeting');
    const [nameInput, setNameInput] = useState(userName || '');
    const [pressProgress, setPressProgress] = useState(0);
    const [isPressing, setIsPressing] = useState(false);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

    const hour = now.getHours();
    const isMorning = hour >= 5 && hour < 12;
    const isAfternoon = hour >= 12 && hour < 18;

    const bgGradient = isMorning
        ? 'from-amber-50/80 via-white/40 to-matcha/5'
        : isAfternoon
            ? 'from-blue-50/80 via-white/40 to-clay/5'
            : 'from-slate-100/80 via-white/40 to-lavender/10';

    useEffect(() => {
        let interval: any;
        if (isPressing) {
            interval = setInterval(() => {
                setPressProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        onComplete(nameInput);
                        return 100;
                    }
                    return prev + 2;
                });
            }, 20);
        } else {
            setPressProgress(0);
        }
        return () => clearInterval(interval);
    }, [isPressing, nameInput, onComplete]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 1.5, staggerChildren: 0.8 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 bg-gradient-to-br ${bgGradient} backdrop-blur-3xl`}
        >
            <div className="max-w-xl w-full text-center space-y-12">

                <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex items-center justify-center gap-4 text-charcoal/30 font-sans text-xs tracking-[0.2em] uppercase">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {dateStr}</span>
                        <span className="w-1 h-1 rounded-full bg-clay/20" />
                        <span className="flex items-center gap-1"><Clock size={12} /> {timeStr}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif text-charcoal leading-tight">
                        {step === 'naming' ? "Welcome to the still." : `Good ${isMorning ? 'morning' : isAfternoon ? 'afternoon' : 'evening'}, ${userName}.`}
                    </h1>
                </motion.div>

                <AnimatePresence mode="wait">
                    {step === 'naming' ? (
                        <motion.div
                            key="naming"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            <p className="text-charcoal/40 font-serif italic text-lg">Your stream is waiting. What should we call you?</p>
                            <input
                                type="text"
                                autoFocus
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && nameInput && setStep('greeting')}
                                placeholder="E.g. Explorer, Weaver, Willow..."
                                className="w-full bg-transparent border-b-2 border-matcha/20 focus:border-matcha outline-none text-2xl font-serif py-2 text-center text-charcoal transition-all placeholder:text-charcoal/10"
                            />
                            {nameInput && (
                                <button
                                    onClick={() => setStep('greeting')}
                                    className="text-matcha text-sm font-sans uppercase tracking-widest font-bold hover:tracking-[0.3em] transition-all"
                                >
                                    Begin Phase
                                </button>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="greeting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-8"
                        >
                            {yesterdayPriorities.filter(p => p).length > 0 && (
                                <div className="p-6 rounded-2xl bg-white/30 border border-white/50 space-y-3">
                                    <p className="text-[10px] uppercase tracking-widest text-charcoal/30 font-bold">Anchors from yesterday</p>
                                    <div className="space-y-1">
                                        {yesterdayPriorities.map((p, i) => p && (
                                            <p key={i} className="font-serif italic text-charcoal/60">{p}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <p className="text-charcoal/40 font-serif italic text-lg leading-relaxed">
                                Use this moment to ground yourself.<br />
                                Your focus is finite, but your potential is fluid.
                            </p>

                            <div className="pt-12 flex flex-col items-center gap-6">
                                <button
                                    onMouseDown={() => setIsPressing(true)}
                                    onMouseUp={() => setIsPressing(false)}
                                    onMouseLeave={() => setIsPressing(false)}
                                    onTouchStart={() => setIsPressing(true)}
                                    onTouchEnd={() => setIsPressing(false)}
                                    className="relative w-24 h-24 rounded-full border border-matcha/30 flex items-center justify-center group"
                                >
                                    <div
                                        className="absolute inset-0 rounded-full bg-matcha/10 transition-transform duration-75"
                                        style={{ transform: `scale(${pressProgress / 100})` }}
                                    />
                                    <div className={`absolute inset-0 rounded-full border-2 border-matcha transition-all duration-300 ${isPressing ? 'scale-110 opacity-50' : 'scale-100 opacity-20'}`} />
                                    <Sparkles className={`transition-all duration-500 ${isPressing ? 'scale-125 text-matcha' : 'text-charcoal/20 group-hover:text-matcha/40'}`} size={32} />
                                </button>
                                <span className="text-[10px] uppercase tracking-[0.3em] text-charcoal/30 font-bold animate-pulse">
                                    Hold to enter stream
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </motion.div>
    );
};
