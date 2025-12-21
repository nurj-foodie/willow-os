import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full py-8 mt-auto flex flex-col items-center gap-4 opacity-30 hover:opacity-100 transition-opacity duration-500">
            <div className="flex gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal">
                <a href="/privacy" className="hover:text-matcha transition-colors">Privacy</a>
                <a href="/terms" className="hover:text-matcha transition-colors">Terms</a>
            </div>
            <div className="text-[10px] font-medium text-charcoal/40 font-serif italic text-center">
                Willow OS — Flow, don't force. 🌿
            </div>
        </footer>
    );
};
