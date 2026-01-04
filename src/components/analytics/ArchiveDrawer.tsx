import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar } from 'lucide-react';
import type { Task } from '../../types';

interface ArchiveDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
}

export const ArchiveDrawer: React.FC<ArchiveDrawerProps> = ({ isOpen, onClose, tasks }) => {
    const archivedTasks = tasks.filter(t => t.status === 'done');

    // Group tasks by date
    const groups = archivedTasks.reduce((acc, task) => {
        const date = task.updated_at ? new Date(task.updated_at).toLocaleDateString() : 'Unknown';
        if (!acc[date]) acc[date] = [];
        acc[date].push(task);
        return acc;
    }, {} as Record<string, Task[]>);

    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const priorityLabels = {
        1: 'Urgent/Important',
        2: 'Important',
        3: 'Urgent',
        4: 'Normal'
    };

    const priorityColors = {
        1: 'border-clay/50 bg-clay/10 text-clay',
        2: 'border-sage/50 bg-sage/10 text-sage',
        3: 'border-matcha/50 bg-matcha/10 text-matcha',
        4: 'border-lavender/50 bg-lavender/10 text-lavender'
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-charcoal/20 z-40 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-oat/95 backdrop-blur-xl border-l border-white/20 shadow-2xl z-50 p-6 overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-serif font-bold text-charcoal">Archive</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-charcoal/5 transition-colors"
                            >
                                <X size={24} className="text-charcoal/60" />
                            </button>
                        </div>

                        {archivedTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                                <span className="text-4xl opacity-50">📜</span>
                                <p className="text-charcoal/40 font-serif italic">Your history is yet to be written.</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {sortedDates.map(date => (
                                    <div key={date} className="space-y-4">
                                        <div className="flex items-center gap-2 text-charcoal/30 text-xs font-bold uppercase tracking-widest">
                                            <Calendar size={12} />
                                            <span>{date}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {groups[date].map(task => (
                                                <div
                                                    key={task.id}
                                                    className={`p-4 rounded-xl border bg-white/40 flex items-center justify-between group hover:bg-white/60 transition-colors`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl opacity-80 filter grayscale group-hover:grayscale-0 transition-all">{task.emoji || '📝'}</span>
                                                        <span className="font-sans text-charcoal/80 line-through decoration-charcoal/20">{task.title}</span>
                                                    </div>
                                                    <span className={`text-[10px] px-2 py-1 rounded-full border ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors[4]} font-bold uppercase tracking-wider`}>
                                                        {priorityLabels[task.priority as keyof typeof priorityLabels] || 'Normal'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
