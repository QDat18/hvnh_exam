import React, { useState, useEffect } from 'react';
import ImportSection from '../components/ImportSection';
import ManualQuestionForm from '../components/ManualQuestionForm';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, Layers, Zap, Plus, Search, Filter, Edit, Trash2, Upload, BarChart2, CheckCircle, FileDown, RefreshCw, LayoutGrid, ChevronRight, Activity } from 'lucide-react';
import subjectService from '../services/subject.service';
import questionService from '../services/question.service';
import { toast } from 'react-toastify';
import axiosClient from '../services/axiosClient';

const bloomMap: Record<string, { label: string, color: string }> = {
    'REMEMBER': { label: 'Ghi nhớ', color: 'bg-secondary bg-opacity-10 text-secondary border border-secondary' },
    'UNDERSTAND': { label: 'Thông hiểu', color: 'bg-info bg-opacity-10 text-info border border-info' },
    'APPLY': { label: 'Vận dụng', color: 'bg-primary bg-opacity-10 text-primary border border-primary' },
    'ANALYZE': { label: 'Phân tích', color: 'bg-warning bg-opacity-10 text-warning border-warning text-dark' },
    'EVALUATE': { label: 'Đánh giá', color: 'bg-danger bg-opacity-10 text-danger border border-danger' },
    'CREATE': { label: 'Sáng tạo', color: 'bg-success bg-opacity-10 text-success border border-success' }
};

const diffMap: Record<string, { label: string, color: string }> = {
    'EASY': { label: 'DỄ', color: 'bg-success bg-gradient text-white shadow-sm' },
    'MEDIUM': { label: 'TRUNG BÌNH', color: 'bg-warning bg-gradient text-dark shadow-sm' },
    'HARD': { label: 'KHÓ', color: 'bg-danger bg-gradient text-white shadow-sm' }
};

