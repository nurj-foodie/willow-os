import { useState, useEffect } from 'react';
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
import { AnimatePresence, motion } from 'framer-motion';
import { Layout } from './components/layout/Layout';
import { LiquidStream } from './components/stream/LiquidStream';
import { SmartInput } from './components/input/SmartInput';
import { ParkingLot } from './components/stream/ParkingLot';
import { ResetRitual } from './components/ui/ResetRitual';
import { TaskCard } from './components/stream/TaskCard';
import { Auth } from './components/auth/Auth';
import { useTasks } from './hooks/useTasks';
import { useNotifications } from './hooks/useNotifications';
import { LogOut, Shield, ShieldOff, History, Wallet, Trash2 } from 'lucide-react';
import { VibeHeader } from './components/wellness/VibeHeader';
import { useWellbeing } from './hooks/useWellbeing';
import { useProfile } from './hooks/useProfile';
import { RitualOverlay } from './components/analytics/RitualOverlay';
import { ArchiveDrawer } from './components/analytics/ArchiveDrawer';
import { LedgerDrawer } from './components/finance/LedgerDrawer';
import { useLedger } from './hooks/useLedger';
import { PasskeyBanner } from './components/auth/PasskeyBanner';
import { Footer } from './components/layout/Footer';
import { OnboardingTour } from './components/onboarding/OnboardingTour';

function App() {
  const { tasks, loading: tasksLoading, user, addTask, updateTask, reorderTasks, logout, deleteAccount } = useTasks();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showLedger, setShowLedger] = useState(false);

  const { mood, priorities, saving, updateMood, updatePriority, persistPriorities, loading: wellbeingLoading } = useWellbeing(user);
  const { profile, loading: profileLoading, updateProfile, recordLogin } = useProfile(user);
  const { entries, trialDaysLeft, startTrial, addEntry, hasStartedTrial } = useLedger(user, profile, updateProfile);

  const [showRitual, setShowRitual] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);

  // Ritual trigger logic
  useEffect(() => {
    if (!profileLoading && profile && user) {
      const lastLogin = profile.last_login_at ? new Date(profile.last_login_at) : null;
      const now = new Date();

      const isNewUser = !profile.display_name;
      const isFirstLoginToday = !lastLogin || lastLogin.toDateString() !== now.toDateString();

      if (isNewUser || isFirstLoginToday) {
        setShowRitual(true);
      }
    }
  }, [profileLoading, profile, user]);

  const handleRitualComplete = async (name: string) => {
    if (name !== profile?.display_name) {
      await updateProfile({ display_name: name });
    }
    await recordLogin();
    setShowRitual(false);

    // If new user, trigger onboarding tour right after naming ritual
    if (!profile?.display_name) {
      setShowOnboarding(true);
    }
  };

  // Only show loading state when user is logged in
  const loading = user && (tasksLoading || wellbeingLoading || profileLoading);

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
        <Auth onOpenLegal={setShowLegal} />
      </Layout>
    );
  }

  const activeTask = tasks.find(t => t.id === activeId);

  // Time-based atmospheric hue
  const hour = new Date().getHours();
  const isMorning = hour >= 5 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 18;
  const bgGradient = isMorning
    ? 'from-amber-50/30 via-oat to-oat'
    : isAfternoon
      ? 'from-blue-50/20 via-oat to-oat'
      : 'from-slate-100/30 via-oat to-oat';

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`flex flex-col md:flex-row min-h-screen bg-gradient-to-br ${bgGradient} relative overflow-x-hidden`}>
        {user && <PasskeyBanner userId={user.id} />}
        <AnimatePresence>
          {showRitual && (
            <RitualOverlay
              userName={profile?.display_name || null}
              onComplete={handleRitualComplete}
              yesterdayPriorities={priorities}
              isNewUser={!profile?.display_name}
            />
          )}
          {showOnboarding && (
            <OnboardingTour onComplete={() => setShowOnboarding(false)} />
          )}
        </AnimatePresence>

        <div className={`flex-grow max-w-2xl mx-auto px-4 py-8 md:py-16 w-full transition-all duration-1000 ${showRitual ? 'blur-xl scale-95 opacity-0 pointer-events-none' : 'blur-0 scale-100 opacity-100'}`}>
          <header className="mb-12 flex justify-between items-center">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-charcoal tracking-tight">
              Willow
            </h1>
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowArchive(true)}
                    className="text-charcoal/30 hover:text-charcoal transition-colors p-2 rounded-full hover:bg-clay/10"
                    title="View Archive"
                  >
                    <History size={20} />
                  </button>
                  <button
                    onClick={() => setShowLedger(true)}
                    className="text-charcoal/30 hover:text-charcoal transition-colors p-2 rounded-full hover:bg-clay/10"
                    title="Willow Ledger"
                  >
                    <Wallet size={20} />
                  </button>
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
                  <button
                    onClick={deleteAccount}
                    className="text-clay/30 hover:text-clay transition-colors p-2 rounded-full hover:bg-clay/10"
                    title="Delete Account & Data"
                  >
                    <Trash2 size={20} />
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

        <ArchiveDrawer
          isOpen={showArchive}
          onClose={() => setShowArchive(false)}
          tasks={tasks}
        />

        <LedgerDrawer
          isOpen={showLedger}
          onClose={() => setShowLedger(false)}
          entries={entries}
          trialDaysLeft={trialDaysLeft}
          onStartTrial={startTrial}
          onAddEntry={addEntry}
          hasStartedTrial={hasStartedTrial}
          user={user}
        />

        <Footer onOpenLegal={setShowLegal} />

        {/* Legal Modal Overlay */}
        <AnimatePresence>
          {showLegal && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLegal(null)}
                className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-white rounded-[2rem] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
              >
                <div className="p-8 overflow-y-auto font-sans leading-relaxed text-charcoal/80">
                  {showLegal === 'privacy' ? (
                    <div className="prose prose-slate">
                      <h2 className="text-2xl font-serif font-bold text-charcoal mb-6">Privacy Policy</h2>
                      <p>Your privacy is our priority. Willow OS is designed with offline-first principles. Your task data is encrypted and only accessible by you.</p>
                      <h4 className="font-bold mt-4">Data We Collect</h4>
                      <p>We collect your email for authentication and basic profile info to personalize your flow.</p>
                      <h4 className="font-bold mt-4">Your Rights</h4>
                      <p>You have the right to export or delete your data at any time via the "Delete Account" button in the header.</p>
                    </div>
                  ) : (
                    <div className="prose prose-slate">
                      <h2 className="text-2xl font-serif font-bold text-charcoal mb-6">Terms of Service</h2>
                      <p>By using Willow, you agree to treat your productivity with mindfulness and respect.</p>
                      <h4 className="font-bold mt-4">Usage</h4>
                      <p>Willow is provided "as is". We are not responsible for any missed deadlines or excessive zen states.</p>
                      <h4 className="font-bold mt-4">Subscription</h4>
                      <p>Receipt scanning is part of the Willow Ledger premium suite, currently available as a 7-day trial.</p>
                    </div>
                  )}
                </div>
                <div className="p-6 bg-oat border-t border-clay/10 flex justify-end">
                  <button
                    onClick={() => setShowLegal(null)}
                    className="px-6 py-2 bg-charcoal text-white rounded-xl font-bold hover:bg-matcha hover:text-charcoal transition-all"
                  >
                    Acknowledged
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <ResetRitual
          hasTasks={tasks.some(t => t.status === 'done')}
          onReset={() => {
            tasks.filter(t => t.status === 'done').forEach(t => {
              updateTask(t.id, { status: 'archived' });
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
