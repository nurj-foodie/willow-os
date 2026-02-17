import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FileText, X, CheckCircle2, Sparkles, Image, Camera, Aperture } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReceiptScannerProps {
    onProcessed: (data: { amount: number; merchant: string; category: string; date: string; receipt_url?: string }) => void;
    onClose: () => void;
    onManualEntry?: () => void;
    userId: string;
}

type ScannerStatus = 'idle' | 'camera' | 'uploading' | 'processing' | 'done' | 'error';

// iOS doesn't support getUserMedia well in PWA mode, but also doesn't kill the PWA
// when the external camera opens — so native <input capture> is safe on iOS.
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onProcessed, onClose, onManualEntry, userId }) => {
    const [status, setStatus] = useState<ScannerStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const processedDataRef = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Stop camera stream when component unmounts or status changes away from camera
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    // Open in-app camera using getUserMedia (stays inside PWA, no external app)
    const openCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
            });
            streamRef.current = stream;
            setStatus('camera');

            // Wait for next render then attach stream to video
            requestAnimationFrame(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(console.error);
                }
            });
        } catch (err: any) {
            console.error('[Scanner] Camera access denied:', err);
            setErrorMessage('Camera access denied. Please use Gallery instead.');
            setStatus('error');
        }
    };

    // Capture a photo from the live video stream
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);

        stopCamera();

        canvas.toBlob(async (blob) => {
            if (!blob) {
                setErrorMessage('Failed to capture photo.');
                setStatus('error');
                return;
            }

            const file = new File([blob], `receipt_${Date.now()}.jpg`, { type: 'image/jpeg' });
            await processFile(file);
        }, 'image/jpeg', 0.85);
    };

    // Handle file from gallery picker
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = ''; // Reset input
        await processFile(file);
    };

    // Shared upload + AI processing logic
    const processFile = async (file: File) => {
        console.log('[Scanner] File selected:', file.name, file.size, 'bytes', file.type);
        setStatus('uploading');

        try {
            const fileExt = file.name.split('.').pop() || 'jpg';
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
        stopCamera();
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

                        <div className="flex gap-3">
                            {isIOS ? (
                                /* iOS: native camera input — iOS doesn't kill the PWA */
                                <>
                                    <label
                                        htmlFor="scanner-ios-camera"
                                        className="flex flex-col items-center gap-2 px-5 py-4 bg-white text-charcoal rounded-2xl font-bold text-sm hover:scale-105 transition-transform cursor-pointer"
                                    >
                                        <Camera size={20} />
                                        <span>Camera</span>
                                    </label>
                                    <input
                                        id="scanner-ios-camera"
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </>
                            ) : (
                                /* Android: in-app camera via getUserMedia (avoids PWA kill) */
                                <button
                                    onClick={openCamera}
                                    className="flex flex-col items-center gap-2 px-5 py-4 bg-white text-charcoal rounded-2xl font-bold text-sm hover:scale-105 transition-transform"
                                >
                                    <Camera size={20} />
                                    <span>Camera</span>
                                </button>
                            )}

                            {/* Gallery — native label, opens in-browser file picker */}
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
                        </div>
                    </div>
                )}

                {/* IN-APP CAMERA STATE */}
                {status === 'camera' && (
                    <div className="flex flex-col items-center gap-4 w-full">
                        <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ maxHeight: '300px' }}>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-auto rounded-xl"
                                style={{ maxHeight: '300px', objectFit: 'cover' }}
                            />
                        </div>
                        <div className="flex gap-3 items-center">
                            <button
                                onClick={() => { stopCamera(); setStatus('idle'); }}
                                className="px-5 py-3 bg-white/10 text-white rounded-2xl font-bold text-sm hover:bg-white/20 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={capturePhoto}
                                className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                            >
                                <Aperture size={28} className="text-charcoal" />
                            </button>
                        </div>
                        <p className="text-xs text-white/40">Point at your receipt and tap the shutter</p>
                    </div>
                )}

                {/* UPLOADING STATE */}
                {status === 'uploading' && (
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="w-12 h-12 border-4 border-matcha/30 border-t-matcha rounded-full animate-spin"
                        />
                        <p className="text-lg font-bold text-matcha">Uploading...</p>
                        <p className="text-sm text-white/50">Please wait</p>
                    </div>
                )}

                {/* PROCESSING STATE */}
                {status === 'processing' && (
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="w-12 h-12 border-4 border-matcha/30 border-t-matcha rounded-full animate-spin"
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

            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} className="hidden" />

            <p className="text-[10px] text-white/30 text-center font-medium leading-relaxed">
                Receipts are processed securely by Google AI.
            </p>
        </div>
    );
};
