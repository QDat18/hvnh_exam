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
        { sender: 'ai', text: 'Chào bạn! Mình là Gia sư AI. Bạn cần hỗ trợ gì về bài học hôm nay không?' }
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
        <div className="position-fixed" style={{ bottom: '25px', right: '25px', zIndex: 9999 }}>
            
            {/* --- KHUNG CHAT --- */}
            <div className={`bg-white shadow-lg d-flex flex-column overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 scale-100 mb-3' : 'opacity-0 scale-0 mb-0'}`}
                style={{ width: '360px', height: '520px', borderRadius: '1.2rem', transformOrigin: 'bottom right', pointerEvents: isOpen ? 'auto' : 'none', position: 'absolute', bottom: '70px', right: '0' }}>
                
                {/* Header khung chat */}
                <div className="p-3 d-flex align-items-center justify-content-between shadow-sm" style={{ background: 'linear-gradient(135deg, #002b5e 0%, #0d6efd 100%)', color: 'white' }}>
                    <div className="d-flex align-items-center gap-3">
                        {/* Dùng Logo HVNH nhỏ ở góc khung chat sẽ rất hợp */}
                        <div className="bg-white rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                            <img src={logoHVNH} alt="HVNH Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <div>
                            <h6 className="mb-0 fw-bold d-flex align-items-center gap-1">iReview AI Tutor <Sparkles size={14} className="text-warning"/></h6>
                            <small className="text-white-50" style={{ fontSize: '0.7rem' }}>Trợ lý học tập thông minh</small>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="btn btn-sm text-white border-0 hover-opacity"><X size={20} /></button>
                </div>

                {/* Chọn tài liệu */}
                <div className="bg-light p-2 border-bottom">
                    <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white text-muted border-end-0"><FileText size={14}/></span>
                        <select className="form-select border-start-0 text-secondary fw-medium shadow-none bg-white cursor-pointer" 
                                value={selectedDocId} onChange={(e) => setSelectedDocId(e.target.value)}>
                            <option value="general">🌍 Tư vấn tự do chung</option>
                            {documents.length > 0 && <option disabled>── Tài liệu học phần ──</option>}
                            {documents.map(doc => <option key={doc.studentDocId} value={doc.studentDocId}>📄 {doc.documentTitle}</option>)}
                        </select>
                    </div>
                </div>

                {/* Nội dung tin nhắn */}
                <div className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-3 custom-chat-bg">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                            <div className={`p-3 shadow-sm ${msg.sender === 'user' ? 'bg-primary text-white custom-rounded-user' : 'bg-white border text-dark custom-rounded-ai'}`} 
                                 style={{ maxWidth: '85%', fontSize: '0.9rem', lineHeight: '1.4' }}>{msg.text}</div>
                        </div>
                    ))}
                    {isTyping && <div className="d-flex align-items-center text-muted small px-2 mt-1"><Loader2 size={14} className="me-2 spin text-primary" /> <span>AI đang suy nghĩ...</span></div>}
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
                    className={`btn rounded-circle shadow-lg p-0 d-flex align-items-center justify-content-center transition-all ${isOpen ? 'rotate-90 bg-danger text-white border-0' : 'pulse-effect bg-primary text-white border-0'}`}
                    style={{ width: '60px', height: '60px', position: 'absolute', bottom: '0', right: '0', background: isOpen ? '' : 'linear-gradient(135deg, #002b5e 0%, #0d6efd 100%)' }}>
                {isOpen ? <X size={26} /> : <Bot size={28} />}
            </button>

            <style>{`
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
            `}</style>
        </div>
    );
};

export default FloatingAITutor;