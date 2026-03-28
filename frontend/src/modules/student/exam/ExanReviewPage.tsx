import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, BarChart2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { studyHubApi } from '../../../services/studyHubApi';


interface ReviewAnswer {
    answerId: string;
    answerText: string;
    answerLabel: string;
    isCorrect: boolean;
    isSelected: boolean;
}

interface ReviewQuestion {
    questionId: string;
    questionText: string;
    difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD';
    answers: ReviewAnswer[];
}

interface ReviewData {
    examRoomName: string;
    score: number;
    totalQuestions: number;
    creationMode: 'BANK' | 'PDF';
    durationMinutes: number;
    startTime: string;
    endTime: string;
    // BANK mode
    questions?: ReviewQuestion[];
    // PDF mode
    pdfUrl?: string;
    answerKey?: string;       // "1A,2B,3C,..."
    studentAnswers?: Record<string, string>;  // { "1": "A", "2": "C", ... }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const diffBadge = (level: string) => {
    if (level === 'EASY')   return <span className="badge rounded-pill px-2 py-1" style={{background:'#dcfce7',color:'#16a34a',fontSize:'0.7rem'}}>Dễ</span>;
    if (level === 'HARD')   return <span className="badge rounded-pill px-2 py-1" style={{background:'#fee2e2',color:'#dc2626',fontSize:'0.7rem'}}>Khó</span>;
    return                         <span className="badge rounded-pill px-2 py-1" style={{background:'#fef3c7',color:'#d97706',fontSize:'0.7rem'}}>Trung bình</span>;
};

