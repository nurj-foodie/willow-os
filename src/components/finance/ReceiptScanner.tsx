import React, { useState, useRef } from 'react';
import { FileText, Upload, X, CheckCircle2, Sparkles, Image, FileUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReceiptScannerProps {
    onProcessed: (data: { amount: number; merchant: string; category: string; date: string; receipt_url?: string }) => void;
    onClose: () => void;
    onManualEntry?: () => void;
    userId: string;
}

type ScannerStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onProcessed, onClose, onManualEntry, userId }) => {
    const [status, setStatus] = useState<ScannerStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const processedDataRef = useRef<any>(null);
    const lastInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Save ref to the input that triggered this, so we can reset it
        lastInputRef.current = e.target;

        console.log('[Scanner] File selected:', file.name, file.size, 'bytes', file.type);
        setStatus('uploading');

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;

            console.log('[Scanner] Uploading to:', filePath);
            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(filePath, file);

            if (uploadError) throw uploadError;
            console.log('[Scanner] Upload complete, processing...');

            setStatus('processing');

            console.log('[Scanner] Calling AI...');
            const { data, error: fnError } = await supabase.functions.invoke('process-receipt', {
                body: { filePath }
            });

            if (fnError) {
                console.error('[Scanner] Edge Function error:', fnError);
                throw new Error(`AI processing failed: ${fnError.message || 'Unknown error'}`);
            }

            if (!data || data.error) {
                console.error('[Scanner] AI returned error:', data);
                throw new Error(data?.error || 'AI could not process the receipt');
            }

            console.log('[Scanner] AI result:', data);

            const { data: urlData } = await supabase.storage
                .from('receipts')
                .createSignedUrl(filePath, 60 * 60 * 24 * 365);

            processedDataRef.current = {
                amount: typeof data.amount === 'number' ? data.amount : parseFloat(data.amount) || 0,
                merchant: data.merchant || data.vendor || 'Unknown',
                category: data.category || 'Other',
                date: data.date || new Date().toISOString(),
                receipt_url: urlData?.signedUrl || null
            };

            console.log('[Scanner] Setting done status');
            setStatus('done');

        } catch (err: any) {
            console.error('[Scanner] Error:', err);
            setErrorMessage(err.message || 'Upload failed. Please try again.');
            setStatus('error');
        } finally {
            // Reset the file input so the same file can be selected again
            if (lastInputRef.current) {
                lastInputRef.current.value = '';
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

    const canClose = status === 'idle' || status === 'error';

    return (
        <div
            className="p-6 bg-charcoal rounded-3xl text-white shadow-2xl space-y-6"
            style={{ minHeight: '280px' }}
        >
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-serif font-bold flex items-center gap-2">
                    <div className="relative">
                        <FileText size={24} className="text-matcha" />
                        <Sparkles size={12} className="absolute -top-1 -right-1 text-matcha" />
                    </div>
                    Digitize the Clutter
                </h3>
                {canClose && (
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                )}
            </div>

            <div
                className="relative rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center p-8 text-center overflow-hidden"
                style={{ minHeight: '180px' }}
            >
                {/* IDLE STATE */}
                {status === 'idle' && (
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-sm text-white/60 italic">Safe here, gone from your purse.</p>

                        {/* Upload Options - Using native <label> to avoid mobile PWA page refresh bug */}
                        <div className="flex gap-3">
                            <label
                                htmlFor="scanner-camera-input"
                                className="flex flex-col items-center gap-2 px-5 py-4 bg-white text-charcoal rounded-2xl font-bold text-sm hover:scale-105 transition-transform cursor-pointer"
                            >
                                <Upload size={20} />
                                <span>Camera</span>
                            </label>
                            <input
                                id="scanner-camera-input"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            <label
                                htmlFor="scanner-gallery-input"
                                className="flex flex-col items-center gap-2 px-5 py-4 bg-white/10 text-white rounded-2xl font-bold text-sm hover:scale-105 hover:bg-white/20 transition-all cursor-pointer"
                            >
                                <Image size={20} />
                                <span>Gallery</span>
                            </label>
                            <input
                                id="scanner-gallery-input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            <label
                                htmlFor="scanner-pdf-input"
                                className="flex flex-col items-center gap-2 px-5 py-4 bg-white/10 text-white rounded-2xl font-bold text-sm hover:scale-105 hover:bg-white/20 transition-all cursor-pointer"
                            >
                                <FileUp size={20} />
                                <span>PDF</span>
                            </label>
                            <input
                                id="scanner-pdf-input"
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    </div>
                )}

                {/* UPLOADING STATE */}
                {status === 'uploading' && (
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="w-12 h-12 border-4 border-matcha/30 border-t-matcha rounded-full"
                            style={{ animation: 'spin 1s linear infinite' }}
                        />
                        <p className="text-lg font-bold text-matcha">Uploading...</p>
                        <p className="text-sm text-white/50">Please wait</p>
                    </div>
                )}

                {/* PROCESSING STATE */}
                {status === 'processing' && (
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="w-12 h-12 border-4 border-matcha/30 border-t-matcha rounded-full"
                            style={{ animation: 'spin 1s linear infinite' }}
                        />
                        <p className="text-lg font-bold text-matcha">Gemini is reading...</p>
                        <p className="text-sm text-white/50">Extracting receipt data</p>
                    </div>
                )}

                {/* DONE STATE */}
                {status === 'done' && (
                    <div className="flex flex-col items-center gap-4">
                        <CheckCircle2 size={64} className="text-matcha" />
                        <p className="text-lg font-bold text-matcha">Digitized!</p>
                        {processedDataRef.current && (
                            <div className="text-center text-sm text-white/70">
                                <p className="font-bold">RM {processedDataRef.current.amount?.toFixed(2)}</p>
                                <p>{processedDataRef.current.merchant}</p>
                            </div>
                        )}
                        <button
                            onClick={handleDone}
                            className="mt-2 px-8 py-3 bg-matcha text-charcoal rounded-2xl font-bold hover:scale-105 transition-transform"
                        >
                            Done
                        </button>
                    </div>
                )}

                {/* ERROR STATE */}
                {status === 'error' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                            <X size={32} className="text-red-400" />
                        </div>
                        <p className="text-lg font-bold text-red-400">Upload Failed</p>
                        <p className="text-sm text-white/50 text-center max-w-xs">{errorMessage}</p>
                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={handleRetry}
                                className="px-6 py-3 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-colors"
                            >
                                Try Again
                            </button>
                            {onManualEntry && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onManualEntry();
                                    }}
                                    className="px-6 py-3 bg-clay text-white rounded-2xl font-bold hover:scale-105 transition-transform"
                                >
                                    Enter Manually
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <p className="text-[10px] text-white/30 text-center font-medium leading-relaxed">
                Receipts are processed securely by Google AI.
            </p>

            {/* CSS for spinner animation */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
