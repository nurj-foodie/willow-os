import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Sparkles } from 'lucide-react';

export const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) {
            alert(error.message);
        } else {
            setSent(true);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-16 h-16 rounded-3xl bg-matcha/20 flex items-center justify-center text-3xl mb-6 animate-bounce">
                🌿
            </div>
            <h1 className="text-3xl font-serif font-bold text-charcoal mb-2">Welcome to your flow.</h1>
            <p className="text-charcoal/50 font-sans italic mb-8 max-w-xs">
                Enter your email to reclaim your space and sync your vibe.
            </p>

            {sent ? (
                <div className="bg-white/50 backdrop-blur-xl p-8 rounded-3xl border border-matcha/20 animate-in fade-in zoom-in duration-500">
                    <Sparkles className="mx-auto mb-4 text-matcha" size={32} />
                    <p className="text-charcoal font-medium">✨ Check your inbox!</p>
                    <p className="text-sm text-charcoal/40 mt-2">A magic link is on its way to {email}</p>
                </div>
            ) : (
                <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/20 group-focus-within:text-matcha transition-colors" size={20} />
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 rounded-full bg-white border border-clay/10 focus:border-matcha focus:ring-4 focus:ring-matcha/5 outline-none transition-all font-sans text-charcoal"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-full bg-charcoal text-white font-medium hover:bg-matcha hover:text-charcoal transition-all disabled:opacity-50"
                    >
                        {loading ? 'Sending magic...' : 'Send Magic Link ✨'}
                    </button>
                </form>
            )}
        </div>
    );
};
