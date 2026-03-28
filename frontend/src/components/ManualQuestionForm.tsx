import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Save, HelpCircle, Layers, Target, X, Edit } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../services/axiosClient';

interface ManualQuestionFormProps {
    subjectId: string;
    chapterId?: string;
    editingQuestion?: any;  
    onSuccess?: () => void; 
}

const ManualQuestionForm: React.FC<ManualQuestionFormProps> = ({ subjectId, chapterId, editingQuestion, onSuccess }) => {
    // 1. Các states lưu trữ dữ liệu câu hỏi
    const [questionText, setQuestionText] = useState('');
    const [difficultyLevel, setDifficultyLevel] = useState('EASY');
    const [bloomLevel, setBloomLevel] = useState('REMEMBER');
    const [questionType, setQuestionType] = useState('MCQ_SINGLE');
    const [explanation, setExplanation] = useState('');
    
    // State mảng đáp án
    const [answers, setAnswers] = useState([
        { answerText: '', isCorrect: true, answerLabel: 'A' },
        { answerText: '', isCorrect: false, answerLabel: 'B' },
        { answerText: '', isCorrect: false, answerLabel: 'C' },
        { answerText: '', isCorrect: false, answerLabel: 'D' },
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // 2. EFFECT: Nạp dữ liệu khi ở chế độ CHỈNH SỬA
    useEffect(() => {
        if (editingQuestion) {
            setQuestionText(editingQuestion.questionText || '');
            setDifficultyLevel(editingQuestion.difficultyLevel || 'EASY');
            setBloomLevel(editingQuestion.bloomLevel || 'REMEMBER');
            setQuestionType(editingQuestion.questionType || 'MCQ_SINGLE');
            setExplanation(editingQuestion.explanation || '');
            
            if (editingQuestion.answers && editingQuestion.answers.length > 0) {
                // Map lại để đảm bảo cấu trúc sạch
                setAnswers(editingQuestion.answers.map((a: any) => ({
                    answerText: a.answerText,
                    isCorrect: a.isCorrect,
                    answerLabel: a.answerLabel
                })));
            }
        } else {
            // Nếu không có editingQuestion (chế độ Thêm mới), reset form về mặc định
            resetForm();
        }
    }, [editingQuestion]);

    const resetForm = () => {
        setQuestionText('');
        setExplanation('');
        setDifficultyLevel('EASY');
        setBloomLevel('REMEMBER');
        setQuestionType('MCQ_SINGLE');
        setAnswers([
            { answerText: '', isCorrect: true, answerLabel: 'A' },
            { answerText: '', isCorrect: false, answerLabel: 'B' },
            { answerText: '', isCorrect: false, answerLabel: 'C' },
            { answerText: '', isCorrect: false, answerLabel: 'D' },
        ]);
    };

    // 3. Các hàm xử lý đáp án
    const handleAnswerChange = (index: number, value: string) => {
        const newAnswers = [...answers];
        newAnswers[index].answerText = value;
        setAnswers(newAnswers);
    };

    const handleSetCorrect = (index: number) => {
        const newAnswers = [...answers];
        if (questionType === 'MCQ_SINGLE' || questionType === 'TRUE_FALSE') {
            newAnswers.forEach((a, i) => a.isCorrect = (i === index));
        } else {
            newAnswers[index].isCorrect = !newAnswers[index].isCorrect;
        }
        setAnswers(newAnswers);
    };

    const handleAddAnswer = () => {
        const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const nextLabel = labels[answers.length % 26];
        setAnswers([...answers, { answerText: '', isCorrect: false, answerLabel: nextLabel }]);
    };

    const handleRemoveAnswer = (index: number) => {
        if (answers.length <= 2) {
            toast.warning('Cần ít nhất 2 đáp án!');
            return;
        }
        const newAnswers = answers.filter((_, i) => i !== index);
        const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        newAnswers.forEach((ans, idx) => { ans.answerLabel = labels[idx]; });
        setAnswers(newAnswers);
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const type = e.target.value;
        setQuestionType(type);
        if (type === 'TRUE_FALSE') {
            setAnswers([
                { answerText: 'Đúng', isCorrect: true, answerLabel: 'A' },
                { answerText: 'Sai', isCorrect: false, answerLabel: 'B' },
            ]);
        }
    };

    // 4. SUBMIT: Xử lý cả THÊM và SỬA
    const handleSubmit = async () => {
        if (!subjectId) return toast.error('Chọn môn học đã bác ơi!');
        if (!questionText.trim()) return toast.error('Nội dung câu hỏi trống kìa!');
        if (answers.some(a => !a.answerText.trim())) return toast.error('Nhập đủ text cho các đáp án nhé!');
        if (!answers.some(a => a.isCorrect)) return toast.error('Phải có ít nhất 1 đáp án đúng!');

        setIsSubmitting(true);
        try {
            const payload = {
                subjectId,
                chapterId: chapterId || null,
                questionText,
                difficultyLevel,
                bloomLevel,
                questionType,
                explanation,
                answers
            };

            if (editingQuestion) {
                // CHẾ ĐỘ CẬP NHẬT (PUT)
                await axiosClient.put(`/content/questions/${editingQuestion.questionId}`, payload);
                toast.success('Cập nhật câu hỏi thành công! 🎉');
            } else {
                // CHẾ ĐỘ THÊM MỚI (POST)
                await axiosClient.post('/content/questions', payload);
                toast.success('Đã thêm câu hỏi vào kho! 🚀');
            }

            if (onSuccess) {
                onSuccess(); // Gọi để cha load lại bảng và đóng form
            } else {
                resetForm();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi server bác ạ!');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`p-4 rounded-4 border-start border-5 shadow-sm transition-all ${editingQuestion ? 'bg-warning bg-opacity-10 border-warning' : 'bg-light border-primary'}`}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0 d-flex align-items-center">
                    {editingQuestion ? (
                        <><Edit className="me-2 text-warning" /> CHỈNH SỬA CÂU HỎI</>
                    ) : (
                        <><Plus className="me-2 text-primary" /> THÊM CÂU HỎI MỚI</>
                    )}
                </h5>
                {editingQuestion && (
                    <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={onSuccess}>
                         Hủy bỏ
                    </button>
                )}
            </div>

            {/* BỘ LỌC PHÂN LOẠI */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1"><HelpCircle size={14}/> Loại</label>
                    <select className="form-select border-0 shadow-sm" value={questionType} onChange={handleTypeChange}>
                        <option value="MCQ_SINGLE">Trắc nghiệm (1 đáp án)</option>
                        <option value="MCQ_MULTIPLE">Trắc nghiệm (Nhiều đáp án)</option>
                        <option value="TRUE_FALSE">Đúng / Sai</option>
                    </select>
                </div>
                <div className="col-md-4">
                    <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1"><Target size={14}/> Độ khó</label>
                    <select className="form-select border-0 shadow-sm" value={difficultyLevel} onChange={e => setDifficultyLevel(e.target.value)}>
                        <option value="EASY">Dễ</option>
                        <option value="MEDIUM">Trung bình</option>
                        <option value="HARD">Khó</option>
                    </select>
                </div>
                <div className="col-md-4">
                    <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1"><Layers size={14}/> Bloom</label>
                    <select className="form-select border-0 shadow-sm" value={bloomLevel} onChange={e => setBloomLevel(e.target.value)}>
                        <option value="REMEMBER">Ghi nhớ</option>
                        <option value="UNDERSTAND">Thông hiểu</option>
                        <option value="APPLY">Vận dụng</option>
                        <option value="ANALYZE">Phân tích</option>
                        <option value="EVALUATE">Đánh giá</option>
                        <option value="CREATE">Sáng tạo</option>
                    </select>
                </div>
            </div>

            {/* NỘI DUNG CHÍNH */}
            <div className="mb-4">
                <label className="form-label small fw-bold text-dark">NỘI DUNG CÂU HỎI</label>
                <textarea 
                    className="form-control border-0 shadow-sm" 
                    rows={3} 
                    placeholder="Nhập câu hỏi..."
                    value={questionText}
                    onChange={e => setQuestionText(e.target.value)}
                />
            </div>

            <div className="mb-4">
                <label className="form-label small fw-bold text-dark">DANH SÁCH ĐÁP ÁN</label>
                <div className="d-flex flex-column gap-2">
                    {answers.map((answer, index) => (
                        <div key={index} className={`d-flex align-items-center gap-3 p-2 rounded-3 border transition-all ${answer.isCorrect ? 'bg-success bg-opacity-10 border-success' : 'bg-white'}`}>
                            <button 
                                className={`btn rounded-circle p-1 d-flex align-items-center justify-content-center flex-shrink-0 ${answer.isCorrect ? 'btn-success' : 'btn-outline-secondary'}`}
                                style={{ width: '28px', height: '28px' }}
                                onClick={() => handleSetCorrect(index)}
                            >
                                {answer.isCorrect && <CheckCircle size={16} />}
                            </button>
                            
                            <span className="fw-bold text-muted" style={{width: '15px'}}>{answer.answerLabel}.</span>
                            
                            <input 
                                type="text" 
                                className="form-control border-0 bg-transparent shadow-none" 
                                placeholder="Nhập đáp án..."
                                value={answer.answerText}
                                onChange={(e) => handleAnswerChange(index, e.target.value)}
                                disabled={questionType === 'TRUE_FALSE'}
                            />
                            
                            {questionType !== 'TRUE_FALSE' && (
                                <button className="btn btn-sm text-danger opacity-50 hover-opacity-100" onClick={() => handleRemoveAnswer(index)}>
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                
                {questionType !== 'TRUE_FALSE' && (
                    <button className="btn btn-link btn-sm mt-2 text-decoration-none fw-bold" onClick={handleAddAnswer}>
                        <Plus size={16} /> Thêm đáp án
                    </button>
                )}
            </div>

            <div className="mb-4">
                <label className="form-label small fw-bold text-muted">GIẢI THÍCH (TÙY CHỌN)</label>
                <textarea 
                    className="form-control border-0 shadow-sm" 
                    rows={2} 
                    placeholder="Giải thích cho sinh viên..."
                    value={explanation}
                    onChange={e => setExplanation(e.target.value)}
                />
            </div>

            <div className="d-flex justify-content-end pt-3 border-top">
                <button 
                    className={`btn fw-bold px-5 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2 ${editingQuestion ? 'btn-warning' : 'btn-primary'}`}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <span className="spinner-border spinner-border-sm"></span> : <Save size={18} />}
                    {editingQuestion ? 'Cập nhật thay đổi' : 'Lưu vào ngân hàng'}
                </button>
            </div>
        </div>
    );
};

export default ManualQuestionForm;