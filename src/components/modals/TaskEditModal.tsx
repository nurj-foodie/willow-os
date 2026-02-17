import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import type { Task } from '../../types';

interface TaskEditModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Task>) => void;
    onDelete?: (id: string) => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, isOpen, onClose, onSave, onDelete }) => {
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState(4);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDueDate(task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '');
            setPriority(task.priority || 4);
        }
        // Reset confirmation when task changes
        setConfirmDelete(false);
    }, [task]);

    const handleSave = () => {
        if (!task) return;

        onSave(task.id, {
            title: title.trim() || task.title,
            due_date: dueDate ? new Date(dueDate).toISOString() : null,
            priority,
        });
        onClose();
    };

    const handleDelete = () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        // Second tap — actually delete
        if (task && onDelete) {
            onDelete(task.id);
            onClose();
        }
    };

    const handleClose = () => {
        setConfirmDelete(false);
        onClose();
    };

    const priorityLevels = [
        { id: 1, label: 'Urgent/Important', color: 'bg-clay' },
        { id: 2, label: 'Important', color: 'bg-sage' },
        { id: 3, label: 'Urgent', color: 'bg-matcha' },
        { id: 4, label: 'Normal', color: 'bg-lavender' },
    ];

    return (
        <AnimatePresence>
            {isOpen && task && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-50"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-oat rounded-[2rem] shadow-2xl max-w-md w-full p-6 relative">
                            {/* Close button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-clay/20 transition-colors z-10"
                            >
                                <X size={20} className="text-charcoal/60" />
                            </button>

                            {/* Header */}
                            <h2 className="font-serif text-2xl text-charcoal mb-6">Edit Task</h2>

                            {/* Title Input */}
                            <div className="mb-4">
                                <label className="block text-xs font-sans uppercase tracking-widest text-charcoal/40 mb-2 font-bold">
                                    Task Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-clay/20 bg-white/70 focus:outline-none focus:border-matcha transition-all font-sans"
                                    placeholder="Enter task title..."
                                />
                            </div>

                            {/* Date Input */}
                            <div className="mb-4">
                                <label className="block text-xs font-sans uppercase tracking-widest text-charcoal/40 mb-2 font-bold">
                                    <CalendarIcon size={12} className="inline mr-1" />
                                    Due Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-clay/20 bg-white/70 focus:outline-none focus:border-matcha transition-all font-sans"
                                />
                            </div>

                            {/* Priority */}
                            <div className="mb-6">
                                <label className="block text-xs font-sans uppercase tracking-widest text-charcoal/40 mb-3 font-bold">
                                    Priority
                                </label>
                                <div className="flex gap-2">
                                    {priorityLevels.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setPriority(p.id)}
                                            title={p.label}
                                            className={`flex-1 h-10 rounded-xl transition-all duration-300 font-sans text-sm ${priority === p.id
                                                ? `${p.color} ring-2 ring-offset-2 ring-charcoal/20 text-charcoal font-bold`
                                                : 'bg-charcoal/5 hover:bg-charcoal/10 text-charcoal/40'
                                                }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-3 rounded-xl bg-charcoal/5 hover:bg-charcoal/10 text-charcoal font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 px-4 py-3 rounded-xl bg-matcha hover:bg-matcha/80 text-charcoal font-medium transition-colors shadow-sm"
                                >
                                    Save Changes
                                </button>
                            </div>

                            {/* Delete button — two-tap confirmation (no window.confirm) */}
                            <button
                                onClick={handleDelete}
                                className={`w-full mt-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${confirmDelete
                                        ? 'bg-red-500 text-white animate-pulse'
                                        : 'bg-clay/10 hover:bg-clay/20 text-clay'
                                    }`}
                            >
                                <Trash2 size={16} />
                                <span>{confirmDelete ? 'Tap again to confirm delete' : 'Delete Task'}</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
