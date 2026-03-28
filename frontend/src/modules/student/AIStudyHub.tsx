import React, { useState, useEffect, useRef, useCallback } from 'react';
import { studyHubApi } from '../../services/studyHubApi';
import { type StudentDocument, type Flashcard } from '../../types/study';
import {
    BookOpen, CheckCircle, Clock, FileText, X,
    PlayCircle, Send, Bot, User, RotateCcw,
    AlertCircle, ChevronLeft, ChevronRight, Layers, Brain, BarChart2
} from 'lucide-react';

interface AIStudyHubProps { subjectId: string; }

// ── Badge helpers ────────────────────────────────────────────
const bloomCfg: Record<string, { label: string; color: string; bg: string }> = {
    REMEMBER:   { label: 'Ghi nhớ',    color: '#6b7280', bg: '#f3f4f6' },
    UNDERSTAND: { label: 'Thông hiểu', color: '#0284c7', bg: '#e0f2fe' },
    APPLY:      { label: 'Vận dụng',   color: '#7c3aed', bg: '#ede9fe' },
    ANALYZE:    { label: 'Phân tích',  color: '#d97706', bg: '#fef3c7' },
    EVALUATE:   { label: 'Đánh giá',   color: '#dc2626', bg: '#fee2e2' },
    CREATE:     { label: 'Sáng tạo',   color: '#16a34a', bg: '#dcfce7' },
};
const diffCfg: Record<string, { label: string; color: string; bg: string }> = {
    EASY:   { label: 'Dễ',        color: '#16a34a', bg: '#dcfce7' },
    MEDIUM: { label: 'Trung bình', color: '#d97706', bg: '#fef3c7' },
    HARD:   { label: 'Khó',        color: '#dc2626', bg: '#fee2e2' },
};

const BloomBadge = ({ level }: { level?: string }) => {
    const c = bloomCfg[level || ''] ?? bloomCfg['REMEMBER'];
    return <span className="badge rounded-pill px-2 py-1" style={{ background: c.bg, color: c.color, fontSize: '0.72rem', fontWeight: 600 }}>
        <Brain size={10} style={{ verticalAlign: 'middle', marginRight: 3 }}/>{c.label}
    </span>;
};
const DiffBadge = ({ level }: { level?: string }) => {
    const c = diffCfg[level || ''] ?? diffCfg['MEDIUM'];
    return <span className="badge rounded-pill px-2 py-1" style={{ background: c.bg, color: c.color, fontSize: '0.72rem', fontWeight: 600 }}>{c.label}</span>;
};
const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'COMPLETED') return <span className="badge rounded-pill" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.7rem' }}><CheckCircle size={9} style={{ marginRight: 3 }}/>Hoàn thành</span>;
    if (status === 'PROCESSING') return <span className="badge rounded-pill" style={{ background: '#fef3c7', color: '#d97706', fontSize: '0.7rem' }}><Clock size={9} style={{ marginRight: 3 }}/>Đang xử lý</span>;
    return <span className="badge rounded-pill" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.7rem' }}>Lỗi</span>;
};

// ── SM-2 Review Button ───────────────────────────────────────
const ReviewBtn = ({ emoji, label, color, onClick, disabled }: { emoji: string; label: string; color: string; onClick: () => void; disabled: boolean }) => (
    <button onClick={onClick} disabled={disabled}
            className="btn flex-fill fw-bold rounded-3 py-2 border-0 d-flex flex-column align-items-center gap-1"
            style={{ background: color + '1a', color }}>
        <span style={{ fontSize: '1.3rem' }}>{emoji}</span>
        <span style={{ fontSize: '0.75rem' }}>{label}</span>
    </button>
);