const QuestionManager: React.FC = () => {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState<any[]>([]);
    const [chapters, setChapters] = useState<any[]>([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedChapter, setSelectedChapter] = useState('');

    const [questions, setQuestions] = useState<any[]>([]);
    const [mockExam, setMockExam] = useState<any[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    const [editingQuestion, setEditingQuestion] = useState<any>(null);
    const [showMatrixModal, setShowMatrixModal] = useState(false);
    const [matrixConfig, setMatrixConfig] = useState<any[]>([]);
    const [showImport, setShowImport] = useState(false);
    const [showManualForm, setShowManualForm] = useState(false);

    const [filters, setFilters] = useState({ keyword: '', difficulty: '', bloom: '', type: '' });

    const isTeacher = user?.role === 'TEACHER';

    useEffect(() => {
        subjectService.getAllSubjects().then(res => {
            const data = Array.isArray(res.data) ? res.data : (res.data.content || []);
            setSubjects(data);
        }).catch(() => toast.error("Lỗi kết nối Server!"));
    }, []);

    useEffect(() => {
        if (selectedSubject) {
            questionService.getChaptersBySubject(selectedSubject)
                .then(res => setChapters(res.data)).catch(() => setChapters([]));
            setPage(0);
        }
    }, [selectedSubject]);

    const fetchQuestions = async () => {
        if (!selectedSubject) return;
        try {
            const res = await axiosClient.get(`/questions/subject/${selectedSubject}`, {
                params: { page, size: pageSize, difficulty: filters.difficulty || undefined, bloom: filters.bloom || undefined, type: filters.type || undefined, keyword: filters.keyword || undefined }
            });
            setQuestions(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
        } catch (error) { console.error("Lỗi lấy danh sách câu hỏi", error); }
    };

    useEffect(() => { fetchQuestions(); }, [selectedSubject, page, filters]);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này khỏi hệ thống?")) return;
        try {
            await axiosClient.delete(`/content/questions/${id}`);
            toast.success("Đã xóa câu hỏi thành công!");
            fetchQuestions();
        } catch (e) { toast.error("Có lỗi xảy ra khi xóa."); }
    };

    const handleEdit = (q: any) => {
        setEditingQuestion(q);
        setShowManualForm(true);
        setShowImport(false);
        window.scrollTo({ top: 150, behavior: 'smooth' });
    };

    const handleExportExcel = async () => {
        if (!selectedSubject) return toast.warning("Vui lòng chọn môn học để xuất dữ liệu!");
        try {
            const toastId = toast.loading("Đang trích xuất file Excel...");
            const res = await axiosClient.get(`/content/questions/export?subjectId=${selectedSubject}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Kho_Cau_Hoi_${selectedSubject.substring(0, 6)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.update(toastId, { render: "Đã tải file Excel thành công!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) { toast.error("Lỗi khi xuất dữ liệu!"); }
    };

    const stats = {
        total: totalElements,
        easy: questions.filter(q => (q.difficultyLevel || q.difficulty || '') === 'EASY').length,
        medium: questions.filter(q => (q.difficultyLevel || q.difficulty || '') === 'MEDIUM').length,
        hard: questions.filter(q => (q.difficultyLevel || q.difficulty || '') === 'HARD').length,
    };

    const bloomStats = [
        { label: 'Ghi nhớ', key: 'REMEMBER', color: 'bg-secondary' },
        { label: 'Thông hiểu', key: 'UNDERSTAND', color: 'bg-info' },
        { label: 'Vận dụng', key: 'APPLY', color: 'bg-primary' },
        { label: 'Phân tích', key: 'ANALYZE', color: 'bg-warning' },
        { label: 'Đánh giá', key: 'EVALUATE', color: 'bg-danger' },
        { label: 'Sáng tạo', key: 'CREATE', color: 'bg-success' }
    ].map(level => ({ ...level, count: questions.filter(q => (q.bloomLevel || q.bloom || q.bloomTaxonomy || '') === level.key).length }));

    const maxBloomCount = Math.max(...bloomStats.map(b => b.count), 1);

    const handleOpenMatrix = () => {
        if (!selectedSubject) return toast.warning("Vui lòng chọn môn học để cấu hình!");
        const initialMatrix = [
            { chapterId: null, chapterName: 'Kho chung (Không phân chương)', easy: 0, medium: 0, hard: 0 },
            ...chapters.map(c => ({ chapterId: c.chapterId, chapterName: `Chương ${c.chapterNumber}: ${c.chapterName}`, easy: 0, medium: 0, hard: 0 }))
        ];
        setMatrixConfig(initialMatrix);
        setShowMatrixModal(true);
    };

    const handleMatrixChange = (index: number, field: string, value: string) => {
        const num = parseInt(value) || 0;
        const newMatrix = [...matrixConfig];
        newMatrix[index][field] = num;
        setMatrixConfig(newMatrix);
    };

    const handleGenerateMatrixExam = async () => {
        const totalQs = matrixConfig.reduce((sum, row) => sum + row.easy + row.medium + row.hard, 0);
        if (totalQs === 0) return toast.error("Vui lòng thiết lập ít nhất 1 câu hỏi để bốc đề!");
        try {
            const toastId = toast.loading("Đang phân tích và khởi tạo đề thi...");
            const payload = {
                subjectId: selectedSubject,
                matrices: matrixConfig.map(m => ({ chapterId: m.chapterId, easyCount: m.easy, mediumCount: m.medium, hardCount: m.hard }))
            };
            const res = await axiosClient.post('/content/questions/generate-matrix', payload);
            setMockExam(res.data);
            setShowMatrixModal(false);
            toast.update(toastId, { render: `Khởi tạo thành công đề thi với ${res.data.length} câu hỏi!`, type: "success", isLoading: false, autoClose: 3000 });
            setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 400);
        } catch (error: any) { toast.error(error.response?.data?.message || "Hệ thống không đủ câu hỏi đáp ứng ma trận được chọn!"); }
    };

    const handleShuffleExam = () => {
        const toastId = toast.loading("Đang xáo trộn mã đề...");
        setTimeout(() => {
            const shuffledQuestions = [...mockExam].sort(() => Math.random() - 0.5);
            const fullyShuffled = shuffledQuestions.map((q) => {
                if (!q.answers || q.questionType === 'TRUE_FALSE') return q;
                const shuffledAnswers = [...q.answers].sort(() => Math.random() - 0.5);
                const labels = ['A', 'B', 'C', 'D'];
                const reLabeledAnswers = shuffledAnswers.map((a, idx) => ({ ...a, answerLabel: labels[idx] || '' }));
                return { ...q, answers: reLabeledAnswers };
            });
            setMockExam(fullyShuffled);
            toast.update(toastId, { render: "Đã tạo mã đề mới thành công!", type: "success", isLoading: false, autoClose: 2000 });
        }, 500);
    };

    return (
        <main className="container-fluid py-4 page-container gravity-theme" style={{ maxWidth: '1400px' }}>
            {/* 1. HEADER & ACTIONS */}
            <header className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center mb-5 gap-4 animation-slide-up">
                <div>
                    <h1 className="fw-bolder mb-2 text-primary d-flex align-items-center gap-3 gravity-heading">
                        <div className="icon-wrapper bg-gradient-primary shadow-sm text-white rounded-4 p-2 d-flex align-items-center justify-content-center">
                            <LayoutGrid size={28} strokeWidth={2.5} />
                        </div>
                        Ngân hàng câu hỏi
                    </h1>
                    <p className="text-secondary mb-0 border-start border-3 border-primary ps-3 small fw-semibold text-uppercase tracking-wide">
                        Phân hệ Quản trị Học liệu & Đề thi
                    </p>
                </div>
                <nav aria-label="Công cụ quản trị" className="d-flex flex-wrap gap-3">
                    <button aria-label="Xuất dữ liệu Excel" className="btn btn-glass border border-light-subtle rounded-pill px-4 py-2 shadow-sm d-flex align-items-center gap-2 fw-semibold text-dark hover-elevate transition-all" onClick={handleExportExcel}>
                        <FileDown size={18} className="text-success" /> <span>Xuất Excel</span>
                    </button>
                    <button aria-label="Cấu hình bốc đề ma trận" className="btn btn-warning bg-gradient rounded-pill px-4 py-2 shadow-sm d-flex align-items-center gap-2 fw-semibold text-dark hover-elevate transition-all" onClick={handleOpenMatrix}>
                        <Zap size={18} className="text-danger" /> <span>Test Bốc Đề</span>
                    </button>
                    {isTeacher && (
                        <>
                            <div className="vr mx-2 d-none d-lg-block bg-secondary opacity-25"></div>
                            <button aria-label="Nhập dữ liệu Excel" className={`btn ${showImport ? 'btn-secondary shadow-none' : 'btn-outline-primary bg-white'} rounded-pill px-4 py-2 shadow-sm d-flex align-items-center gap-2 fw-semibold transition-all hover-elevate`} onClick={() => { setShowImport(!showImport); setShowManualForm(false); }}>
                                <Upload size={18} /> Nhập Excel
                            </button>
                            <button aria-label="Mở form soạn câu hỏi" className={`btn ${showManualForm && !editingQuestion ? 'btn-secondary shadow-none' : 'btn-primary bg-gradient shadow-primary'} rounded-pill px-4 py-2 d-flex align-items-center gap-2 fw-bold transition-all hover-elevate`} onClick={() => { setEditingQuestion(null); setShowManualForm(!showManualForm || editingQuestion !== null); setShowImport(false); }}>
                                <Plus size={20} /> Soạn câu hỏi
                            </button>
                        </>
                    )}
                </nav>
            </header>

            {/* 2. CONTROL PANEL (BỘ LỌC TỔNG HỢP) */}
            <section aria-label="Khu vực bộ lọc và tìm kiếm" className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white gravity-card glassmorphism animation-fade-in" style={{ animationDelay: '0.1s' }}>
                <form className="row g-4 align-items-end" onSubmit={e => e.preventDefault()}>
                    <div className="col-md-3">
                        <label htmlFor="subjectSelect" className="fw-bold text-secondary small mb-2 d-flex align-items-center gap-2">
                            <BookOpen size={14} /> MÔN HỌC
                        </label>
                        <select id="subjectSelect" aria-label="Chọn môn học" className="form-select bg-light border-0 py-2 fw-semibold text-primary custom-select shadow-none" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                            <option value="">-- Chọn môn học --</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label htmlFor="chapterSelect" className="fw-bold text-secondary small mb-2 d-flex align-items-center gap-2">
                            <Layers size={14} /> CHƯƠNG KẾT CẤU
                        </label>
                        <select id="chapterSelect" aria-label="Chọn chương" className="form-select bg-light border-0 py-2 custom-select shadow-none" value={selectedChapter} onChange={e => { setSelectedChapter(e.target.value); setPage(0); }} disabled={!selectedSubject}>
                            <option value="">Tất cả các chương</option>
                            {chapters.map(c => <option key={c.chapterId} value={c.chapterId}>Chương {c.chapterNumber}: {c.chapterName}</option>)}
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="fw-bold text-secondary small mb-2 d-flex align-items-center gap-2">
                            <Filter size={14} />TÌM KIẾM & BỘ LỌC TỔNG HỢP
                        </label>
                        <div className="input-group shadow-sm rounded-3 overflow-hidden border border-light-subtle">
                            <span className="input-group-text bg-white border-0 ps-3"><Search size={18} className="text-muted" /></span>
                            <input type="text" aria-label="Tìm kiếm nội dung câu hỏi" className="form-control bg-white border-0 py-2 shadow-none" placeholder="Nhập nội dung tìm kiếm..." value={filters.keyword} onChange={e => { setFilters({ ...filters, keyword: e.target.value }); setPage(0); }} disabled={!selectedSubject} />

                            <select aria-label="Lọc theo độ khó" className="form-select bg-light border-0 border-start" style={{ maxWidth: '120px' }} value={filters.difficulty} onChange={e => { setFilters({ ...filters, difficulty: e.target.value }); setPage(0); }} disabled={!selectedSubject}>
                                <option value="">Độ khó</option>
                                <option value="EASY">Dễ</option>
                                <option value="MEDIUM">T.Bình</option>
                                <option value="HARD">Khó</option>
                            </select>

                            <select aria-label="Lọc theo Bloom" className="form-select bg-light border-0 border-start" style={{ maxWidth: '130px' }} value={filters.bloom} onChange={e => { setFilters({ ...filters, bloom: e.target.value }); setPage(0); }} disabled={!selectedSubject}>
                                <option value="">Bloom</option>
                                <option value="REMEMBER">Ghi nhớ</option>
                                <option value="UNDERSTAND">Thông hiểu</option>
                                <option value="APPLY">Vận dụng</option>
                                <option value="ANALYZE">Phân tích</option>
                                <option value="EVALUATE">Đánh giá</option>
                                <option value="CREATE">Sáng tạo</option>
                            </select>

                            <button type="button" aria-label="Xóa bộ lọc" className="btn btn-light border-start text-danger hover-bg-danger transition-colors bg-white" onClick={() => { setFilters({ keyword: '', difficulty: '', bloom: '', type: '' }); setPage(0); }} title="Xóa toàn bộ bộ lọc">
                                <RefreshCw size={16} />
                            </button>
                        </div>
                    </div>
                </form>
            </section>

            {/* FORM NHẬP / SỬA */}
            {showImport && <section aria-label="Nhập file Excel" className="mb-4 animation-slide-up"><ImportSection subjectId={selectedSubject} chapterId={selectedChapter} onSuccess={fetchQuestions} /></section>}
            {showManualForm && isTeacher && <section aria-label="Soạn thảo câu hỏi" className="mb-4 animation-slide-up"><ManualQuestionForm subjectId={selectedSubject} chapterId={selectedChapter} editingQuestion={editingQuestion} onSuccess={() => { fetchQuestions(); setEditingQuestion(null); setShowManualForm(false); }} /></section>}

            {/* 3. KHU VỰC DỮ LIỆU CHÍNH */}
            {selectedSubject ? (
                <article aria-label="Kết quả học liệu" className="animation-fade-in" style={{ animationDelay: '0.2s' }}>
                    {/* THỐNG KÊ */}
                    <section aria-label="Bảng thống kê nhanh" className="row g-4 mb-4">
                        <div className="col-xl-3 col-lg-4">
                            <div className="card border-0 shadow-lg rounded-4 h-100 bg-gradient-primary text-white p-4 d-flex flex-column justify-content-center hover-elevate overflow-hidden position-relative gravity-card">
                                <div className="position-absolute opacity-10" style={{ right: '-20px', top: '-10px', transform: 'scale(2.5)' }}><Activity size={100} /></div>
                                <h2 className="opacity-75 fw-semibold mb-1 fs-6 text-uppercase tracking-wide">Tổng số học liệu</h2>
                                <div className="display-3 fw-bolder mb-0 lh-1 d-flex align-items-center gap-2">
                                    {stats.total}
                                </div>
                                <small className="mt-3 opacity-75 d-flex align-items-center gap-2 fw-medium"><CheckCircle size={16} /> Sẵn sàng cho mọi bài thi</small>
                            </div>
                        </div>
                        <div className="col-xl-9 col-lg-8">
                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white gravity-card">
                                <div className="row align-items-center h-100">
                                    <div className="col-md-5 text-center mb-4 mb-md-0">
                                        <h3 className="text-secondary fw-bold mb-4 fs-6 text-uppercase tracking-wide">Phân bổ Độ Khó <span className="text-lowercase fw-normal">(Trang hiện tại)</span></h3>
                                        <div className="d-flex justify-content-around px-3">
                                            <div className="text-center group-hover">
                                                <div className="fs-2 fw-bolder text-success mb-1">{stats.easy}</div>
                                                <small className="badge bg-success bg-opacity-10 text-success fw-bold rounded-pill px-3 py-1 border border-success">DỄ</small>
                                            </div>
                                            <div className="text-center group-hover">
                                                <div className="fs-2 fw-bolder text-warning mb-1">{stats.medium}</div>
                                                <small className="badge bg-warning bg-opacity-10 text-warning fw-bold rounded-pill px-3 py-1 border border-warning">T.BÌNH</small>
                                            </div>
                                            <div className="text-center group-hover">
                                                <div className="fs-2 fw-bolder text-danger mb-1">{stats.hard}</div>
                                                <small className="badge bg-danger bg-opacity-10 text-danger fw-bold rounded-pill px-3 py-1 border border-danger">KHÓ</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-7 border-start-md px-md-4">
                                        <h3 className="text-secondary fw-bold mb-3 fs-6 d-flex align-items-center gap-2 text-uppercase tracking-wide">
                                            <BarChart2 size={18} className="text-primary" /> Tháp Nhận Thức Bloom
                                        </h3>
                                        <div className="d-flex flex-column gap-2 mt-3">
                                            {bloomStats.map((item, index) => (
                                                <div key={index} className="d-flex align-items-center gap-3">
                                                    <div style={{ width: '85px' }} className="small fw-semibold text-secondary text-end">{item.label}</div>
                                                    <div className="progress flex-grow-1 bg-light border border-light-subtle shadow-inner" style={{ height: '10px', borderRadius: '12px' }}>
                                                        <div className={`progress-bar ${item.color} rounded-pill progress-bar-striped progress-bar-animated opacity-75`} style={{ width: `${(item.count / maxBloomCount) * 100}%`, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                                                    </div>
                                                    <div style={{ width: '25px' }} className="small fw-bold text-dark fs-6">{item.count}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* BẢNG DỮ LIỆU */}
                    <section aria-label="Danh sách học liệu chi tiết">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-4 gravity-card table-wrapper">
                            <div className="table-responsive" style={{ minHeight: '450px' }}>
                                <table className="table table-hover align-middle mb-0 gravity-table">
                                    <thead className="bg-light">
                                        <tr>
                                            <th scope="col" className="ps-4 py-3 text-secondary fw-bold text-uppercase tracking-wide" style={{ width: '55%' }}>Nội dung câu hỏi</th>
                                            <th scope="col" className="py-3 text-center text-secondary fw-bold text-uppercase tracking-wide" style={{ width: '15%' }}>Độ khó</th>
                                            <th scope="col" className="py-3 text-center text-secondary fw-bold text-uppercase tracking-wide" style={{ width: '15%' }}>Mức độ Cognitive</th>
                                            {isTeacher && <th scope="col" className="py-3 text-center pe-4 text-secondary fw-bold text-uppercase tracking-wide">Tác vụ</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="border-top-0">
                                        {questions.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center py-5 text-muted">
                                                    <div className="d-flex flex-column align-items-center justify-content-center opacity-50 py-4">
                                                        <Search size={50} className="mb-3" />
                                                        <h4 className="fw-semibold">Không tìm thấy dữ liệu</h4>
                                                        <p className="mb-0">Chưa có câu hỏi nào khớp với tiêu chí tìm kiếm của bạn.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            questions.map((q: any) => {
                                                const diff = q.difficultyLevel || q.difficulty || q.level || '';
                                                const bloom = q.bloomLevel || q.bloom || q.bloomTaxonomy || '';
                                                return (
                                                    <tr key={q.questionId} className="border-bottom border-light-subtle align-middle table-row-hover">
                                                        <td className="ps-4 py-3">
                                                            <div className="fw-semibold text-dark text-wrap lh-base mb-2 font-inter" style={{ fontSize: '0.98rem' }}>{q.questionText}</div>
                                                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                                                {q.chapterName && (
                                                                    <span className="badge bg-light text-secondary fw-medium border rounded-pill px-3 py-1 font-monospace" style={{ fontSize: '0.75rem' }}>
                                                                        <Layers size={12} className="me-1 d-inline" /> CH. {q.chapterNumber}
                                                                    </span>
                                                                )}
                                                                {q.questionType && (
                                                                    <span className="badge bg-primary bg-opacity-10 text-primary fw-medium border border-primary border-opacity-25 rounded-pill px-3 py-1" style={{ fontSize: '0.75rem' }}>
                                                                        {q.questionType === 'MULTIPLE_CHOICE' ? '☑ Trắc nghiệm' : q.questionType === 'TRUE_FALSE' ? '✓ Đúng/Sai' : q.questionType}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="text-center py-3">
                                                            {diff ? (
                                                                <span className={`badge px-3 py-2 rounded-3 fw-bold ${diffMap[diff]?.color || 'bg-secondary text-white'}`}>
                                                                    {diffMap[diff]?.label || diff}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted small fst-italic">—</span>
                                                            )}
                                                        </td>
                                                        <td className="text-center py-3">
                                                            {bloom ? (
                                                                <span className={`badge px-3 py-2 rounded-pill fw-semibold shadow-sm ${bloomMap[bloom]?.badge || 'bg-secondary text-white'}`}>
                                                                    {bloomMap[bloom]?.label || bloom}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted small fst-italic">—</span>
                                                            )}
                                                        </td>
                                                        {isTeacher && (
                                                            <td className="text-center pe-4 py-3">
                                                                <div className="d-flex justify-content-center gap-2">
                                                                    <button aria-label={`Sửa câu hỏi ${q.questionId}`} className="btn btn-sm btn-light text-primary rounded-circle p-2 hover-bg-primary transition-colors shadow-sm" onClick={() => handleEdit(q)} title="Chỉnh sửa chi tiết"><Edit size={16} /></button>
                                                                    <button aria-label={`Xóa câu hỏi ${q.questionId}`} className="btn btn-sm btn-light text-danger rounded-circle p-2 hover-bg-danger transition-colors shadow-sm" onClick={() => handleDelete(q.questionId)} title="Xóa khỏi hệ thống"><Trash2 size={16} /></button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* FOOTER PHÂN TRANG */}
                            {totalPages > 0 && (
                                <footer aria-label="Điều hướng phân trang" className="card-footer bg-white p-3 border-top border-light-subtle d-flex justify-content-between align-items-center">
                                    <div className="small fw-semibold text-secondary">Đang hiển thị <span className="text-primary fw-bold badge bg-primary bg-opacity-10 px-2 py-1 mx-1 rounded-2">{questions.length}</span> trên tổng <b>{totalElements}</b></div>
                                    <nav aria-label="Phân trang danh sách" className="btn-group shadow-sm rounded-pill overflow-hidden border border-light-subtle">
                                        <button aria-label="Trang trước" className="btn btn-sm btn-white bg-white hover-bg-light fw-bold px-3 py-2 text-dark" disabled={page === 0} onClick={() => setPage(page - 1)}>&laquo; Trước</button>
                                        <span className="btn btn-sm btn-primary bg-gradient px-4 py-2 fw-bold text-white shadow-inner pointer-events-none">Trang {page + 1} / {totalPages}</span>
                                        <button aria-label="Trang sau" className="btn btn-sm btn-white bg-white hover-bg-light fw-bold px-3 py-2 text-dark" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Sau &raquo;</button>
                                    </nav>
                                </footer>
                            )}
                        </div>
                    </section>
                </article>
            ) : (
                <section aria-label="Trạng thái trống" className="text-center py-5 bg-white rounded-4 shadow-sm border border-light-subtle mt-4 gravity-card empty-state">
                    <div className="empty-state-icon bg-light rounded-circle d-inline-flex p-4 mb-4 shadow-sm">
                        <BookOpen size={60} className="text-primary opacity-50" />
                    </div>
                    <h2 className="text-dark fw-bolder fs-4 mb-2">Chưa có môn học nào được chọn</h2>
                    <p className="text-secondary mb-0 fw-medium">Hãy sử dụng bộ lọc bên trên để chọn môn học và bắt đầu duyệt kho lưu trữ.</p>
                </section>
            )}

            {/* 4. MODAL BỐC MA TRẬN TEST */}
            {showMatrixModal && (
                <div className="modal d-block modal-blur" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(5px)' }} role="dialog" aria-labelledby="matrixModalTitle" aria-modal="true">
                    <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                        <div className="modal-content rounded-4 border-0 shadow-xl overflow-hidden gravity-modal">
                            <header className="modal-header bg-gradient-warning border-0 p-4 position-relative">
                                <h2 id="matrixModalTitle" className="modal-title fw-bolder text-dark d-flex align-items-center gap-3 fs-5">
                                    <div className="bg-white rounded-circle p-2 shadow-sm text-warning"><Zap size={22} fill="currentColor" /></div>
                                    Công cụ test thuật toán bốc đề
                                </h2>
                                <button type="button" aria-label="Đóng bảng" className="btn-close shadow-none bg-white rounded-circle p-2 opacity-100 hover-scale" onClick={() => setShowMatrixModal(false)}></button>
                            </header>
                            <div className="modal-body p-0 bg-light-subtle">
                                <table className="table align-middle mb-0 text-center bg-white">
                                    <thead className="table-light text-secondary sticky-top shadow-sm">
                                        <tr>
                                            <th scope="col" className="text-start ps-4 py-3 fw-bold text-uppercase tracking-wide">Phạm vi kiến thức</th>
                                            <th scope="col" style={{ width: '130px' }} className="fw-bold text-uppercase tracking-wide text-success">DỄ</th>
                                            <th scope="col" style={{ width: '130px' }} className="fw-bold text-uppercase tracking-wide text-warning text-dark">T.BÌNH</th>
                                            <th scope="col" style={{ width: '130px' }} className="fw-bold text-uppercase tracking-wide text-danger">KHÓ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="border-top-0">
                                        {matrixConfig.map((row, idx) => (
                                            <tr key={idx} className="hover-bg-light transition-colors">
                                                <td className="text-start ps-4 fw-semibold text-dark">{row.chapterName}</td>
                                                <td className="p-2"><input aria-label={`Số câu dễ ${row.chapterName}`} type="number" min="0" className="form-control form-control-lg text-center bg-white border-light-subtle shadow-sm rounded-3 fw-bold text-success" value={row.easy === 0 ? '' : row.easy} onChange={e => handleMatrixChange(idx, 'easy', e.target.value)} placeholder="0" /></td>
                                                <td className="p-2"><input aria-label={`Số câu TB ${row.chapterName}`} type="number" min="0" className="form-control form-control-lg text-center bg-white border-light-subtle shadow-sm rounded-3 fw-bold text-warning" value={row.medium === 0 ? '' : row.medium} onChange={e => handleMatrixChange(idx, 'medium', e.target.value)} placeholder="0" /></td>
                                                <td className="p-2"><input aria-label={`Số câu khó ${row.chapterName}`} type="number" min="0" className="form-control form-control-lg text-center bg-white border-light-subtle shadow-sm rounded-3 fw-bold text-danger" value={row.hard === 0 ? '' : row.hard} onChange={e => handleMatrixChange(idx, 'hard', e.target.value)} placeholder="0" /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <footer className="modal-footer bg-white border-top border-light-subtle p-4 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
                                <div className="fw-bold text-secondary fs-6 d-flex align-items-center bg-light px-4 py-2 rounded-pill shadow-inner">
                                    Tổng thiết lập: <span className="badge bg-danger fs-5 ms-3 rounded-pill px-3">{matrixConfig.reduce((s, r) => s + r.easy + r.medium + r.hard, 0)}</span> <span className="ms-2 fw-medium">câu</span>
                                </div>
                                <div className="d-flex gap-2">
                                    <button type="button" className="btn btn-light border border-light-subtle rounded-pill px-4 py-2 fw-semibold text-dark hover-bg-secondary transition-colors" onClick={() => setShowMatrixModal(false)}>Hủy lệnh</button>
                                    <button type="button" className="btn btn-warning bg-gradient rounded-pill fw-bold px-4 py-2 shadow-md text-dark d-flex align-items-center gap-2 hover-elevate transition-transform" onClick={handleGenerateMatrixExam}>Tiến hành bốc <ChevronRight size={18} strokeWidth={3} /></button>
                                </div>
                            </footer>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. PREVIEW KẾT QUẢ ĐỀ THI ĐÃ BỐC */}
            {mockExam.length > 0 && (
                <section aria-label="Bản xem trước đề thi đã tạo" className="mt-5 p-4 p-md-5 bg-white rounded-4 shadow-lg border-start border-warning border-5 animation-slide-up position-relative overflow-hidden gravity-preview">
                    <div className="position-absolute top-0 end-0 p-4 opacity-10"><Zap size={150} /></div>
                    <header className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center border-bottom border-warning border-opacity-25 pb-4 mb-4 position-relative z-1">
                        <h2 className="fw-bolder text-warning text-darken mb-3 mb-md-0 d-flex align-items-center gap-3 fs-4">
                            <span className="bg-warning bg-opacity-25 rounded-circle p-2 text-warning"><CheckCircle size={28} /></span>
                            Review Đề thi ({mockExam.length} câu)
                        </h2>
                        <div className="d-flex gap-2 align-items-center">
                            <button aria-label="Xáo trộn lại mã đề" className="btn btn-warning bg-opacity-10 text-warning-darker hover-bg-warning fw-bold rounded-pill px-4 py-2 d-flex align-items-center gap-2 transition-all shadow-sm border border-warning" onClick={handleShuffleExam}>
                                <RefreshCw size={18} /> Đảo mã đề
                            </button>
                            <button aria-label="Xóa đề thi nháp" className="btn btn-white border border-danger text-danger bg-danger bg-opacity-10 hover-bg-danger hover-text-white rounded-circle p-2 transition-all shadow-sm mx-1" onClick={() => setMockExam([])} title="Hủy bỏ đề này"><Trash2 size={20} /></button>
                        </div>
                    </header>

                    <div className="exam-preview-container position-relative z-1 config-scrollbar pe-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {mockExam.map((q, idx) => (
                            <article key={idx} className="mb-4 bg-light p-4 rounded-4 border border-light-subtle shadow-sm hover-elevate-sm transition-all gravity-question-card">
                                <h3 className="fw-bold text-dark mb-4 lh-base fs-6 font-inter">
                                    <span className="badge bg-primary bg-gradient rounded-pill px-3 py-2 me-2 shadow-sm fs-6">Câu {idx + 1}</span>
                                    <span style={{ fontSize: '1.05rem' }}>{q.questionText}</span>
                                </h3>
                                <div className="row g-3 px-md-3">
                                    {q.answers?.map((a: any) => (
                                        <div key={a.answerId || a.answerLabel} className="col-md-6">
                                            <div className={`p-3 rounded-4 d-flex align-items-start gap-3 h-100 transition-colors cursor-default ${a.isCorrect ? 'bg-success bg-opacity-10 text-success-darker fw-bold border border-success border-2 shadow-sm relative overflow-hidden' : 'bg-white text-secondary border border-light-subtle hover-border-primary hover-shadow'}`}>
                                                {a.isCorrect && <div className="position-absolute end-0 top-0 text-success opacity-25 p-2"><CheckCircle size={40} /></div>}
                                                <span className={`badge rounded-circle p-0 d-flex align-items-center justify-content-center shadow-sm fs-6 flex-shrink-0 z-1 ${a.isCorrect ? 'bg-success bg-gradient text-white' : 'bg-light text-secondary border'}`} style={{ width: '32px', height: '32px' }}>{a.answerLabel}</span>
                                                <span className="mt-1 flex-grow-1 z-1" style={{ fontSize: '0.95rem' }}>{a.answerText}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            <style>{`
                /* Hệ thống Biến Gravity & SEO Utilities */
                :root {
                    --gravity-primary: #0d6efd;
                    --gravity-primary-light: rgba(13, 110, 253, 0.1);
                    --gravity-radius-lg: 1rem;
                    --gravity-shadow: 0 10px 30px rgba(0,0,0,0.04);
                    --gravity-shadow-hover: 0 15px 35px rgba(0,0,0,0.08);
                    --gravity-transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                }
                
                body {
                    background-color: #f8fafc;
                    -webkit-font-smoothing: antialiased;
                }

                .font-inter { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
                .tracking-wide { letter-spacing: 0.05em; }
                
                .bg-gradient-primary { background: linear-gradient(135deg, #0d6efd 0%, #0043a8 100%); }
                .bg-gradient-warning { background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); }
                .text-warning-darker { color: #b27b00 !important; }
                .text-success-darker { color: #146c43 !important; }
                
                .glassmorphism {
                    background: rgba(255, 255, 255, 0.85) !important;
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.5) !important;
                }
                
                .gravity-card { transition: var(--gravity-transition); box-shadow: var(--gravity-shadow) !important; }
                .gravity-card:hover { transform: translateY(-2px); box-shadow: var(--gravity-shadow-hover) !important; }
                
                .hover-elevate { transition: var(--gravity-transition); }
                .hover-elevate:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important; }
                .hover-elevate-sm:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.05) !important; }
                
                .hover-bg-primary:hover { background-color: var(--gravity-primary) !important; color: white !important; }
                .hover-bg-danger:hover { background-color: #dc3545 !important; color: white !important; }
                .hover-bg-secondary:hover { background-color: #e9ecef !important; }
                
                .hover-border-primary:hover { border-color: var(--gravity-primary) !important; }
                .hover-shadow:hover { box-shadow: 0 4px 15px rgba(0,0,0,0.03) !important; }
                
                .transition-all { transition: all 0.3s ease; }
                .transition-colors { transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease; }
                .transition-transform { transition: transform 0.2s ease; }
                
                .shadow-inner { box-shadow: inset 0 2px 4px rgba(0,0,0,0.03) !important; }
                .shadow-primary { box-shadow: 0 6px 20px rgba(13, 110, 253, 0.2) !important; }
                
                /* Animations */
                .animation-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
                .animation-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                
                /* Custom scrollbar for preview */
                .config-scrollbar::-webkit-scrollbar { width: 6px; }
                .config-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .config-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
                .config-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
                
                /* Fix cho input number */
                input[type="number"]::-webkit-inner-spin-button { opacity: 1; height: 30px; }
                
                .cursor-default { cursor: default; }
            `}</style>
        </main>
    );
};

export default QuestionManager;