// Parse "1A,2B,3C" → { "1": "A", "2": "B", "3": "C" }
const parseAnswerKey = (key: string): Record<string, string> => {
    const map: Record<string, string> = {};
    if (!key) return map;
    key.split(',').forEach(part => {
        const match = part.trim().match(/^(\d+)([A-Da-d])$/);
        if (match) map[match[1]] = match[2].toUpperCase();
    });
    return map;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ExamReviewPage: React.FC = () => {
    const { attemptId } = useParams<{ attemptId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState<string | null>(null);
    const [data, setData]           = useState<ReviewData | null>(null);
    const [activeFilter, setActiveFilter] = useState<'all' | 'correct' | 'wrong'>('all');

    useEffect(() => {
        if (!attemptId) return;
        studyHubApi.getAttemptReview(attemptId)
            .then(res => { setData(res.data); setLoading(false); })
            .catch(err => {
                setError(err.response?.data?.error || 'Không thể tải bài làm. Vui lòng thử lại.');
                setLoading(false);
            });
    }, [attemptId]);

    // ── Loading ────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{height:'80vh'}}>
            <div className="spinner-border text-primary" style={{width:'3rem',height:'3rem'}}/>
        </div>
    );

    // ── Lỗi (403 = chưa đủ điều kiện xem) ────────────────────────────────────
    if (error) return (
        <div className="container py-5" style={{maxWidth:600}}>
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                <AlertTriangle size={56} className="text-warning mx-auto mb-3"/>
                <h4 className="fw-bold mb-2">Không thể xem đáp án</h4>
                <p className="text-muted mb-4">{error}</p>
                <button className="btn btn-primary rounded-pill px-5 fw-bold" onClick={() => navigate(-1)}>
                    Quay lại
                </button>
            </div>
        </div>
    );

    if (!data) return null;

    // ── Tính thống kê (chỉ BANK mode) ─────────────────────────────────────────
    const bankStats = data.questions ? (() => {
        let correct = 0, wrong = 0, unanswered = 0;
        data.questions!.forEach(q => {
            const sel = q.answers.find(a => a.isSelected);
            if (!sel) { unanswered++; return; }
            if (sel.isCorrect) correct++; else wrong++;
        });
        return { correct, wrong, unanswered };
    })() : null;

    // ── Tính thống kê PDF mode ─────────────────────────────────────────────────
    const pdfStats = (data.creationMode === 'PDF' && data.answerKey && data.studentAnswers) ? (() => {
        const keyMap = parseAnswerKey(data.answerKey);
        let correct = 0, wrong = 0, unanswered = 0;
        const total = data.totalQuestions || Object.keys(keyMap).length;
        for (let i = 1; i <= total; i++) {
            const k = i.toString();
            if (!data.studentAnswers![k]) { unanswered++; continue; }
            if (data.studentAnswers![k] === keyMap[k]) correct++; else wrong++;
        }
        return { correct, wrong, unanswered };
    })() : null;

    // ── Lọc câu hỏi (BANK) ────────────────────────────────────────────────────
    const filteredQuestions = data.questions?.filter(q => {
        if (activeFilter === 'all') return true;
        const sel = q.answers.find(a => a.isSelected);
        if (activeFilter === 'correct') return sel?.isCorrect === true;
        return !sel || sel.isCorrect === false; // wrong hoặc bỏ trống
    });

    const timeTaken = data.startTime && data.endTime
        ? Math.round((new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 60000)
        : null;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="bg-light min-vh-100 pb-5">

            {/* Header */}
            <div className="bg-white border-bottom shadow-sm sticky-top" style={{zIndex:100}}>
                <div className="container py-3 d-flex align-items-center gap-3" style={{maxWidth:860}}>
                    <button className="btn btn-light border rounded-circle p-2" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20}/>
                    </button>
                    <div className="flex-grow-1 min-vw-0">
                        <h5 className="fw-bold mb-0 text-truncate">{data.examRoomName}</h5>
                        <small className="text-muted">Xem lại bài làm & Đáp án</small>
                    </div>
                    {/* Điểm nổi bật */}
                    <div className="text-center px-4 py-2 rounded-3" style={{background:'#eff6ff',minWidth:80}}>
                        <div className="fw-bold text-primary" style={{fontSize:'1.5rem',lineHeight:1}}>
                            {data.score ?? '--'}
                        </div>
                        <small className="text-muted">điểm</small>
                    </div>
                </div>
            </div>

            <div className="container pt-4" style={{maxWidth:860}}>

                {/* Stat cards */}
                <div className="row g-3 mb-4">
                    {(bankStats || pdfStats) && (() => {
                        const s = bankStats || pdfStats!;
                        return (
                            <>
                                <div className="col-6 col-md-3">
                                    <div className="card border-0 shadow-sm rounded-4 p-3 text-center h-100">
                                        <div className="fw-bold text-success fs-4">{s.correct}</div>
                                        <small className="text-muted">Câu đúng</small>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="card border-0 shadow-sm rounded-4 p-3 text-center h-100">
                                        <div className="fw-bold text-danger fs-4">{s.wrong}</div>
                                        <small className="text-muted">Câu sai</small>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="card border-0 shadow-sm rounded-4 p-3 text-center h-100">
                                        <div className="fw-bold text-secondary fs-4">{s.unanswered}</div>
                                        <small className="text-muted">Bỏ trống</small>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="card border-0 shadow-sm rounded-4 p-3 text-center h-100">
                                        <div className="fw-bold text-primary fs-4 d-flex align-items-center justify-content-center gap-1">
                                            <Clock size={16}/>{timeTaken ?? '--'}
                                        </div>
                                        <small className="text-muted">Phút làm bài</small>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* ── BANK MODE: danh sách câu hỏi ── */}
                {data.creationMode === 'BANK' && filteredQuestions && (
                    <>
                        {/* Filter tabs */}
                        <div className="d-flex gap-2 mb-4 flex-wrap">
                            {(['all','correct','wrong'] as const).map(f => (
                                <button key={f}
                                    onClick={() => setActiveFilter(f)}
                                    className={`btn btn-sm rounded-pill px-4 fw-bold border-0 ${activeFilter === f ? 'btn-primary' : 'btn-light text-muted'}`}
                                    style={{fontSize:'0.82rem'}}>
                                    {f === 'all' ? `Tất cả (${data.questions!.length})`
                                     : f === 'correct' ? `✅ Đúng (${bankStats!.correct})`
                                     : `❌ Sai / Bỏ trống (${bankStats!.wrong + bankStats!.unanswered})`}
                                </button>
                            ))}
                        </div>

                        {/* Questions */}
                        <div className="d-flex flex-column gap-3">
                            {filteredQuestions.map((q, idx) => {
                                const selectedAns = q.answers.find(a => a.isSelected);
                                const correctAns  = q.answers.find(a => a.isCorrect);
                                const isCorrect   = selectedAns?.isCorrect === true;
                                const isSkipped   = !selectedAns;

                                return (
                                    <div key={q.questionId}
                                         className="card border-0 shadow-sm rounded-4 overflow-hidden">
                                        {/* Stripe màu trái */}
                                        <div style={{
                                            borderLeft: `4px solid ${isSkipped ? '#94a3b8' : isCorrect ? '#16a34a' : '#dc2626'}`
                                        }}>
                                            <div className="card-body p-4">
                                                {/* Question header */}
                                                <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                                                    <span className="badge bg-light text-muted border rounded-pill"
                                                          style={{fontSize:'0.72rem'}}>
                                                        Câu {idx + 1}
                                                    </span>
                                                    {diffBadge(q.difficultyLevel)}
                                                    {isSkipped ? (
                                                        <span className="badge rounded-pill ms-auto"
                                                              style={{background:'#f1f5f9',color:'#64748b',fontSize:'0.72rem'}}>
                                                            Bỏ trống
                                                        </span>
                                                    ) : isCorrect ? (
                                                        <span className="badge rounded-pill ms-auto d-flex align-items-center gap-1"
                                                              style={{background:'#dcfce7',color:'#16a34a',fontSize:'0.72rem'}}>
                                                            <CheckCircle size={10}/>Đúng
                                                        </span>
                                                    ) : (
                                                        <span className="badge rounded-pill ms-auto d-flex align-items-center gap-1"
                                                              style={{background:'#fee2e2',color:'#dc2626',fontSize:'0.72rem'}}>
                                                            <XCircle size={10}/>Sai
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Question text */}
                                                <p className="fw-bold text-dark mb-3 lh-base"
                                                   style={{fontSize:'0.95rem'}}>
                                                    {q.questionText}
                                                </p>

                                                {/* Answers */}
                                                <div className="d-flex flex-column gap-2">
                                                    {q.answers.map(ans => {
                                                        let bg = 'transparent', border = '#e2e8f0', color = '#374151';
                                                        let icon = null;

                                                        if (ans.isCorrect && ans.isSelected) {
                                                            // Chọn đúng
                                                            bg = '#dcfce7'; border = '#86efac'; color = '#15803d';
                                                            icon = <CheckCircle size={15} color="#16a34a"/>;
                                                        } else if (ans.isCorrect && !ans.isSelected) {
                                                            // Đáp án đúng nhưng SV không chọn
                                                            bg = '#f0fdf4'; border = '#86efac'; color = '#15803d';
                                                            icon = <CheckCircle size={15} color="#16a34a"/>;
                                                        } else if (!ans.isCorrect && ans.isSelected) {
                                                            // SV chọn sai
                                                            bg = '#fee2e2'; border = '#fca5a5'; color = '#b91c1c';
                                                            icon = <XCircle size={15} color="#dc2626"/>;
                                                        }

                                                        return (
                                                            <div key={ans.answerId}
                                                                 className="d-flex align-items-center gap-2 px-3 py-2 rounded-3"
                                                                 style={{
                                                                     background: bg,
                                                                     border: `1.5px solid ${border}`,
                                                                     fontSize: '0.875rem',
                                                                     color,
                                                                 }}>
                                                                <span className="fw-bold flex-shrink-0"
                                                                      style={{minWidth:20}}>
                                                                    {ans.answerLabel}.
                                                                </span>
                                                                <span className="flex-grow-1">{ans.answerText}</span>
                                                                {icon && <span className="flex-shrink-0">{icon}</span>}
                                                                {ans.isSelected && !ans.isCorrect && (
                                                                    <span className="badge ms-1"
                                                                          style={{background:'#fee2e2',color:'#dc2626',
                                                                                  fontSize:'0.65rem',flexShrink:0}}>
                                                                        Bạn chọn
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Gợi ý nếu làm sai */}
                                                {!isCorrect && !isSkipped && correctAns && (
                                                    <div className="mt-3 p-2 rounded-3 d-flex align-items-start gap-2"
                                                         style={{background:'#eff6ff',fontSize:'0.8rem',color:'#1e40af'}}>
                                                        <BarChart2 size={14} className="flex-shrink-0 mt-1"/>
                                                        <span>
                                                            <b>Đáp án đúng:</b> {correctAns.answerLabel}. {correctAns.answerText}
                                                        </span>
                                                    </div>
                                                )}
                                                {isSkipped && correctAns && (
                                                    <div className="mt-3 p-2 rounded-3 d-flex align-items-start gap-2"
                                                         style={{background:'#f8fafc',fontSize:'0.8rem',color:'#64748b'}}>
                                                        <BarChart2 size={14} className="flex-shrink-0 mt-1"/>
                                                        <span>
                                                            <b>Đáp án đúng:</b> {correctAns.answerLabel}. {correctAns.answerText}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* ── PDF MODE: bảng so sánh đáp án ── */}
                {data.creationMode === 'PDF' && data.answerKey && (
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className="card-header bg-white border-bottom py-3 px-4">
                            <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                                <FileText size={18} className="text-primary"/>
                                Bảng so sánh đáp án
                            </h6>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr style={{fontSize:'0.78rem'}}>
                                            <th className="ps-4">Câu</th>
                                            <th className="text-center">Bạn chọn</th>
                                            <th className="text-center">Đáp án đúng</th>
                                            <th className="text-center">Kết quả</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const keyMap = parseAnswerKey(data.answerKey!);
                                            const total  = data.totalQuestions || Object.keys(keyMap).length;
                                            return Array.from({length: total}, (_, i) => {
                                                const num      = (i + 1).toString();
                                                const student  = data.studentAnswers?.[num]?.toUpperCase() || '--';
                                                const correct  = keyMap[num] || '--';
                                                const isRight  = student === correct && student !== '--';
                                                return (
                                                    <tr key={num}>
                                                        <td className="ps-4 fw-bold text-muted"
                                                            style={{fontSize:'0.82rem'}}>
                                                            {num}
                                                        </td>
                                                        <td className="text-center fw-bold"
                                                            style={{color: student === '--' ? '#94a3b8' : isRight ? '#16a34a' : '#dc2626'}}>
                                                            {student}
                                                        </td>
                                                        <td className="text-center fw-bold text-success">
                                                            {correct}
                                                        </td>
                                                        <td className="text-center">
                                                            {student === '--'
                                                                ? <span style={{fontSize:'0.75rem',color:'#94a3b8'}}>Bỏ trống</span>
                                                                : isRight
                                                                    ? <CheckCircle size={16} color="#16a34a"/>
                                                                    : <XCircle size={16} color="#dc2626"/>
                                                            }
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Back button bottom */}
                <div className="text-center mt-5">
                    <button className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm"
                            onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} className="me-2"/>Quay lại lớp học
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExamReviewPage;