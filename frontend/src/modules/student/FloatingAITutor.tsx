import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, FileText, Loader2, Sparkles } from 'lucide-react';
import { studyHubApi } from '../../services/studyHubApi'; 

// Import Logo HVNH để dùng ở Header của khung chat (chỗ này hiển thị đẹp hơn)
import logoHVNH from '../../assets/images/logo.jpg';

interface FloatingAITutorProps {
    subjectId?: string; 
}

const FloatingAITutor: React.FC<FloatingAITutorProps> = ({ subjectId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [documents, setDocuments] = useState<any[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<string>('general');
    const [messages, setMessages] = useState<{ sender: 'ai' | 'user', text: string }[]>([
        { sender: 'ai', text: 'Xin chào! Mình là iReview AI Tutor - Trợ lý học tập của Học viện Ngân hàng. Mình đã sẵn sàng hỗ trợ bạn chinh phục các bài tập và giáo trình hôm nay rồi đây! 🚀' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const isValidUUID = (id?: string) => {
            if (!id || id === "ID_MON_HOC_TẠM" || id.trim() === "") return false;
            return id.length >= 30;
        };

        if (isValidUUID(subjectId)) {
            studyHubApi.getDocuments(subjectId!)
                .then(res => {
                    const completedDocs = (res.data?.documents || []).filter((d: any) => d.processingStatus === 'COMPLETED');
                    setDocuments(completedDocs);
                })
                .catch(() => setDocuments([]));
        } else {
            setDocuments([]);
            setSelectedDocId('general');
        }
    }, [subjectId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!input.trim() || isTyping) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInput('');
        setIsTyping(true);

        try {
            const res = selectedDocId === 'general' 
                ? await studyHubApi.chatGeneral(userMsg)
                : await studyHubApi.chatWithDocument(selectedDocId, userMsg);
            
            setMessages(prev => [...prev, { sender: 'ai', text: res.data.answer }]);
        } catch {
            setMessages(prev => [...prev, { sender: 'ai', text: 'Hệ thống đang bận, bác thử lại sau nhé!' }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="position-fixed floating-ai-container" style={{ bottom: '25px', right: '25px', zIndex: 9999 }}>
            
            {/* --- KHUNG CHAT --- */}
            <div className={`bg-white shadow-lg d-flex flex-column overflow-hidden transition-all duration-300 floating-chat-window ${isOpen ? 'opacity-100 scale-100 active' : 'opacity-0 scale-0'}`}
                style={{ transformOrigin: 'bottom right', pointerEvents: isOpen ? 'auto' : 'none', position: 'absolute', bottom: '70px', right: '0' }}>
                
                {/* Header khung chat */}
                <div className="p-3 d-flex align-items-center justify-content-between shadow-sm chat-header" style={{ background: 'linear-gradient(135deg, #002b5e 0%, #0d6efd 100%)', color: 'white' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-white rounded-circle p-1 d-flex align-items-center justify-content-center chat-logo-container" style={{ width: '38px', height: '38px' }}>
                            <img src={logoHVNH} alt="HVNH Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <div>
                            <h6 className="mb-0 fw-bold d-flex align-items-center gap-1 chat-title-text">iReview AI Tutor <Sparkles size={14} className="text-warning"/></h6>
                            <small className="text-white-50" style={{ fontSize: '0.7rem' }}>Trợ lý học tập thông minh</small>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="btn btn-sm text-white border-0 hover-opacity"><X size={20} /></button>
                </div>

                {/* Chọn tài liệu - Rigid Flexbox for stability */}
                <div className="bg-light p-2 border-bottom">
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'row',
                        flexWrap: 'nowrap',
                        alignItems: 'center', 
                        backgroundColor: 'white', 
                        borderRadius: '8px', 
                        border: '1px solid #dee2e6',
                        padding: '0 12px',
                        width: '100%',
                        height: '42px', // Fixed height to prevent vertical expansion
                        boxSizing: 'border-box'
                    }}>
                        <FileText size={18} style={{ color: '#6c757d', flexShrink: 0 }} />
                        <select 
                            style={{ 
                                flexGrow: 1,
                                border: 'none', 
                                outline: 'none', 
                                background: 'transparent',
                                fontSize: '0.875rem',
                                color: '#1a202c', // Pure dark text for visibility
                                fontWeight: '600',
                                cursor: 'pointer',
                                height: '100%',
                                appearance: 'none',
                                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236c757d\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 0 center',
                                paddingRight: '25px',
                                marginLeft: '10px',
                                width: '0', // Hack to allow flexbox to control width
                                minWidth: '100%' // Ensures it fills the flex container
                            }}
                            value={selectedDocId} 
                            onChange={(e) => setSelectedDocId(e.target.value)}
                        >
                            <option value="general">🌍 Tư vấn tự do chung</option>
                            {documents.length > 0 && <option disabled>── Tài liệu học phần ──</option>}
                            {documents.map(doc => <option key={doc.studentDocId} value={doc.studentDocId}>📄 {doc.documentTitle}</option>)}
                        </select>
                    </div>
                </div>

                {/* Nội dung tin nhắn */}
                <div className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-3 custom-chat-bg">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'} fade-in`}>
                            <div className={`p-3 shadow-sm ${msg.sender === 'user' 
                                ? 'bg-primary text-white custom-rounded-user' 
                                : 'bg-white border text-dark custom-rounded-ai'}`} 
                                 style={{ 
                                     maxWidth: '85%', 
                                     fontSize: '0.9rem', 
                                     lineHeight: '1.6', 
                                     boxShadow: msg.sender === 'user' ? '0 4px 15px rgba(13, 110, 253, 0.2)' : '0 2px 10px rgba(0,0,0,0.05)'
                                 }}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="d-flex align-items-center text-muted small px-2 mt-1 typing-indicator">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <span className="ms-2">iReview đang chuẩn bị câu trả lời...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Ô nhập liệu */}
                <div className="p-3 bg-white border-top">
                    <div className="d-flex align-items-center bg-light rounded-pill border p-1 px-3 focus-ring-primary transition-all">
                        <input className="form-control border-0 bg-transparent shadow-none py-2 px-1" placeholder="Hỏi AI về bài học..." 
                               value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
                        <button className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
                                style={{ width: 36, height: 36, marginLeft: '5px' }} onClick={handleSendMessage} disabled={!input.trim() || isTyping}>
                            <Send size={16} className="ms-1" />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- NÚT BẤM MỞ CHAT HIỆN ĐẠI --- */}
            <button onClick={() => setIsOpen(!isOpen)} 
                    className={`btn rounded-circle shadow-lg p-0 d-flex align-items-center justify-content-center transition-all floating-toggle-btn ${isOpen ? 'rotate-90 bg-danger text-white border-0' : 'pulse-effect bg-primary text-white border-0'}`}
                    style={{ width: '60px', height: '60px', position: 'absolute', bottom: '0', right: '0', background: isOpen ? '' : 'linear-gradient(135deg, #002b5e 0%, #0d6efd 100%)' }}>
                {isOpen ? <X size={26} /> : <Bot size={28} />}
            </button>

            <style>{`
                .floating-chat-window {
                    width: 360px; 
                    height: 520px; 
                    border-radius: 1.2rem;
                }

                @media (max-width: 576px) {
                    .floating-ai-container {
                        bottom: 15px !important;
                        right: 15px !important;
                    }
                    .floating-chat-window {
                        width: calc(100vw - 30px);
                        height: 70vh;
                        max-height: 500px;
                        right: 0;
                        bottom: 75px;
                    }
                    .floating-toggle-btn {
                        width: 54px !important;
                        height: 54px !important;
                    }
                    .chat-title-text { font-size: 0.9rem; }
                }

                .spin { animation: spin 1s linear infinite; } 
                @keyframes spin { 100% { transform: rotate(360deg); } } 
                
                .pulse-effect { animation: pulse 2s infinite; } 
                @keyframes pulse { 
                    0% { box-shadow: 0 0 0 0 rgba(13, 110, 253, 0.5); } 
                    70% { box-shadow: 0 0 0 15px rgba(13, 110, 253, 0); } 
                    100% { box-shadow: 0 0 0 0 rgba(13, 110, 253, 0); } 
                }
                
                .hover-opacity:hover { opacity: 0.8; }
                .cursor-pointer { cursor: pointer; }
                
                /* Làm đẹp khung chat */
                .custom-chat-bg { background-color: #f8f9fa; }
                .custom-rounded-user { border-radius: 18px 18px 0px 18px; }
                .custom-rounded-ai { border-radius: 18px 18px 18px 0px; }
                
                .focus-ring-primary:focus-within { border-color: #86b7fe !important; box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important; }

                .fade-in {
                    animation: fadeIn 0.3s ease-in-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .typing-indicator {
                    display: flex;
                    align-items: center;
                }
                .typing-dot {
                    width: 6px;
                    height: 6px;
                    margin: 0 2px;
                    background: #0d6efd;
                    border-radius: 50%;
                    opacity: 0.6;
                    animation: typing 1s infinite alternate;
                }
                .typing-dot:nth-child(2) { animation-delay: 0.2s; }
                .typing-dot:nth-child(3) { animation-delay: 0.4s; }
                @keyframes typing {
                    from { transform: scale(1); opacity: 0.4; }
                    to { transform: scale(1.3); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default FloatingAITutor;