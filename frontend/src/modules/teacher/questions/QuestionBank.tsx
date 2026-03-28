import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

// Import Types & Service
import type { Question, QuestionPayload, Answer } from '../../../types/question.types';
import type { Subject } from '../../../types/subject.types';
import subjectService from '../../admin/subjects/subject.service'; // Tận dụng service của Admin
// import questionService from './question.service'; // Mở khi có API

const QuestionBank = () => {
    // --- STATE ---
    const [questions, setQuestions] = useState<Question[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<QuestionPayload>({
        content: '',
        subjectId: '',
        level: 'MEDIUM',
        type: 'SINGLE_CHOICE',
        answers: [
            { content: '', isCorrect: false },
            { content: '', isCorrect: false },
            { content: '', isCorrect: false },
            { content: '', isCorrect: false }
        ]
    });

    // --- EFFECT: Load danh sách môn học trước ---
    useEffect(() => {
        const loadSubjects = async () => {
            try {
                const res = await subjectService.getAll();
                // @ts-ignore
                setSubjects(res);
                // Mặc định chọn môn đầu tiên nếu có
                if (res.length > 0) setSelectedSubjectId(res[0].id);
            } catch (error) {
                console.error(error);
            }
        };
        loadSubjects();
    }, []);

    // --- EFFECT: Load câu hỏi khi chọn Môn ---
    useEffect(() => {
        if (selectedSubjectId) fetchQuestions(selectedSubjectId);
    }, [selectedSubjectId]);

    const fetchQuestions = async (subjectId: string) => {
        setIsLoading(true);
        // GIẢ LẬP DỮ LIỆU CÂU HỎI
        setTimeout(() => {
            setQuestions([
                {
                    id: '1', content: 'Thủ đô của Việt Nam là gì?', level: 'EASY', type: 'SINGLE_CHOICE', subjectId: '1',
                    answers: [
                        { content: 'Hồ Chí Minh', isCorrect: false },
                        { content: 'Hà Nội', isCorrect: true },
                        { content: 'Đà Nẵng', isCorrect: false },
                        { content: 'Hải Phòng', isCorrect: false }
                    ]
                },
                {
                    id: '2', content: 'Đâu là ngôn ngữ lập trình Backend?', level: 'MEDIUM', type: 'MULTIPLE_CHOICE', subjectId: '1',
                    answers: [
                        { content: 'Java', isCorrect: true },
                        { content: 'HTML', isCorrect: false },
                        { content: 'Python', isCorrect: true },
                        { content: 'CSS', isCorrect: false }
                    ]
                }
            ]);
            setIsLoading(false);
        }, 500);
    };

    // --- HANDLERS FORM ---
    const handleAnswerChange = (index: number, field: keyof Answer, value: any) => {
        const newAnswers = [...formData.answers];
        // @ts-ignore
        newAnswers[index][field] = value;
        
        // Nếu là Single Choice -> Reset các câu khác về false khi chọn true
        if (formData.type === 'SINGLE_CHOICE' && field === 'isCorrect' && value === true) {
            newAnswers.forEach((ans, i) => {
                if (i !== index) ans.isCorrect = false;
            });
        }
        setFormData({ ...formData, answers: newAnswers });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // Validate đơn giản
        if (!formData.content) return toast.warning("Chưa nhập nội dung câu hỏi!");
        if (!formData.answers.some(a => a.isCorrect)) return toast.warning("Chưa chọn đáp án đúng!");

        toast.success("Đã lưu câu hỏi!");
        setShowModal(false);
        // fetchQuestions(selectedSubjectId);
    };

    return (
        <div className="container-fluid p-0">
            {/* 1. HEADER & FILTER */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold text-primary mb-0">Ngân hàng Câu hỏi</h4>
                <button className="btn btn-warning fw-bold text-primary shadow-sm" onClick={() => setShowModal(true)}>
                    <Plus size={18} className="me-2"/> Tạo câu hỏi
                </button>
            </div>

            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-3">
                    <div className="row g-3 align-items-center">
                        <div className="col-md-4">
                            <label className="form-label small fw-bold text-muted mb-1">Đang xem môn học:</label>
                            <select 
                                className="form-select fw-bold text-primary" 
                                value={selectedSubjectId}
                                onChange={e => setSelectedSubjectId(e.target.value)}
                            >
                                <option value="">-- Chọn môn học --</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.subjectCode} - {s.subjectName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-4">
                             <label className="form-label small fw-bold text-muted mb-1">Tìm kiếm nội dung:</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white"><Search size={16}/></span>
                                <input type="text" className="form-control border-start-0" placeholder="Nhập từ khóa..."/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. QUESTION LIST */}
            <div className="d-flex flex-column gap-3">
                {isLoading ? <div className="text-center py-5">Đang tải dữ liệu...</div> : 
                 questions.map((q, idx) => (
                    <div key={q.id} className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle">
                                    Câu {idx + 1}
                                </span>
                                <div className="d-flex gap-2">
                                    <span className={`badge ${q.level === 'EASY' ? 'bg-success' : 'bg-warning'} bg-opacity-75`}>
                                        {q.level}
                                    </span>
                                    <button className="btn btn-sm btn-light text-primary"><Edit size={16}/></button>
                                    <button className="btn btn-sm btn-light text-danger"><Trash2 size={16}/></button>
                                </div>
                            </div>
                            
                            <h6 className="fw-bold text-dark mb-3">{q.content}</h6>

                            <div className="row g-2">
                                {q.answers.map((ans, i) => (
                                    <div key={i} className="col-md-6">
                                        <div className={`p-2 rounded border d-flex align-items-center gap-2 ${ans.isCorrect ? 'bg-success-subtle border-success text-success fw-bold' : 'bg-light border-light'}`}>
                                            {ans.isCorrect ? <CheckCircle size={16}/> : <Circle size={16} className="text-muted"/>}
                                            <span>{ans.content}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
                
                {questions.length === 0 && !isLoading && (
                    <div className="text-center py-5 text-muted">
                        <AlertCircle size={48} className="mb-2 opacity-25"/>
                        <p>Chưa có câu hỏi nào cho môn học này.</p>
                    </div>
                )}
            </div>

            {/* 3. MODAL CREATE QUESTION */}
            {showModal && (
                <>
                    <div className="modal-backdrop show"></div>
                    <div className="modal show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-lg modal-dialog-scrollable">
                            <div className="modal-content">
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title fw-bold">Thêm Câu hỏi mới</h5>
                                    <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body bg-light">
                                    <div className="card border-0 shadow-sm mb-3">
                                        <div className="card-body">
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-bold">Môn học</label>
                                                    <select 
                                                        className="form-select"
                                                        value={selectedSubjectId}
                                                        disabled
                                                    >
                                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
                                                    </select>
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="form-label small fw-bold">Độ khó</label>
                                                    <select className="form-select" onChange={e => setFormData({...formData, level: e.target.value})}>
                                                        <option value="EASY">Dễ</option>
                                                        <option value="MEDIUM">Trung bình</option>
                                                        <option value="HARD">Khó</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="form-label small fw-bold">Loại câu</label>
                                                    <select className="form-select" onChange={e => setFormData({...formData, type: e.target.value})}>
                                                        <option value="SINGLE_CHOICE">1 Đáp án đúng</option>
                                                        <option value="MULTIPLE_CHOICE">Nhiều đáp án</option>
                                                    </select>
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label small fw-bold">Nội dung câu hỏi</label>
                                                    <textarea 
                                                        className="form-control" rows={3} 
                                                        placeholder="Nhập nội dung câu hỏi..."
                                                        value={formData.content}
                                                        onChange={e => setFormData({...formData, content: e.target.value})}
                                                    ></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <h6 className="small fw-bold text-muted mb-2 ms-1">DANH SÁCH ĐÁP ÁN</h6>
                                    {formData.answers.map((ans, idx) => (
                                        <div key={idx} className="card border-0 shadow-sm mb-2">
                                            <div className="card-body p-2 d-flex align-items-center gap-2">
                                                <div className="form-check">
                                                    <input 
                                                        className="form-check-input" 
                                                        type={formData.type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                                                        name="correctAnswer"
                                                        checked={ans.isCorrect}
                                                        onChange={(e) => handleAnswerChange(idx, 'isCorrect', e.target.checked)}
                                                    />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    className={`form-control border-0 ${ans.isCorrect ? 'text-success fw-bold' : ''}`}
                                                    placeholder={`Nhập đáp án ${String.fromCharCode(65 + idx)}...`}
                                                    value={ans.content}
                                                    onChange={(e) => handleAnswerChange(idx, 'content', e.target.value)}
                                                />
                                                {idx > 1 && (
                                                    <button className="btn btn-sm text-danger"><Trash2 size={16}/></button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button className="btn btn-sm btn-link text-decoration-none">
                                        <Plus size={16}/> Thêm đáp án khác
                                    </button>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                                    <button className="btn btn-primary" onClick={handleSave}>Lưu câu hỏi</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default QuestionBank;