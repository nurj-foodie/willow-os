import React from 'react';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import type { Task } from '../../types';

interface LiquidStreamProps {
    tasks: Task[];
    onToggle: (id: string, done: boolean) => void;
}

export const LiquidStream: React.FC<LiquidStreamProps> = ({ tasks, onToggle }) => {
    return (
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
    );
};
