import React, { useState, useEffect } from 'react';
import { studyHubApi } from '../../services/studyHubApi';
import { Target, FileText, Clock, CheckCircle, XCircle, Play, RotateCcw, Bot, BookMarked, Layers, FileSignature, Save, List, ExternalLink } from 'lucide-react';

interface PracticeZoneTabProps {
    subjectId?: string; 
}

const PracticeZoneTab: React.FC<PracticeZoneTabProps> = ({ subjectId }) => {
    // --- States Setup ---
    const [documents, setDocuments] = useState<any[]>([]);
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
    const [examMode, setExamMode] = useState<'single' | 'multiple'>('single');
    const [matrix, setMatrix] = useState({ easy: 3, medium: 2, hard: 0 });
    
    // --- States Quản lý Đề thi đã lưu ---
    const [savedQuizzes, setSavedQuizzes] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'create' | 'history'>('create');

    // --- States Chạy Quiz ---
    const [quizData, setQuizData] = useState<any[]>([]);
    const [step, setStep] = useState<'setup' | 'loading' | 'playing' | 'result'>('setup');
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [score, setScore] = useState(0);

    // Load dữ liệu và Đề đã lưu
    useEffect(() => {
        if (subjectId) {
            studyHubApi.getDocuments(subjectId).then(res => {
                const completedDocs = (res.data?.documents || []).filter((d: any) => d.processingStatus === 'COMPLETED');
                setDocuments(completedDocs);
                if(completedDocs.length > 0) setSelectedDocIds([completedDocs[0].studentDocId]);
            }).catch(err => console.error(err));
        }
        // Load lịch sử từ LocalStorage
        const history = JSON.parse(localStorage.getItem('savedQuizzes') || '[]');
        setSavedQuizzes(history);
    }, [subjectId]);

    useEffect(() => {
        if (step === 'playing' && timeLeft > 0) {
            const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timerId);
        } else if (step === 'playing' && timeLeft === 0) {
            handleSubmitQuiz();
        }
    }, [timeLeft, step]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleSelectDoc = (id: string) => {
        if (examMode === 'single') setSelectedDocIds([id]);
        else setSelectedDocIds(prev => prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]);
    };

    // TẠO ĐỀ MỚI
    const handleGenerateQuiz = async () => {
        const total = matrix.easy + matrix.medium + matrix.hard;
        if (selectedDocIds.length === 0) return alert("Vui lòng chọn ít nhất 1 tài liệu!");
        if (total === 0) return alert("Tổng số câu hỏi phải lớn hơn 0!");
        if (total > 20) return alert("Vui lòng tạo tối đa 20 câu một lần để tránh lỗi AI.");

        setStep('loading');
        try {
            const res = await studyHubApi.generateQuizMatrix(selectedDocIds, matrix);
            if (res.data && res.data.length > 0) {
                setQuizData(res.data);
                setUserAnswers({});
                setCurrentQuestionIdx(0);
                setTimeLeft(total * 60); 
                setStep('playing');
            } else throw new Error("Không có dữ liệu");
        } catch (error) {
            alert("AI đang bận hoặc số lượng câu quá lớn, vui lòng thử lại với số câu ít hơn!");
            setStep('setup');
        }
    };

    // THI LẠI ĐỀ CŨ
    const handleRetakeQuiz = (quiz: any) => {
        setQuizData(quiz.data);
        setSelectedDocIds(quiz.docs); // Để lúc giải thích lấy được link PDF
        setUserAnswers({});
        setCurrentQuestionIdx(0);
        setTimeLeft(quiz.data.length * 60);
        setStep('playing');
    };

    // LƯU ĐỀ VÀO LOCALSTORAGE
    const handleSaveQuiz = () => {
        const newQuiz = {
            id: Date.now(),
            date: new Date().toLocaleDateString('vi-VN'),
            docs: selectedDocIds,
            data: quizData,
            total: quizData.length
        };
        const updatedQuizzes = [newQuiz, ...savedQuizzes];
        setSavedQuizzes(updatedQuizzes);
        localStorage.setItem('savedQuizzes', JSON.stringify(updatedQuizzes));
        alert("Đã lưu đề thi thành công! Bạn có thể xem lại ở tab Đề đã lưu.");
    };

    const handleSelectOption = (qIndex: number, optionIndex: number) => {
        setUserAnswers({ ...userAnswers, [qIndex]: optionIndex });
    };

    const handleSubmitQuiz = () => {
        let currentScore = 0;
        quizData.forEach((q, index) => {
            if (userAnswers[index] === q.correctAnswer) currentScore += 1;
        });
        setScore(currentScore);
        setStep('result');
    };

    // Lấy URL của PDF
    const getDocumentUrls = () => {
        return documents.filter(doc => selectedDocIds.includes(doc.studentDocId) && doc.fileUrl);
    };

    // ==========================================
    // 0. GIAO DIỆN CHƯA CHỌN MÔN
    // ==========================================
    if (!subjectId) {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'white', borderRadius: '24px', border: '1px solid #e5e7eb', margin: '20px' }}>
                <div style={{ width: '80px', height: '80px', background: '#f5f3ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <BookMarked size={40} color="#6366f1" />
                </div>
                <h3 style={{ fontWeight: 900, color: '#1e293b', marginBottom: '12px' }}>Chưa chọn môn học</h3>
                <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 32px' }}>Vui lòng chọn một môn học ở thanh công cụ phía trên để thiết lập đề thi luyện tập.</p>
            </div>
        );
    }

    // ==========================================
    // 1. GIAO DIỆN SETUP (Có 2 Tab: Tạo mới & Lịch sử)
    // ==========================================
    if (step === 'setup') return (
        <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 animation-fade-in">
            <div className="text-center mb-4">
                <Target size={50} className="text-primary mb-3 mx-auto opacity-75" />
                <h3 className="fw-bold">Thiết Lập Đấu Trường AI</h3>
            </div>
            
            <ul className="nav nav-pills justify-content-center mb-5 bg-light p-1 rounded-pill mx-auto" style={{ width: 'fit-content' }}>
                <li className="nav-item">
                    <button className={`nav-link rounded-pill fw-bold px-4 ${viewMode === 'create' ? 'active shadow-sm' : 'text-muted'}`} onClick={() => setViewMode('create')}>Tạo Đề Mới</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link rounded-pill fw-bold px-4 ${viewMode === 'history' ? 'active shadow-sm' : 'text-muted'}`} onClick={() => setViewMode('history')}>Đề Đã Lưu ({savedQuizzes.length})</button>
                </li>
            </ul>

            {viewMode === 'create' ? (
                <div className="row g-5">
                    {/* (Giữ nguyên form Setup cũ ở đây) */}
                    <div className="col-md-6 d-flex flex-column">
                        <h6 className="fw-bold text-dark mb-3 d-flex align-items-center"><Layers size={18} className="me-2 text-primary"/> Nguồn Tài Liệu</h6>
                        <div className="btn-group w-100 mb-3 shadow-sm" role="group">
                            <input type="radio" className="btn-check" id="modeSingle" checked={examMode === 'single'} onChange={() => {setExamMode('single'); setSelectedDocIds(documents.length>0?[documents[0].studentDocId]:[]);}} />
                            <label className="btn btn-outline-primary fw-bold py-2" htmlFor="modeSingle"><FileSignature size={16} className="me-2 mb-1 d-inline"/> Thi 1 Bài Giảng</label>
                            <input type="radio" className="btn-check" id="modeMulti" checked={examMode === 'multiple'} onChange={() => setExamMode('multiple')} />
                            <label className="btn btn-outline-primary fw-bold py-2" htmlFor="modeMulti"><Layers size={16} className="me-2 mb-1 d-inline"/> Thi Tổng Hợp</label>
                        </div>
                        <div className="card border rounded-3 overflow-auto flex-grow-1" style={{ maxHeight: '250px', minHeight: '200px' }}>
                            <div className="list-group list-group-flush">
                                {documents.length === 0 ? <div className="p-4 text-center text-muted small mt-4">Chưa có tài liệu sẵn sàng.</div> : documents.map(doc => {
                                    const isSelected = selectedDocIds.includes(doc.studentDocId);
                                    return (
                                        <label key={doc.studentDocId} className={`list-group-item list-group-item-action d-flex align-items-center p-3 cursor-pointer ${isSelected ? 'bg-primary bg-opacity-10' : ''}`}>
                                            <input className="form-check-input me-3 border-secondary" type={examMode === 'single' ? "radio" : "checkbox"} checked={isSelected} onChange={() => handleSelectDoc(doc.studentDocId)}/>
                                            <span className={`fw-bold text-truncate ${isSelected ? 'text-primary' : 'text-dark'}`} style={{ fontSize: '0.9rem' }}>{doc.documentTitle}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 d-flex flex-column">
                        <h6 className="fw-bold text-dark mb-3 d-flex align-items-center"><Target size={18} className="me-2 text-primary"/> Ma Trận Câu Hỏi</h6>
                        <div className="row g-3 mb-4">
                            <div className="col-4"><label className="form-label small fw-bold text-success">Dễ</label><input type="number" min="0" max="10" className="form-control form-control-lg bg-success bg-opacity-10 border-success text-center fw-bold" value={matrix.easy} onChange={e => setMatrix({...matrix, easy: Number(e.target.value) || 0})} /></div>
                            <div className="col-4"><label className="form-label small fw-bold text-warning">Trung Bình</label><input type="number" min="0" max="10" className="form-control form-control-lg bg-warning bg-opacity-10 border-warning text-center fw-bold" value={matrix.medium} onChange={e => setMatrix({...matrix, medium: Number(e.target.value) || 0})} /></div>
                            <div className="col-4"><label className="form-label small fw-bold text-danger">Khó</label><input type="number" min="0" max="10" className="form-control form-control-lg bg-danger bg-opacity-10 border-danger text-center fw-bold" value={matrix.hard} onChange={e => setMatrix({...matrix, hard: Number(e.target.value) || 0})} /></div>
                        </div>
                        <button className="btn btn-primary btn-lg rounded-pill w-100 fw-bold shadow mt-auto d-flex justify-content-center align-items-center" onClick={handleGenerateQuiz} disabled={selectedDocIds.length === 0 || (matrix.easy + matrix.medium + matrix.hard) === 0}><Play size={20} className="me-2" /> BẮT ĐẦU LÀM BÀI</button>
                    </div>
                </div>
            ) : (
                <div className="row justify-content-center">
                    <div className="col-md-8">
                        {savedQuizzes.length === 0 ? (
                            <div className="text-center p-5 border rounded-4 bg-light text-muted">Chưa có đề thi nào được lưu.</div>
                        ) : (
                            <div className="list-group shadow-sm">
                                {savedQuizzes.map(quiz => (
                                    <div key={quiz.id} className="list-group-item p-4 d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="fw-bold mb-1">Đề thi tự luyện - {quiz.total} câu</h6>
                                            <small className="text-muted d-flex align-items-center"><Clock size={14} className="me-1"/> Đã tạo ngày: {quiz.date}</small>
                                        </div>
                                        <button className="btn btn-outline-primary rounded-pill fw-bold" onClick={() => handleRetakeQuiz(quiz)}><RotateCcw size={16} className="me-1 mb-1 d-inline"/> Thi Lại</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    // ==========================================
    // 2. GIAO DIỆN LOADING
    // ==========================================
    if (step === 'loading') return (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center py-5" style={{ minHeight: '400px' }}>
            <div className="my-auto"><div className="spinner-border text-primary border-3 mb-4" style={{ width: '3rem', height: '3rem' }}></div><h4 className="fw-bold text-primary mb-2">AI đang nhào nặn đề thi...</h4></div>
        </div>
    );

    const currentQ = quizData[currentQuestionIdx];

    // ==========================================
    // 3. GIAO DIỆN PLAYING (Thêm Bảng Điều Hướng)
    // ==========================================
    if (step === 'playing') return (
        <div className="row animation-fade-in g-4">
            {/* Vùng thi chính */}
            <div className="col-lg-9">
                <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded-4 shadow-sm border">
                    <div className="fw-bold text-muted">Câu <span className="text-primary fs-5">{currentQuestionIdx + 1}</span> / {quizData.length}</div>
                    <div className={`fw-bold fs-4 d-flex align-items-center ${timeLeft < 60 ? 'text-danger' : 'text-success'}`}><Clock size={24} className="me-2" /> {formatTime(timeLeft)}</div>
                    <button className="btn btn-success fw-bold rounded-pill px-4 shadow-sm" onClick={handleSubmitQuiz}>Nộp Bài</button>
                </div>

                <div className="card border-0 shadow-sm rounded-4 mb-4">
                    <div className="card-body p-4 p-md-5">
                        <div className="mb-3"><span className={`badge ${currentQ.difficulty?.toLowerCase().includes('khó') ? 'bg-danger' : 'bg-success'}`}>{currentQ.difficulty || 'Mặc định'}</span></div>
                        <h4 className="fw-bold lh-base mb-5">{currentQ.question}</h4>
                        <div className="d-flex flex-column gap-3">
                            {currentQ.options.map((opt: string, idx: number) => (
                                <button key={idx} onClick={() => handleSelectOption(currentQuestionIdx, idx)} className={`text-start btn btn-lg p-3 rounded-3 border-2 transition-all ${userAnswers[currentQuestionIdx] === idx ? 'btn-primary border-primary fw-bold shadow-sm' : 'btn-light border-light text-dark hover-border-primary'}`}>{opt}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-between">
                    <button className="btn btn-outline-secondary px-5 rounded-pill fw-bold" disabled={currentQuestionIdx === 0} onClick={() => setCurrentQuestionIdx(prev => prev - 1)}>&larr; Câu trước</button>
                    <button className="btn btn-primary px-5 rounded-pill fw-bold" onClick={() => { if (currentQuestionIdx < quizData.length - 1) setCurrentQuestionIdx(prev => prev + 1); else handleSubmitQuiz(); }}>{currentQuestionIdx < quizData.length - 1 ? 'Câu tiếp theo →' : 'Hoàn thành'}</button>
                </div>
            </div>

            {/* Bảng điều hướng câu hỏi (Palette) */}
            <div className="col-lg-3">
                <div className="card border-0 shadow-sm rounded-4 sticky-top" style={{ top: '20px' }}>
                    <div className="card-header bg-white border-bottom pt-4 pb-3 px-4"><h6 className="fw-bold text-dark mb-0"><List size={18} className="me-2 text-primary d-inline mb-1"/> Danh sách câu hỏi</h6></div>
                    <div className="card-body p-4">
                        <div className="d-flex flex-wrap gap-2">
                            {quizData.map((_, idx) => {
                                const isAnswered = userAnswers[idx] !== undefined;
                                const isActive = currentQuestionIdx === idx;
                                return (
                                    <button 
                                        key={idx} 
                                        onClick={() => setCurrentQuestionIdx(idx)}
                                        className={`btn fw-bold p-0 d-flex align-items-center justify-content-center transition-all ${isActive ? 'btn-primary shadow-sm border-primary' : isAnswered ? 'btn-success text-white border-success opacity-75' : 'btn-outline-secondary'}`}
                                        style={{ width: '42px', height: '42px', borderRadius: '12px' }}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <hr className="my-4"/>
                        <div className="small text-muted d-flex flex-column gap-2">
                            <div className="d-flex align-items-center"><div className="bg-primary rounded me-2" style={{width: '15px', height:'15px'}}></div> Đang xem</div>
                            <div className="d-flex align-items-center"><div className="bg-success rounded me-2 opacity-75" style={{width: '15px', height:'15px'}}></div> Đã trả lời</div>
                            <div className="d-flex align-items-center"><div className="border border-secondary rounded me-2" style={{width: '15px', height:'15px'}}></div> Chưa trả lời</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // ==========================================
    // 4. GIAO DIỆN RESULT (Thêm nút Lưu đề & Link PDF)
    // ==========================================
    if (step === 'result') return (
        <div className="animation-fade-in">
            <div className="card border-0 shadow rounded-4 mb-4 overflow-hidden">
                <div className="bg-primary bg-gradient p-5 text-center text-white">
                    <h1 className="display-1 fw-bold mb-0">{Math.round((score / quizData.length) * 10)}<span className="fs-3 text-white-50">/10</span></h1>
                    <p className="fs-5 mb-0 mt-2">Bạn trả lời đúng {score} trên tổng số {quizData.length} câu hỏi.</p>
                </div>
                <div className="p-3 bg-white d-flex justify-content-center gap-3">
                    <button className="btn btn-outline-primary fw-bold rounded-pill px-4" onClick={() => setStep('setup')}><RotateCcw size={18} className="me-2 mb-1 d-inline"/> Thi lại đề khác</button>
                    <button className="btn btn-success fw-bold rounded-pill px-4 shadow-sm" onClick={handleSaveQuiz}><Save size={18} className="me-2 mb-1 d-inline"/> Lưu đề thi này</button>
                </div>
            </div>

            <h5 className="fw-bold mb-3 d-flex align-items-center"><FileText className="me-2 text-primary" /> Chi tiết & Trỏ nguồn</h5>
            {quizData.map((q, idx) => {
                const isCorrect = userAnswers[idx] === q.correctAnswer;
                return (
                    <div key={idx} className={`card border-0 shadow-sm rounded-4 mb-4 border-start border-4 ${isCorrect ? 'border-success' : 'border-danger'}`}>
                        <div className="card-body p-4">
                            <h6 className="fw-bold mb-3">Câu {idx + 1}: {q.question}</h6>
                            <div className="row g-2 mb-3">
                                {q.options.map((opt: string, optIdx: number) => {
                                    let btnClass = "bg-light text-dark border-0";
                                    if (optIdx === q.correctAnswer) btnClass = "bg-success text-white fw-bold shadow-sm";
                                    else if (optIdx === userAnswers[idx]) btnClass = "bg-danger text-white fw-bold";
                                    return (
                                        <div key={optIdx} className="col-12"><div className={`p-2 rounded-3 px-3 d-flex justify-content-between align-items-center ${btnClass}`}><span>{opt}</span>{optIdx === q.correctAnswer && <CheckCircle size={18} />}{optIdx === userAnswers[idx] && optIdx !== q.correctAnswer && <XCircle size={18} />}</div></div>
                                    );
                                })}
                            </div>

                            {/* CHỖ NÀY CÓ THÊM NÚT MỞ PDF */}
                            <div className="bg-light p-3 rounded-3 text-secondary small border">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <span className="fw-bold text-dark"><Bot size={16} className="me-1 text-primary"/> Giải thích:</span>
                                </div>
                                <div className="mb-3" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{q.explanation}</div>
                                
                                <div className="d-flex align-items-center flex-wrap gap-2 pt-2 border-top">
                                    <span className="fw-bold text-dark d-flex align-items-center me-2"><BookMarked size={16} className="me-1 text-primary"/> Tài liệu tham khảo:</span>
                                    {getDocumentUrls().length > 0 ? getDocumentUrls().map(doc => (
                                        <a key={doc.studentDocId} href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-info rounded-pill fw-bold d-flex align-items-center">
                                            <ExternalLink size={14} className="me-1"/> Mở {doc.documentTitle}
                                        </a>
                                    )) : (
                                        <span className="text-muted fst-italic">{q.reference || 'Kiến thức tổng hợp'}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return null;
};

export default PracticeZoneTab;