import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studyHubApi } from '../../services/studyHubApi';
import courseClassService from '../../services/course-class.service';
import { BookOpen, FolderOpen, MoreVertical, Plus, Info, CheckCircle2, X } from 'lucide-react';

const MyClasses: React.FC = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // States cho tính năng Tham gia lớp
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [joinMessage, setJoinMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    // Hàm load danh sách lớp
    const fetchClasses = () => {
        setLoading(true);
        studyHubApi.getMyClasses()
            .then(res => {
                setClasses(res.data?.classes || []);
            })
            .catch(err => console.error("Lỗi lấy danh sách lớp:", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    // Xử lý khi sinh viên bấm tham gia lớp
    const handleJoinClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setIsJoining(true);
        setJoinMessage(null);

        try {
            const res = await courseClassService.joinClass(joinCode.trim());
            setJoinMessage({ type: 'success', text: res.data.message || 'Tham gia lớp thành công!' });
            setJoinCode('');
            // Load lại danh sách lớp để hiện card mới
            fetchClasses();
            
            // Tự động ẩn thông báo sau 3 giây
            setTimeout(() => {
                setShowJoinForm(false);
                setJoinMessage(null);
            }, 3000);
        } catch (error: any) {
            setJoinMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Mã lớp không hợp lệ hoặc bạn đã tham gia lớp này.' 
            });
        } finally {
            setIsJoining(false);
        }
    };

    if (loading && classes.length === 0) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted fw-bold">Đang tải không gian học tập...</p>
            </div>
        );
    }

    return (
        <div className="container-fluid py-2 animation-fade-in">
            {/* TIÊU ĐỀ & NÚT THAM GIA */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 bg-white p-3 rounded-4 shadow-sm border">
                <div className="mb-3 mb-md-0">
                    <h5 className="fw-bold mb-0 text-dark d-flex align-items-center">
                        <BookOpen className="me-2 text-primary" size={20} /> 
                        Lớp học phần của tôi
                    </h5>
                    <p className="text-muted small mb-0 mt-1">Quản lý các lớp bạn đã tham gia trong học kỳ này</p>
                </div>
                <button 
                    className={`btn rounded-pill d-flex align-items-center gap-2 px-4 shadow-sm fw-bold transition-all ${showJoinForm ? 'btn-light' : 'btn-primary'}`}
                    onClick={() => setShowJoinForm(!showJoinForm)}
                >
                    {showJoinForm ? <X size={20} /> : <Plus size={20} />}
                    {showJoinForm ? 'Hủy' : 'Tham gia lớp mới'}
                </button>
            </div>

            {/* FORM THAM GIA LỚP (Hiển thị khi bấm nút) */}
            {showJoinForm && (
                <div className="card border-0 shadow-sm rounded-4 mb-4 bg-primary bg-opacity-10 border-primary border-opacity-25 animation-slide-down">
                    <div className="card-body p-4">
                        <h6 className="fw-bold text-primary mb-3">Nhập mã lớp học (Join Code)</h6>
                        <form onSubmit={handleJoinClass} className="d-flex flex-column flex-md-row gap-3 align-items-start">
                            <div className="flex-grow-1 w-100">
                                <input 
                                    type="text" 
                                    className="form-control form-control-lg rounded-3 border-0 shadow-sm" 
                                    placeholder="VD: ABC-1234" 
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    disabled={isJoining}
                                />
                                <small className="text-muted mt-2 d-block">Mã lớp học phần do Giảng viên hoặc Khoa cung cấp.</small>
                            </div>
                            <button 
                                type="submit" 
                                className="btn btn-primary btn-lg rounded-3 px-5 fw-bold shadow-sm"
                                disabled={!joinCode.trim() || isJoining}
                            >
                                {isJoining ? <span className="spinner-border spinner-border-sm"></span> : 'Xác nhận'}
                            </button>
                        </form>
                        
                        {/* Hiển thị thông báo lỗi/thành công */}
                        {joinMessage && (
                            <div className={`alert mt-3 mb-0 border-0 rounded-3 d-flex align-items-center gap-2 ${joinMessage.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                                {joinMessage.type === 'success' ? <CheckCircle2 size={18} /> : <Info size={18} />}
                                <strong>{joinMessage.text}</strong>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* DANH SÁCH LỚP HỌC */}
            {classes.length === 0 ? (
                <div className="text-center py-5 bg-white rounded-4 border shadow-sm mt-2">
                    <div className="bg-light d-inline-flex p-4 rounded-circle mb-3">
                        <BookOpen size={48} className="text-muted opacity-50" />
                    </div>
                    <h5 className="fw-bold">Chưa có lớp học nào</h5>
                    <p className="text-muted mx-auto" style={{maxWidth: '400px'}}>
                        Bạn chưa ghi danh vào lớp học phần nào. Hãy bấm "Tham gia lớp mới" và nhập mã để bắt đầu.
                    </p>
                </div>
            ) : (
                <div className="row g-4">
                    {classes.map((cls) => (
                        <div key={cls.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                            <div className="card h-100 border shadow-sm rounded-4 overflow-hidden classroom-card transition-all">
                                {/* Header Card Gradient */}
                                <div className="p-3 text-white position-relative" style={{ 
                                    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                                    height: '110px'
                                }}>
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="overflow-hidden pe-3 w-100">
                                            <h6 className="fw-bold mb-0 text-truncate cursor-pointer hover-underline" 
                                                title={cls.name}
                                                onClick={() => navigate(`/student/class-hub/${cls.id}`)}>
                                                {cls.name}
                                            </h6>
                                            <div className="small opacity-75 mt-1">{cls.code}</div>
                                        </div>
                                        <button className="btn btn-link text-white p-0 opacity-75"><MoreVertical size={20}/></button>
                                    </div>
                                    {/* Avatar tròn đặc trưng Classroom */}
                                    <div className="position-absolute" style={{bottom: '-25px', right: '20px'}}>
                                        <div className="bg-warning text-primary rounded-circle shadow d-flex align-items-center justify-content-center fw-bold border border-white border-3" 
                                             style={{width: 54, height: 54, fontSize: '1.1rem'}}>
                                            {cls.name.charAt(0)}
                                        </div>
                                    </div>
                                </div>

                                <div className="card-body pt-5 pb-3 bg-white">
                                    <div className="mb-4 text-muted small d-flex flex-column gap-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <Info size={15} className="text-primary"/> 
                                            <span className="text-truncate">GV: <span className="fw-semibold text-dark">{cls.teacher}</span></span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <FolderOpen size={15} className="text-primary"/> 
                                            <span>{cls.totalDocs || 0} tài liệu bài giảng</span>
                                        </div>
                                    </div>
                                    
                                    <div className="d-flex justify-content-end border-top pt-3 mt-auto">
                                        <button 
                                            className="btn btn-outline-primary fw-bold rounded-pill px-4 btn-sm transition-all shadow-sm"
                                            onClick={() => navigate(`/student/class-hub/${cls.id}`)}
                                        >
                                            Vào học
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .classroom-card { border: 1px solid #e0e0e0 !important; }
                .classroom-card:hover { 
                    transform: translateY(-5px); 
                    box-shadow: 0 12px 20px rgba(0,0,0,0.1) !important; 
                    border-color: #0d6efd !important;
                }
                .hover-underline:hover { text-decoration: underline; }
                .cursor-pointer { cursor: pointer; }
                .transition-all { transition: all 0.2s ease-in-out; }
                .animation-fade-in { animation: fadeIn 0.4s ease-out; }
                .animation-slide-down { animation: slideDown 0.3s ease-out; }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default MyClasses;