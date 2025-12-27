import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface ReceiptScannerProps {
    onProcessed: (data: { amount: number; merchant: string; category: string; date: string }) => void;
    onClose: () => void;
    userId: string;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onProcessed, onClose, userId }) => {
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        console.log('[Receipt Scanner] File selected:', file ? `${file.name} (${file.size} bytes)` : 'No file');

        if (!file) {
            console.warn('[Receipt Scanner] No file in input, aborting');
            return;
        }

        console.log('[Receipt Scanner] Starting upload process...');
        setStatus('uploading');
        setProgress(10);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;

            // 1. Upload to Supabase Storage
            console.log('[Receipt Scanner] Uploading to Storage:', filePath);
            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(filePath, file);

            if (uploadError) {
                console.error('[Receipt Scanner] Storage upload failed:', uploadError);
                throw new Error(`Upload failed: ${uploadError.message}`);
            }
            console.log('[Receipt Scanner] Upload successful');
            setProgress(50);
            setStatus('processing');

            // 2. Invoke Edge Function for AI extraction
            console.log('[Receipt Scanner] Calling Edge Function for AI extraction...');
            const { data, error: functionError } = await supabase.functions.invoke('process-receipt', {
                body: { filePath }
            });

            if (functionError) {
                console.error('[Receipt Scanner] Edge Function error:', functionError);

                // Extract error details from the response body
                let errorDetails = 'Unknown error';
                try {
                    // The FunctionsHttpError has a context.Response object
                    if (functionError.context && typeof functionError.context.json === 'function') {
                        const errorBody = await functionError.context.json();
                        console.error('[Receipt Scanner] Error response body:', errorBody);
                        errorDetails = errorBody.error || errorBody.message || JSON.stringify(errorBody);
                    } else if (data && typeof data === 'object') {
                        console.error('[Receipt Scanner] Error in data:', data);
                        if ('error' in data) {
                            errorDetails = data.error;
                        }
                    }
                } catch (parseError) {
                    console.error('[Receipt Scanner] Failed to parse error:', parseError);
                    errorDetails = functionError.message || 'Edge Function failed';
                }

                console.error('[Receipt Scanner] Final error details:', errorDetails);
                throw new Error(`AI processing failed: ${errorDetails}`);
            }

            console.log('Gemini Extraction Result:', data);

            // Get the public URL for the uploaded receipt
            const { data: { publicUrl } } = supabase.storage
                .from('receipts')
                .getPublicUrl(filePath);

            // Sanitization: Ensure data has expected keys and formats
            const sanitizedData = {
                amount: typeof data.amount === 'number' ? data.amount : parseFloat(data.amount) || 0,
                merchant: data.merchant || data.vendor || 'Unknown Merchant',
                category: data.category || 'Other',
                date: data.date || new Date().toISOString(),
                receipt_url: publicUrl
            };

            setProgress(100);
            setStatus('done');

            // Artificial delay to let user see the "Done" state
            setTimeout(() => {
                console.log('[Receipt Scanner] Calling onProcessed with:', sanitizedData);
                onProcessed(sanitizedData);

                // Close after a brief delay to let parent update state
                setTimeout(() => {
                    console.log('[Receipt Scanner] Closing scanner');
                    onClose();
                }, 100);
            }, 1000);

        } catch (err: any) {
            console.error('[Receipt Scanner] Complete error:', err);
            console.error('[Receipt Scanner] Error details:', {
                message: err?.message,
                name: err?.name,
                stack: err?.stack
            });
            setStatus('error');
        } finally {
            // Reset file input for mobile compatibility
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

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
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="relative aspect-video rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center p-8 text-center overflow-hidden">
                <AnimatePresence mode="wait">
                    {status === 'idle' && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <p className="text-sm text-white/50 italic">Snap a clear photo of your receipt</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-6 py-3 bg-white text-charcoal rounded-2xl font-bold text-sm hover:scale-105 transition-transform"
                                >
                                    <Upload size={18} />
                                    Choose Photo
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {(status === 'uploading' || status === 'processing') && (
                        <motion.div
                            key="working"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <Loader2 size={40} className="text-matcha animate-spin" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold uppercase tracking-widest text-matcha">
                                    {status === 'uploading' ? 'Uploading...' : 'Gemini is reading...'}
                                </p>
                                <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-matcha"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {status === 'done' && (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-2 text-matcha"
                        >
                            <CheckCircle2 size={48} />
                            <p className="font-bold">Sync Complete</p>
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4 text-orange-400"
                        >
                            <p className="font-bold">Upload Failed</p>
                            <p className="text-xs text-white/60">Check console for details</p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="text-sm underline hover:text-orange-300"
                            >
                                Try again
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
            />

            <p className="text-[10px] text-white/30 text-center font-medium leading-relaxed">
                Receipts are processed securely by Google AI.<br />
                No manual data entry required.
            </p>
        </motion.div>
    );
};
