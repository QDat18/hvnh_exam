import React from 'react';
import { Settings, ShieldAlert, Clock, RefreshCw } from 'lucide-react';

const MaintenancePage: React.FC = () => {
    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="container text-center py-5">
                <div className="mb-4 d-inline-block">
                    <div className="bg-warning bg-opacity-10 p-4 rounded-circle border border-warning border-opacity-20 shadow-sm animate-pulse">
                        <Settings size={64} className="text-warning spin" />
                    </div>
                </div>

                <h1 className="display-4 fw-bold text-dark mb-3">Hệ thống đang Bảo trì</h1>
                <p className="lead text-muted mb-5 mx-auto" style={{ maxWidth: '600px' }}>
                    Chúng tôi đang thực hiện một số nâng cấp quan trọng để cải thiện trải nghiệm của bạn.
                    Dịch vụ sẽ sớm quay trở lại. Cảm ơn sự kiên nhẫn của bạn!
                </p>

                <div className="row g-4 justify-content-center mb-5">
                    <div className="col-md-3">
                        <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
                            <ShieldAlert className="text-primary mb-3" size={32} />
                            <h5 className="fw-bold h6 mb-2">Bảo mật & Ổn định</h5>
                            <p className="small text-muted mb-0">Nâng cấp lõi hệ thống và tường lửa.</p>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
                            <Clock className="text-success mb-3" size={32} />
                            <h5 className="fw-bold h6 mb-2">Thời gian hoàn tất</h5>
                            <p className="small text-muted mb-0">Dự kiến hoàn thành trong vài phút.</p>
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-center gap-3">
                    <button
                        className="btn btn-primary rounded-pill px-5 py-3 fw-bold shadow-sm d-flex align-items-center gap-2"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw size={18} /> Tải lại trang
                    </button>
                    <a href="/login" className="btn btn-outline-secondary rounded-pill px-5 py-3 fw-bold">
                        Quay về Đăng nhập
                    </a>
                </div>

                <div className="mt-5 text-muted small fw-medium">
                    &copy; {new Date().getFullYear()} HVNH Exam System — All Rights Reserved.
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin {
                    animation: spin 8s linear infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-pulse {
                    animation: pulse 4s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default MaintenancePage;
