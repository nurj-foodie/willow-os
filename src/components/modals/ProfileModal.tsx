import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    LogOut,
    Trash2,
    Shield,
    ShieldOff,
    Bell,
    BellOff,
    History,
    HelpCircle,
    Loader2,
    Wallet,
    Edit2,
    Check,
    Moon,
    Sun
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { usePushNotifications } from '../../hooks/usePushNotifications';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: SupabaseUser | null;
    profile: any;
    updateProfile: (updates: any) => Promise<any>;

    // Actions passed from App
    onLogout: () => void;
    onDeleteAccount: () => void;
    onOpenArchive: () => void;
    onRestartTutorial: () => void;

    // Privacy State
    privacyMode: boolean;
    setPrivacyMode: (mode: boolean) => void;

    // Theme State
    isDark: boolean;
    toggleTheme: () => void;
}

export const ProfileModal = ({
    isOpen,
    onClose,
    user,
    profile,
    updateProfile,
    onLogout,
    onDeleteAccount,
    onOpenArchive,
    onRestartTutorial,
    privacyMode,
    setPrivacyMode,
    isDark,
    toggleTheme
}: ProfileModalProps) => {
    const { isSubscribed, loading: pushLoading, subscribeToPush, unsubscribeFromPush, isSupported: isPushSupported } = usePushNotifications(user);

    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState('');
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && profile?.display_name) {
            setEditName(profile.display_name);
        }
    }, [isOpen, profile]);

    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
        }
    }, [isEditingName]);

    const handleSaveName = async () => {
        if (!editName.trim()) return;
        await updateProfile({ display_name: editName.trim() });
        setIsEditingName(false);
    };

    const joinDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        : 'Recently';

    const avatarInitial = profile?.display_name ? profile.display_name[0].toUpperCase() : user?.email?.[0].toUpperCase() || '?';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-white dark:bg-neutral-900/90 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative p-6 pt-12 pb-8 flex flex-col items-center border-b border-clay/10 bg-gradient-to-b from-oat/50 to-transparent">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-charcoal/30 hover:text-charcoal transition-colors rounded-full hover:bg-clay/10"
                            >
                                <X size={20} />
                            </button>

                            {/* Avatar */}
                            <div className="w-24 h-24 rounded-full bg-oat border-4 border-white shadow-lg flex items-center justify-center text-4xl font-serif text-charcoal mb-4 relative overflow-hidden group">
                                {avatarInitial}
                            </div>

                            {/* Editable Name */}
                            <div className="flex items-center gap-2 mb-1 h-8">
                                {isEditingName ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            ref={nameInputRef}
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                            onBlur={handleSaveName}
                                            className="bg-transparent border-b-2 border-matcha text-center font-serif text-xl font-bold text-charcoal focus:outline-none w-40"
                                        />
                                        <button onClick={handleSaveName} className="text-matcha hover:text-matcha/80">
                                            <Check size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="font-serif text-xl font-bold text-charcoal">
                                            {profile?.display_name || 'Willow User'}
                                        </h2>
                                        <button
                                            onClick={() => setIsEditingName(true)}
                                            className="text-charcoal/20 hover:text-charcoal/60 transition-colors"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </>
                                )}
                            </div>

                            <p className="text-xs font-sans text-charcoal/40 uppercase tracking-widest font-bold">
                                Member since {joinDate}
                            </p>
                        </div>

                        {/* Wallet / Stats Highlight */}
                        <div className="px-6 py-4">
                            <div className="bg-oat/60 rounded-2xl p-4 flex items-center justify-between border border-clay/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-matcha/20 rounded-xl text-matcha-dark">
                                        <Wallet size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-charcoal text-sm">Total Flow</h4>
                                        <p className="text-xs text-charcoal/50">Lifetime Manhours</p>
                                    </div>
                                </div>
                                <div className="text-xl font-serif font-bold text-charcoal">
                                    {/* TODO: Pass actual manhours if not in profile, checking useLedger/useProfile logic later */}
                                    {/* For now assuming profile has manhours or we fetch it. Actually App.tsx has useWellbeing or Ledger? */}
                                    {/* Let's assume we pass a prop or just show placeholder for V1 */}
                                    ---
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Grid */}
                        <div className="p-6 grid grid-cols-2 gap-3">

                            {/* Notifications */}
                            <button
                                onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
                                disabled={pushLoading || !isPushSupported}
                                className={`p-4 rounded-2xl border transition-all text-left flex flex-col gap-2 ${isSubscribed
                                    ? 'bg-matcha/10 border-matcha/20 hover:bg-matcha/20'
                                    : 'bg-white/40 border-clay/10 hover:bg-white/60'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className={`p-2 rounded-lg ${isSubscribed ? 'bg-matcha/20 text-matcha-dark' : 'bg-charcoal/5 text-charcoal/40'}`}>
                                        {pushLoading ? <Loader2 size={18} className="animate-spin" /> : (isSubscribed ? <Bell size={18} /> : <BellOff size={18} />)}
                                    </div>
                                    {isSubscribed && <div className="w-2 h-2 rounded-full bg-matcha shadow-[0_0_8px_rgba(0,255,0,0.4)]" />}
                                </div>
                                <div>
                                    <span className="block font-bold text-sm text-charcoal">Notifications</span>
                                    <span className="text-[10px] text-charcoal/50 font-medium">
                                        {isSubscribed ? 'On' : 'Off'}
                                    </span>
                                </div>
                            </button>

                            {/* Privacy Mode */}
                            <button
                                onClick={() => setPrivacyMode(!privacyMode)}
                                className={`p-4 rounded-2xl border transition-all text-left flex flex-col gap-2 ${privacyMode
                                    ? 'bg-lavender/10 border-lavender/20 hover:bg-lavender/20'
                                    : 'bg-white/40 border-clay/10 hover:bg-white/60'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className={`p-2 rounded-lg ${privacyMode ? 'bg-lavender/20 text-lavender-dark' : 'bg-charcoal/5 text-charcoal/40'}`}>
                                        {privacyMode ? <Shield size={18} /> : <ShieldOff size={18} />}
                                    </div>
                                    {privacyMode && <div className="w-2 h-2 rounded-full bg-lavender shadow-[0_0_8px_rgba(200,100,255,0.4)]" />}
                                </div>
                                <div>
                                    <span className="block font-bold text-sm text-charcoal">Privacy</span>
                                    <span className="text-[10px] text-charcoal/50 font-medium">
                                        {privacyMode ? 'Hidden' : 'Visible'}
                                    </span>
                                </div>
                            </button>

                            {/* Archive */}
                            <button
                                onClick={() => { onClose(); onOpenArchive(); }}
                                className="p-4 rounded-2xl border border-clay/10 bg-white/40 hover:bg-white/60 transition-all text-left flex flex-col gap-2 group"
                            >
                                <div className="p-2 rounded-lg bg-charcoal/5 text-charcoal/40 group-hover:bg-charcoal/10 group-hover:text-charcoal/60 transition-colors w-fit">
                                    <History size={18} />
                                </div>
                                <div>
                                    <span className="block font-bold text-sm text-charcoal">Archive</span>
                                    <span className="text-[10px] text-charcoal/50 font-medium">History</span>
                                </div>
                            </button>

                            {/* Tutorial */}
                            <button
                                onClick={() => { onClose(); onRestartTutorial(); }}
                                className="p-4 rounded-2xl border border-clay/10 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-all text-left flex flex-col gap-2 group"
                            >
                                <div className="p-2 rounded-lg bg-charcoal/5 text-charcoal/40 group-hover:bg-charcoal/10 group-hover:text-charcoal/60 transition-colors w-fit">
                                    <HelpCircle size={18} />
                                </div>
                                <div>
                                    <span className="block font-bold text-sm text-charcoal">Tutorial</span>
                                    <span className="text-[10px] text-charcoal/50 font-medium">Restart</span>
                                </div>
                            </button>

                            {/* Dark Mode Toggle */}
                            <button
                                onClick={toggleTheme}
                                className={`p-4 rounded-2xl border transition-all text-left flex flex-col gap-2 col-span-2 ${isDark
                                    ? 'bg-charcoal/20 border-charcoal/30 hover:bg-charcoal/30'
                                    : 'bg-white/40 border-clay/10 hover:bg-white/60'
                                    }`}
                            >
                                <div className="flex justify-between items-center w-full">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isDark ? 'bg-lavender/20 text-lavender' : 'bg-charcoal/5 text-charcoal/40'}`}>
                                            {isDark ? <Moon size={18} /> : <Sun size={18} />}
                                        </div>
                                        <div>
                                            <span className="block font-bold text-sm text-charcoal">Appearance</span>
                                            <span className="text-[10px] text-charcoal/50 font-medium">
                                                {isDark ? 'Dark Mode' : 'Light Mode'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isDark ? 'bg-lavender' : 'bg-charcoal/20'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                            </button>

                        </div>

                        {/* Footer / Danger Zone */}
                        <div className="p-4 bg-oat/30 border-t border-clay/10 flex items-center justify-between">
                            <button
                                onClick={onLogout}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-charcoal/60 hover:text-charcoal hover:bg-charcoal/5 rounded-xl transition-all"
                            >
                                <LogOut size={16} />
                                Log Out
                            </button>

                            <button
                                onClick={onDeleteAccount}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                                <Trash2 size={16} />
                                Delete Account
                            </button>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
