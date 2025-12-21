import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Sparkles, AlertCircle } from 'lucide-react';
import type { LedgerEntry } from '../../hooks/useLedger';

interface LedgerDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    entries: LedgerEntry[];
    trialDaysLeft: number | null;
    onStartTrial: () => void;
    onAddEntry: (entry: any) => Promise<void>;
    hasStartedTrial: boolean;
}

export const LedgerDrawer: React.FC<LedgerDrawerProps> = ({
    isOpen, onClose, entries, trialDaysLeft, onStartTrial, onAddEntry, hasStartedTrial
}) => {
    const [showForm, setShowForm] = useState(false);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onAddEntry({
            amount: parseFloat(amount),
            category,
            description,
            currency: 'MYR'
        });
        setAmount('');
        setCategory('');
        setDescription('');
        setShowForm(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-charcoal/20 z-40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-serif font-bold text-charcoal">Willow Ledger</h2>
                                <button onClick={onClose} className="p-2 rounded-full hover:bg-charcoal/5"><X /></button>
                            </div>

                            {!hasStartedTrial ? (
                                <div className="bg-matcha/10 rounded-2xl p-8 text-center space-y-6">
                                    <Sparkles className="w-12 h-12 text-matcha mx-auto" />
                                    <h3 className="text-xl font-serif font-bold">Start Your 7-Day Trial</h3>
                                    <p className="text-charcoal/60 text-sm italic">"Mindful spending is the sibling of mindful focus."</p>
                                    <button
                                        onClick={onStartTrial}
                                        className="w-full bg-charcoal text-oat py-4 rounded-xl font-bold shadow-lg hover:shadow-charcoal/20 transition-all"
                                    >
                                        Activate Explorer Trial
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Trial Status Header */}
                                    {trialDaysLeft !== null && trialDaysLeft <= 7 && (
                                        <div className="flex items-center gap-2 bg-clay/5 px-4 py-2 rounded-full text-xs font-bold text-clay uppercase tracking-widest">
                                            <AlertCircle size={14} />
                                            <span>{trialDaysLeft} Days Remaining in Trial</span>
                                        </div>
                                    )}

                                    {/* Quick Summary */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-sage/10 p-4 rounded-xl">
                                            <span className="text-[10px] uppercase font-bold text-sage opacity-60">This Week</span>
                                            <p className="text-xl font-serif font-bold text-sage">RM {entries.reduce((a, b) => a + b.amount, 0).toFixed(2)}</p>
                                        </div>
                                        <div className="bg-clay/10 p-4 rounded-xl flex items-center justify-center cursor-pointer hover:bg-clay/20 transition-colors"
                                            onClick={() => setShowForm(!showForm)}>
                                            <Plus size={24} className="text-clay" />
                                        </div>
                                    </div>

                                    {showForm && (
                                        <form onSubmit={handleSubmit} className="space-y-4 bg-oat/30 p-4 rounded-xl border border-clay/10">
                                            <input
                                                required type="number" step="0.01" placeholder="Amount (RM)"
                                                value={amount} onChange={e => setAmount(e.target.value)}
                                                className="w-full bg-white px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-clay"
                                            />
                                            <select
                                                required value={category} onChange={e => setCategory(e.target.value)}
                                                className="w-full bg-white px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-clay"
                                            >
                                                <option value="">Category</option>
                                                <option value="Food">🍲 Food</option>
                                                <option value="Transport">🚗 Transport</option>
                                                <option value="Wellness">🧘 Wellness</option>
                                                <option value="Misc">📦 Misc</option>
                                            </select>
                                            <input
                                                placeholder="Description (Optional)"
                                                value={description} onChange={e => setDescription(e.target.value)}
                                                className="w-full bg-white px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-clay"
                                            />
                                            <button type="submit" className="w-full bg-clay text-white py-3 rounded-lg font-bold">Plant Entry</button>
                                        </form>
                                    )}

                                    {/* Entries List */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-charcoal/30 uppercase tracking-widest">Flow Log</h4>
                                        {entries.map(entry => (
                                            <div key={entry.id} className="flex justify-between items-center p-4 rounded-xl border border-charcoal/5 group hover:border-clay/20 transition-all">
                                                <div>
                                                    <p className="font-bold text-charcoal">{entry.description || entry.category}</p>
                                                    <p className="text-[10px] text-charcoal/40 uppercase font-bold">{entry.category}</p>
                                                </div>
                                                <p className="font-serif font-bold text-clay">RM {entry.amount.toFixed(2)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
