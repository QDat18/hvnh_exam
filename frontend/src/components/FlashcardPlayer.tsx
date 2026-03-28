import React, { useState } from 'react';
import { studyHubApi } from '../services/studyHubApi';
import { type Flashcard } from '../types/study';

interface Props {
    cards: Flashcard[];
    onClose: () => void;
}

const FlashcardPlayer: React.FC<Props> = ({ cards, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentCard = cards[currentIndex];

    // Hàm gửi kết quả đánh giá SM-2 về Backend
    const handleReview = async (quality: number) => {
        if (!currentCard || isSubmitting) return;

        setIsSubmitting(true);
        try {
            // Gọi API review đã viết ở Phần 3
            await studyHubApi.reviewCard(currentCard.flashcardId, quality);
            
            // Chuyển sang thẻ tiếp theo
            if (currentIndex < cards.length - 1) {
                setIsFlipped(false);
                setTimeout(() => {
                    setCurrentIndex(prev => prev + 1);
                    setIsSubmitting(false);
                }, 300);
            } else {
                alert("Chúc mừng! Bạn đã hoàn thành phiên học này.");
                onClose();
            }
        } catch (err) {
            alert("Không thể lưu kết quả review!");
            setIsSubmitting(false);
        }
    };

    if (!currentCard) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <span className="font-bold text-gray-500">
                        Thẻ {currentIndex + 1} / {cards.length}
                    </span>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Card Display */}
                <div className="p-12 flex flex-col items-center justify-center min-h-[300px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                    {!isFlipped ? (
                        <div className="text-center animate-in fade-in duration-500">
                            <span className="text-blue-500 font-black text-xs uppercase tracking-widest">Mặt trước (Câu hỏi)</span>
                            <h2 className="text-3xl font-bold text-gray-800 mt-4 leading-snug">{currentCard.frontText}</h2>
                            <p className="text-gray-400 text-sm mt-8 italic">Bấm vào thẻ để xem đáp án</p>
                        </div>
                    ) : (
                        <div className="text-center animate-in zoom-in-95 duration-300">
                            <span className="text-green-500 font-black text-xs uppercase tracking-widest">Mặt sau (Giải thích)</span>
                            <div className="text-xl text-gray-700 mt-4 leading-relaxed">{currentCard.backText}</div>
                        </div>
                    )}
                </div>

                {/* SM-2 Rating Buttons (Chỉ hiện khi đã lật thẻ) */}
                <div className={`p-6 bg-gray-50 border-t transition-all duration-500 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                    <p className="text-center text-xs font-bold text-gray-400 uppercase mb-4">Bạn nhớ kiến thức này thế nào?</p>
                    <div className="grid grid-cols-6 gap-2">
                        {[0, 1, 2, 3, 4, 5].map((num) => (
                            <button
                                key={num}
                                onClick={(e) => { e.stopPropagation(); handleReview(num); }}
                                disabled={isSubmitting}
                                className={`py-3 rounded-xl font-bold text-lg transition-all active:scale-90 ${getButtonColor(num)}`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-between mt-3 text-[10px] font-bold text-gray-400 px-1">
                        <span>QUÊN HẲN</span>
                        <span>RẤT NHỚ</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper để lấy màu nút bấm
const getButtonColor = (num: number) => {
    const colors = [
        "bg-red-100 text-red-600 hover:bg-red-600 hover:text-white",       // 0
        "bg-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white", // 1
        "bg-yellow-100 text-yellow-600 hover:bg-yellow-600 hover:text-white", // 2
        "bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white",     // 3
        "bg-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white", // 4
        "bg-green-100 text-green-600 hover:bg-green-600 hover:text-white"    // 5
    ];
    return colors[num];
};

export default FlashcardPlayer;