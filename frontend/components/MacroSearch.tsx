import React, { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const searchDropIcon = '/nano_search.png';

interface MacroResult {
    food: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

interface MacroSearchProps {
    token: string;
}

export const MacroSearch: React.FC<MacroSearchProps> = ({ token }) => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<MacroResult | null>(null);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || loading) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/nutrition/macro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query: query.trim() })
            });

            if (!response.ok) throw new Error('Failed to analyze food');

            const data = await response.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Could not fetch macro data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-surface-dark p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent"></div>

            <div className="relative flex justify-between items-start mb-5">
                <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-[1.2rem] bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-lg p-2 relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 bg-orange-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <img src={searchDropIcon} alt="Macro Search" className="w-full h-full object-contain relative z-10 hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h3 className="text-lg font-bold text-white tracking-tight leading-tight">Smart Macro Search</h3>
                        <p className="text-[10px] uppercase font-bold text-orange-500 tracking-widest mt-0.5">AI Analysis</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSearch} className="relative mb-2 z-10">
                <div className="relative flex items-center bg-background-dark/50 border border-white/10 rounded-2xl overflow-hidden focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/50 transition-all">
                    <div className="pl-4 pr-3 text-slate-400">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., 2 scrambled eggs..."
                        className="w-full bg-transparent border-none py-3.5 outline-none text-white text-sm placeholder:text-slate-600"
                    />
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="h-full px-4 bg-orange-500/10 text-orange-500 flex items-center justify-center hover:bg-orange-500/20 transition-colors disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"></div>
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </form>

            {error && <p className="text-xs text-red-400 mt-2 px-2 relative z-10">{error}</p>}

            <AnimatePresence>
                {result && !loading && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden relative z-10"
                    >
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                            <div className="col-span-2 mb-1">
                                <span className="text-[11px] font-bold text-slate-400 tracking-wide">Result for: <span className="text-white">"{result.food}"</span></span>
                            </div>

                            <div className="bg-background-dark/50 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-white mb-1">{result.calories}</span>
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-500">Calories</span>
                            </div>
                            <div className="bg-background-dark/50 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-white mb-1">{result.protein}g</span>
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">Protein</span>
                            </div>
                            <div className="bg-background-dark/50 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-white mb-1">{result.carbs}g</span>
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-400">Carbs</span>
                            </div>
                            <div className="bg-background-dark/50 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-white mb-1">{result.fat}g</span>
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-red-400">Fat</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
