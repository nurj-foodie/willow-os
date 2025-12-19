import React from 'react';
import { motion } from 'framer-motion';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-oat flex flex-col items-center px-4 py-8 md:py-16 selection:bg-matcha selection:text-charcoal">
            <header className="w-full max-w-2xl mb-12 flex justify-between items-center">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl md:text-4xl font-serif font-bold text-charcoal tracking-tight"
                >
                    Willow
                </motion.h1>
                <div className="w-10 h-10 rounded-full bg-clay/30 flex items-center justify-center text-xl">
                    ✨
                </div>
            </header>

            <main className="w-full max-w-2xl flex-grow">
                {children}
            </main>

            <footer className="w-full max-w-2xl mt-12 py-8 text-center text-charcoal/40 text-sm font-sans italic">
                "You did enough today. Rest now."
            </footer>
        </div>
    );
};
