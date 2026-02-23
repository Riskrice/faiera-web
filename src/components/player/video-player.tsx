'use client';

import { motion } from 'framer-motion';
import { Play, SkipBack, SkipForward, Volume2, Maximize, Settings } from 'lucide-react';
import { useState } from 'react';

import { SecurePlayer } from '@/components/video/secure-player';

export function VideoPlayer({ title, lessonId }: { title: string; lessonId?: string }) {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group shadow-2xl ring-1 ring-border/20">
            {/* If playing and we have a lessonId, show the SecurePlayer */}
            {isPlaying && lessonId ? (
                <div className="absolute inset-0 z-20">
                    <SecurePlayer lessonId={lessonId} autoPlay={true} />
                </div>
            ) : (
                <>
                    {/* Placeholder Background & Controls (Show these when NOT playing or if no lessonId) */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                        {!isPlaying && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsPlaying(true)}
                                className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur-md border border-primary/40 flex items-center justify-center text-primary z-20 group-hover:bg-primary group-hover:text-black transition-all duration-300"
                            >
                                <Play className="w-8 h-8 ml-1 fill-current" />
                            </motion.button>
                        )}
                        {isPlaying && !lessonId && (
                            <div className="text-white/50 animate-pulse">Playing Simulation... (No Lesson ID)</div>
                        )}
                    </div>

                    {/* Overlay Gradient */}
                    {!isPlaying && (
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    )}

                    {/* Controls (Only show if not playing actual specific video, or maybe hidden if custom player controls used) */}
                    {!isPlaying && (
                        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2 z-30">
                            {/* Progress Bar */}
                            <div className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer relative overflow-hidden active:scale-y-125 transition-transform">
                                <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-primary rounded-full" />
                            </div>

                            <div className="flex items-center justify-between text-white">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-primary transition-colors">
                                        <Play className="w-5 h-5 fill-current" />
                                    </button>
                                    <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                                        <span>05:30</span> / <span>15:00</span>
                                    </div>
                                    <Volume2 className="w-5 h-5 hover:text-white/80 cursor-pointer" />
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium">{title}</span>
                                    <Settings className="w-5 h-5 hover:scale-110 transition-transform cursor-pointer" />
                                    <Maximize className="w-5 h-5 hover:scale-110 transition-transform cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
