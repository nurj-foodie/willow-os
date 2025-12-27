import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, AlertCircle, Camera } from 'lucide-react';
import type { LedgerEntry } from '../../hooks/useLedger';
import { ReceiptScanner } from './ReceiptScanner';

interface LedgerDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    entries: LedgerEntry[];
    trialDaysLeft: number | null;
    onAddEntry: (entry: any) => Promise<void>;
    user: any;
}

export const LedgerDrawer: React.FC<LedgerDrawerProps> = ({
    isOpen, onClose, entries, trialDaysLeft, onAddEntry, user
}) => {
    const [showForm, setShowForm] = useState(false);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [showScanner, setShowScanner] = useState(false);

    // Debug: Log form state changes
    React.useEffect(() => {
        console.log('[LedgerDrawer] State changed:', { showForm, showScanner, amount, category, description });
    }, [showForm, showScanner, amount, category, description]);

    const handleScannerSuccess = (data: { amount: number; merchant: string; category: string; date: string }) => {
        console.log('[LedgerDrawer] Received scanner data:', data);

        // Map Gemini categories to Willow categories
        const categoryMap: Record<string, string> = {
            'Food & Drink': 'Food',
            'Transport': 'Transport',
            'Wellness': 'Wellness',
            'Shopping': 'Misc',
            'bills': 'Misc',
            'Other': 'Misc'
        };

        const mappedCategory = categoryMap[data.category] || data.category || 'Misc';

        setAmount(data.amount?.toString() || '0');
        setCategory(mappedCategory);
        setDescription(data.merchant);
        setShowScanner(false);
        setShowForm(true);
        console.log('[LedgerDrawer] Form state updated, showForm:', true);
    };

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

                            <div className="space-y-6">
                                {/* Trial Status Header - Hidden since trial is bypassed */}
                                {false && trialDaysLeft !== null && (
                                    <div className="flex items-center gap-2 bg-clay/5 px-4 py-2 rounded-full text-xs font-bold text-clay uppercase tracking-widest">
                                        <AlertCircle size={14} />
                                        <span>{trialDaysLeft} Days Remaining in Trial</span>
                                    </div>
                                )}

                                {/* Receipt Scanner Entry */}
                                <AnimatePresence mode="wait">
                                    {showScanner ? (
                                        <ReceiptScanner
                                            userId={user?.id || ''}
                                            onProcessed={handleScannerSuccess}
                                            onClose={() => setShowScanner(false)}
                                        />
                                    ) : (
                                        <motion.button
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            onClick={() => setShowScanner(true)}
                                            className="w-full py-8 border-2 border-dashed border-charcoal/10 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-matcha/5 hover:border-matcha/30 transition-all group"
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-matcha/20 flex items-center justify-center text-matcha group-hover:scale-110 transition-transform">
                                                <Camera size={24} />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-charcoal/60">Scan Receipt</p>
                                                <p className="text-[10px] font-bold text-charcoal/20 uppercase tracking-widest">Powered by AI</p>
                                            </div>
                                        </motion.button>
                                    )}
                                </AnimatePresence>

                                {/* Quick Summary */}
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="bg-sage/10 p-4 rounded-xl">
                                        <span className="text-[10px] uppercase font-bold text-sage opacity-60">This Month</span>
                                        <p className="text-2xl font-serif font-bold text-sage">RM {entries.reduce((a, b) => a + b.amount, 0).toFixed(2)}</p>
                                        <div className="mt-2 flex gap-2 text-xs">
                                            <span className="bg-sage/20 px-2 py-1 rounded">🍲 Food: RM{entries.filter(e => e.category === 'Food').reduce((a, b) => a + b.amount, 0).toFixed(2)}</span>
                                            <span className="bg-sage/20 px-2 py-1 rounded">🚗 Trans: RM{entries.filter(e => e.category === 'Transport').reduce((a, b) => a + b.amount, 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Manual Entry Button */}
                                <button
                                    onClick={() => setShowForm(!showForm)}
                                    className="w-full py-3 border border-clay/20 rounded-xl text-clay font-bold hover:bg-clay/10 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} />
                                    Add Manual Entry
                                </button>

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
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
