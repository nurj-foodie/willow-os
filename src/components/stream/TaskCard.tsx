import React from 'react';
import { motion } from 'framer-motion';
import { Check, GripVertical, Edit2, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../types';

interface TaskCardProps {
    task: Task;
    onToggle?: (id: string) => void;
    onEdit?: (task: Task) => void;
    onDelete?: (id: string) => void;
    privacyMode?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onEdit, onDelete, privacyMode }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const priorityColors = {
        1: 'bg-clay/40 border-clay/20',     // Urgent/Important
        2: 'bg-sage/40 border-sage/20',     // Important
        3: 'bg-matcha/40 border-matcha/20', // Urgent
        4: 'bg-lavender/40 border-lavender/20', // Normal
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group mb-4 ${isDragging ? 'z-50' : 'z-0'}`}
        >
            <motion.div
                layout
                className={`pill border flex items-center gap-4 ${priorityColors[task.priority as keyof typeof priorityColors] || 'bg-white border-clay/20'} shadow-sm hover:shadow-md transition-shadow cursor-default`}
            >
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-charcoal/20 group-hover:text-charcoal/40 transition-colors p-1 -ml-1 touch-none select-none"
                    style={{ WebkitTouchCallout: 'none' }}
                >
                    <GripVertical size={20} />
                </div>

                <button
                    onClick={() => onToggle?.(task.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'done'
                        ? 'bg-matcha border-matcha text-white'
                        : 'border-charcoal/10 bg-white/50 hover:border-matcha'
                        }`}
                >
                    {task.status === 'done' && <Check size={14} />}
                </button>

                <span className={`flex-grow font-sans text-lg transition-all duration-500 ${task.status === 'done' ? 'line-through text-charcoal/40' : 'text-charcoal'} ${privacyMode ? 'blur-md select-none' : ''}`}>
                    {task.emoji && <span className="mr-2">{task.emoji}</span>}
                    {task.title}
                </span>

                {task.due_date && (
                    <span className="text-xs font-serif italic text-charcoal/40 bg-white/30 px-3 py-1 rounded-full">
                        {new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}

                {/* Edit & Delete buttons - appear on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(task);
                            }}
                            className="p-1.5 rounded-full hover:bg-white/50 text-charcoal/40 hover:text-charcoal transition-colors"
                            title="Edit task"
                        >
                            <Edit2 size={14} />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(task.id);
                            }}
                            className="p-1.5 rounded-full hover:bg-clay/30 text-charcoal/40 hover:text-clay transition-colors"
                            title="Delete task"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
