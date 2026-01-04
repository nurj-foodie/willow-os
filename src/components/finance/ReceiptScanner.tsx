import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';

interface ReceiptScannerProps {
    onProcessed: (data: { amount: number; merchant: string; category: string; date: string; receipt_url?: string }) => void;
    onClose: () => void;
    userId: string;
}

type ScannerStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onProcessed, onClose, userId }) => {
    const [status, setStatus] = useState<ScannerStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const processedDataRef = useRef<any>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log('[Scanner] File selected:', file.name, file.size, 'bytes');

        // Start upload - set status BEFORE any async work
        setStatus('uploading');

        try {
            // Upload to storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;

            console.log('[Scanner] Uploading to:', filePath);
            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(filePath, file);

            if (uploadError) throw uploadError;
            console.log('[Scanner] Upload complete');

            // Now processing with AI
            setStatus('processing');

            console.log('[Scanner] Calling AI...');
            const { data, error: fnError } = await supabase.functions.invoke('process-receipt', {
                body: { filePath }
            });

            if (fnError) throw fnError;
            console.log('[Scanner] AI result:', data);

            // Get signed URL
            const { data: urlData } = await supabase.storage
                .from('receipts')
                .createSignedUrl(filePath, 60 * 60 * 24 * 365);

            // Store result
            processedDataRef.current = {
                amount: typeof data.amount === 'number' ? data.amount : parseFloat(data.amount) || 0,
                merchant: data.merchant || data.vendor || 'Unknown',
                category: data.category || 'Other',
                date: data.date || new Date().toISOString(),
                receipt_url: urlData?.signedUrl || null
            };

            // Show success
            setStatus('done');
            console.log('[Scanner] Success, showing done state');

        } catch (err: any) {
            console.error('[Scanner] Error:', err);
            setErrorMessage(err.message || 'Upload failed');
            setStatus('error');
        } finally {
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDone = () => {
        if (processedDataRef.current) {
            console.log('[Scanner] Calling onProcessed');
            onProcessed(processedDataRef.current);
        }
        onClose();
    };

    const handleRetry = () => {
        setStatus('idle');
        setErrorMessage('');
    };

    // Render based on status
    const renderContent = () => {
        switch (status) {
            case 'idle':
                return (
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-sm text-white/50 italic">Snap a clear photo of your receipt</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-charcoal rounded-2xl font-bold text-sm hover:scale-105 transition-transform"
                        >
                            <Upload size={18} />
                            Choose Photo
                        </button>
                    </div>
                );

            case 'uploading':
                return (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 size={48} className="text-matcha animate-spin" />
                        <p className="text-lg font-bold text-matcha">Uploading...</p>
                        <p className="text-sm text-white/50">Please wait</p>
                    </div>
                );

            case 'processing':
                return (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 size={48} className="text-matcha animate-spin" />
                        <p className="text-lg font-bold text-matcha">Gemini is reading...</p>
                        <p className="text-sm text-white/50">Extracting receipt data</p>
                    </div>
                );

            case 'done':
                return (
                    <div className="flex flex-col items-center gap-4">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                        >
                            <CheckCircle2 size={64} className="text-matcha" />
                        </motion.div>
                        <p className="text-lg font-bold text-matcha">Scan Complete!</p>
                        {processedDataRef.current && (
                            <div className="text-center text-sm text-white/70">
                                <p>RM {processedDataRef.current.amount?.toFixed(2)}</p>
                                <p>{processedDataRef.current.merchant}</p>
                            </div>
                        )}
                        <button
                            onClick={handleDone}
                            className="mt-4 px-8 py-3 bg-matcha text-charcoal rounded-2xl font-bold hover:scale-105 transition-transform"
                        >
                            Done
                        </button>
                    </div>
                );

            case 'error':
                return (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                            <X size={32} className="text-red-400" />
                        </div>
                        <p className="text-lg font-bold text-red-400">Upload Failed</p>
                        <p className="text-sm text-white/50 text-center max-w-xs">{errorMessage}</p>
                        <button
                            onClick={handleRetry}
                            className="mt-4 px-6 py-3 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                );
        }
    };

    // Only show close button when idle or error
    const canClose = status === 'idle' || status === 'error';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-6 bg-charcoal rounded-3xl text-white shadow-2xl space-y-6"
        >
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-serif font-bold flex items-center gap-2">
                    <Camera size={24} className="text-matcha" />
                    Receipt Scanner
                </h3>
                {canClose && (
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className="relative aspect-video rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center p-8 text-center overflow-hidden min-h-[200px]">
                {renderContent()}
            </div>

            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
            />

            <p className="text-[10px] text-white/30 text-center font-medium leading-relaxed">
                Receipts are processed securely by Google AI.<br />
                No manual data entry required.
            </p>
        </motion.div>
    );
};
