import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, ChevronRight, Maximize2, 
    Minimize2, Home, List, Sparkles 
} from 'lucide-react';
import { slides } from './SlideContent';
import { useNavigate } from 'react-router-dom';
import './Presentation.css';

const PresentationLayout: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showThumbnails, setShowThumbnails] = useState(false);
    const navigate = useNavigate();

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, []);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'f') toggleFullscreen();
            if (e.key === 'Escape') setShowThumbnails(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextSlide, prevSlide]);

    const slide = slides[currentSlide];

    return (
        <div className="presentation-container">
            {/* Background Decorative Elements */}
            <div className="presentation-bg-glow-1" />
            <div className="presentation-bg-glow-2" />
            <div className="presentation-grid-overlay" />

            {/* Header */}
            <header className="presentation-header">
                <div className="logo-section" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
                    <div className="logo-text">
                        HVNH <span className="text-gold">EXAM</span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <button 
                        onClick={() => setShowThumbnails(!showThumbnails)}
                        className="nav-btn"
                        style={{ width: 'auto', borderRadius: '12px', padding: '0 20px', gap: '10px', fontSize: '0.875rem', fontWeight: 600 }}
                    >
                        <List size={18} />
                        Slide {currentSlide + 1} / {slides.length}
                    </button>
                    
                    <button onClick={toggleFullscreen} className="nav-btn">
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="slide-main">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="slide-wrapper"
                    >
                        {/* Info Column */}
                        <div className="slide-info">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="slide-type-tag"
                            >
                                {slide.icon} {slide.type}
                            </motion.div>
                            
                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="slide-title"
                            >
                                {slide.title}
                            </motion.h1>

                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="slide-subtitle"
                            >
                                {slide.subtitle}
                            </motion.p>

                            <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                {slide.content}
                            </motion.div>
                        </div>

                        {/* Image Column */}
                        <motion.div 
                            initial={{ opacity: 0, x: 40, rotate: 2 }}
                            animate={{ opacity: 1, x: 0, rotate: 0 }}
                            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                            className="image-container"
                        >
                            <img 
                                src={slide.image} 
                                alt={slide.title} 
                                className="slide-image"
                            />
                            <div style={{ 
                                position: 'absolute', 
                                inset: 0, 
                                background: 'linear-gradient(to top, rgba(5,5,16,0.6), transparent)' 
                            }} />
                        </motion.div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Controls */}
                <div className="presentation-controls">
                    <button onClick={prevSlide} className="nav-btn">
                        <ChevronLeft size={24} />
                    </button>
                    
                    <div className="progress-bar">
                        {slides.map((_, i) => (
                            <div 
                                key={i}
                                className={`progress-dot ${i === currentSlide ? 'active' : 'inactive'}`}
                                onClick={() => setCurrentSlide(i)}
                                style={{cursor: 'pointer'}}
                            />
                        ))}
                    </div>

                    <button onClick={nextSlide} className="nav-btn">
                        <ChevronRight size={24} />
                    </button>
                </div>
            </main>

            {/* Thumbnails Modal */}
            <AnimatePresence>
                {showThumbnails && (
                    <motion.div 
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        className="thumbnails-panel"
                        style={{ height: 'auto', bottom: '0', background: 'rgba(5,5,16,0.95)' }}
                    >
                        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Explore Slides</h2>
                                <button 
                                    onClick={() => setShowThumbnails(false)}
                                    style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    CLOSE [ESC]
                                </button>
                            </div>
                            <div className="thumb-scroll" style={{ paddingBottom: '20px' }}>
                                {slides.map((s, i) => (
                                    <div 
                                        key={i}
                                        onClick={() => {
                                            setCurrentSlide(i);
                                            setShowThumbnails(false);
                                        }}
                                        className="thumb-item"
                                        style={{ 
                                            width: '260px', 
                                            border: i === currentSlide ? '2px solid var(--accent-gold)' : '1px solid var(--glass-border)',
                                            background: i === currentSlide ? 'rgba(251, 191, 36, 0.1)' : 'var(--bg-card)'
                                        }}
                                    >
                                        <img src={s.image} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px', opacity: 0.6 }} />
                                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', marginBottom: '4px' }}>0{i + 1}</div>
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: '1.2' }}>{s.title}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .thumb-scroll::-webkit-scrollbar { height: 4px; }
                .thumb-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
            `}</style>
        </div>
    );
};

export default PresentationLayout;
