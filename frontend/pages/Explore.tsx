import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

// Step 3 & 4: Types and helper function
interface VideoItem {
    id: string;
    videoId: string;
    title: string;
    thumbnail: string;
    videoUrl: string;   // watch?v= for external links
    embedUrl: string;   // embed/ for iframes
    category: string;
    duration: string;
}

// Step 4: Build a guaranteed safe embed URL
function buildYoutubeEmbedUrl(videoId: string): string {
    if (!videoId) return '';
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`;
}

export const Explore: React.FC<{ token: string }> = ({ token }) => {
    const [query, setQuery] = useState('');
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
    const navigate = useNavigate();

    const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
        if (e) e.preventDefault();
        const searchQuery = overrideQuery !== undefined ? overrideQuery : query;
        if (!searchQuery.trim()) return;

        setLoading(true);
        setActiveVideo(null);
        try {
            const res = await fetch(`/api/discover/search?q=${encodeURIComponent(searchQuery)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setVideos(data.suggestions || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const defaultQuery = 'Beginner Fitness Workout';
        setQuery(defaultQuery);
        handleSearch(undefined, defaultQuery);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Step 5: Render the iframe using embedUrl, NEVER watch?v=
    const renderPlayer = (video: VideoItem) => {
        // Step 6: Defensive validation – if no videoId, show fallback link
        if (!video.videoId) {
            return (
                <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary text-sm font-bold hover:underline"
                >
                    <ExternalLink className="w-4 h-4" /> Watch on YouTube
                </a>
            );
        }

        // Step 5: Correct iframe with embed URL and full required permissions (Step 3)
        return (
            <div className="aspect-video w-full rounded-[1.5rem] overflow-hidden border border-white/10 shadow-2xl">
                <iframe
                    src={buildYoutubeEmbedUrl(video.videoId)}
                    width="100%"
                    height="315"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    loading="lazy"
                    title={video.title}
                    style={{ border: 'none', width: '100%', height: '100%' }}
                />
            </div>
        );
    };

    return (
        <div className="min-h-screen max-w-[430px] mx-auto bg-background-dark text-white relative flex flex-col no-scrollbar">
            <header className="px-4 py-8 flex items-center gap-4 relative z-10 sticky top-0 bg-background-dark/80 backdrop-blur-3xl border-b border-white/5">
                <button onClick={() => navigate(-1)} className="p-2 bg-surface-dark border border-white/10 rounded-full hover:border-primary/50 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Explore Videos</h1>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.2em]">Discover Workouts</p>
                </div>
            </header>

            <div className="px-4 mb-4 mt-6">
                <form onSubmit={handleSearch} className="relative">
                    <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform">
                        <Search className="w-5 h-5 text-slate-500" />
                    </button>
                    <input
                        type="text"
                        placeholder="Search for workouts, nutrition, meditation..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-surface-dark border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-primary/50 text-white transition-colors"
                    />
                </form>
            </div>

            <div className="flex-1 px-4 pb-24 flex flex-col gap-6 overflow-y-auto no-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-sm tracking-widest uppercase">Searching...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 pb-8">
                        {/* Step 5: Active video player */}
                        {activeVideo && (
                            <motion.div
                                key={`player-${activeVideo.id}`}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-surface-dark rounded-[2.5rem] overflow-hidden border border-primary/20 shadow-2xl p-4"
                            >
                                <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mb-3 px-2">{activeVideo.category}</p>
                                <p className="text-base font-bold mb-4 px-2">{activeVideo.title}</p>
                                {renderPlayer(activeVideo)}
                                <div className="flex items-center justify-between mt-4 px-2">
                                    <span className="text-xs text-slate-500">{activeVideo.duration}</span>
                                    <a
                                        href={activeVideo.videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                                    >
                                        <ExternalLink className="w-3 h-3" /> Open on YouTube
                                    </a>
                                </div>
                            </motion.div>
                        )}

                        {videos.map(video => (
                            <motion.div
                                key={video.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-surface-dark rounded-[2.5rem] overflow-hidden border shadow-2xl cursor-pointer transition-colors ${activeVideo?.id === video.id ? 'border-primary/40' : 'border-white/5 hover:border-white/15'}`}
                                onClick={() => setActiveVideo(activeVideo?.id === video.id ? null : video)}
                            >
                                <div className="relative h-48 group">
                                    <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            // Fallback to YouTube's own thumbnail API
                                            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className={`w-14 h-14 rounded-full backdrop-blur-md flex items-center justify-center border transition-transform group-hover:scale-110 ${activeVideo?.id === video.id ? 'bg-primary/40 border-primary/60' : 'bg-black/50 border-white/20'}`}>
                                            {/* YouTube play icon */}
                                            <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-bold text-white border border-white/10">
                                        {video.duration}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                        <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] truncate">{video.category}</span>
                                    </div>
                                    <p className="text-base font-bold leading-tight group-hover:text-primary transition-colors">{video.title}</p>
                                    <p className="text-[10px] text-slate-500 mt-2">
                                        {activeVideo?.id === video.id ? 'Click to collapse ▲' : 'Click to play ▶'}
                                    </p>
                                </div>
                            </motion.div>
                        ))}

                        {videos.length === 0 && !loading && (
                            <p className="text-center text-slate-500 text-sm mt-8">No videos found. Try a different search.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
