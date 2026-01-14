import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ChevronLeft, ChevronRight, Sparkles, FileText, Pencil, Trash2, Check, Download, BarChart3, Image, Camera } from 'lucide-react';
import { jsPDF } from 'jspdf';
import type { LedgerEntry } from '../../hooks/useLedger';
import { ReceiptScanner } from './ReceiptScanner';
import { supabase } from '../../lib/supabase';

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
    const [lastSavedEntry, setLastSavedEntry] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [manualPhoto, setManualPhoto] = useState<File | null>(null);
    const [manualPhotoPreview, setManualPhotoPreview] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const manualPhotoRef = useRef<HTMLInputElement>(null);

    // Monthly navigation state
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Filter entries by selected month
    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            const entryDate = new Date(entry.created_at);
            return entryDate.getMonth() === selectedDate.getMonth() &&
                entryDate.getFullYear() === selectedDate.getFullYear();
        });
    }, [entries, selectedDate]);

    // Calculate month totals and category breakdown
    const monthStats = useMemo(() => {
        const total = filteredEntries.reduce((sum, e) => sum + e.amount, 0);
        const byCategory: Record<string, { total: number; count: number }> = {};

        filteredEntries.forEach(e => {
            const cat = e.category || 'Misc';
            if (!byCategory[cat]) byCategory[cat] = { total: 0, count: 0 };
            byCategory[cat].total += e.amount;
            byCategory[cat].count++;
        });

        return { total, byCategory, count: filteredEntries.length };
    }, [filteredEntries]);

    const navigateMonth = (direction: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setSelectedDate(newDate);
    };

    const monthLabel = selectedDate.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });

    // Check for pending scanned data on mount
    React.useEffect(() => {
        const pending = localStorage.getItem('willow_pending_receipt');
        if (pending && isOpen) {
            try {
                const data = JSON.parse(pending);
                setAmount(data.amount || '');
                setCategory(data.category || '');
                setDescription(data.description || '');
                setShowForm(true);
                setShowScanner(false);
                localStorage.removeItem('willow_pending_receipt');
            } catch (e) {
                localStorage.removeItem('willow_pending_receipt');
            }
        }
    }, [isOpen]);

    const handleScannerSuccess = async (data: { amount: number; merchant: string; category: string; date: string; receipt_url?: string }) => {
        const categoryMap: Record<string, string> = {
            'Food & Drink': 'Food',
            'Transport': 'Transport',
            'Wellness': 'Wellness',
            'Shopping': 'Misc',
            'bills': 'Misc',
            'Other': 'Misc'
        };

        const mappedCategory = categoryMap[data.category] || data.category || 'Misc';

        const isDuplicate = entries.some(entry =>
            entry.amount === data.amount &&
            entry.description?.toLowerCase() === data.merchant?.toLowerCase()
        );

        if (isDuplicate) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const proceed = confirm(`⚠️ Possible duplicate detected!\n\nAmount: RM ${data.amount?.toFixed(2)}\nMerchant: ${data.merchant}\n\nSave anyway?`);
            if (!proceed) return;
        }

        try {
            await onAddEntry({
                amount: data.amount || 0,
                category: mappedCategory,
                description: data.merchant || 'Scanned Receipt',
                currency: 'MYR',
                receipt_url: data.receipt_url
            });

            setLastSavedEntry(`RM ${data.amount?.toFixed(2)} - ${data.merchant}`);
            setTimeout(() => setLastSavedEntry(null), 3000);
        } catch (error) {
            console.error('[PaperTrail] Failed to save:', error);
        }
    };

    const handleManualPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setManualPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => setManualPhotoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let receipt_url: string | undefined;

        // Upload photo if provided
        if (manualPhoto && user?.id) {
            setUploadingPhoto(true);
            try {
                const fileExt = manualPhoto.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('receipts')
                    .upload(filePath, manualPhoto);

                if (!uploadError) {
                    const { data: urlData } = await supabase.storage
                        .from('receipts')
                        .createSignedUrl(filePath, 60 * 60 * 24 * 365);
                    receipt_url = urlData?.signedUrl || undefined;
                }
            } catch (err) {
                console.error('[ManualEntry] Photo upload failed:', err);
            }
            setUploadingPhoto(false);
        }

        await onAddEntry({
            amount: parseFloat(amount),
            category,
            description,
            currency: 'MYR',
            receipt_url
        });
        setAmount('');
        setCategory('');
        setDescription('');
        setManualPhoto(null);
        setManualPhotoPreview(null);
        setShowForm(false);
    };

    const handleExportPDF = () => {
        const pdf = new jsPDF();
        const total = monthStats.total;

        // Header
        pdf.setFontSize(24);
        pdf.setTextColor(60, 60, 60);
        pdf.text('🧾 Paper Trail', 20, 25);

        pdf.setFontSize(14);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${monthLabel} Expense Report`, 20, 35);

        // Total box
        pdf.setFillColor(241, 245, 239);
        pdf.rect(20, 50, 170, 20, 'F');
        pdf.setFontSize(12);
        pdf.setTextColor(60, 60, 60);
        pdf.text('Total Expenses:', 25, 62);
        pdf.setFontSize(16);
        pdf.setTextColor(80, 130, 80);
        pdf.text(`RM ${total.toFixed(2)}`, 140, 62);

        // Category breakdown
        pdf.setFontSize(12);
        pdf.setTextColor(60, 60, 60);
        pdf.text('Category Breakdown', 20, 85);

        let catY = 95;
        pdf.setFontSize(10);
        Object.entries(monthStats.byCategory)
            .sort((a, b) => b[1].total - a[1].total)
            .forEach(([cat, data]) => {
                const percentage = total > 0 ? ((data.total / total) * 100).toFixed(1) : '0';
                pdf.setTextColor(80, 80, 80);
                pdf.text(`${cat}`, 25, catY);
                pdf.text(`${data.count} receipt${data.count > 1 ? 's' : ''}`, 80, catY);
                pdf.text(`RM ${data.total.toFixed(2)}`, 120, catY);
                pdf.setTextColor(150, 150, 150);
                pdf.text(`(${percentage}%)`, 165, catY);
                catY += 8;
            });

        // Page 2: Details
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.setTextColor(60, 60, 60);
        pdf.text('Receipt Details', 20, 20);

        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text('Date', 20, 30);
        pdf.text('Description', 50, 30);
        pdf.text('Category', 120, 30);
        pdf.text('Amount', 165, 30);

        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, 33, 190, 33);

        let y = 42;
        const sortedEntries = [...filteredEntries].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        for (let i = 0; i < sortedEntries.length; i++) {
            const entry = sortedEntries[i];
            if (y > 270) {
                pdf.addPage();
                y = 20;
            }

            const entryDate = new Date(entry.created_at).toLocaleDateString('en-MY', {
                day: '2-digit',
                month: 'short'
            });

            if (i % 2 === 0) {
                pdf.setFillColor(250, 250, 250);
                pdf.rect(20, y - 5, 170, 10, 'F');
            }

            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            pdf.text(entryDate, 20, y);
            pdf.setTextColor(60, 60, 60);
            pdf.text((entry.description || 'No description').substring(0, 30), 50, y);
            pdf.setTextColor(100, 100, 100);
            pdf.text(entry.category || 'Misc', 120, y);
            pdf.setTextColor(60, 60, 60);
            pdf.text(`RM ${entry.amount.toFixed(2)}`, 165, y);

            y += 10;
        }

        // Footer
        pdf.setFontSize(8);
        pdf.setTextColor(180, 180, 180);
        pdf.text(`Generated by Willow • ${new Date().toLocaleDateString()}`, 20, 285);

        const filename = `paper-trail-${monthLabel.toLowerCase().replace(' ', '-')}.pdf`;
        pdf.save(filename);
    };

    const getCategoryIcon = (cat: string) => {
        const icons: Record<string, string> = {
            'Food': '🍲',
            'Transport': '🚗',
            'Wellness': '🧘',
            'Misc': '📦'
        };
        return icons[cat] || '📋';
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
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-serif font-bold text-charcoal">Paper Trail</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleExportPDF}
                                        className="p-2 rounded-full hover:bg-charcoal/5"
                                        title="Export PDF"
                                    >
                                        <Download size={20} />
                                    </button>
                                    <button onClick={onClose} className="p-2 rounded-full hover:bg-charcoal/5"><X /></button>
                                </div>
                            </div>

                            {/* Month Navigation */}
                            <div className="flex items-center justify-between mb-6 bg-oat/50 rounded-2xl px-4 py-3">
                                <button
                                    onClick={() => navigateMonth(-1)}
                                    className="p-2 hover:bg-charcoal/5 rounded-full transition-colors"
                                >
                                    <ChevronLeft size={20} className="text-charcoal/60" />
                                </button>
                                <div className="text-center">
                                    <p className="font-bold text-charcoal">{monthLabel}</p>
                                    <p className="text-xs text-charcoal/40">{monthStats.count} receipt{monthStats.count !== 1 ? 's' : ''}</p>
                                </div>
                                <button
                                    onClick={() => navigateMonth(1)}
                                    className="p-2 hover:bg-charcoal/5 rounded-full transition-colors"
                                >
                                    <ChevronRight size={20} className="text-charcoal/60" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Current Trail Summary Button */}
                                <button
                                    onClick={() => setShowSummaryModal(true)}
                                    className="w-full bg-sage/10 p-4 rounded-xl flex items-center justify-between hover:bg-sage/20 transition-colors group"
                                >
                                    <div className="text-left">
                                        <span className="text-[10px] uppercase font-bold text-sage opacity-60">Current Trail</span>
                                        <p className="text-2xl font-serif font-bold text-sage">RM {monthStats.total.toFixed(2)}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <BarChart3 size={20} className="text-sage" />
                                    </div>
                                </button>

                                {/* Receipt Scanner / Upload */}
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
                                        <div className="w-14 h-14 rounded-2xl bg-matcha/20 flex items-center justify-center text-matcha group-hover:scale-110 transition-transform relative">
                                            <FileText size={24} />
                                            <Sparkles size={14} className="absolute -top-1 -right-1 text-matcha" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-charcoal/70">Digitize the Clutter</p>
                                            <p className="text-xs text-charcoal/40 italic mt-1">Safe here, gone from your purse.</p>
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
                                            <p className="font-bold">✓ Receipt Saved!</p>
                                            <p className="text-sm">{lastSavedEntry}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

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

                                        {/* Photo Upload */}
                                        <div className="space-y-2">
                                            <p className="text-xs text-charcoal/40 font-medium">Attach Receipt (Optional)</p>
                                            {manualPhotoPreview ? (
                                                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-charcoal/5">
                                                    <img src={manualPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setManualPhoto(null); setManualPhotoPreview(null); }}
                                                        className="absolute top-2 right-2 p-1 bg-white/80 rounded-full hover:bg-white"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (manualPhotoRef.current) {
                                                                manualPhotoRef.current.accept = 'image/*';
                                                                manualPhotoRef.current.capture = 'environment';
                                                                manualPhotoRef.current.click();
                                                            }
                                                        }}
                                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white rounded-lg text-charcoal/60 hover:bg-charcoal/5 transition-colors"
                                                    >
                                                        <Camera size={18} />
                                                        <span className="text-sm font-medium">Camera</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (manualPhotoRef.current) {
                                                                manualPhotoRef.current.accept = 'image/*';
                                                                manualPhotoRef.current.removeAttribute('capture');
                                                                manualPhotoRef.current.click();
                                                            }
                                                        }}
                                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white rounded-lg text-charcoal/60 hover:bg-charcoal/5 transition-colors"
                                                    >
                                                        <Image size={18} />
                                                        <span className="text-sm font-medium">Gallery</span>
                                                    </button>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                ref={manualPhotoRef}
                                                onChange={handleManualPhotoSelect}
                                                className="hidden"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={uploadingPhoto}
                                            className="w-full bg-clay text-white py-3 rounded-lg font-bold disabled:opacity-50"
                                        >
                                            {uploadingPhoto ? 'Uploading...' : 'Save Receipt'}
                                        </button>
                                    </form>
                                )}

                                {/* Receipts List */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-charcoal/30 uppercase tracking-widest">Receipts</h4>

                                    {/* Empty State */}
                                    {filteredEntries.length === 0 && (
                                        <div className="py-12 text-center">
                                            <p className="text-charcoal/30 italic">No paper left behind.</p>
                                            <p className="text-xs text-charcoal/20 mt-1">Purse: Clean. Mind: Clear.</p>
                                        </div>
                                    )}

                                    {filteredEntries.map(entry => (
                                        <div key={entry.id} className="p-4 rounded-xl border border-charcoal/5 group hover:border-clay/20 transition-all">
                                            {editingId === entry.id ? (
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
                                                <div className="flex justify-between items-center gap-3">
                                                    {entry.receipt_url && (
                                                        <button
                                                            onClick={() => setViewingImage(entry.receipt_url!)}
                                                            className="w-14 h-14 rounded-lg bg-charcoal/5 overflow-hidden flex-shrink-0 hover:opacity-80"
                                                        >
                                                            <img src={entry.receipt_url} alt="Receipt" className="w-full h-full object-cover" />
                                                        </button>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-charcoal">{entry.description || entry.category}</p>
                                                        <div className="flex items-center gap-2 text-[10px] text-charcoal/40">
                                                            <span className="uppercase font-bold">{entry.category}</span>
                                                            <span>•</span>
                                                            <span>{new Date(entry.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}</span>
                                                        </div>
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
                                                                if (onDeleteEntry && confirm('Delete this receipt?')) {
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

                                {/* Summary Modal */}
                                <AnimatePresence>
                                    {showSummaryModal && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
                                            onClick={() => setShowSummaryModal(false)}
                                        >
                                            <motion.div
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.9, opacity: 0 }}
                                                className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div className="flex justify-between items-center mb-6">
                                                    <h3 className="text-xl font-serif font-bold text-charcoal">{monthLabel}</h3>
                                                    <button
                                                        onClick={() => setShowSummaryModal(false)}
                                                        className="p-2 hover:bg-charcoal/5 rounded-full"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>

                                                {/* Total */}
                                                <div className="bg-sage/10 p-4 rounded-xl mb-6 text-center">
                                                    <span className="text-[10px] uppercase font-bold text-sage/60">Total Spent</span>
                                                    <p className="text-3xl font-serif font-bold text-sage">RM {monthStats.total.toFixed(2)}</p>
                                                    <p className="text-xs text-sage/60 mt-1">{monthStats.count} receipt{monthStats.count !== 1 ? 's' : ''}</p>
                                                </div>

                                                {/* Category Breakdown */}
                                                <div className="space-y-3">
                                                    <h4 className="text-xs font-bold text-charcoal/30 uppercase tracking-widest">Breakdown</h4>
                                                    {Object.entries(monthStats.byCategory)
                                                        .sort((a, b) => b[1].total - a[1].total)
                                                        .map(([cat, data]) => {
                                                            const percentage = monthStats.total > 0 ? (data.total / monthStats.total) * 100 : 0;
                                                            return (
                                                                <div key={cat} className="flex items-center gap-3">
                                                                    <span className="text-lg">{getCategoryIcon(cat)}</span>
                                                                    <div className="flex-1">
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="font-medium text-charcoal">{cat}</span>
                                                                            <span className="text-charcoal/60">RM {data.total.toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="h-2 bg-charcoal/5 rounded-full mt-1 overflow-hidden">
                                                                            <motion.div
                                                                                initial={{ width: 0 }}
                                                                                animate={{ width: `${percentage}%` }}
                                                                                className="h-full bg-sage rounded-full"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                    {Object.keys(monthStats.byCategory).length === 0 && (
                                                        <p className="text-center text-charcoal/30 italic py-4">No receipts this month</p>
                                                    )}
                                                </div>
                                            </motion.div>
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
