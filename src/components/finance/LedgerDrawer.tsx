import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, AlertCircle, Camera, Pencil, Trash2, Check, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import type { LedgerEntry } from '../../hooks/useLedger';
import { ReceiptScanner } from './ReceiptScanner';

interface LedgerDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    entries: LedgerEntry[];
    trialDaysLeft: number | null;
    onAddEntry: (entry: any) => Promise<void>;
    onUpdateEntry?: (id: string, updates: any) => Promise<void>;
    onDeleteEntry?: (id: string) => Promise<void>;
    user: any;
    showScanner: boolean;
    setShowScanner: (show: boolean) => void;
}

export const LedgerDrawer: React.FC<LedgerDrawerProps> = ({
    isOpen, onClose, entries, trialDaysLeft, onAddEntry, onUpdateEntry, onDeleteEntry, user,
    showScanner, setShowScanner
}) => {
    const [showForm, setShowForm] = useState(false);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    // showScanner now comes from props (lifted to App.tsx)
    const [lastSavedEntry, setLastSavedEntry] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    // Check for pending scanned data on mount (survives app reloads)
    React.useEffect(() => {
        const pending = localStorage.getItem('willow_pending_receipt');
        if (pending && isOpen) {
            try {
                const data = JSON.parse(pending);
                console.log('[LedgerDrawer] Found pending receipt data:', data);
                setAmount(data.amount || '');
                setCategory(data.category || '');
                setDescription(data.description || '');
                setShowForm(true);
                setShowScanner(false);
                localStorage.removeItem('willow_pending_receipt');
            } catch (e) {
                console.error('[LedgerDrawer] Failed to parse pending data:', e);
                localStorage.removeItem('willow_pending_receipt');
            }
        }
    }, [isOpen]);

    // Debug: Log form state changes
    React.useEffect(() => {
        console.log('[LedgerDrawer] State changed:', { showForm, showScanner, amount, category, description });
    }, [showForm, showScanner, amount, category, description]);

    // Auto-save scanned receipt directly (no form needed)
    const handleScannerSuccess = async (data: { amount: number; merchant: string; category: string; date: string; receipt_url?: string }) => {
        console.log('[LedgerDrawer] Auto-saving scanned receipt:', data);

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

        // NOTE: Don't close scanner here - ReceiptScanner handles its own
        // close timing after showing the "done" animation for 1 second

        // Check for duplicate (same amount + merchant)
        const isDuplicate = entries.some(entry =>
            entry.amount === data.amount &&
            entry.description?.toLowerCase() === data.merchant?.toLowerCase()
        );

        if (isDuplicate) {
            // Small delay to let scanner close animation finish
            await new Promise(resolve => setTimeout(resolve, 300));
            const proceed = confirm(`⚠️ Possible duplicate detected!\n\nAmount: RM ${data.amount?.toFixed(2)}\nMerchant: ${data.merchant}\n\nThis looks similar to an existing entry. Save anyway?`);
            if (!proceed) {
                return;
            }
        }

        try {
            console.log('[LedgerDrawer] Saving with receipt_url:', data.receipt_url);
            // Save directly to database - no form needed!
            await onAddEntry({
                amount: data.amount || 0,
                category: mappedCategory,
                description: data.merchant || 'Scanned Receipt',
                currency: 'MYR',
                receipt_url: data.receipt_url
            });

            console.log('[LedgerDrawer] Entry auto-saved successfully!');
            setLastSavedEntry(`RM ${data.amount?.toFixed(2)} - ${data.merchant}`);

            // Clear success message after 3 seconds
            setTimeout(() => setLastSavedEntry(null), 3000);
        } catch (error) {
            console.error('[LedgerDrawer] Failed to auto-save entry:', error);
        }
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
                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => {
                                            const pdf = new jsPDF();
                                            const now = new Date();
                                            const monthYear = now.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
                                            const total = entries.reduce((sum, e) => sum + e.amount, 0);
                                            const isOngoingMonth = now.getMonth() === new Date().getMonth() && now.getFullYear() === new Date().getFullYear();

                                            // === PAGE 1: Summary ===

                                            // Header with Willow branding
                                            pdf.setFontSize(24);
                                            pdf.setTextColor(60, 60, 60);
                                            pdf.text('🌿 Willow Ledger', 20, 25);

                                            pdf.setFontSize(14);
                                            pdf.setTextColor(100, 100, 100);
                                            pdf.text(`${monthYear} Expense Report`, 20, 35);

                                            if (isOngoingMonth) {
                                                pdf.setFontSize(9);
                                                pdf.setTextColor(150, 150, 150);
                                                pdf.text('(Progress Report - Month in Progress)', 20, 42);
                                            }

                                            // Total summary box
                                            pdf.setFillColor(241, 245, 239); // Light matcha
                                            pdf.rect(20, 50, 170, 20, 'F');
                                            pdf.setFontSize(12);
                                            pdf.setTextColor(60, 60, 60);
                                            pdf.text('Total Expenses:', 25, 62);
                                            pdf.setFontSize(16);
                                            pdf.setTextColor(80, 130, 80); // Matcha green
                                            pdf.text(`RM ${total.toFixed(2)}`, 140, 62);

                                            // Category breakdown
                                            const categoryTotals: Record<string, { total: number; count: number }> = {};
                                            entries.forEach(e => {
                                                const cat = e.category || 'Misc';
                                                if (!categoryTotals[cat]) categoryTotals[cat] = { total: 0, count: 0 };
                                                categoryTotals[cat].total += e.amount;
                                                categoryTotals[cat].count++;
                                            });

                                            pdf.setFontSize(12);
                                            pdf.setTextColor(60, 60, 60);
                                            pdf.text('Category Breakdown', 20, 85);

                                            let catY = 95;
                                            pdf.setFontSize(10);
                                            Object.entries(categoryTotals)
                                                .sort((a, b) => b[1].total - a[1].total)
                                                .forEach(([cat, data]) => {
                                                    const percentage = ((data.total / total) * 100).toFixed(1);
                                                    pdf.setTextColor(80, 80, 80);
                                                    pdf.text(`${cat}`, 25, catY);
                                                    pdf.text(`${data.count} item${data.count > 1 ? 's' : ''}`, 80, catY);
                                                    pdf.text(`RM ${data.total.toFixed(2)}`, 120, catY);
                                                    pdf.setTextColor(150, 150, 150);
                                                    pdf.text(`(${percentage}%)`, 165, catY);
                                                    catY += 8;
                                                });

                                            // === PAGE 2+: Detailed entries ===
                                            pdf.addPage();
                                            pdf.setFontSize(14);
                                            pdf.setTextColor(60, 60, 60);
                                            pdf.text('Transaction Details', 20, 20);

                                            pdf.setFontSize(8);
                                            pdf.setTextColor(150, 150, 150);
                                            pdf.text('Date', 20, 30);
                                            pdf.text('Description', 50, 30);
                                            pdf.text('Category', 120, 30);
                                            pdf.text('Amount', 165, 30);

                                            // Separator line
                                            pdf.setDrawColor(200, 200, 200);
                                            pdf.line(20, 33, 190, 33);

                                            let y = 42;
                                            let runningTotal = 0;

                                            // Sort entries by date
                                            const sortedEntries = [...entries].sort((a, b) =>
                                                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                                            );

                                            for (let i = 0; i < sortedEntries.length; i++) {
                                                const entry = sortedEntries[i];
                                                if (y > 270) {
                                                    pdf.addPage();
                                                    y = 20;
                                                }

                                                runningTotal += entry.amount;
                                                const entryDate = new Date(entry.created_at).toLocaleDateString('en-MY', {
                                                    day: '2-digit',
                                                    month: 'short'
                                                });

                                                // Alternate row background
                                                if (i % 2 === 0) {
                                                    pdf.setFillColor(250, 250, 250);
                                                    pdf.rect(20, y - 5, 170, 10, 'F');
                                                }

                                                pdf.setFontSize(9);
                                                pdf.setTextColor(100, 100, 100);
                                                pdf.text(entryDate, 20, y);

                                                pdf.setTextColor(60, 60, 60);
                                                const desc = (entry.description || 'No description').substring(0, 30);
                                                pdf.text(desc, 50, y);

                                                pdf.setTextColor(100, 100, 100);
                                                pdf.text(entry.category || 'Misc', 120, y);

                                                pdf.setTextColor(60, 60, 60);
                                                pdf.text(`RM ${entry.amount.toFixed(2)}`, 165, y);

                                                y += 10;
                                            }

                                            // Final total at bottom
                                            pdf.setDrawColor(200, 200, 200);
                                            pdf.line(20, y + 2, 190, y + 2);
                                            pdf.setFontSize(10);
                                            pdf.setTextColor(80, 130, 80);
                                            pdf.text(`Running Total: RM ${runningTotal.toFixed(2)}`, 130, y + 12);

                                            // Footer
                                            pdf.setFontSize(8);
                                            pdf.setTextColor(180, 180, 180);
                                            pdf.text(`Generated by Willow • ${now.toLocaleDateString()}`, 20, 285);

                                            pdf.save(`willow-ledger-${monthYear.replace(' ', '-')}.pdf`);
                                        }}
                                        className="p-2 rounded-full hover:bg-charcoal/5"
                                        title="Export PDF"
                                    >
                                        <Download size={20} />
                                    </button>
                                    <button onClick={onClose} className="p-2 rounded-full hover:bg-charcoal/5"><X /></button>
                                </div>
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
                                {showScanner ? (
                                    <ReceiptScanner
                                        userId={user?.id || ''}
                                        onProcessed={handleScannerSuccess}
                                        onClose={() => setShowScanner(false)}
                                    />
                                ) : (
                                    <button
                                        onClick={() => setShowScanner(true)}
                                        className="w-full py-8 border-2 border-dashed border-charcoal/10 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-matcha/5 hover:border-matcha/30 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-matcha/20 flex items-center justify-center text-matcha group-hover:scale-110 transition-transform">
                                            <Camera size={24} />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-charcoal/60">Scan Receipt</p>
                                            <p className="text-[10px] font-bold text-charcoal/20 uppercase tracking-widest">Auto-Saves Instantly</p>
                                        </div>
                                    </button>
                                )}

                                {/* Success Message */}
                                <AnimatePresence>
                                    {lastSavedEntry && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="bg-matcha/20 text-matcha px-4 py-3 rounded-xl text-center"
                                        >
                                            <p className="font-bold">✓ Entry Saved!</p>
                                            <p className="text-sm">{lastSavedEntry}</p>
                                        </motion.div>
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
                                        <div key={entry.id} className="p-4 rounded-xl border border-charcoal/5 group hover:border-clay/20 transition-all">
                                            {editingId === entry.id ? (
                                                // Edit mode
                                                <div className="space-y-3">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={editAmount}
                                                        onChange={e => setEditAmount(e.target.value)}
                                                        className="w-full bg-white px-3 py-2 rounded-lg border border-clay/20 text-sm"
                                                        placeholder="Amount"
                                                    />
                                                    <select
                                                        value={editCategory}
                                                        onChange={e => setEditCategory(e.target.value)}
                                                        className="w-full bg-white px-3 py-2 rounded-lg border border-clay/20 text-sm"
                                                    >
                                                        <option value="Food">🍲 Food</option>
                                                        <option value="Transport">🚗 Transport</option>
                                                        <option value="Wellness">🧘 Wellness</option>
                                                        <option value="Misc">📦 Misc</option>
                                                    </select>
                                                    <input
                                                        value={editDescription}
                                                        onChange={e => setEditDescription(e.target.value)}
                                                        className="w-full bg-white px-3 py-2 rounded-lg border border-clay/20 text-sm"
                                                        placeholder="Description"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                if (onUpdateEntry) {
                                                                    await onUpdateEntry(entry.id, {
                                                                        amount: parseFloat(editAmount),
                                                                        category: editCategory,
                                                                        description: editDescription
                                                                    });
                                                                }
                                                                setEditingId(null);
                                                            }}
                                                            className="flex-1 bg-matcha text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1"
                                                        >
                                                            <Check size={16} /> Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="px-4 py-2 border border-charcoal/20 rounded-lg text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // View mode
                                                <div className="flex justify-between items-center gap-3">
                                                    {entry.receipt_url && (
                                                        <button
                                                            onClick={() => setViewingImage(entry.receipt_url!)}
                                                            className="w-12 h-12 rounded-lg bg-charcoal/5 overflow-hidden flex-shrink-0 hover:opacity-80"
                                                        >
                                                            <img src={entry.receipt_url} alt="Receipt" className="w-full h-full object-cover" />
                                                        </button>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-charcoal">{entry.description || entry.category}</p>
                                                        <p className="text-[10px] text-charcoal/40 uppercase font-bold">{entry.category}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-serif font-bold text-clay">RM {entry.amount.toFixed(2)}</p>
                                                        <button
                                                            onClick={() => {
                                                                setEditingId(entry.id);
                                                                setEditAmount(entry.amount.toString());
                                                                setEditCategory(entry.category);
                                                                setEditDescription(entry.description || '');
                                                            }}
                                                            className="p-2 hover:bg-charcoal/5 rounded-lg transition-all"
                                                        >
                                                            <Pencil size={14} className="text-charcoal/40" />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (onDeleteEntry && confirm('Delete this entry?')) {
                                                                    await onDeleteEntry(entry.id);
                                                                }
                                                            }}
                                                            className="p-2 hover:bg-red-50 rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={14} className="text-red-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Image Modal */}
                                <AnimatePresence>
                                    {viewingImage && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
                                            onClick={() => setViewingImage(null)}
                                        >
                                            <motion.img
                                                initial={{ scale: 0.9 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0.9 }}
                                                src={viewingImage}
                                                alt="Receipt"
                                                className="max-w-full max-h-full rounded-xl"
                                            />
                                            <button
                                                className="absolute top-4 right-4 p-2 bg-white/20 rounded-full"
                                                onClick={() => setViewingImage(null)}
                                            >
                                                <X size={24} className="text-white" />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
