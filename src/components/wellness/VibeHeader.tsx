import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Calendar } from 'lucide-react';

interface VibeHeaderProps {
    onMoodChange: (mood: number) => void;
    currentMood: number;
    onCalendarClick: () => void;
    saving?: boolean;
}

export const VibeHeader: React.FC<VibeHeaderProps> = ({
    onMoodChange,
    currentMood,
    onCalendarClick,
    saving
}) => {
    const [hoverMood, setHoverMood] = useState<number | null>(null);

    const moods = [
        { val: 1, color: 'hover:text-amber-400', label: 'Low Energy' },
        { val: 2, color: 'hover:text-orange-400', label: 'Unsettled' },
        { val: 3, color: 'hover:text-matcha', label: 'Steady' },
        { val: 4, color: 'hover:text-blue-400', label: 'Flow' },
        { val: 5, color: 'hover:text-purple-400', label: 'Inspired' },
    ];

    // Today's date - calculated, not stored in state
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

    return (
        <section className="mb-8 p-6 bg-white/40 backdrop-blur-xl rounded-[2rem] border border-clay/10 shadow-sm overflow-hidden relative">
            {saving && (
                <div className="absolute top-4 right-6 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-matcha animate-pulse" />
                    <span className="text-[10px] text-charcoal/30 uppercase tracking-widest font-bold">Syncing...</span>
                </div>
            )}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Today's Date */}
                <div className="flex-1">
                    <h3 className="text-xs font-sans uppercase tracking-widest text-charcoal/30 mb-3 font-bold">Today's Focus</h3>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Calendar size={20} className="text-matcha" />
                            <span className="font-serif text-xl text-charcoal">{dateStr}</span>
                        </div>
                        <button
                            onClick={onCalendarClick}
                            className="px-4 py-2 bg-matcha/10 hover:bg-matcha/20 text-charcoal rounded-full transition-colors text-sm font-medium"
                        >
                            View Calendar
                        </button>
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
                                        ? 'fill-current text-matcha shadow-glow'
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
                    <p className="text-[10px] font-sans italic text-charcoal/30 mt-3 h-3">
                        {hoverMood ? moods[hoverMood - 1].label : (currentMood ? moods[currentMood - 1].label : '')}
                    </p>
                </div>
            </div>
        </section>
    );
};
