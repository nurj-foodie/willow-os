import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { Inbox } from 'lucide-react';
import type { Task } from '../../types';

interface ParkingLotProps {
    tasks: Task[];
    onToggle: (id: string, done: boolean) => void;
}

export const ParkingLot: React.FC<ParkingLotProps> = ({ tasks, onToggle }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: 'parking-lot',
    });

    return (
        <div
            ref={setNodeRef}
            className={`h-full flex flex-col p-6 transition-colors duration-300 ${isOver ? 'bg-matcha/10' : 'bg-oat'
                }`}
        >
            <div className="flex items-center gap-3 mb-8 text-charcoal/40">
                <Inbox size={20} />
                <h2 className="text-xl font-serif italic">Parking Lot</h2>
            </div>

            <div className="flex-grow overflow-y-auto pr-2">
                {tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <div className="w-12 h-12 rounded-full bg-clay/10 flex items-center justify-center text-2xl mb-4 grayscale opacity-50">
                            📦
                        </div>
                        <p className="text-sm font-sans text-charcoal/30 italic">
                            "Drag tasks here to clear your mind."
                        </p>
                    </div>
                ) : (
                    <SortableContext
                        items={tasks.map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-col">
                            {tasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onToggle={(id) => onToggle(id, task.status !== 'done')}
                                />
                            ))}
                        </div>
                    </SortableContext>
                )}
            </div>
        </div>
    );
};
