import React, { useState, useEffect } from 'react';
import { Settings, Clock, CheckCircle, Layers, Zap, ArrowLeft, Eye, RefreshCw, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import questionService from '../../services/question.service'; 
import axiosClient from '../../services/axiosClient';

interface ExamBuilderProps {
    classId: string;       
    subjectId: string;     
    examType: 'PRACTICE' | 'OFFICIAL'; 
    onClose: () => void;  
    onSuccess: () => void; 
}

const ExamBuilder: React.FC<ExamBuilderProps> = ({ classId, subjectId, examType, onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // Step 1: Matrix, Step 2: Preview
    
    // 🔥 1. ĐÃ FIX: Đổi examDate thành startTime và thêm endTime
    const [examData, setExamData] = useState({
        title: '',
        durationMinutes: 45,
        startTime: '', 
        endTime: '',   
        maxAttempts: 1,
        showResult: true
    });

    const [matrixConfig, setMatrixConfig] = useState<any[]>([]);
    const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (subjectId) {
            questionService.getChaptersBySubject(subjectId).then(res => {
                const fetchedChapters = res.data || [];
                const initialMatrix = [
                    { chapterId: null, chapterName: 'Kho chung (Không chương)', easy: 0, medium: 0, hard: 0 },
                    ...fetchedChapters.map((c: any) => ({
                        chapterId: c.chapterId,
                        chapterName: `Chương ${c.chapterNumber}: ${c.chapterName}`,
                        easy: 0, medium: 0, hard: 0
                    }))
                ];
                setMatrixConfig(initialMatrix);
            }).catch(() => toast.error("Không tải được danh sách chương"));
        }
    }, [subjectId]);

    const handleMatrixChange = (index: number, level: 'easy' | 'medium' | 'hard', value: string) => {
        const val = parseInt(value) || 0;
        const newConfig = [...matrixConfig];
        newConfig[index][level] = val;
        setMatrixConfig(newConfig);
    };

    const totalQuestions = matrixConfig.reduce((acc, curr) => acc + curr.easy + curr.medium + curr.hard, 0);

    const handlePreviewExam = async () => {
        if (!examData.title.trim()) return toast.warning("Vui lòng nhập tiêu đề");
        if (totalQuestions === 0) return toast.warning("Vui lòng nhập số lượng câu hỏi");

        try {
            setIsSubmitting(true);
            const payload = {
                subjectId,
                matrices: matrixConfig.filter(m => (m.easy + m.medium + m.hard) > 0).map(m => ({
                    chapterId: m.chapterId,
                    easyCount: m.easy,
                    mediumCount: m.medium,
                    hardCount: m.hard
                }))
            };
            const response = await axiosClient.post('/exams/preview-from-matrix', payload);
            setPreviewQuestions(response.data);
            setStep(2); 
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không đủ câu hỏi trong kho!");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 🔥 2. ĐÃ FIX: Truyền cả startTime và endTime xuống Backend (giữ nguyên múi giờ VN)
    const handleConfirmCreate = async () => {
        try {
            setIsSubmitting(true);
            
            const payload = {
                ...examData,
                name: examData.title, // Bọc thép phòng trường hợp DTO Backend dùng chữ "name"
                courseClassId: classId,
                startTime: examData.startTime ? examData.startTime : null,
                endTime: examData.endTime ? examData.endTime : null,
                questionIds: previewQuestions.map(q => q.questionId) 
            };

            await axiosClient.post('/exams/create-final', payload);
            toast.success("Đã khởi tạo đề thi thành công!");
            onSuccess();
            onClose();
        } catch (error) {
            toast.error("Lỗi khi lưu đề thi");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="exam-builder-container animation-fade-in">
            <div className="d-flex align-items-center mb-4">
                <button className="btn btn-link text-decoration-none p-0 me-3" onClick={step === 2 ? () => setStep(1) : onClose}>
                    <ArrowLeft size={24} />
                </button>
                <h4 className="fw-bold mb-0 text-dark">{step === 1 ? "Thiết lập Ma trận đề" : "Xem trước nội dung đề"}</h4>
            </div>

            {step === 1 ? (
                /* --- GIAO DIỆN BƯỚC 1: NHẬP MA TRẬN --- */
                <>
                    <div className="card border-0 shadow-sm rounded-4 mb-4">
                        <div className="card-body p-4">
                            <h6 className="fw-bold text-primary mb-3 d-flex align-items-center"><Settings size={18} className="me-2"/> Thông tin chung</h6>
                            
                            {/* 🔥 3. ĐÃ FIX: Chia lại Layout Grid để nhét vừa 2 cột Giờ Mở/Đóng */}
                            <div className="row g-3">
                                <div className="col-12">
                                    <label className="small fw-bold text-muted">TIÊU ĐỀ ĐỀ THI</label>
                                    <input type="text" className="form-control bg-light border-0" value={examData.title} onChange={e => setExamData({...examData, title: e.target.value})} placeholder="VD: Kiểm tra cuối kỳ môn MIS..." />
                                </div>
                                <div className="col-md-6">
                                    <label className="small fw-bold text-muted">THỜI GIAN (PHÚT)</label>
                                    <input type="number" className="form-control bg-light border-0" value={examData.durationMinutes} onChange={e => setExamData({...examData, durationMinutes: parseInt(e.target.value)})} min="1" />
                                </div>
                                <div className="col-md-6">
                                    <label className="small fw-bold text-muted">SỐ LẦN LÀM TỐI ĐA</label>
                                    <input type="number" className="form-control bg-light border-0" value={examData.maxAttempts} onChange={e => setExamData({...examData, maxAttempts: parseInt(e.target.value) || 1})} min="1" />
                                </div>
                                <div className="col-md-6">
                                    <label className="small fw-bold text-muted">MỞ PHÒNG (BẮT ĐẦU)</label>
                                    <input type="datetime-local" className="form-control bg-light border-0" value={examData.startTime} onChange={e => setExamData({...examData, startTime: e.target.value})} />
                                </div>
                                <div className="col-md-6">
                                    <label className="small fw-bold text-muted">ĐÓNG PHÒNG (KẾT THÚC)</label>
                                    <input type="datetime-local" className="form-control bg-light border-0" value={examData.endTime} onChange={e => setExamData({...examData, endTime: e.target.value})} />
                                </div>
                                <div className="col-12 mt-3">
                                    <div className="form-check form-switch d-flex align-items-center gap-3 bg-light p-3 rounded-3 border">
                                        <input 
                                            className="form-check-input mt-0 ms-0" 
                                            type="checkbox" 
                                            role="switch" 
                                            id="showResultSwitch" 
                                            checked={examData.showResult} 
                                            onChange={e => setExamData({...examData, showResult: e.target.checked})} 
                                            style={{ width: '45px', height: '24px', cursor: 'pointer' }} 
                                        />
                                        <label className="form-check-label fw-bold text-dark mb-0 cursor-pointer" htmlFor="showResultSwitch">
                                            Cho phép sinh viên xem Điểm và Đáp án sau khi nộp bài
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm rounded-4 mb-4">
                        <div className="card-body p-4">
                            <h6 className="fw-bold text-primary mb-3 d-flex align-items-center"><Layers size={18} className="me-2"/> Ma trận câu hỏi</h6>
                            <table className="table align-middle mb-0">
                                <thead className="table-light">
                                    <tr className="small text-muted">
                                        <th>CHƯƠNG</th>
                                        <th className="text-center" style={{width: '90px'}}>DỄ</th>
                                        <th className="text-center" style={{width: '90px'}}>T.BÌNH</th>
                                        <th className="text-center" style={{width: '90px'}}>KHÓ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {matrixConfig.map((row, idx) => (
                                        <tr key={idx}>
                                            <td className="fw-medium">{row.chapterName}</td>
                                            <td><input type="number" className="form-control form-control-sm text-center border-0 bg-light fw-bold" value={row.easy} onChange={e => handleMatrixChange(idx, 'easy', e.target.value)} min="0"/></td>
                                            <td><input type="number" className="form-control form-control-sm text-center border-0 bg-light fw-bold" value={row.medium} onChange={e => handleMatrixChange(idx, 'medium', e.target.value)} min="0"/></td>
                                            <td><input type="number" className="form-control form-control-sm text-center border-0 bg-light fw-bold" value={row.hard} onChange={e => handleMatrixChange(idx, 'hard', e.target.value)} min="0"/></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="text-end">
                        <button className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-sm d-inline-flex align-items-center gap-2" onClick={handlePreviewExam} disabled={totalQuestions === 0 || isSubmitting}>
                            {isSubmitting ? <RefreshCw className="spin" size={18} /> : <Eye size={18} />}
                            Xem thử đề thi ({totalQuestions} câu)
                        </button>
                    </div>
                </>
            ) : (
                /* --- GIAO DIỆN BƯỚC 2: PREVIEW CÂU HỎI --- */
                <div className="animation-slide-up">
                    <div className="alert alert-info border-0 rounded-4 shadow-sm mb-4 d-flex align-items-center gap-2 py-3">
                        <Zap size={20} className="flex-shrink-0" />
                        <span className="fw-medium">Đây là bản xem trước. Bạn có thể kiểm tra nội dung trước khi xuất bản chính thức.</span>
                    </div>

                    <div className="question-preview-list">
                        {previewQuestions.map((q, idx) => (
                            <div key={idx} className="card border-0 shadow-sm rounded-4 mb-3 overflow-hidden">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 fw-bold fs-6">Câu {idx + 1}</span>
                                        <span className={`badge rounded-pill px-3 py-2 ${q.difficultyLevel === 'EASY' ? 'bg-success' : q.difficultyLevel === 'MEDIUM' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                            {q.difficultyLevel === 'EASY' ? 'Dễ' : q.difficultyLevel === 'MEDIUM' ? 'Trung bình' : 'Khó'}
                                        </span>
                                    </div>
                                    <p className="fw-bold fs-5 mb-4 lh-base">{q.questionText}</p>
                                    <div className="row g-3">
                                        {q.answers?.map((ans: any) => (
                                            <div key={ans.answerId} className="col-md-6">
                                                <div className={`h-100 p-3 rounded-3 border d-flex align-items-start gap-2 ${ans.isCorrect ? 'bg-success bg-opacity-10 border-success text-success fw-bold' : 'bg-light border-light text-dark'}`}>
                                                    <span className="flex-shrink-0">{ans.answerLabel}.</span> 
                                                    <span className="flex-grow-1">{ans.answerText}</span>
                                                    {ans.isCorrect && <CheckCircle size={16} className="flex-shrink-0 mt-1" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mt-4 mb-5">
                        <button className="btn btn-light border px-4 py-3 rounded-pill fw-bold text-dark w-100 w-md-auto d-flex justify-content-center align-items-center gap-2" onClick={() => setStep(1)}>
                            <ArrowLeft size={18} /> Quay lại chỉnh ma trận
                        </button>
                        <button className="btn btn-success px-5 py-3 rounded-pill fw-bold shadow-lg w-100 w-md-auto d-flex justify-content-center align-items-center gap-2" onClick={handleConfirmCreate} disabled={isSubmitting}>
                            {isSubmitting ? <RefreshCw className="spin" size={18} /> : <CheckCircle size={18} />}
                            Xác nhận & Xuất bản đề
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animation-slide-up { animation: slideUp 0.3s ease-out; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { opacity: 1; }
            `}</style>
        </div>
    );
};

export default ExamBuilder;