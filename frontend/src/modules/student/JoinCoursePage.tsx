import React, { useState } from 'react';
import { toast } from 'react-toastify';
import courseClassService from '../../services/course-class.service';
import { KeyRound, ArrowRight, GraduationCap, CheckCircle2 } from 'lucide-react';

const JoinCoursePage: React.FC = () => {
    const [joinCode, setJoinCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleJoinClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim() || joinCode.length < 5) {
            toast.warning("⚠️ Vui lòng nhập mã tham gia hợp lệ!");
            return;
        }

        setIsLoading(true);
        setSuccessMessage('');
        try {
            // Gọi API bằng mã in hoa cho chuẩn
            const res = await courseClassService.joinClass(joinCode.toUpperCase().trim());
            const data = res.data as any;
            toast.success("🎉 " + data.message);
            setSuccessMessage(data.message);
            setJoinCode('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || "❌ Mã tham gia không đúng hoặc lớp đã đầy!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container-fluid min-vh-100 bg-light d-flex align-items-center justify-content-center py-5">
            <div className="row w-100 justify-content-center">
                <div className="col-12 col-md-8 col-lg-5">
                    
                    {/* Header Logo */}
                    <div className="text-center mb-5">
                        <div className="bg-primary bg-opacity-10 d-inline-flex p-4 rounded-circle mb-3">
                            <GraduationCap size={48} className="text-primary" />
                        </div>
                        <h2 className="fw-bold text-dark">Tham Gia Lớp Học Phần</h2>
                        <p className="text-muted">Nhập mã tham gia (Join Code) do Giảng viên hoặc Giáo vụ khoa cung cấp để vào lớp.</p>
                    </div>

                    {/* Card Form */}
                    <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
                        <div className="card-body p-5">
                            {successMessage ? (
                                <div className="text-center animation-fade-in py-4">
                                    <CheckCircle2 size={64} className="text-success mb-3" />
                                    <h4 className="fw-bold text-success mb-2">Thành Công!</h4>
                                    <p className="text-muted mb-4">{successMessage}</p>
                                    <button 
                                        className="btn btn-primary px-4 rounded-pill fw-bold"
                                        onClick={() => setSuccessMessage('')}
                                    >
                                        Tham gia lớp khác
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleJoinClass}>
                                    <div className="mb-4">
                                        <label className="form-label fw-bold text-dark mb-3">Mã lớp học phần</label>
                                        <div className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden border">
                                            <span className="input-group-text bg-white border-0 text-muted ps-3 ps-md-4">
                                                <KeyRound size={24} />
                                            </span>
                                            <input 
                                                type="text" 
                                                className="form-control border-0 px-2 px-md-3 fw-bold text-uppercase tracking-wider" 
                                                placeholder="VD: X7K9PQ"
                                                value={joinCode}
                                                onChange={(e) => setJoinCode(e.target.value)}
                                                maxLength={10}
                                                required
                                                style={{ fontSize: '1.15rem', letterSpacing: '2px' }}
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="btn btn-primary btn-lg w-100 fw-bold d-flex justify-content-center align-items-center rounded-3 shadow py-3"
                                        disabled={isLoading || !joinCode.trim()}
                                    >
                                        {isLoading ? (
                                            <><span className="spinner-border spinner-border-sm me-2"></span> Đang xác thực...</>
                                        ) : (
                                            <>Xác nhận tham gia <ArrowRight size={20} className="ms-2" /></>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                        <div className="card-footer bg-light border-0 text-center py-4 px-3 px-md-4">
                            <p className="small text-muted mb-0">
                                Nếu không có mã tham gia, vui lòng liên hệ Giảng viên bộ môn hoặc xem thông báo trên cổng thông tin Khoa.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .tracking-wider { letter-spacing: 0.1em; }
                .animation-fade-in { animation: fadeIn 0.4s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .input-group-lg .form-control:focus { box-shadow: none; }
                .input-group:focus-within { border-color: #0d6efd !important; box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25); }
                
                @media (max-width: 576px) {
                    .card-body { padding: 1.5rem !important; }
                    h2 { font-size: 1.5rem !important; }
                    p { font-size: 0.9rem !important; }
                }
            `}</style>
        </div>
    );
};

export default JoinCoursePage;