// ── Main ─────────────────────────────────────────────────────
const AIStudyHub: React.FC<AIStudyHubProps> = ({ subjectId }) => {
    const [documents, setDocuments]       = useState<StudentDocument[]>([]);
    const [selectedDoc, setSelectedDoc]   = useState<StudentDocument | null>(null);
    const [flashcards, setFlashcards]     = useState<Flashcard[]>([]);
    const [loadingCards, setLoadingCards] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [activeTab, setActiveTab]       = useState<'flashcard' | 'chat' | 'list'>('flashcard');

    // Flashcard session
    const [currentIdx, setCurrentIdx]     = useState(0);
    const [isFlipped, setIsFlipped]       = useState(false);
    const [isReviewing, setIsReviewing]   = useState(false);
    const [sessionDone, setSessionDone]   = useState(false);
    const [reviewMap, setReviewMap]       = useState<Record<number, number>>({});

    // Chat
    const [chatMsg, setChatMsg]           = useState('');
    const [chatHistory, setChatHistory]   = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
    const [isChatting, setIsChatting]     = useState(false);
    const chatBoxRef                      = useRef<HTMLDivElement>(null);
    const pollingRef                      = useRef<NodeJS.Timeout | null>(null);

    // ── Fetch ──────────────────────────────────────────────────
    const fetchDocuments = useCallback(async (isPolling = false) => {
        try {
            const res = await studyHubApi.getDocuments(subjectId);
            const docs: StudentDocument[] = res.data?.documents || [];
            setDocuments(docs);
            if (docs.some(d => d.processingStatus === 'PROCESSING')) {
                if (!pollingRef.current) pollingRef.current = setInterval(() => fetchDocuments(true), 5000);
            } else {
                if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
            }
        } catch { /* silent */ }
        finally { if (!isPolling) setIsInitialLoading(false); }
    }, [subjectId]);

    useEffect(() => {
        fetchDocuments();
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [fetchDocuments]);

    useEffect(() => {
        if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }, [chatHistory, isChatting]);

    // ── Select doc ─────────────────────────────────────────────
    const handleSelectDoc = async (doc: StudentDocument) => {
        if (doc.processingStatus !== 'COMPLETED') return;
        setSelectedDoc(doc);
        setCurrentIdx(0); setIsFlipped(false); setSessionDone(false); setReviewMap({});
        setChatHistory([{ role: 'ai', text: `Xin chào! Mình đã đọc "${doc.documentTitle}". Bạn có câu hỏi gì không?` }]);
        setActiveTab('flashcard');
        setLoadingCards(true);
        try {
            const res = await studyHubApi.getFlashcards(doc.studentDocId);
            setFlashcards(res.data?.flashcards || []);
        } catch { setFlashcards([]); }
        finally { setLoadingCards(false); }
    };

    // ── Review ─────────────────────────────────────────────────
    const handleReview = async (quality: number) => {
        if (isReviewing || !flashcards[currentIdx]) return;
        setIsReviewing(true);
        try {
            await studyHubApi.reviewCard(flashcards[currentIdx].flashcardId, quality);
            setReviewMap(prev => ({ ...prev, [currentIdx]: quality }));
            if (currentIdx < flashcards.length - 1) {
                setIsFlipped(false);
                setTimeout(() => { setCurrentIdx(p => p + 1); setIsReviewing(false); }, 250);
            } else {
                setSessionDone(true); setIsReviewing(false);
            }
        } catch { setIsReviewing(false); }
    };

    // ── Chat ───────────────────────────────────────────────────
    const handleSendMsg = async () => {
        if (!chatMsg.trim() || !selectedDoc || isChatting) return;
        const txt = chatMsg.trim();
        setChatHistory(prev => [...prev, { role: 'user', text: txt }]);
        setChatMsg(''); setIsChatting(true);
        try {
            const res = await studyHubApi.chatWithDocument(selectedDoc.studentDocId, txt);
            setChatHistory(prev => [...prev, { role: 'ai', text: res.data.answer }]);
        } catch {
            setChatHistory(prev => [...prev, { role: 'ai', text: 'Hệ thống đang bận, thử lại sau nhé!' }]);
        } finally { setIsChatting(false); }
    };

    const card = flashcards[currentIdx];
    const progress = flashcards.length ? Math.round(((currentIdx + (sessionDone ? 1 : 0)) / flashcards.length) * 100) : 0;
    const doneCount = Object.keys(reviewMap).length;

    // ── RENDER ─────────────────────────────────────────────────
    return (
        <div className="animation-fade-in">
            <div className="row g-3 g-lg-4">

                {/* LEFT: Library */}
                <div className="col-12 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className="px-3 py-3 border-0" style={{ background: 'linear-gradient(135deg,#1e40af,#1e3a8a)' }}>
                            <h6 className="fw-bold text-white mb-0 d-flex align-items-center gap-2"><Layers size={16}/>Thư viện</h6>
                            <small className="text-white opacity-50">{documents.length} tài liệu</small>
                        </div>
                        <div className="p-2" style={{ maxHeight: 480, overflowY: 'auto' }}>
                            {isInitialLoading ? (
                                <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary"/></div>
                            ) : documents.length === 0 ? (
                                <div className="text-center py-4 px-3 text-muted small">
                                    <FileText size={32} className="opacity-20 mb-2 d-block mx-auto"/>
                                    Tải tài liệu ở tab <b>Kho Tài Liệu</b>
                                </div>
                            ) : documents.map(doc => {
                                const sel = selectedDoc?.studentDocId === doc.studentDocId;
                                const ok  = doc.processingStatus === 'COMPLETED';
                                return (
                                    <div key={doc.studentDocId} onClick={() => handleSelectDoc(doc)}
                                         className="rounded-3 p-3 mb-1"
                                         style={{
                                             cursor: ok ? 'pointer' : 'default',
                                             background: sel ? '#eff6ff' : 'transparent',
                                             borderLeft: sel ? '3px solid #1d4ed8' : '3px solid transparent',
                                             opacity: ok ? 1 : 0.55,
                                             transition: 'all 0.15s',
                                         }}>
                                        <div className="d-flex gap-2 align-items-start">
                                            <div style={{ width: 30, height: 30, borderRadius: 7, background: sel ? '#dbeafe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                                <FileText size={15} color={sel ? '#1d4ed8' : '#94a3b8'}/>
                                            </div>
                                            <div className="overflow-hidden flex-grow-1">
                                                <div className="fw-semibold text-truncate" style={{ fontSize: '0.82rem', color: sel ? '#1d4ed8' : '#1e293b' }}>{doc.documentTitle}</div>
                                                <div className="mt-1"><StatusBadge status={doc.processingStatus}/></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Study space */}
                <div className="col-12 col-lg-9">
                    {!selectedDoc ? (
                        <div className="card border-0 shadow-sm rounded-4 d-flex align-items-center justify-content-center text-center p-5"
                             style={{ minHeight: 400, border: '2px dashed #e2e8f0' }}>
                            <BookOpen size={52} className="text-muted opacity-20 mb-3"/>
                            <h5 className="fw-bold text-muted">Chọn tài liệu để bắt đầu</h5>
                            <p className="text-muted small">Chọn tài liệu "Hoàn thành" ở cột bên trái</p>
                        </div>
                    ) : (
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden d-flex flex-column" style={{ minHeight: 480 }}>

                            {/* Tab nav */}
                            <div className="px-3 pt-3 pb-0 bg-white border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <span className="fw-semibold text-dark text-truncate" style={{ maxWidth: 260, fontSize: '0.88rem' }}>{selectedDoc.documentTitle}</span>
                                <div className="d-flex gap-1 pb-0">
                                    {(['flashcard','chat','list'] as const).map(t => (
                                        <button key={t} onClick={() => setActiveTab(t)}
                                                className={`btn btn-sm fw-semibold rounded-pill px-3 border-0 ${activeTab === t ? 'btn-primary' : 'btn-light text-muted'}`}
                                                style={{ fontSize: '0.78rem' }}>
                                            {t === 'flashcard' ? <><PlayCircle size={12} style={{ marginRight: 4 }}/>Ôn thẻ</>
                                             : t === 'chat'     ? <><Bot size={12} style={{ marginRight: 4 }}/>Hỏi AI</>
                                             :                    <><BarChart2 size={12} style={{ marginRight: 4 }}/>Danh sách</>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── FLASHCARD TAB ─────────────────────────── */}
                            {activeTab === 'flashcard' && (
                                <div className="flex-grow-1 bg-light p-3 p-md-4 d-flex flex-column">
                                    {loadingCards ? (
                                        <div className="text-center py-5"><div className="spinner-border text-primary"/></div>
                                    ) : flashcards.length === 0 ? (
                                        <div className="text-center py-5 text-muted">
                                            <AlertCircle size={40} className="mb-3 opacity-25 d-block mx-auto"/>
                                            Tài liệu này chưa có thẻ nhớ.
                                        </div>
                                    ) : sessionDone ? (
                                        /* Session complete screen */
                                        <div className="text-center py-4 animation-fade-in">
                                            <div style={{ fontSize: '3rem' }} className="mb-3">🎉</div>
                                            <h4 className="fw-bold mb-2">Hoàn thành phiên ôn tập!</h4>
                                            <p className="text-muted mb-4">{flashcards.length} thẻ đã ôn</p>
                                            <div className="d-flex justify-content-center gap-3 mb-4 flex-wrap">
                                                {[
                                                    { label: 'Thuộc lòng', filter: (q: number) => q >= 4, color: '#16a34a', bg: '#dcfce7' },
                                                    { label: 'Còn lưỡng lự', filter: (q: number) => q === 3, color: '#d97706', bg: '#fef3c7' },
                                                    { label: 'Cần ôn lại', filter: (q: number) => q <= 2, color: '#dc2626', bg: '#fee2e2' },
                                                ].map(stat => (
                                                    <div key={stat.label} className="px-4 py-2 rounded-3 text-center" style={{ background: stat.bg }}>
                                                        <div className="fw-bold fs-5" style={{ color: stat.color }}>
                                                            {Object.values(reviewMap).filter(stat.filter).length}
                                                        </div>
                                                        <small style={{ color: stat.color }}>{stat.label}</small>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={() => { setCurrentIdx(0); setIsFlipped(false); setSessionDone(false); setReviewMap({}); }}
                                                    className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm">
                                                <RotateCcw size={15} style={{ marginRight: 6 }}/>Ôn lại từ đầu
                                            </button>
                                        </div>
                                    ) : (
                                        /* Flashcard player */
                                        <div className="d-flex flex-column align-items-center mx-auto w-100" style={{ maxWidth: 580 }}>

                                            {/* Progress bar */}
                                            <div className="w-100 mb-3">
                                                <div className="d-flex justify-content-between mb-1">
                                                    <small className="text-muted fw-semibold">Thẻ {currentIdx + 1} / {flashcards.length}</small>
                                                    <small className="text-muted">{doneCount} đã ôn</small>
                                                </div>
                                                <div className="progress rounded-pill" style={{ height: 5 }}>
                                                    <div className="progress-bar bg-primary rounded-pill" style={{ width: `${progress}%`, transition: 'width 0.4s' }}/>
                                                </div>
                                            </div>

                                            {/* Metadata badges */}
                                            {card && (
                                                <div className="mb-2 d-flex gap-1 flex-wrap align-items-center w-100">
                                                    <BloomBadge level={(card as any).bloomLevel}/>
                                                    <DiffBadge level={card.difficulty}/>
                                                    {card.sourceReference && (
                                                        <span className="badge rounded-pill px-2 py-1" style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.7rem' }}>
                                                            📄 {card.sourceReference}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Card face */}
                                            <div onClick={() => setIsFlipped(f => !f)}
                                                 className="w-100 rounded-4 shadow-sm mb-3 d-flex flex-column align-items-center justify-content-center text-center p-4"
                                                 style={{
                                                     minHeight: 210,
                                                     cursor: 'pointer',
                                                     background: isFlipped ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : '#ffffff',
                                                     border: `2px solid ${isFlipped ? '#86efac' : '#e2e8f0'}`,
                                                     transition: 'all 0.3s ease',
                                                     userSelect: 'none',
                                                 }}>
                                                {!isFlipped ? (
                                                    <div className="animation-fade-in">
                                                        <span className="badge bg-primary rounded-pill px-3 py-1 mb-3" style={{ fontSize: '0.73rem' }}>CÂU HỎI</span>
                                                        <h5 className="fw-bold text-dark lh-base mb-4">{card?.frontText}</h5>
                                                        <p className="text-muted small mb-0 d-flex align-items-center justify-content-center gap-1">
                                                            <RotateCcw size={12}/>Bấm để xem đáp án
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="animation-fade-in">
                                                        <span className="badge rounded-pill px-3 py-1 mb-3" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.73rem' }}>ĐÁP ÁN</span>
                                                        <p className="text-dark lh-base mb-0" style={{ fontSize: '0.95rem' }}>{card?.backText}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Navigation */}
                                            <div className="d-flex justify-content-between w-100 mb-2">
                                                <button onClick={() => { setCurrentIdx(i => Math.max(0, i - 1)); setIsFlipped(false); }}
                                                        disabled={currentIdx === 0}
                                                        className="btn btn-sm btn-light border rounded-pill px-3">
                                                    <ChevronLeft size={15}/> Trước
                                                </button>
                                                <button onClick={() => { setCurrentIdx(i => Math.min(flashcards.length - 1, i + 1)); setIsFlipped(false); }}
                                                        disabled={currentIdx === flashcards.length - 1}
                                                        className="btn btn-sm btn-light border rounded-pill px-3">
                                                    Tiếp <ChevronRight size={15}/>
                                                </button>
                                            </div>

                                            {/* SM-2 buttons */}
                                            <div className="d-flex gap-2 w-100"
                                                 style={{ opacity: isFlipped ? 1 : 0.25, pointerEvents: isFlipped ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
                                                <ReviewBtn emoji="😵" label="Quên hẳn"   color="#dc2626" quality={1} onClick={() => handleReview(1)} disabled={isReviewing}/>
                                                <ReviewBtn emoji="😕" label="Lờ mờ"      color="#d97706" quality={2} onClick={() => handleReview(2)} disabled={isReviewing}/>
                                                <ReviewBtn emoji="😊" label="Nhớ được"   color="#0284c7" quality={4} onClick={() => handleReview(4)} disabled={isReviewing}/>
                                                <ReviewBtn emoji="🎯" label="Thuộc lòng" color="#16a34a" quality={5} onClick={() => handleReview(5)} disabled={isReviewing}/>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── CHAT TAB ───────────────────────────────── */}
                            {activeTab === 'chat' && (
                                <div className="d-flex flex-column flex-grow-1" style={{ minHeight: 400 }}>
                                    <div ref={chatBoxRef} className="flex-grow-1 p-3 overflow-auto" style={{ maxHeight: 420 }}>
                                        {chatHistory.map((m, i) => (
                                            <div key={i} className={`d-flex mb-3 gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                <div className="flex-shrink-0 rounded-circle d-flex align-items-center justify-content-center"
                                                     style={{ width: 30, height: 30, minWidth: 30, background: m.role === 'ai' ? '#eff6ff' : '#f1f5f9' }}>
                                                    {m.role === 'ai' ? <Bot size={15} color="#1d4ed8"/> : <User size={15} color="#64748b"/>}
                                                </div>
                                                <div className="p-3 rounded-4 shadow-sm"
                                                     style={{
                                                         maxWidth: '78%', fontSize: '0.87rem', lineHeight: 1.6,
                                                         background: m.role === 'user' ? '#1d4ed8' : '#ffffff',
                                                         color: m.role === 'user' ? '#fff' : '#1e293b',
                                                         border: m.role === 'ai' ? '1px solid #e2e8f0' : 'none',
                                                     }}>
                                                    {m.text}
                                                </div>
                                            </div>
                                        ))}
                                        {isChatting && (
                                            <div className="d-flex mb-3 gap-2 animation-fade-in">
                                                <div style={{ width: 30, height: 30, minWidth: 30, background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Bot size={15} color="#1d4ed8"/>
                                                </div>
                                                <div className="p-3 rounded-4 bg-white border shadow-sm d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                                                    <div className="spinner-grow spinner-grow-sm text-primary" style={{ width: 10, height: 10 }}/>
                                                    <span className="text-muted">AI đang suy nghĩ...</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 bg-white border-top">
                                        <div className="input-group overflow-hidden border rounded-pill shadow-sm">
                                            <input type="text" className="form-control border-0 shadow-none px-3 bg-light"
                                                   style={{ fontSize: '0.87rem' }}
                                                   placeholder="Hỏi AI về nội dung tài liệu..."
                                                   value={chatMsg}
                                                   onChange={e => setChatMsg(e.target.value)}
                                                   onKeyDown={e => e.key === 'Enter' && handleSendMsg()}
                                                   disabled={isChatting}/>
                                            <button className="btn btn-primary fw-bold px-4 d-flex align-items-center gap-2"
                                                    onClick={handleSendMsg}
                                                    disabled={isChatting || !chatMsg.trim()}>
                                                <Send size={15}/>Gửi
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── LIST TAB ───────────────────────────────── */}
                            {activeTab === 'list' && (
                                <div className="p-3 flex-grow-1 overflow-auto bg-light" style={{ maxHeight: 520 }}>
                                    {loadingCards ? (
                                        <div className="text-center py-5"><div className="spinner-border text-primary"/></div>
                                    ) : flashcards.length === 0 ? (
                                        <div className="text-center py-5 text-muted small">Chưa có thẻ nhớ.</div>
                                    ) : (
                                        <div className="row g-3">
                                            {flashcards.map((c, i) => (
                                                <div key={c.flashcardId} className="col-12 col-md-6">
                                                    <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                                                        <div className="card-body p-3 d-flex flex-column gap-2">
                                                            <div className="d-flex align-items-center gap-1 flex-wrap">
                                                                <span className="badge bg-light text-muted border rounded-pill" style={{ fontSize: '0.68rem' }}>#{i + 1}</span>
                                                                <BloomBadge level={(c as any).bloomLevel}/>
                                                                <DiffBadge level={c.difficulty}/>
                                                            </div>
                                                            <p className="fw-bold text-dark mb-1 lh-base" style={{ fontSize: '0.87rem' }}>{c.frontText}</p>
                                                            <hr className="my-1 opacity-10"/>
                                                            <p className="text-muted small mb-0 fst-italic lh-base">{c.backText}</p>
                                                            {c.sourceReference && <span className="text-muted" style={{ fontSize: '0.7rem' }}>📄 {c.sourceReference}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .animation-fade-in { animation: aiFadeIn 0.25s ease-out; }
                @keyframes aiFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default AIStudyHub;