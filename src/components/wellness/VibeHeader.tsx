import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface VibeHeaderProps {
    onMoodChange: (mood: number) => void;
    currentMood?: number;
}

export const VibeHeader: React.FC<VibeHeaderProps> = ({ onMoodChange, currentMood = 3 }) => {
    const [hoverMood, setHoverMood] = useState<number | null>(null);

    const moods = [
        { val: 1, color: 'hover:text-amber-400', label: 'Low Energy' },
        { val: 2, color: 'hover:text-orange-400', label: 'Unsettled' },
        { val: 3, color: 'hover:text-matcha', label: 'Steady' },
        { val: 4, color: 'hover:text-blue-400', label: 'Flow' },
        { val: 5, color: 'hover:text-purple-400', label: 'Inspired' },
    ];

    return (
        <section className="mb-8 p-6 bg-white/40 backdrop-blur-xl rounded-[2rem] border border-clay/10 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Top 3 Priorities Section */}
                <div className="flex-1">
                    <h3 className="text-xs font-sans uppercase tracking-widest text-charcoal/30 mb-4 font-bold">Today's Non-Negotiables</h3>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 group">
                                <div className="w-5 h-5 rounded-full border border-clay/20 flex-shrink-0 flex items-center justify-center text-[10px] text-charcoal/20 group-hover:border-matcha group-hover:text-matcha transition-colors">
                                    {i}
                                </div>
                                <input
                                    type="text"
                                    placeholder={`Priority ${i}...`}
                                    className="bg-transparent border-none outline-none font-serif text-lg text-charcoal/60 placeholder:text-charcoal/10 focus:text-charcoal transition-all w-full"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stardust Mood Tracker */}
                <div className="flex flex-col items-center md:items-end md:text-right border-t md:border-t-0 md:border-l border-clay/10 pt-6 md:pt-0 md:pl-8">
                    <h3 className="text-xs font-sans uppercase tracking-widest text-charcoal/30 mb-4 font-bold">Vibe Check</h3>
                    <div className="flex items-center gap-3 py-2 px-4 bg-clay/5 rounded-full border border-clay/5">
                        {moods.map((m) => (
                            <button
                                key={m.val}
                                onClick={() => onMoodChange(m.val)}
                                onMouseEnter={() => setHoverMood(m.val)}
                                onMouseLeave={() => setHoverMood(null)}
                                className="relative group transition-transform active:scale-95"
                                title={m.label}
                            >
                                <Star
                                    size={18}
                                    className={`transition-all duration-300 ${(hoverMood || currentMood) >= m.val
                                            ? `${m.val <= (hoverMood || currentMood) ? 'fill-current text-matcha shadow-glow' : 'text-charcoal/10'}`
                                            : 'text-charcoal/10'
                                        } ${m.color}`}
                                />
                                {currentMood === m.val && (
                                    <motion.div
                                        layoutId="currentMoodIndicator"
                                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-matcha"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] font-sans italic text-charcoal/30 mt-3">
                        {hoverMood ? moods[hoverMood - 1].label : moods[currentMood - 1].label}
                    </p>
                </div>
            </div>
        </section>
    );
};
