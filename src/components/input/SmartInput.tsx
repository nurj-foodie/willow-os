import React, { useState, useEffect, useRef } from 'react';
import * as chrono from 'chrono-node';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';

interface SmartInputProps {
    onAddTask: (title: string, date: Date | null, priority: number) => void;
}

export const SmartInput: React.FC<SmartInputProps> = ({ onAddTask }) => {
    const [value, setValue] = useState('');
    const [parsedDate, setParsedDate] = useState<Date | null>(null);
    const [dateText, setDateText] = useState<string>('');
    const [priority, setPriority] = useState<number>(4);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const results = chrono.parse(value);
        if (results.length > 0) {
            setParsedDate(results[0].start.date());
            setDateText(results[0].text);
        } else {
            setParsedDate(null);
            setDateText('');
        }
    }, [value]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) return;

        // Filter out the date text from the title
        let title = value;
        if (dateText) {
            title = value.replace(dateText, '').trim();
        }

        onAddTask(title || value, parsedDate, priority);
        setValue('');
        setParsedDate(null);
        setDateText('');
        setPriority(4); // Reset to default priority
    };

    const priorityLevels = [
        { id: 1, label: 'Urgent/Important', color: 'bg-clay' },
        { id: 2, label: 'Important', color: 'bg-sage' },
        { id: 3, label: 'Urgent', color: 'bg-matcha' },
        { id: 4, label: 'Normal', color: 'bg-lavender' },
    ];

    return (
        <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-2xl mt-8 mb-4 px-2"
        >
            <div className="flex justify-end gap-2 mb-2 px-4">
                {priorityLevels.map((p) => (
                    <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        title={p.label}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${priority === p.id
                            ? `${p.color} ring-2 ring-offset-2 ring-charcoal/20 scale-125`
                            : 'bg-charcoal/10 hover:bg-charcoal/20'}`}
                    />
                ))}
            </div>

            <div className="relative flex items-center">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Plant a task in your stream..."
                    className="w-full h-14 pl-6 pr-14 rounded-pill border-2 border-clay/20 bg-white/70 backdrop-blur-sm focus:outline-none focus:border-matcha transition-all font-sans text-lg placeholder:text-charcoal/30 shadow-sm"
                />

                <button
                    type="submit"
                    className={`absolute right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${value ? 'bg-matcha text-charcoal' : 'bg-charcoal/5 text-charcoal/20'
                        }`}
                >
                    <Send size={18} />
                </button>
            </div>

            <AnimatePresence>
                {parsedDate && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -top-8 left-6 flex items-center gap-2 px-3 py-1 rounded-full bg-matcha text-charcoal text-xs font-serif italic shadow-sm"
                    >
                        <span>Caught:</span>
                        <span className="font-bold underline decoration-dotted">
                            {parsedDate.toLocaleString([], {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </form>
    );
};
