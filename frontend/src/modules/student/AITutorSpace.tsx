import React, { useState, useEffect, useRef } from 'react';
import { studyHubApi } from '../../services/studyHubApi';
import { type StudentDocument, type Flashcard } from '../../types/study';
import { BookOpen, Send, Bot, User, PlayCircle, RotateCcw, AlertCircle } from 'lucide-react';

interface AITutorSpaceProps {
    subjectId: string;
}

const AITutorSpace: React.FC<AITutorSpaceProps> = ({ subjectId }) => {
    // --- States ---
    const [documents, setDocuments] = useState<StudentDocument[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<StudentDocument | null>(null);
    const [activeTab, setActiveTab] = useState<'flashcard' | 'chat'>('flashcard');

    // States cho Flashcard
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // States cho Chatbot
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
    const [isChatting, setIsChatting] = useState(false);
    const chatBoxRef = useRef<HTMLDivElement>(null);

    // --- Load Danh sách tài liệu (Chỉ lấy file Đã hoàn thành) ---
    useEffect(() => {
        studyHubApi.getDocuments(subjectId).then(res => {
            const completedDocs = (res.data?.documents || []).filter(d => d.processingStatus === 'COMPLETED');
            setDocuments(completedDocs);
            if (completedDocs.length > 0) {
                handleSelectDoc(completedDocs[0]);
            }
        }).catch(err => console.error("Lỗi load docs", err));
    }, [subjectId]);

    // Cuộn chat xuống cuối
    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [chatHistory, isChatting]);

    // --- Chọn Tài liệu & Load Flashcard ---
    const handleSelectDoc = async (doc: StudentDocument) => {
        setSelectedDoc(doc);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setChatHistory([
            { role: 'ai', text: `Chào bạn! Mình là Gia sư AI. Mình đã đọc xong tài liệu "${doc.documentTitle}". Bạn có câu hỏi nào cần mình giải đáp không?` }
        ]);

        try {
            const res = await studyHubApi.getFlashcards(doc.studentDocId);
            setFlashcards(res.data?.flashcards || []);
        } catch (err) {
            console.error(err);
        }
    };

    // --- Xử lý Chat ---
    const handleSendMessage = async () => {
        if (!chatMessage.trim() || !selectedDoc) return;

        const userMsg = chatMessage.trim();
        setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
        setChatMessage('');
        setIsChatting(true);

        try {
            const res = await studyHubApi.chatWithDocument(selectedDoc.studentDocId, userMsg);
            setChatHistory(prev => [...prev, { role: 'ai', text: res.data.answer }]);
        } catch (err) {
            setChatHistory(prev => [...prev, { role: 'ai', text: "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau!" }]);
        } finally {
            setIsChatting(false);
        }
    };

    // --- Xử lý Flashcard ---
    const handleReview = async (quality: number) => {
        if (isSubmittingReview || flashcards.length === 0) return;
        setIsSubmittingReview(true);
        try {
            await studyHubApi.reviewCard(flashcards[currentCardIndex].flashcardId, quality);
            if (currentCardIndex < flashcards.length - 1) {
                setIsFlipped(false);
                setCurrentCardIndex(prev => prev + 1);
            } else {
                alert("Hoàn thành bài ôn tập!");
                setCurrentCardIndex(0);
                setIsFlipped(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (documents.length === 0) {
        return (
            <div className="text-center p-5 bg-white rounded-4 shadow-sm border border-dashed">
                <AlertCircle size={48} className="text-warning opacity-50 mb-3" />
                <h4>Chưa có tài liệu nào sẵn sàng</h4>
                <p className="text-muted">Vui lòng sang tab <b>Kho Tài Liệu</b> để tải tài liệu lên và chờ AI xử lý trước khi học nhé.</p>
            </div>
        );
    }

    return (
        <div className="row g-4 animation-fade-in">
            {/* CỘT TRÁI: DANH SÁCH TÀI LIỆU */}
            <div className="col-lg-3">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                    <div className="card-header bg-white border-bottom pt-4 pb-3 px-4">
                        <h6 className="fw-bold text-dark mb-0">📚 Chọn Bài Học</h6>
                    </div>
                    <div className="list-group list-group-flush p-2">
                        {documents.map(doc => (
                            <button
                                key={doc.studentDocId}
                                onClick={() => handleSelectDoc(doc)}
                                className={`list-group-item list-group-item-action rounded-3 border-0 mb-1 p-3 transition-all ${selectedDoc?.studentDocId === doc.studentDocId ? 'bg-primary text-white shadow-sm' : 'bg-light text-dark hover-bg-secondary'}`}
                            >
                                <div className="fw-bold text-truncate" style={{ fontSize: '0.9rem' }}>{doc.documentTitle}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* CỘT PHẢI: KHÔNG GIAN HỌC (FLASHCARD + CHAT) */}
            <div className="col-lg-9">
                <div className="card border-0 shadow-sm rounded-4 h-100 d-flex flex-column overflow-hidden">
                    {/* Header Tabs */}
                    <div className="card-header bg-white p-3 border-bottom d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold text-primary mb-0 text-truncate pe-3">
                            {selectedDoc?.documentTitle}
                        </h5>
                        <div className="bg-light p-1 rounded-pill d-inline-flex flex-shrink-0">
                            <button
                                className={`btn btn-sm rounded-pill px-4 fw-bold ${activeTab === 'flashcard' ? 'btn-primary shadow-sm' : 'btn-light text-muted'}`}
                                onClick={() => setActiveTab('flashcard')}
                            >
                                <PlayCircle size={16} className="me-1 mb-1 d-inline" /> Thẻ Nhớ
                            </button>
                            <button
                                className={`btn btn-sm rounded-pill px-4 fw-bold ${activeTab === 'chat' ? 'btn-primary shadow-sm' : 'btn-light text-muted'}`}
                                onClick={() => setActiveTab('chat')}
                            >
                                <Bot size={16} className="me-1 mb-1 d-inline" /> Hỏi Đáp AI
                            </button>
                        </div>
                    </div>

                    {/* VÙNG HIỂN THỊ */}
                    <div className="card-body p-0 bg-light d-flex flex-column" style={{ minHeight: '500px' }}>

                        {/* TAB 1: FLASHCARD (Giao diện lật thẻ 3D) */}
                        {activeTab === 'flashcard' && (
                            <div className="p-4 d-flex flex-column h-100 align-items-center justify-content-center bg-light rounded-bottom-4">
                                {flashcards.length === 0 ? (
                                    <div className="text-center text-muted p-5 bg-white rounded-4 shadow-sm">
                                        <h5 className="mb-0">Tài liệu này chưa có thẻ nhớ nào.</h5>
                                    </div>
                                ) : (
                                    <div className="w-100" style={{ maxWidth: '650px' }}>
                                        {/* Header: Tiến độ */}
                                        <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                                            <div className="text-muted fw-bold">
                                                Thẻ {currentCardIndex + 1} / {flashcards.length}
                                            </div>
                                            <div className="progress flex-grow-1 mx-4 bg-white shadow-sm" style={{ height: '10px' }}>
                                                <div
                                                    className="progress-bar bg-primary rounded-pill transition-all"
                                                    style={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%`, transitionDuration: '0.4s' }}
                                                ></div>
                                            </div>
                                            <div className="text-primary fw-bolder">
                                                {Math.round(((currentCardIndex + 1) / flashcards.length) * 100)}%
                                            </div>
                                        </div>

                                        {/* Thẻ Flashcard 3D */}
                                        <div
                                            className="cursor-pointer mb-4 w-100"
                                            onClick={() => setIsFlipped(!isFlipped)}
                                            style={{ height: '360px', perspective: '1000px' }}
                                        >
                                            <div style={{
                                                position: 'relative', width: '100%', height: '100%', textAlign: 'center',
                                                transition: 'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)',
                                                transformStyle: 'preserve-3d',
                                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                                            }}>
                                                {/* MẶT TRƯỚC (CÂU HỎI) */}
                                                <div className="card border-0 shadow-sm p-5 d-flex flex-column align-items-center justify-content-center" style={{
                                                    position: 'absolute', width: '100%', height: '100%',
                                                    backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                                                    backgroundColor: '#ffffff', borderRadius: '1.5rem'
                                                }}>
                                                    <span className="badge bg-primary bg-opacity-10 text-primary px-4 py-2 rounded-pill fw-bold mb-4" style={{ letterSpacing: '1px' }}>CÂU HỎI</span>
                                                    <div className="flex-grow-1 d-flex gap-2 align-items-center justify-content-center overflow-auto w-100">
                                                        <h3 className="fw-bolder text-dark lh-base mb-0" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                                            {flashcards[currentCardIndex].frontText}
                                                        </h3>
                                                    </div>
                                                    <p className="text-muted small mt-4 mb-0 fw-medium bg-light px-3 py-2 rounded-pill">
                                                        <RotateCcw size={14} className="me-1 mb-1" /> Nhấn vào thẻ để xem đáp án
                                                    </p>
                                                </div>

                                                {/* MẶT SAU (ĐÁP ÁN) */}
                                                <div className="card shadow-sm p-5 d-flex flex-column align-items-center justify-content-center" style={{
                                                    position: 'absolute', width: '100%', height: '100%',
                                                    backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                                                    backgroundColor: '#f8fffb', border: '3px solid #2ecc71', borderRadius: '1.5rem',
                                                    transform: 'rotateY(180deg)'
                                                }}>
                                                    <span className="badge bg-success bg-opacity-10 text-success px-4 py-2 rounded-pill fw-bold mb-4" style={{ letterSpacing: '1px' }}>ĐÁP ÁN</span>
                                                    <div className="flex-grow-1 d-flex gap-2 align-items-center justify-content-center overflow-auto w-100">
                                                        <h4 className="text-dark lh-base mb-0 fw-medium" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                                            {flashcards[currentCardIndex].backText}
                                                        </h4>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nút chấm điểm */}
                                        <div
                                            className="d-flex gap-3 transition-all"
                                            style={{
                                                opacity: isFlipped ? 1 : 0,
                                                transform: isFlipped ? 'translateY(0)' : 'translateY(15px)',
                                                pointerEvents: isFlipped ? 'auto' : 'none',
                                                transitionDuration: '0.4s'
                                            }}
                                        >
                                            <button onClick={(e) => { e.stopPropagation(); handleReview(1); }} className="btn btn-outline-danger flex-fill py-3 fw-bolder rounded-4 bg-white" disabled={!isFlipped || isSubmittingReview}>
                                                <div className="fs-4 mb-1">😥</div>
                                                Chưa thuộc
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleReview(3); }} className="btn btn-outline-warning text-dark flex-fill py-3 fw-bolder rounded-4 bg-white" disabled={!isFlipped || isSubmittingReview}>
                                                <div className="fs-4 mb-1">🤔</div>
                                                Tạm nhớ
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleReview(5); }} className="btn btn-success flex-fill py-3 fw-bolder rounded-4 shadow-sm" disabled={!isFlipped || isSubmittingReview}>
                                                <div className="fs-4 mb-1">😎</div>
                                                Rất thuộc
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: CHATBOT */}
                        {activeTab === 'chat' && (
                            <div className="d-flex flex-column h-100">
                                {/* Khung Chat */}
                                <div className="flex-grow-1 p-4 overflow-auto" ref={chatBoxRef} style={{ maxHeight: '450px' }}>
                                    {chatHistory.map((msg, idx) => (
                                        <div key={idx} className={`d-flex mb-3 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                                            {msg.role === 'ai' && <div className="me-2 mt-auto mb-auto"><div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle"><Bot size={20} /></div></div>}
                                            <div
                                                className={`p-3 rounded-4 shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-bottom-end-0' : 'bg-white text-dark rounded-bottom-start-0 border'}`}
                                                style={{ maxWidth: '80%', lineHeight: '1.6' }}
                                            >
                                                {msg.text}
                                            </div>
                                            {msg.role === 'user' && <div className="ms-2 mt-auto mb-auto"><div className="bg-secondary bg-opacity-10 text-secondary p-2 rounded-circle"><User size={20} /></div></div>}
                                        </div>
                                    ))}
                                    {isChatting && (
                                        <div className="d-flex mb-3 justify-content-start animation-fade-in">
                                            <div className="me-2"><div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle"><Bot size={20} /></div></div>
                                            <div className="p-3 rounded-4 bg-white border text-muted shadow-sm d-flex align-items-center">
                                                <div className="spinner-grow spinner-grow-sm text-primary me-2" role="status"></div>
                                                AI đang suy nghĩ...
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Ô nhập liệu Chat */}
                                <div className="p-3 bg-white border-top">
                                    <div className="input-group input-group-lg shadow-sm rounded-pill overflow-hidden border">
                                        <input
                                            type="text"
                                            className="form-control border-0 shadow-none px-4 bg-light"
                                            placeholder="Hỏi AI giải thích khái niệm, tóm tắt chương..."
                                            value={chatMessage}
                                            onChange={(e) => setChatMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            disabled={isChatting}
                                        />
                                        <button
                                            className="btn btn-primary px-4 fw-bold d-flex align-items-center"
                                            onClick={handleSendMessage}
                                            disabled={isChatting || !chatMessage.trim()}
                                        >
                                            <Send size={18} className="me-2" /> Gửi
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AITutorSpace;