import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, RotateCcw, Shuffle } from 'lucide-react';
import { studyHubApi } from '../../../services/studyHubApi';
import { toast } from 'react-toastify';
import { type Flashcard } from '../../../types/study';

const FlashcardReviewPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const fileId = queryParams.get('fileId');
    const subjectId = queryParams.get('subjectId');
    const limit = parseInt(queryParams.get('limit') || '20');
    const mode = queryParams.get('mode') || 'mixed';

    const [loading, setLoading] = useState(true);
    const [dueCards, setDueCards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [slideDir, setSlideDir] = useState<'next' | 'prev'>('next');
    const [sessionComplete, setSessionComplete] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [startTime] = useState<number>(Date.now());
    const [isShuffled, setIsShuffled] = useState(false);
    const [sessionStats, setSessionStats] = useState({
        total: 0,
        reviewed: 0,
        mastered: 0,
        learning: 0,
        responses: [] as number[]
    });
    const [reviewsData, setReviewsData] = useState<{flashcardId: string, quality: number}[]>([]);

    useEffect(() => { fetchCards(); }, [fileId]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') { e.preventDefault(); toggleFlip(); }
            if (e.key >= '0' && e.key <= '5' && isFlipped && !isExiting) handleReview(parseInt(e.key));
            if (e.key === 'ArrowRight' && !isFlipped && currentIndex < dueCards.length - 1 && !isExiting) goNext();
            if (e.key === 'ArrowLeft' && !isFlipped && currentIndex > 0 && !isExiting) goPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFlipped, currentIndex, dueCards.length, isExiting]);

    const fetchCards = async () => {
        try {
            setLoading(true);
            let cards: Flashcard[] = [];
            if (fileId) {
                const res = await studyHubApi.getFlashcards(fileId, 0, limit);
                cards = res.data.flashcards || [];
            } else if (subjectId) {
                const res = await studyHubApi.getFlashcardsBySubject(subjectId, limit, mode);
                cards = res.data.flashcards || [];
            } else {
                const res = await studyHubApi.getDueFlashcards();
                cards = res.data.dueCards || [];
            }
            if (limit && cards.length > limit) cards = cards.slice(0, limit);
            setDueCards(cards);
            setSessionStats(prev => ({ ...prev, total: cards.length }));
        } catch (error) {
            toast.error("Không thể tải danh sách thẻ.");
        } finally {
            setLoading(false);
        }
    };

    const toggleFlip = () => { if (!isExiting) setIsFlipped(!isFlipped); };

    const shuffleCards = () => {
        if (isShuffled) {
            setIsShuffled(false); setCurrentIndex(0); setIsFlipped(false);
        } else {
            const shuffled = [...dueCards].sort(() => Math.random() - 0.5);
            setDueCards(shuffled); setIsShuffled(true); setCurrentIndex(0); setIsFlipped(false);
        }
    };

    const goNext = () => {
        if (currentIndex < dueCards.length - 1 && !isExiting) {
            setSlideDir('next'); setIsExiting(true);
            setTimeout(() => { setIsFlipped(false); setCurrentIndex(prev => prev + 1); setIsExiting(false); }, 260);
        }
    };

    const goPrev = () => {
        if (currentIndex > 0 && !isExiting) {
            setSlideDir('prev'); setIsExiting(true);
            setTimeout(() => { setIsFlipped(false); setCurrentIndex(prev => prev - 1); setIsExiting(false); }, 260);
        }
    };

    const triggerConfetti = () => {
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed; border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
                pointer-events: none; z-index: 9999;
                width: ${Math.random() * 9 + 5}px; height: ${Math.random() * 9 + 5}px;
                background: ${['#FF6B6B', '#FFD93D', '#6BCF7F', '#4D96FF', '#B366FF', '#FF9F43'][Math.floor(Math.random() * 6)]};
                left: ${45 + Math.random() * 10}%; top: 55%;
            `;
            document.body.appendChild(confetti);
            let offset = 0;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 9 + 5;
            let rot = 0;
            const animate = () => {
                offset += speed;
                rot += 12;
                const x = parseFloat(confetti.style.left) + Math.cos(angle) * (offset / 6);
                const y = parseFloat(confetti.style.top) - (offset / 2) + (offset * offset) / 1800;
                confetti.style.left = x + '%';
                confetti.style.top = y + '%';
                confetti.style.transform = `rotate(${rot}deg)`;
                confetti.style.opacity = Math.max(0, 1 - offset / 450) + '';
                if (offset < 450) requestAnimationFrame(animate);
                else confetti.remove();
            };
            setTimeout(() => requestAnimationFrame(animate), i * 10);
        }
    };

    const submitSession = async (allReviews: any[]) => {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        const knownCount = allReviews.filter(r => r.quality >= 4).length;
        const learningCount = allReviews.filter(r => r.quality < 4).length;

        const payload = {
            documentId: fileId || null,
            subjectId: subjectId || null,
            totalCards: allReviews.length,
            knownCards: knownCount,
            learningCards: learningCount,
            timeSpentSeconds: timeSpent,
            reviews: allReviews
        };

        localStorage.setItem('pendingFlashcardSession', JSON.stringify(payload));
        try {
            await studyHubApi.submitFlashcardSession(payload);
            localStorage.removeItem('pendingFlashcardSession');
        } catch (err: any) {
            if (err.response?.status !== 401) {
                toast.error("Lỗi khi lưu kết quả. Dữ liệu đã được lưu tạm.");
            }
        }
    };

    const handleReview = async (quality: number) => {
        if (isExiting) return;
        const currentCard = dueCards[currentIndex];
        const cardId = currentCard.flashcardId || (currentCard as any).id;
        
        const newReviews = [...reviewsData, { flashcardId: cardId, quality }];
        setReviewsData(newReviews);

        const newStats = {
            ...sessionStats,
            reviewed: sessionStats.reviewed + 1,
            mastered: quality >= 4 ? sessionStats.mastered + 1 : sessionStats.mastered,
            learning: quality < 4 ? sessionStats.learning + 1 : sessionStats.learning,
            responses: [...sessionStats.responses, quality]
        };
        setSessionStats(newStats);
        
        if (quality >= 4) triggerConfetti();
        
        if (currentIndex < dueCards.length - 1) {
            goNext();
        } else {
            setShowCelebration(true);
            submitSession(newReviews);
            setTimeout(() => setSessionComplete(true), 1500);
        }
    };

    // Loading Screen
    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>🧠</div>
                    <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.3rem', fontWeight: 800, fontFamily: "'Nunito', sans-serif" }}>Đang chuẩn bị thẻ nhớ...</p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Sắp bắt đầu thôi!</p>
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // Empty / Already Mastered Screen
    if (dueCards.length === 0 && !sessionComplete) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)', padding: '1rem' }}>
                <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '1.25rem', animation: 'float 3s ease-in-out infinite' }}>🎉</div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#1E1B4B', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-1px', marginBottom: '0.75rem' }}>
                        Tuyệt cú mèo!
                    </h2>
                    <p style={{ color: '#6B7280', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                        {fileId ? "Bạn đã thuộc hết các thẻ trong tài liệu này." : "Bạn đã hoàn thành mục tiêu ôn tập cho hôm nay. Giỏi lắm!"}
                    </p>
                    <button
                        onClick={() => navigate('/student/flashcards')}
                        style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: 'white', border: 'none', borderRadius: '16px', padding: '1rem 2.5rem', fontSize: '1rem', fontWeight: 900, fontFamily: "'Nunito', sans-serif", cursor: 'pointer', boxShadow: '0 12px 28px rgba(79, 70, 229, 0.35)', transition: 'all 0.3s', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                        ← Về Dashboard
                    </button>
                </div>
                <style>{`@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }`}</style>
            </div>
        );
    }

    // Session Complete Screen
    if (sessionComplete) {
        const accuracy = sessionStats.total > 0 ? Math.round((sessionStats.mastered / sessionStats.total) * 100) : 0;
        const elapsedTime = Math.round((Date.now() - startTime) / 1000 / 60);
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)', padding: '1rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%)', borderRadius: '50%' }} />

                <div style={{ background: 'white', borderRadius: '36px', padding: '3rem 2.5rem', maxWidth: '480px', width: '100%', boxShadow: '0 40px 80px rgba(79, 70, 229, 0.15)', border: '1.5px solid rgba(79, 70, 229, 0.12)', position: 'relative', zIndex: 1, animation: 'popIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
                    {showCelebration && (
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '4rem', animation: 'bounce 1.5s infinite' }}>🏆</div>
                    )}
                    <h1 style={{ textAlign: 'center', fontSize: '1.9rem', fontWeight: 900, color: '#1E1B4B', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-1px', marginBottom: '0.5rem' }}>
                        Phiên học hoàn thành!
                    </h1>
                    <p style={{ textAlign: 'center', color: '#6B7280', marginBottom: '2rem', fontSize: '0.95rem' }}>
                        Bạn vừa ôn tập <strong>{sessionStats.total}</strong> kiến thức quan trọng 🎯
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem', marginBottom: '2rem' }}>
                        {[
                            { value: sessionStats.mastered, label: 'Đã thuộc', color: '#10B981', bg: '#D1FAE5', emoji: '✅' },
                            { value: accuracy + '%', label: 'Chính xác', color: '#4F46E5', bg: '#EEF2FF', emoji: '📈' },
                            { value: elapsedTime + 'm', label: 'Thời gian', color: '#F59E0B', bg: '#FEF3C7', emoji: '⏱️' },
                        ].map(({ value, label, color, bg, emoji }) => (
                            <div key={label} style={{ background: bg, borderRadius: '20px', padding: '1.25rem 0.75rem', textAlign: 'center', transition: 'transform 0.3s' }}>
                                <div style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>{emoji}</div>
                                <div style={{ fontSize: '1.9rem', fontWeight: 900, color, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.3rem' }}>{label}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <button
                            onClick={() => navigate('/student/flashcards')}
                            style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: 'white', border: 'none', borderRadius: '16px', padding: '1.1rem', fontSize: '1rem', fontWeight: 900, fontFamily: "'Nunito', sans-serif", cursor: 'pointer', boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                        >
                            ✅ Hoàn thành phiên học
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            style={{ background: 'transparent', color: '#4F46E5', border: '1.5px solid rgba(79, 70, 229, 0.25)', borderRadius: '16px', padding: '1rem', fontSize: '0.95rem', fontWeight: 800, fontFamily: "'Nunito', sans-serif", cursor: 'pointer', transition: 'all 0.25s' }}
                        >
                            🔄 Ôn tập lại bộ này
                        </button>
                    </div>
                </div>

                <style>{`
                    @keyframes popIn { from { transform: scale(0.85) translateY(24px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
                    @keyframes bounce { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-20px) scale(1.1); } }
                `}</style>
            </div>
        );
    }

    const currentCard = dueCards[currentIndex];
    const progress = ((currentIndex + 1) / dueCards.length) * 100;
    const accuracy = sessionStats.reviewed > 0 ? Math.round((sessionStats.mastered / sessionStats.reviewed) * 100) : 0;

    let wrapperClass = "fc-wrapper";
    if (isExiting) wrapperClass += slideDir === 'next' ? ' fc-exit-left' : ' fc-exit-right';
    else wrapperClass += slideDir === 'next' ? ' fc-enter-right' : ' fc-enter-left';

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'linear-gradient(160deg, #F5F3FF 0%, #EDE9FE 50%, #E0E7FF 100%)', position: 'relative' }}>

            {/* Ambient blobs */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
                <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)', borderRadius: '50%', animation: 'floatBlob 18s ease-in-out infinite alternate' }} />
                <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: '560px', height: '560px', background: 'radial-gradient(circle, rgba(79, 70, 229, 0.12) 0%, transparent 70%)', borderRadius: '50%', animation: 'floatBlob 22s ease-in-out infinite alternate-reverse' }} />
            </div>

            {/* Header */}
            <header className="review-header" style={{ padding: '1rem 2rem', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10, boxShadow: '0 4px 24px rgba(79, 70, 229, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <button
                        onClick={() => navigate('/student/flashcards')}
                        className="header-action-btn"
                        style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1.5px solid rgba(79, 70, 229, 0.15)', background: 'white', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.25s' }}
                        title="Quay lại"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <button
                        onClick={shuffleCards}
                        title="Xáo trộn"
                        className="header-action-btn d-none d-sm-flex"
                        style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1.5px solid rgba(79, 70, 229, 0.15)', background: isShuffled ? '#4F46E5' : 'white', color: isShuffled ? 'white' : '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.25s' }}
                    >
                        <Shuffle size={16} />
                    </button>
                    <div className="header-info">
                        <p className="title-text" style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#1E1B4B', fontFamily: "'Space Grotesk', sans-serif" }}>
                            {fileId ? '📚 Theo tài liệu' : '🔥 Ôn tập hàng ngày'}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>
                            Thẻ {currentIndex + 1} / {dueCards.length}
                        </p>
                    </div>
                </div>

                <div className="header-stats-area" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Progress bar */}
                    <div className="progress-container" style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: '#6B7280' }}>
                            <span>Tiến độ</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #4F46E5, #7C3AED)', borderRadius: '8px', transition: 'width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="stats-mini-grid" style={{ display: 'flex', gap: '1.25rem' }}>
                        {[
                            { val: sessionStats.mastered, label: '✅ Thuộc', color: '#10B981' },
                            { val: accuracy + '%', label: '📊 Tỉ lệ', color: '#4F46E5' },
                        ].map(({ val, label, color }) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 900, color, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>{val}</div>
                                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '3px' }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            {/* Main Card Area */}
            <main className="review-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10, padding: '1.5rem' }}>
                
                <div className="card-outer-container" style={{ width: '100%', maxWidth: '800px', position: 'relative' }}>
                    
                    {/* Nav Arrow Left */}
                    <button
                        onClick={goPrev}
                        disabled={currentIndex === 0 || isFlipped}
                        className="nav-btn nav-btn-left"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    {/* The Flashcard */}
                    <div
                        className={wrapperClass}
                        onClick={toggleFlip}
                        style={{ width: '100%', height: '480px', perspective: '2000px', cursor: 'pointer', position: 'relative' }}
                    >
                        <div className={`fc-inner ${isFlipped ? 'fc-flipped' : ''}`}>

                            {/* Front */}
                            <div className="fc-face fc-front">
                                <div className="fc-badge" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5' }}>
                                    ⚡ CÂU HỎI
                                </div>
                                <h2 className="fc-text">{currentCard.frontText}</h2>
                                <p className="fc-hint">
                                    <Eye size={14} /> Click hoặc nhấn Space để xem đáp án
                                </p>
                            </div>

                            {/* Back */}
                            <div className="fc-face fc-back">
                                <div className="fc-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
                                    ✨ ĐÁP ÁN
                                </div>
                                <h3 className="fc-text" style={{ fontSize: '1.5rem', color: '#374151' }}>{currentCard.backText}</h3>
                                <p className="fc-hint">
                                    <RotateCcw size={14} /> Click để quay lại câu hỏi
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Nav Arrow Right */}
                    <button
                        onClick={goNext}
                        disabled={currentIndex === dueCards.length - 1 || isFlipped}
                        className="nav-btn nav-btn-right"
                    >
                        <ChevronRight size={24} />
                    </button>
                    
                    {/* Rating Panel (Desktop Style) */}
                    <div className={`fc-rating-panel d-none d-md-block ${isFlipped && !isExiting ? 'fc-rating-show' : ''}`}>
                        <div className="fc-rating-group">
                            {[
                                { q: 0, emoji: '😵', label: 'Trắng', cls: 'fc-btn-red' },
                                { q: 1, emoji: '😟', label: 'Khó', cls: 'fc-btn-orange' },
                                { q: 2, emoji: '😐', label: 'Lơ mơ', cls: 'fc-btn-yellow' },
                                { q: 3, emoji: '🤔', label: 'Gần thuộc', cls: 'fc-btn-blue' },
                                { q: 4, emoji: '😊', label: 'Thuộc', cls: 'fc-btn-teal' },
                                { q: 5, emoji: '🤩', label: 'Siêu thuộc', cls: 'fc-btn-green' },
                            ].map(({ q, emoji, label, cls }) => (
                                <button
                                    key={q}
                                    className={`fc-rating-btn ${cls}`}
                                    onClick={e => { e.stopPropagation(); handleReview(q); }}
                                >
                                    <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{emoji}</span>
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile Rating Bar (Visible on mobile when flipped) */}
                <div className={`mobile-rating-bar d-md-none ${isFlipped && !isExiting ? 'show' : ''}`}>
                    <div className="mobile-rating-content">
                        <div className="mobile-rating-grid">
                            {[
                                { q: 0, emoji: '😵', cls: 'fc-btn-red' },
                                { q: 1, emoji: '😟', cls: 'fc-btn-orange' },
                                { q: 2, emoji: '😐', cls: 'fc-btn-yellow' },
                                { q: 3, emoji: '🤔', cls: 'fc-btn-blue' },
                                { q: 4, emoji: '😊', cls: 'fc-btn-teal' },
                                { q: 5, emoji: '🤩', cls: 'fc-btn-green' },
                            ].map(({ q, emoji, cls }) => (
                                <button
                                    key={q}
                                    className={`mobile-rate-btn ${cls}`}
                                    onClick={e => { e.stopPropagation(); handleReview(q); }}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center', color: '#6B7280' }}>Chọn mức độ ghi nhớ của bạn</p>
                    </div>
                </div>
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Space+Grotesk:wght@700;900&display=swap');

                @keyframes floatBlob {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(40px, 60px) scale(1.08); }
                }

                .nav-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 54px;
                    height: 54px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.85);
                    backdrop-filter: blur(10px);
                    border: 1.5px solid rgba(79, 70, 229, 0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #4F46E5;
                    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.1);
                    z-index: 20;
                }
                .nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
                .nav-btn-left { left: -70px; }
                .nav-btn-right { right: -70px; }

                @media (max-width: 992px) {
                    .nav-btn-left { left: -20px; }
                    .nav-btn-right { right: -20px; }
                    .progress-container { width: 120px !important; }
                }

                @media (max-width: 576px) {
                    .review-header { padding: 0.75rem 1rem !important; }
                    .header-info .title-text { font-size: 0.8rem !important; }
                    .header-stats-area { gap: 0.75rem !important; }
                    .progress-container, .stats-mini-grid { display: none !important; }
                    .review-main { padding: 1rem !important; }
                    .wrapperClass, .fc-wrapper { height: 60vh !important; min-height: 380px !important; }
                    .nav-btn { width: 42px; height: 42px; }
                    .nav-btn-left { left: 0; }
                    .nav-btn-right { right: 0; }
                    .fc-face { padding: 2rem !important; }
                    .fc-text { font-size: 1.4rem !important; }
                }

                .mobile-rating-bar {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    background: white;
                    border-top: 1px solid rgba(0,0,0,0.05);
                    padding: 1.25rem 1rem 2rem;
                    transform: translateY(101%);
                    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    z-index: 1000;
                    box-shadow: 0 -10px 30px rgba(0,0,0,0.05);
                }
                .mobile-rating-bar.show { transform: translateY(0); }
                .mobile-rating-grid {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 8px;
                }
                .mobile-rate-btn {
                    height: 48px;
                    border-radius: 12px;
                    border: none;
                    font-size: 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* 3D Card Mechanics */
                .fc-wrapper { position: relative; }
                .fc-inner {
                    width: 100%; height: 100%;
                    position: relative;
                    transform-style: preserve-3d;
                    transition: transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .fc-inner.fc-flipped { transform: rotateY(180deg) scale(0.97); }

                .fc-face {
                    position: absolute; inset: 0;
                    background: rgba(255, 255, 255, 0.92);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border-radius: 36px;
                    padding: 3rem 3.5rem;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    backface-visibility: hidden;
                    border: 1.5px solid rgba(255, 255, 255, 0.8);
                    box-shadow:
                        0 24px 60px -12px rgba(79, 70, 229, 0.15),
                        0 8px 24px -4px rgba(79, 70, 229, 0.08),
                        inset 0 0 0 1px rgba(255,255,255,0.9);
                }

                .fc-back {
                    transform: rotateY(180deg);
                    background: rgba(255, 255, 255, 0.96);
                }

                .fc-badge {
                    padding: 6px 16px;
                    border-radius: 10px;
                    font-size: 0.72rem;
                    font-weight: 900;
                    letter-spacing: 0.8px;
                    text-transform: uppercase;
                    margin-bottom: auto;
                    font-family: 'Space Grotesk', sans-serif;
                }

                .fc-text {
                    font-size: 1.9rem;
                    font-weight: 900;
                    color: #1E1B4B;
                    line-height: 1.35;
                    text-align: center;
                    margin: 1rem 0;
                    font-family: 'Space Grotesk', sans-serif;
                    letter-spacing: -0.5px;
                    max-width: 100%;
                    overflow-wrap: break-word;
                }

                .fc-hint {
                    display: flex; align-items: center; gap: 6px;
                    font-size: 0.78rem;
                    color: #9CA3AF;
                    margin-top: auto;
                    font-weight: 700;
                    letter-spacing: 0.3px;
                    font-family: 'Nunito', sans-serif;
                }

                /* Entry / Exit */
                .fc-exit-left {
                    transform: translateX(-140px) scale(0.87) rotate(-4deg);
                    opacity: 0;
                    transition: all 0.26s cubic-bezier(0.55, 0, 0.45, 1);
                }
                .fc-exit-right {
                    transform: translateX(140px) scale(0.87) rotate(4deg);
                    opacity: 0;
                    transition: all 0.26s cubic-bezier(0.55, 0, 0.45, 1);
                }
                .fc-enter-right { animation: fcSlideRight 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .fc-enter-left { animation: fcSlideLeft 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

                @keyframes fcSlideRight {
                    from { transform: translateX(160px) scale(0.87) rotate(4deg); opacity: 0; }
                    to { transform: translateX(0) scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes fcSlideLeft {
                    from { transform: translateX(-160px) scale(0.87) rotate(-4deg); opacity: 0; }
                    to { transform: translateX(0) scale(1) rotate(0deg); opacity: 1; }
                }

                /* Rating panel */
                .fc-rating-panel {
                    position: absolute;
                    bottom: -88px;
                    left: 50%;
                    transform: translateX(-50%) translateY(24px) scale(0.92);
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
                    z-index: 100;
                    width: max-content;
                }
                .fc-rating-panel.fc-rating-show {
                    transform: translateX(-50%) translateY(0) scale(1);
                    opacity: 1;
                    pointer-events: auto;
                }

                .fc-rating-group {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border-radius: 28px;
                    padding: 10px;
                    display: flex;
                    gap: 8px;
                    box-shadow: 0 20px 48px rgba(79, 70, 229, 0.15), inset 0 0 0 1.5px rgba(255,255,255,0.8);
                }

                .fc-rating-group:hover .fc-rating-btn:not(:hover) {
                    opacity: 0.55;
                    transform: scale(0.93);
                }

                .fc-rating-btn {
                    padding: 10px 16px;
                    border-radius: 18px;
                    border: none;
                    font-weight: 900;
                    font-family: 'Nunito', sans-serif;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.72rem;
                    letter-spacing: 0.3px;
                    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
                    min-width: 64px;
                }

                .fc-rating-btn:hover {
                    transform: scale(1.22) translateY(-8px) !important;
                    z-index: 10;
                    box-shadow: 0 12px 28px rgba(0,0,0,0.12);
                }

                .fc-btn-red     { background: #FEE2E2; color: #991B1B; }
                .fc-btn-orange  { background: #FFEDD5; color: #9A3412; }
                .fc-btn-yellow  { background: #FEF3C7; color: #92400E; }
                .fc-btn-blue    { background: #DBEAFE; color: #1E40AF; }
                .fc-btn-teal    { background: #D1FAE5; color: #065F46; }
                .fc-btn-green   { background: #A7F3D0; color: #064E3B; }
            `}</style>
        </div>
    );
};

export default FlashcardReviewPage;