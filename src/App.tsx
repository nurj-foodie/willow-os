import { useState, useEffect } from 'react';
import type { Task } from './types';
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
import { LogOut, Shield, ShieldOff, History, Wallet, Trash2, HelpCircle } from 'lucide-react';
import { VibeHeader } from './components/wellness/VibeHeader';
import { CalendarModal } from './components/wellness/CalendarModal';
import { TaskEditModal } from './components/modals/TaskEditModal';
import { useWellbeing } from './hooks/useWellbeing';
import { useProfile } from './hooks/useProfile';
import { RitualOverlay } from './components/analytics/RitualOverlay';
import { ArchiveDrawer } from './components/analytics/ArchiveDrawer';
import { LedgerDrawer } from './components/finance/LedgerDrawer';
import { useLedger } from './hooks/useLedger';

import { Footer } from './components/layout/Footer';
import { TutorialOverlay } from './components/onboarding/TutorialOverlay';
import { PWAInstallPrompt } from './components/ui/PWAInstallPrompt';

function App() {
  console.log('🌿 Willow App Loaded - Build:', new Date().toISOString());
  const { tasks, allTasks, loading: tasksLoading, user, selectedDate, setSelectedDate, addTask, updateTask, updateTasks, reorderTasks, logout, deleteAccount } = useTasks();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { mood, priorities, saving, updateMood, loading: wellbeingLoading } = useWellbeing(user);
  const { profile, loading: profileLoading, updateProfile, recordLogin } = useProfile(user);
  const { entries, trialDaysLeft, addEntry, updateEntry, deleteEntry } = useLedger(user, profile, updateProfile);

  const [showRitual, setShowRitual] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0); // 0: Input, 1: Calendar, 2: Ledger, 3-6: Tour
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);

  // Auto-trigger tutorial if we detect the "Seeded" state (Task 1 exists)
  useEffect(() => {
    if (!tasksLoading && tasks.length > 0) {
      const hasSeedTask = tasks.some(t => t.title.includes('Example: Buy Matcha'));
      if (hasSeedTask && !showOnboarding && !localStorage.getItem('willow_tutorial_completed')) {
        setShowOnboarding(true);
      }
    }
  }, [tasks, tasksLoading]);

  // Ritual trigger logic
  useEffect(() => {
    if (!profileLoading && profile && user) {
      const lastLogin = profile.last_login_at ? new Date(profile.last_login_at) : null;
      const now = new Date();

      const isNewUser = !profile.display_name;
      const isFirstLoginToday = !lastLogin || lastLogin.toDateString() !== now.toDateString();

      // Always show ritual for demo users on first visit OR existing users on new day
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

  // --- Tutorial Handlers ---
  const handleTutorialNext = () => setTutorialStep(prev => prev + 1);

  const handleAppAddTask = async (title: string, date: Date | null, priority: number) => {
    await addTask(title, date, priority);
    // Advance tutorial if on step 0 (Input) - with delay for animation
    if (showOnboarding && tutorialStep === 0) {
      setTimeout(() => setTutorialStep(1), 1500);
    }
  };

  const handleAppCalendarClick = () => {
    setShowCalendar(true);
    // Advance tutorial if on step 1 (Calendar Trigger) -> Step 2 (Inside Calendar)
    if (showOnboarding && tutorialStep === 1) {
      setTutorialStep(2);
    }
  };

  const handleAppDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Advance tutorial if on step 2 (Inside Calendar) -> Step 3 (Ledger Trigger)
    if (showOnboarding && tutorialStep === 2) {
      setTutorialStep(3);
    }
  };

  const handleAppLedgerOpen = () => {
    setShowLedger(true);
    // Advance tutorial if on step 3 (Ledger Trigger) -> Step 4 (Archive)
    if (showOnboarding && tutorialStep === 3) {
      setTutorialStep(4);
    }
  };

  const handleAppArchiveOpen = () => {
    setShowArchive(true);
    // Advance tutorial if on step 4 (Archive) -> Step 5 (Privacy)
    if (showOnboarding && tutorialStep === 4) {
      setTutorialStep(5);
    }
  };


  // Only show loading state when user is logged in
  const loading = user && (tasksLoading || wellbeingLoading || profileLoading);

  // Hide tutorial when majors modals are open, EXCEPT when we are explicitly IN the "Inside Calendar" step (Step 2)
  const isTutorialVisible = showOnboarding &&
    ((!showCalendar && !showLedger && !showArchive) || (showCalendar && tutorialStep === 2));

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
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-2">
            <div className="text-charcoal/40 font-serif italic animate-pulse">
              {profileLoading ? 'Syncing Profile...' :
                wellbeingLoading ? 'Checking Vibe...' :
                  tasksLoading ? 'Loading Tasks...' : 'Almost there...'}
            </div>
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

        <AnimatePresence>
          {showRitual && (() => {
            // Calculate today's tasks for the day summary
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todayTasks = allTasks.filter(t => {
              if (!t.due_date || t.status === 'done' || t.status === 'archived') return false;
              const dueDate = new Date(t.due_date);
              return dueDate >= today && dueDate < tomorrow;
            });

            const overdueTasks = allTasks.filter(t => {
              if (!t.due_date || t.status === 'done' || t.status === 'archived') return false;
              const dueDate = new Date(t.due_date);
              dueDate.setHours(0, 0, 0, 0);
              return dueDate < today;
            });

            return (
              <RitualOverlay
                userName={profile?.display_name || null}
                onComplete={handleRitualComplete}
                yesterdayPriorities={priorities}
                isNewUser={!profile?.display_name}
                todayTaskCount={todayTasks.length}
                overdueTaskCount={overdueTasks.length}
                overdueTasks={overdueTasks.map(t => ({ title: t.title, emoji: t.emoji }))}
              />
            );
          })()}
          {isTutorialVisible && (
            <TutorialOverlay
              step={tutorialStep}
              onNext={handleTutorialNext}
              onSkip={() => {
                setShowOnboarding(false);
                localStorage.setItem('willow_tutorial_completed', 'true');
              }}
            />
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
                    id="archive-trigger"
                    onClick={handleAppArchiveOpen}
                    className="text-charcoal/30 hover:text-charcoal transition-colors p-2 rounded-full hover:bg-clay/10"
                    title="View Archive"
                  >
                    <History size={20} />
                  </button>
                  <button
                    id="ledger-trigger"
                    onClick={handleAppLedgerOpen}
                    className="text-charcoal/30 hover:text-charcoal transition-colors p-2 rounded-full hover:bg-clay/10"
                    title="Willow Ledger"
                  >
                    <Wallet size={20} />
                  </button>
                  <button
                    id="privacy-trigger"
                    onClick={() => {
                      setPrivacyMode(!privacyMode);
                      if (showOnboarding && tutorialStep === 4) setTutorialStep(5);
                    }}
                    className="text-charcoal/30 hover:text-charcoal transition-colors p-2 rounded-full hover:bg-clay/10"
                    title={privacyMode ? "Disable Privacy Mode" : "Enable Privacy Mode"}
                  >
                    {privacyMode ? <Shield size={20} /> : <ShieldOff size={20} />}
                  </button>
                  <div id="account-actions" className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setTutorialStep(0);
                        setShowOnboarding(true);
                      }}
                      className="text-charcoal/30 hover:text-charcoal transition-colors p-2 rounded-full hover:bg-clay/10"
                      title="Restart Tutorial"
                    >
                      <HelpCircle size={20} />
                    </button>
                    <button
                      onClick={() => {
                        if (showOnboarding && tutorialStep === 5) setTutorialStep(6);
                        logout();
                      }}
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
              onCalendarClick={handleAppCalendarClick}
              selectedDate={selectedDate}
              saving={saving}
            />
            <SmartInput onAddTask={handleAppAddTask} />
            <div className="mt-8">
              <LiquidStream
                tasks={streamTasks}
                onToggle={(id, done) => updateTask(id, { status: done ? 'done' : 'todo' })}
                onEdit={setEditingTask}
                privacyMode={privacyMode}
              />
            </div>
          </main>
        </div>

        <aside id="parking-lot-section" className="w-full md:w-80 border-t md:border-t-0 md:border-l border-clay/10 h-[400px] md:h-screen sticky bottom-0 md:top-0 bg-oat/50 backdrop-blur-sm">
          <ParkingLot
            tasks={parkedTasks}
            onToggle={(id, done) => updateTask(id, { status: done ? 'done' : 'parked' })}
            privacyMode={privacyMode}
          />
        </aside>

        <ArchiveDrawer
          isOpen={showArchive}
          onClose={() => setShowArchive(false)}
          tasks={allTasks}
        />

        <LedgerDrawer
          isOpen={showLedger}
          onClose={() => setShowLedger(false)}
          entries={entries}
          trialDaysLeft={trialDaysLeft}
          onAddEntry={addEntry}
          onUpdateEntry={updateEntry}
          onDeleteEntry={deleteEntry}
          user={user}
          showScanner={showReceiptScanner}
          setShowScanner={setShowReceiptScanner}
        />

        <Footer onOpenLegal={setShowLegal} />

        <PWAInstallPrompt />

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
          doneTasks={tasks.filter(t => t.status === 'done')}
          incompleteTasks={tasks.filter(t => {
            // Incomplete = today's tasks that are still 'todo' (not done, not parked)
            if (t.status !== 'todo' || !t.due_date) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dueDate = new Date(t.due_date);
            return dueDate >= today && dueDate < tomorrow;
          })}
          onReset={(rolloverIncomplete) => {
            // Done tasks stay as 'done' - they won't appear tomorrow due to date filtering
            // No need to change status (and 'archived' is not a valid DB status anyway)

            // Rollover incomplete tasks to tomorrow
            if (rolloverIncomplete) {
              const incompleteIds = tasks.filter(t => {
                if (t.status !== 'todo' || !t.due_date) return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dueDate = new Date(t.due_date);
                return dueDate >= today && dueDate < tomorrow;
              }).map(t => t.id);

              if (incompleteIds.length > 0) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(9, 0, 0, 0); // Set to 9am tomorrow
                updateTasks(incompleteIds, { due_date: tomorrow.toISOString() });
              }
            }
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

        {showCalendar && (
          <CalendarModal
            isOpen={showCalendar}
            onClose={() => setShowCalendar(false)}
            tasks={allTasks} // Pass all tasks, including done/archived
            onDateSelect={handleAppDateSelect}
          />
        )}{/* Task Edit Modal */}
        <TaskEditModal
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSave={updateTask}
        />
      </div>
    </DndContext>
  );
}

export default App;
