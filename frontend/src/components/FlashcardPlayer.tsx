import React, { useState, useEffect } from 'react';
import { studyHubApi } from '../services/studyHubApi';
import { type Flashcard } from '../types/study';
import { Zap, ChevronLeft, ChevronRight, Volume2, Eye } from 'lucide-react';

interface Props {
    cards: Flashcard[];
    onClose: () => void;
}

const FlashcardPlayer: React.FC<Props> = ({ cards, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [stats, setStats] = useState({ correct: 0, learning: 0, difficult: 0, total: 0 });
    const [userResponses, setUserResponses] = useState<number[]>([]);
    const [showCelebration, setShowCelebration] = useState(false);

    const currentCard = cards[currentIndex];
    const progress = ((currentIndex + 1) / cards.length) * 100;

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ') {
                e.preventDefault();
                setIsFlipped(!isFlipped);
            }
            if (e.key >= '0' && e.key <= '5' && isFlipped) {
                handleReview(parseInt(e.key));
            }
            if (e.key === 'ArrowRight' && !isFlipped && currentIndex < cards.length - 1) {
                goToNext();
            }
            if (e.key === 'ArrowLeft' && !isFlipped && currentIndex > 0) {
                goToPrev();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFlipped, currentIndex, cards.length]);

    const goToNext = () => {
        if (currentIndex < cards.length - 1) {
            setIsAnimating(true);
            setIsFlipped(false);
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
                setIsAnimating(false);
            }, 300);
        }
    };

    const goToPrev = () => {
        if (currentIndex > 0) {
            setIsAnimating(true);
            setIsFlipped(false);
            setTimeout(() => {
                setCurrentIndex(prev => prev - 1);
                setIsAnimating(false);
            }, 300);
        }
    };

    const handleReview = async (quality: number) => {
        if (!currentCard || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await studyHubApi.reviewCard(currentCard.flashcardId, quality);
            
            // Update stats
            const newResponses = [...userResponses, quality];
            setUserResponses(newResponses);
            
            let correct = 0, learning = 0, difficult = 0;
            newResponses.forEach(q => {
                if (q >= 4) correct++;
                else if (q === 3) learning++;
                else difficult++;
            });
            
            setStats({
                correct,
                learning,
                difficult,
                total: correct + learning + difficult
            });

            // Chuyển sang thẻ tiếp theo
            if (currentIndex < cards.length - 1) {
                setIsAnimating(true);
                setTimeout(() => {
                    setCurrentIndex(prev => prev + 1);
                    setIsFlipped(false);
                    setIsSubmitting(false);
                    setIsAnimating(false);
                }, 300);
            } else {
                // Show completion
                setShowCelebration(true);
                setTimeout(() => {
                    const finalStats = {
                        correct,
                        learning,
                        difficult,
                        total: correct + learning + difficult,
                        completion: new Date().toLocaleTimeString('vi-VN')
                    };
                    onClose(finalStats as any);
                }, 1500);
            }
        } catch (err) {
            console.error("Error reviewing card:", err);
            setIsSubmitting(false);
        }
    };

    if (!currentCard) return null;

    const getQualityInfo = (num: number) => {
        const info = [
            { label: 'Quên hẳn', emoji: '❌', desc: 'Cần ôn lại' },
            { label: 'Rất khó', emoji: '😰', desc: 'khó nhớ' },
            { label: 'Khó', emoji: '😟', desc: 'còn lạ' },
            { label: 'Bình thường', emoji: '🤔', desc: 'chưa thành thạo' },
            { label: 'Tốt', emoji: '😊', desc: 'nhớ tạm' },
            { label: 'Rất tốt', emoji: '🤩', desc: 'nhớ rõ' }
        ];
        return info[num];
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-white/80 transform transition-all duration-300" onClick={e => e.stopPropagation()}>
                
                {/* Premium Header */}
                <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
                    {/* Close Button */}
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all backdrop-blur-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>

                    {/* Progress Bar */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold">Thẻ {currentIndex + 1} / {cards.length}</span>
                            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">⌨️ Spacebar: lật | 0-5: rate</span>
                        </div>
                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-yellow-300 via-green-300 to-blue-300 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 text-xs font-bold mt-3">
                        <div className="flex items-center gap-1">
                            <span className="text-2xl">✅</span>
                            <div>
                                <div className="text-green-200">Thuần thục</div>
                                <div className="text-lg">{stats.correct}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-2xl">📚</span>
                            <div>
                                <div className="text-yellow-200">Đang học</div>
                                <div className="text-lg">{stats.learning}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-2xl">⚡</span>
                            <div>
                                <div className="text-pink-200">Cần ôn</div>
                                <div className="text-lg">{stats.difficult}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Card Area */}
                <div 
                    className="relative p-8 min-h-96 flex items-center justify-center cursor-pointer bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    {/* Flip Animation Container */}
                    <div className={`w-full h-full flex items-center justify-center transition-all duration-500 transform ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
                        {!isFlipped ? (
                            <div className="text-center w-full animate-in fade-in duration-500">
                                <div className="inline-block mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-xs font-bold uppercase tracking-widest">
                                    <Zap className="inline mr-2" size={14} />
                                    Câu hỏi
                                </div>
                                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 leading-snug mb-6">
                                    {currentCard.frontText}
                                </h2>
                                <p className="text-slate-400 text-sm italic flex items-center justify-center gap-2 mt-8">
                                    <Eye size={16} />
                                    Bấm để xem đáp án
                                </p>
                            </div>
                        ) : (
                            <div className="text-center w-full animate-in zoom-in-95 duration-300">
                                <div className="inline-block mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-200 text-green-700 text-xs font-bold uppercase tracking-widest">
                                    ✨ Đáp án
                                </div>
                                <div className="text-2xl text-slate-700 leading-relaxed bg-gradient-to-b from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                    {currentCard.backText}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Arrows */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                        className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all ${currentIndex === 0 ? 'bg-gray-100 text-gray-300 cursor-default' : 'bg-white hover:bg-blue-50 text-slate-700 shadow-lg'}`}
                        disabled={currentIndex === 0}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); goToNext(); }}
                        className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all ${currentIndex === cards.length - 1 ? 'bg-gray-100 text-gray-300 cursor-default' : 'bg-white hover:bg-blue-50 text-slate-700 shadow-lg'}`}
                        disabled={currentIndex === cards.length - 1}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Rating Section */}
                <div className={`p-8 bg-gradient-to-r from-slate-50 to-blue-50/50 border-t border-slate-200 transition-all duration-500 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                    <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Bạn nhớ kiến thức này thế nào? (0-5 hoặc click nút)</p>
                    
                    <div className="grid grid-cols-6 gap-2 mb-4">
                        {[0, 1, 2, 3, 4, 5].map((num) => {
                            const info = getQualityInfo(num);
                            return (
                                <button
                                    key={num}
                                    onClick={(e) => { e.stopPropagation(); handleReview(num); }}
                                    disabled={isSubmitting}
                                    className={`py-3 px-2 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95 ${getButtonColor(num)} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={`${info.label} (${info.desc})`}
                                >
                                    <div className="text-xl mb-1">{info.emoji}</div>
                                    <div className="text-xs font-bold leading-tight">{num}</div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex justify-between text-center text-[11px] font-bold text-slate-400 px-1">
                        <span>Quên hẳn</span>
                        <span>Bình thường</span>
                        <span>Rất nhớ</span>
                    </div>
                </div>

                {/* Celebration Overlay */}
                {showCelebration && (
                    <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center" onClick={() => {}}>
                        <div className="text-center">
                            <div className="text-8xl mb-4 animate-bounce">🎉</div>
                            <h3 className="text-3xl font-black text-white mb-2">Tuyệt vời!</h3>
                            <p className="text-white/80">Bạn đã hoàn thành phiên học</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const getButtonColor = (num: number) => {
    const colors = [
        "bg-red-100 text-red-600 hover:bg-red-200 border-2 border-red-300",
        "bg-orange-100 text-orange-600 hover:bg-orange-200 border-2 border-orange-300",
        "bg-yellow-100 text-yellow-600 hover:bg-yellow-200 border-2 border-yellow-300",
        "bg-blue-100 text-blue-600 hover:bg-blue-200 border-2 border-blue-300",
        "bg-indigo-100 text-indigo-600 hover:bg-indigo-200 border-2 border-indigo-300",
        "bg-green-100 text-green-600 hover:bg-green-200 border-2 border-green-300"
    ];
    return colors[num];
};

export default FlashcardPlayer;