import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Layout } from './components/layout/Layout';
import { LiquidStream } from './components/stream/LiquidStream';
import { SmartInput } from './components/input/SmartInput';
import { ParkingLot } from './components/stream/ParkingLot';
import { ResetRitual } from './components/ui/ResetRitual';
import { TaskCard } from './components/stream/TaskCard';
import { Auth } from './components/auth/Auth';
import { useTasks } from './hooks/useTasks';
import { useNotifications } from './hooks/useNotifications';
import { LogOut, Shield, ShieldOff } from 'lucide-react';
import { VibeHeader } from './components/wellness/VibeHeader';
import { useWellbeing } from './hooks/useWellbeing';

function App() {
  const { tasks, loading, user, addTask, updateTask, reorderTasks, logout } = useTasks();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState(false);
  const { mood, priorities, saving, updateMood, updatePriority, persistPriorities } = useWellbeing(user);

  useNotifications(tasks);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const streamTasks = tasks.filter(t => t.status !== 'parked');
  const parkedTasks = tasks.filter(t => t.status === 'parked');

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Handle dropping into Parking Lot
    if (over.id === 'parking-lot') {
      if (activeTask.status !== 'parked') {
        updateTask(active.id as string, { status: 'parked', due_date: null });
      }
      return;
    }

    // Handle dropping back into Stream from Parking Lot
    const overTask = tasks.find(t => t.id === over.id);
    if (overTask && activeTask.status === 'parked' && overTask.status !== 'parked') {
      updateTask(active.id as string, { status: 'todo' });
    }

    if (active.id !== over.id) {
      reorderTasks(active.id as string, over.id as string);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-charcoal/40 font-serif italic animate-pulse">
            Loading your vibe...
          </div>
        </div>
      </Layout>
    );
  }

  // Show Auth screen if Supabase is configured but no user is logged in
  if (!user && import.meta.env.VITE_SUPABASE_URL) {
    return (
      <Layout>
        <Auth />
      </Layout>
    );
  }

  const activeTask = tasks.find(t => t.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col md:flex-row min-h-screen bg-oat">
        <div className="flex-grow max-w-2xl mx-auto px-4 py-8 md:py-16 w-full">
          <header className="mb-12 flex justify-between items-center">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-charcoal tracking-tight">
              Willow
            </h1>
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPrivacyMode(!privacyMode)}
                    className="text-charcoal/30 hover:text-charcoal transition-colors p-2 rounded-full hover:bg-clay/10"
                    title={privacyMode ? "Disable Privacy Mode" : "Enable Privacy Mode"}
                  >
                    {privacyMode ? <Shield size={20} /> : <ShieldOff size={20} />}
                  </button>
                  <button
                    onClick={logout}
                    className="text-charcoal/30 hover:text-charcoal transition-colors p-2 rounded-full hover:bg-clay/10"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              )}
              <div className="w-10 h-10 rounded-full bg-clay/30 flex items-center justify-center text-xl">
                ✨
              </div>
            </div>
          </header>

          <main>
            <VibeHeader
              currentMood={mood}
              onMoodChange={updateMood}
              priorities={priorities}
              onPriorityChange={updatePriority}
              onPriorityBlur={persistPriorities}
              saving={saving}
            />
            <SmartInput onAddTask={addTask} />
            <div className="mt-8">
              <LiquidStream
                tasks={streamTasks}
                onToggle={(id, done) => updateTask(id, { status: done ? 'done' : 'todo' })}
                privacyMode={privacyMode}
              />
            </div>
          </main>
        </div>

        <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-clay/10 h-[400px] md:h-screen sticky bottom-0 md:top-0 bg-oat/50 backdrop-blur-sm">
          <ParkingLot
            tasks={parkedTasks}
            onToggle={(id, done) => updateTask(id, { status: done ? 'done' : 'parked' })}
            privacyMode={privacyMode}
          />
        </aside>

        <ResetRitual
          hasTasks={tasks.some(t => t.status === 'done')}
          onReset={() => {
            tasks.filter(t => t.status === 'done').forEach(t => {
              updateTask(t.id, { status: 'todo', due_date: new Date(Date.now() + 86400000).toISOString() });
            });
          }}
        />

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.4',
              },
            },
          }),
        }}>
          {activeTask ? (
            <div className="w-full pointer-events-none">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

export default App;
