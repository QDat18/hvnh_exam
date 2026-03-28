import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Send, CheckCircle, AlertTriangle, Eye, ArrowLeft, EyeOff, FileText, Maximize, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { studyHubApi } from '../../../services/studyHubApi';

const ExamTakingPage: React.FC = () => {
    const { attemptId } = useParams<{ attemptId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // ==========================================
    // 1. CÁC STATES QUẢN LÝ DỮ LIỆU
    // ==========================================
    const [loading, setLoading] = useState(true);
    const [examData, setExamData] = useState<any>(null);
    const [answers, setAnswers] = useState<{ [questionIndex: number]: string }>({});

    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [examResult, setExamResult] = useState<any>(null);

    // STATES CHỐNG GIAN LẬN
    const [hasStarted, setHasStarted] = useState(false);
    const [violations, setViolations] = useState(0);
    const [warningMsg, setWarningMsg] = useState<string | null>(null);
    const [showEarlySubmitModal, setShowEarlySubmitModal] = useState(false);

    // REFS
    const isWarningOpen = useRef(false);
    const ignoreCheatRef = useRef(false);
    const questionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

    // ==========================================
    // 2. HÀM TIỆN ÍCH & GỌI API
    // ==========================================
    const getFullFileUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `http://localhost:8080${url}`;
    };

    useEffect(() => {
        const fetchRealExamData = async () => {
            try {
                const res = await studyHubApi.getAttemptDetails(attemptId!);
                const data = res.data;

                // 🔥 ĐÃ FIX: Lọc sạch các phần tử null bị kẹt trong Database
                const validQuestions = data.questions ? data.questions.filter((q: any) => q !== null && q !== undefined) : [];

                setExamData({
                    name: data.examRoomName || "Bài thi trắc nghiệm",
                    duration: data.durationMinutes || 60,
                    pdfUrl: getFullFileUrl(data.pdfUrl),
                    totalQuestions: data.totalQuestions || validQuestions.length,
                    creationMode: data.creationMode,
                    questions: validQuestions // Đã loại bỏ rác
                });

                if (data.savedAnswers) {
                    setAnswers(data.savedAnswers);
                }

                if (data.isSubmitted) {
                    setExamResult({
                        score: data.score,
                        totalAnswered: data.savedAnswers ? Object.keys(data.savedAnswers).length : 0
                    });
                } else {
                    setTimeLeft(data.timeLeftSeconds || data.durationMinutes * 60);
                }

                setLoading(false);
            } catch (error) {
                console.error("Lỗi lấy dữ liệu đề thi:", error);
                alert("Không thể tải thông tin bài thi. Có thể phòng thi đã đóng hoặc lỗi mạng.");
                navigate(-1);
            }
        };

        if (attemptId) fetchRealExamData();
    }, [attemptId, navigate]);

    // ==========================================
    // 3. LOGIC CHỐNG GIAN LẬN & TOÀN MÀN HÌNH
    // ==========================================
    const enterFullScreen = async () => {
        const elem = document.documentElement as any;
        try {
            if (elem.requestFullscreen) await elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
            else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
            return true;
        } catch (error) {
            console.error("Lỗi bật Fullscreen:", error);
            alert("Trình duyệt không hỗ trợ toàn màn hình. Vui lòng thử trình duyệt khác.");
            return false;
        }
    };

    const handleStartClick = async () => {
        const success = await enterFullScreen();
        if (success) setHasStarted(true);
    };

    useEffect(() => {
        if (!hasStarted || loading || examResult || timeLeft <= 0) return;

        const handleViolation = (message: string) => {
            if (ignoreCheatRef.current || isWarningOpen.current) return;
            isWarningOpen.current = true;
            setViolations(prev => prev + 1);
            setWarningMsg(message);
        };

        const handleVisibilityChange = () => {
            if (document.hidden) handleViolation("Bạn đã chuyển sang Tab hoặc phần mềm khác!");
        };
        const handleWindowBlur = () => {
            handleViolation("Bạn đã click chuột ra khỏi khu vực làm bài!");
        };
        const handleFullScreenChange = () => {
            if (!document.fullscreenElement) handleViolation("Bạn đã thoát chế độ Toàn màn hình! Vui lòng bật lại để tiếp tục.");
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleWindowBlur);
        document.addEventListener("fullscreenchange", handleFullScreenChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleWindowBlur);
            document.removeEventListener("fullscreenchange", handleFullScreenChange);
        };
    }, [hasStarted, loading, examResult, timeLeft]);

    const dismissWarning = () => {
        setWarningMsg(null);
        if (!document.fullscreenElement) enterFullScreen();
        setTimeout(() => { isWarningOpen.current = false; }, 500);
    };

    // ==========================================
    // 4. LOGIC ĐẾM NGƯỢC THỜI GIAN
    // ==========================================
    useEffect(() => {
        if (!hasStarted || timeLeft <= 0 || isSubmitting || examResult) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [hasStarted, timeLeft, isSubmitting, examResult]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // ==========================================
    // 5. CHỌN ĐÁP ÁN & NỘP BÀI
    // ==========================================
    const handleSelectBubble = async (qIndex: number, optionOrAnswerId: string) => {
        if (examResult) return;

        setAnswers(prev => ({ ...prev, [qIndex]: optionOrAnswerId }));

        try {
            const isBank = examData?.creationMode === 'BANK';
            // Lấy id an toàn
            const targetQuestion = examData.questions?.[qIndex - 1];
            const questionId = (isBank && targetQuestion) ? targetQuestion.questionId : qIndex.toString();

            await studyHubApi.saveAnswerDraft(attemptId!, questionId, optionOrAnswerId);
        } catch (error) {
            console.error("Lỗi lưu nháp:", error);
        }
    };

    const handleSubmitExam = async (isAuto = false) => {
        if (!isAuto) {
            // Nếu còn thời gian → hiện modal cảnh báo thay vì window.confirm
            if (timeLeft > 0) {
                ignoreCheatRef.current = true;
                setShowEarlySubmitModal(true);
                return;
            }
        }

        ignoreCheatRef.current = true;
        setIsSubmitting(true);
        setShowEarlySubmitModal(false);
        try {
            const res = await studyHubApi.submitExam(attemptId!, { answers });
            setExamResult(res.data);
            if (document.fullscreenElement) document.exitFullscreen();
        } catch (error: any) {
            alert("Lỗi nộp bài: " + (error.response?.data?.error || "Vui lòng thử lại"));
            ignoreCheatRef.current = false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmEarlySubmit = async () => {
        setShowEarlySubmitModal(false);
        ignoreCheatRef.current = true;
        setIsSubmitting(true);
        try {
            const res = await studyHubApi.submitExam(attemptId!, { answers });
            setExamResult(res.data);
            if (document.fullscreenElement) document.exitFullscreen();
        } catch (error: any) {
            alert("Lỗi nộp bài: " + (error.response?.data?.error || "Vui lòng thử lại"));
            ignoreCheatRef.current = false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const cancelEarlySubmit = () => {
        setShowEarlySubmitModal(false);
        setTimeout(() => { ignoreCheatRef.current = false; }, 500);
    };

    const handleAutoSubmit = () => {
        ignoreCheatRef.current = true;
        alert("Đã hết thời gian làm bài! Hệ thống tự động nộp bài.");
        handleSubmitExam(true);
    };

    const scrollToQuestion = (qIndex: number) => {
        const element = questionRefs.current[qIndex];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('bg-warning', 'bg-opacity-25');
            setTimeout(() => element.classList.remove('bg-warning', 'bg-opacity-25'), 1000);
        }
    };

    // ==========================================
    // RENDER UI
    // ==========================================
    if (loading) return <div className="vh-100 d-flex justify-content-center align-items-center bg-light"><div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div></div>;

    if (!hasStarted && !examResult) {
        return (
            <div className="vh-100 bg-dark bg-opacity-10 d-flex align-items-center justify-content-center animation-fade-in">
                <div className="bg-white p-5 rounded-4 shadow-lg text-center" style={{ maxWidth: '600px', width: '90%' }}>
                    <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle d-inline-block mb-4"><Maximize size={48} /></div>
                    <h2 className="fw-bold mb-3">Sẵn sàng làm bài!</h2>
                    <p className="text-muted fs-5 mb-4">Bài thi <b>{examData?.name}</b> có thời gian <b>{examData?.duration} phút</b>.</p>
                    <div className="alert alert-warning text-start mb-4">
                        <h6 className="fw-bold"><AlertTriangle size={18} className="me-2" /> Nội quy phòng thi:</h6>
                        <ul className="mb-0 small">
                            <li>Bài thi yêu cầu chế độ Toàn màn hình (Full-screen).</li>
                            <li>Nghiêm cấm thoát Toàn màn hình hoặc chuyển sang Tab/Cửa sổ khác.</li>
                            <li>Hệ thống tự động nộp bài khi hết thời gian.</li>
                        </ul>
                    </div>
                    <button onClick={handleStartClick} className="btn btn-primary btn-lg w-100 rounded-pill fw-bold shadow-sm py-3 fs-5">BẮT ĐẦU LÀM BÀI</button>
                </div>
            </div>
        );
    }

    if (examResult) {
        // 🔥 LOGIC CHỐNG GIAN LẬN: Chỉ cho xem đáp án khi đã thi đủ số lượt & GV cho phép
        const maxAttempts = examData?.maxAttempts || 1;
        const attemptCount = examData?.attemptCount || 1;
        const showResult = examData?.showResult !== false;

        // Điều kiện mở khóa: Giảng viên bật showResult + Sinh viên đã thi hết lượt
        const canReview = showResult && (attemptCount >= maxAttempts);

        return (
            <div className="vh-100 bg-light d-flex align-items-center justify-content-center animation-fade-in">
                <div className="card border-0 shadow-lg rounded-4 p-5 text-center" style={{ maxWidth: '500px', width: '100%' }}>
                    <div className="mb-4"><CheckCircle size={80} className="text-success mx-auto mb-3" />
                        <h2 className="fw-bold text-dark">Nộp bài thành công!</h2>
                    </div>

                    {/* KIỂM TRA XEM GV CÓ CHO PHÉP XEM ĐIỂM KHÔNG */}
                    {showResult ? (
                        <div className="bg-light p-4 rounded-4 mb-4 border">
                            <h1 className="display-4 fw-bold text-primary mb-0">{examResult.score ?? 0} <span className="fs-5 text-muted">điểm</span></h1>
                            <p className="text-muted mt-2 mb-0">Đã trả lời: {examResult.totalAnswered || Object.keys(answers).length} / {examData?.totalQuestions}</p>
                            {violations > 0 && (
                                <div className="mt-3 text-danger fw-bold d-flex align-items-center justify-content-center gap-2">
                                    <AlertTriangle size={18} /> Hệ thống ghi nhận: {violations} lần vi phạm
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="alert alert-secondary mb-4 rounded-4 py-4 border-0 shadow-sm">
                            <EyeOff size={32} className="text-muted mb-2" />
                            <h5 className="fw-bold text-dark">Điểm số đã được bảo mật</h5>
                            <p className="text-muted mb-0 small">Giảng viên đã thiết lập ẩn điểm & đáp án cho bài thi này.</p>
                        </div>
                    )}

                    {/* 🔥 NÚT CHUYỂN SANG TRANG REVIEW HOẶC THÔNG BÁO KHÓA */}
                    {canReview ? (
                        <button className="btn btn-outline-primary btn-lg w-100 rounded-pill fw-bold shadow-sm mb-3"
                            onClick={() => navigate(`/student/exam-review/${attemptId}`)}>
                            <FileText size={20} className="me-2" /> Xem chi tiết đáp án
                        </button>
                    ) : (
                        <div className="alert alert-warning border-0 rounded-3 small fw-bold d-flex align-items-center justify-content-center gap-2 mb-3">
                            <AlertTriangle size={16} className="flex-shrink-0" />
                            {showResult ? `Bạn phải hoàn thành toàn bộ lượt thi (${attemptCount}/${maxAttempts}) mới được xem đáp án!` : "Bài thi không cho phép xem đáp án!"}
                        </div>
                    )}

                    <button className="btn btn-primary btn-lg w-100 rounded-pill fw-bold shadow-sm" onClick={() => navigate(-1)}>Quay lại lớp học</button>
                </div>
            </div>
        );
    }

    return (
        <div className="vh-100 d-flex flex-column bg-light overflow-hidden animation-fade-in position-relative">

            {/* MODAL CẢNH BÁO NỘP BÀI SỚM */}
            {showEarlySubmitModal && (
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center animation-fade-in"
                    style={{ zIndex: 9998, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
                    <div className="bg-white rounded-4 shadow-lg animation-zoom-in overflow-hidden" style={{ maxWidth: '480px', width: '90%' }}>
                        {/* Header vàng cảnh báo */}
                        <div className="p-4 d-flex align-items-center gap-3" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            <div className="bg-white bg-opacity-25 rounded-circle p-2 flex-shrink-0">
                                <AlertTriangle size={32} className="text-white" />
                            </div>
                            <div>
                                <h5 className="fw-bold text-white mb-0">Nộp bài sớm?</h5>
                                <small className="text-white opacity-75">Vẫn còn thời gian làm bài</small>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-4">
                            {/* Thời gian còn lại */}
                            <div className="d-flex align-items-center justify-content-center gap-3 p-3 rounded-3 mb-4"
                                style={{ background: '#fef3c7', border: '1px solid #fcd34d' }}>
                                <Clock size={24} className="text-warning" />
                                <div className="text-center">
                                    <div className="fw-bold text-dark" style={{ fontSize: '2rem', letterSpacing: '2px' }}>
                                        {formatTime(timeLeft)}
                                    </div>
                                    <small className="text-muted">thời gian còn lại</small>
                                </div>
                            </div>

                            {/* Tiến độ */}
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-1">
                                    <small className="text-muted fw-bold">Tiến độ làm bài</small>
                                    <small className="fw-bold text-primary">{Object.keys(answers).length}/{examData?.totalQuestions} câu</small>
                                </div>
                                <div className="progress rounded-pill" style={{ height: '8px' }}>
                                    <div className="progress-bar bg-primary rounded-pill"
                                        style={{ width: `${(Object.keys(answers).length / (examData?.totalQuestions || 1)) * 100}%` }}></div>
                                </div>
                                {Object.keys(answers).length < (examData?.totalQuestions || 0) && (
                                    <small className="text-danger mt-1 d-block">
                                        ⚠ Còn {(examData?.totalQuestions || 0) - Object.keys(answers).length} câu chưa trả lời
                                    </small>
                                )}
                            </div>

                            <p className="text-muted small mb-4 text-center">
                                Bạn chắc chắn muốn nộp bài? Sau khi nộp <strong>không thể thay đổi đáp án</strong>.
                            </p>

                            {/* Nút hành động */}
                            <div className="d-flex gap-3">
                                <button
                                    className="btn btn-light border fw-bold rounded-pill flex-grow-1 py-2"
                                    onClick={cancelEarlySubmit}
                                >
                                    ← Làm tiếp
                                </button>
                                <button
                                    className="btn fw-bold rounded-pill flex-grow-1 py-2 text-white"
                                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                                    onClick={confirmEarlySubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? <><span className="spinner-border spinner-border-sm me-2"></span>Đang nộp...</>
                                        : <><Send size={16} className="me-2" />Xác nhận nộp bài</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {warningMsg && (
                <div className="position-absolute top-0 start-0 w-100 h-100 bg-danger bg-opacity-90 d-flex align-items-center justify-content-center" style={{ zIndex: 9999, backdropFilter: 'blur(10px)' }}>
                    <div className="bg-white p-5 rounded-4 shadow-lg text-center animation-zoom-in" style={{ maxWidth: '500px' }}>
                        <AlertTriangle size={80} className="text-danger mx-auto mb-3 animate-pulse" />
                        <h2 className="fw-bold text-danger mb-3">CẢNH BÁO GIAN LẬN!</h2>
                        <p className="fs-5 text-dark mb-4">{warningMsg}</p>
                        <button className="btn btn-danger btn-lg w-100 rounded-pill fw-bold shadow" onClick={dismissWarning}>Tôi đã hiểu, tiếp tục làm bài</button>
                    </div>
                </div>
            )}

            <header className="bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center shadow-sm z-3">
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary text-white rounded p-2"><LayoutGrid size={20} /></div>
                    <div>
                        <h5 className="mb-0 fw-bold">{examData?.name}</h5>
                        <small className="text-muted">Sinh viên: {user?.fullName}</small>
                    </div>
                </div>
                <div className="d-flex align-items-center gap-4">
                    {violations > 0 && <div className="badge bg-danger text-white d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm fs-6"><AlertTriangle size={16} /> Vi phạm: {violations}</div>}

                    <div className={`d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-bold fs-5 transition-all ${timeLeft < 300 ? 'bg-danger text-white animate-pulse' : 'bg-light text-primary border'}`}>
                        <Clock size={20} /> {formatTime(timeLeft)}
                    </div>

                    <button className="btn btn-danger px-4 py-2 rounded-pill fw-bold d-flex align-items-center gap-2 shadow-sm" onClick={() => handleSubmitExam(false)} disabled={isSubmitting}>
                        {isSubmitting ? <span className="spinner-border spinner-border-sm"></span> : <Send size={18} />} Nộp bài
                    </button>
                </div>
            </header>

            <div className="d-flex flex-grow-1 overflow-hidden">
                <div className="flex-grow-1 bg-secondary bg-opacity-10 p-2 position-relative overflow-hidden">
                    {examData?.creationMode === 'PDF' && examData?.pdfUrl ? (
                        <iframe
                            src={`${examData.pdfUrl}#toolbar=0&navpanes=0`}
                            className="w-100 h-100 border-0 rounded shadow-sm bg-white"
                            title="Đề thi PDF"
                        />
                    ) : examData?.creationMode === 'BANK' ? (
                        <div className="w-100 h-100 bg-transparent p-2 overflow-auto custom-scrollbar">
                            {examData.questions?.map((q: any, idx: number) => {
                                if (!q) return null; // Thêm 1 lớp bảo vệ nữa
                                const qNum = idx + 1;
                                return (
                                    <div key={q.questionId} ref={(el) => questionRefs.current[qNum] = el} className="card border-0 shadow-sm rounded-4 mb-4 transition-all">
                                        <div className="card-body p-4">
                                            <div className="d-flex justify-content-between mb-3">
                                                <h5 className="fw-bold text-primary mb-0">Câu {qNum}</h5>
                                            </div>
                                            <p className="fs-5 mb-4 text-dark lh-base">{q.questionText}</p>

                                            <div className="d-flex flex-column gap-2 ps-2">
                                                {q.answers?.map((ans: any) => {
                                                    const isSelected = answers[qNum] === ans.answerId;
                                                    return (
                                                        <label
                                                            key={ans.answerId}
                                                            className={`btn text-start p-3 rounded-3 border transition-all d-flex align-items-center gap-3 ${isSelected ? 'btn-primary bg-opacity-10 border-primary' : 'btn-light border-light'}`}
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => handleSelectBubble(qNum, ans.answerId)}
                                                        >
                                                            <div
                                                                className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${isSelected ? 'bg-primary text-white' : 'bg-white border text-secondary'}`}
                                                                style={{ width: '32px', height: '32px', fontWeight: 'bold' }}
                                                            >
                                                                {ans.answerLabel}
                                                            </div>
                                                            <span className="fs-6 text-dark">{ans.answerText}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="w-100 h-100 bg-white rounded shadow-sm p-4 overflow-auto">
                            <h4 className="text-muted text-center mt-5">Không có dữ liệu đề thi</h4>
                        </div>
                    )}
                </div>

                <div className="bg-white border-start d-flex flex-column" style={{ width: '400px', minWidth: '350px' }}>
                    <div className="p-3 border-bottom shadow-sm z-2 bg-light">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="fw-bold mb-0 text-dark text-uppercase tracking-wider fs-6">Danh sách câu hỏi</h6>
                            <span className="badge bg-primary rounded-pill fs-6 px-3">{Object.keys(answers).length}/{examData?.totalQuestions}</span>
                        </div>

                        <div className="d-flex flex-wrap gap-2 overflow-auto custom-scrollbar p-1" style={{ maxHeight: '160px' }}>
                            {Array.from({ length: examData?.totalQuestions || 0 }).map((_, idx) => {
                                const qNum = idx + 1;
                                const isAnswered = !!answers[qNum];
                                return (
                                    <button
                                        key={qNum}
                                        onClick={() => scrollToQuestion(qNum)}
                                        className={`btn btn-sm fw-bold border ${isAnswered ? 'btn-primary text-white border-primary shadow-sm' : 'btn-light text-secondary hover-border'}`}
                                        style={{ width: '38px', height: '38px', transition: 'all 0.2s' }}
                                    >
                                        {qNum}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="d-flex justify-content-center gap-4 mt-3 small fw-bold">
                            <span className="d-flex align-items-center gap-1 text-primary"><div className="bg-primary rounded-circle" style={{ width: 12, height: 12 }}></div> Đã trả lời</span>
                            <span className="d-flex align-items-center gap-1 text-muted"><div className="bg-light border rounded-circle" style={{ width: 12, height: 12 }}></div> Chưa trả lời</span>
                        </div>
                    </div>

                    <div className="p-3 overflow-auto flex-grow-1 custom-scrollbar bg-white">
                        {examData?.creationMode === 'PDF' ? (
                            <div className="d-flex flex-column gap-3 pb-4">
                                {Array.from({ length: examData?.totalQuestions || 0 }).map((_, idx) => {
                                    const qNum = idx + 1;
                                    const options = ['A', 'B', 'C', 'D'];
                                    const selectedOpt = answers[qNum];

                                    return (
                                        <div
                                            key={qNum}
                                            ref={(el) => questionRefs.current[qNum] = el}
                                            className={`d-flex align-items-center p-2 rounded-3 transition-all ${selectedOpt ? 'bg-primary bg-opacity-10 border border-primary border-opacity-25' : 'bg-light border border-transparent hover-border'}`}
                                        >
                                            <div className="fw-bold text-secondary text-end me-3 fs-5" style={{ width: '60px' }}>Câu {qNum}</div>
                                            <div className="d-flex gap-2">
                                                {options.map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => handleSelectBubble(qNum, opt)}
                                                        className={`bubble-btn fw-bold transition-all d-flex align-items-center justify-content-center rounded-circle ${selectedOpt === opt ? 'bg-primary text-white shadow-sm border-primary' : 'bg-white text-dark border-secondary hover-bg-light'}`}
                                                        style={{ width: '40px', height: '40px', border: '1px solid #ccc', fontSize: '1.1rem' }}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="d-flex flex-column justify-content-center align-items-center h-100 text-center px-4">
                                <LayoutGrid size={48} className="text-secondary opacity-25 mb-3" />
                                <h6 className="fw-bold text-secondary">Đây là Đề Ngân Hàng</h6>
                                <p className="text-muted small">Hãy cuộn để đọc và chọn trực tiếp đáp án ở cột bên trái. Bảng này dùng để theo dõi tiến độ.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .animation-fade-in { animation: fadeIn 0.3s ease-out; }
                .animation-zoom-in { animation: zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes zoomIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
                .animate-pulse { animation: pulse 1s infinite; }
                @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
                
                .tracking-wider { letter-spacing: 1px; }
                .hover-border:hover { border-color: #dee2e6 !important; }
                .hover-bg-light:hover { background-color: #e9ecef !important; }
                .bubble-btn:hover:not(.bg-primary) { border-color: #0d6efd !important; color: #0d6efd !important; }
                
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
            `}</style>
        </div>
    );
};

export default ExamTakingPage;