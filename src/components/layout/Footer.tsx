import React from 'react';

interface FooterProps {
    onOpenLegal: (type: 'privacy' | 'terms') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal }) => {
    return (
        <footer className="w-full py-12 mt-auto flex flex-col items-center gap-4 opacity-30 hover:opacity-100 transition-opacity duration-500 pb-32">
            <div className="flex gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal">
                <button
                    onClick={() => onOpenLegal('privacy')}
                    className="hover:text-matcha transition-colors"
                >
                    Privacy
                </button>
                <button
                    onClick={() => onOpenLegal('terms')}
                    className="hover:text-matcha transition-colors"
                >
                    Terms
                </button>
            </div>
            <div className="text-[10px] font-medium text-charcoal/40 font-serif italic text-center">
                Willow OS — Flow, don't force. 🌿
            </div>
        </footer>
    );
};
