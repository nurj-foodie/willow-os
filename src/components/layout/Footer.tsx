import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full py-12 mt-auto flex flex-col items-center gap-4 opacity-30 hover:opacity-100 transition-opacity duration-500 pb-32">
            <div className="text-[10px] font-medium text-charcoal/40 font-serif italic text-center">
                Willow OS — Flow, don't force. 🌿
            </div>
        </footer>
    );
};
