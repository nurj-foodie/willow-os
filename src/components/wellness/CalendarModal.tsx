import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task } from '../../types';

interface CalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    onDateSelect: (date: Date) => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, tasks, onDateSelect }) => {
    const [currentMonth, setCurrentMonth] = React.useState(new Date());

    // Generate calendar grid
    const generateCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (number | null)[] = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    const days = generateCalendar();
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isToday = (day: number | null) => {
        if (!day) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return date.getTime() === today.getTime();
    };

    const getTaskCountForDate = (day: number | null) => {
        if (!day) return 0;
        const targetDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        targetDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        return tasks.filter(task => {
            if (!task.due_date) return false;
            const taskDate = new Date(task.due_date);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() === targetDate.getTime();
        }).length;
    };

    const handleDateClick = (day: number | null) => {
        if (!day) return;
        const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        selectedDate.setHours(0, 0, 0, 0);
        onDateSelect(selectedDate);
        onClose();
    };

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
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
                        className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-50"
                        onClick={onClose}
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
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-clay/20 transition-colors z-10"
                            >
                                <X size={20} className="text-charcoal/60" />
                            </button>

                            {/* Header */}
                            <div className="flex items-center justify-between mb-6 pr-8">
                                <button
                                    onClick={goToPreviousMonth}
                                    className="p-2 rounded-full hover:bg-clay/20 transition-colors"
                                >
                                    <ChevronLeft size={20} className="text-charcoal/60" />
                                </button>

                                <h2 className="font-serif text-2xl text-charcoal">{monthName}</h2>

                                <button
                                    onClick={goToNextMonth}
                                    className="p-2 rounded-full hover:bg-clay/20 transition-colors"
                                >
                                    <ChevronRight size={20} className="text-charcoal/60" />
                                </button>
                            </div>

                            {/* Weekday headers */}
                            <div className="grid grid-cols-7 gap-2 mb-2">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                    <div key={day} className="text-center text-xs font-sans uppercase tracking-wide text-charcoal/30 font-bold">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar grid */}
                            <div className="grid grid-cols-7 gap-2">
                                {days.map((day, idx) => {
                                    const taskCount = getTaskCountForDate(day);
                                    const hasTasks = taskCount > 0;
                                    return (
                                        <button
                                            key={idx}
                                            id={isToday(day) ? "tutorial-target-date" : undefined}
                                            disabled={!day}
                                            onClick={() => handleDateClick(day)}
                                            className={`
                                                aspect-square rounded-lg flex flex-col items-center justify-center
                                                transition-all text-sm font-medium relative
                                                ${!day ? 'invisible' : ''}
                                                ${isToday(day)
                                                    ? 'bg-matcha text-white shadow-md'
                                                    : 'bg-white/40 text-charcoal hover:bg-matcha/20 cursor-pointer'
                                                }
                                            `}
                                        >
                                            {day}
                                            {hasTasks && (
                                                <span className={`
                                                    absolute bottom-1 w-1 h-1 rounded-full
                                                    ${isToday(day) ? 'bg-white/80' : 'bg-matcha'}
                                                `} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
