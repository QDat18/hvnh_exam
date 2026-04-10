import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Building2, MapPin, Calendar, Camera } from 'lucide-react';
import authService from '../../services/auth.service';
import { toast } from 'react-toastify';
import { getFullImageUrl } from '../../utils/urlUtils';

const UserProfile = () => {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    if (!user) return null;

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file hình ảnh hợp lệ.');
            return;
        }

        try {
            setUploadingAvatar(true);
            await authService.updateAvatar(file);
            toast.success('Cập nhật ảnh đại diện thành công!');
            // Reload page to reflect changes across the app
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message || 'Có lỗi xảy ra khi tải ảnh lên.');
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="container-fluid py-4" style={{ maxWidth: '900px' }}>
            {/* Header / Banner */}
            <div className="position-relative bg-white rounded-4 shadow-sm mb-4 overflow-hidden border">
                <div
                    className="w-100 bg-primary"
                    style={{ height: '140px', background: 'linear-gradient(135deg, #0d6efd 0%, #002b5e 100%)' }}
                />
                <div className="px-4 pb-4 d-flex flex-column flex-sm-row align-items-center align-items-sm-start gap-4 position-relative">
                    {/* Avatar */}
                    <div className="position-relative" style={{ marginTop: '-50px' }}>
                        <div
                            className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow overflow-hidden"
                            style={{ width: '120px', height: '120px', padding: '4px' }}
                        >
                            {user.avatarUrl ? (
                                <img
                                    src={getFullImageUrl(user.avatarUrl)}
                                    alt="Avatar"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                />
                            ) : (
                                <div
                                    className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bolder w-100 h-100"
                                    style={{ fontSize: '2.5rem' }}
                                >
                                    {user.fullName?.charAt(0)?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <button
                            className="btn btn-light rounded-circle shadow-sm position-absolute bottom-0 end-0 p-2 d-flex align-items-center justify-content-center"
                            style={{ width: '36px', height: '36px' }}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            title="Tải ảnh lên"
                        >
                            {uploadingAvatar ? (
                                <span className="spinner-border spinner-border-sm text-secondary" role="status" aria-hidden="true"></span>
                            ) : (
                                <Camera size={18} className="text-secondary" />
                            )}
                        </button>
                        <input
                            type="file"
                            className="d-none"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleAvatarChange}
                        />
                    </div>

                    {/* Information Summary */}
                    <div className="mt-2 text-center text-sm-start flex-grow-1">
                        <h2 className="fw-bolder text-dark mb-1">{user.role === 'ADMIN' ? 'Học viện Ngân hàng' : user.fullName}</h2>
                        <div className="d-flex align-items-center justify-content-center justify-content-sm-start gap-2 mb-2 text-muted">
                            <Shield size={16} />
                            <span className="fw-medium">
                                {user.role === 'ADMIN' ? 'Quản trị viên hệ thống' :
                                    user.role === 'TEACHER' ? 'Giảng viên' :
                                        user.role === 'STUDENT' ? 'Sinh viên' : user.role}
                            </span>
                        </div>
                        <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-sm-start gap-3 mt-3">
                            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-medium border border-primary border-opacity-25">
                                Hoạt động tích cực
                            </span>
                            <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill fw-medium border border-success border-opacity-25">
                                Đã xác thực
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="row g-4">
                {/* Left Column: Personal info */}
                <div className="col-12 col-md-5 col-lg-4">
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                            <h5 className="fw-bolder text-dark mb-0">Thông tin liên hệ</h5>
                        </div>
                        <div className="card-body pt-3">
                            <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                                <li className="d-flex align-items-start gap-3">
                                    <div className="bg-light p-2 rounded-3 text-secondary">
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <div className="text-muted small fw-medium">Email</div>
                                        <div className="fw-medium text-dark">{user.email || 'Chưa cập nhật'}</div>
                                    </div>
                                </li>
                                <li className="d-flex align-items-start gap-3">
                                    <div className="bg-light p-2 rounded-3 text-secondary">
                                        <Building2 size={18} />
                                    </div>
                                    <div>
                                        <div className="text-muted small fw-medium">Khoa / Đơn vị</div>
                                        <div className="fw-medium text-dark">{user.facultyName || 'Học viện Ngân hàng'}</div>
                                    </div>
                                </li>
                                <li className="d-flex align-items-start gap-3">
                                    <div className="bg-light p-2 rounded-3 text-secondary">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <div className="text-muted small fw-medium">Tên đăng nhập</div>
                                        <div className="fw-medium text-dark">{user.username}</div>
                                    </div>
                                </li>
                                <li className="d-flex align-items-start gap-3">
                                    <div className="bg-light p-2 rounded-3 text-secondary">
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <div className="text-muted small fw-medium">Ngày tham gia</div>
                                        <div className="fw-medium text-dark">Tháng 9, 2023</div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className="col-12 col-md-7 col-lg-8">
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                            <h5 className="fw-bolder text-dark mb-0">Cài đặt bảo mật</h5>
                        </div>
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between p-3 border rounded-3 mb-3 hover-bg-light transition-all cursor-pointer">
                                <div>
                                    <h6 className="fw-bold mb-1">Đổi mật khẩu</h6>
                                    <div className="text-muted small">Vui lòng liên hệ phòng đào tạo để lấy lại mật khẩu.</div>
                                </div>
                                <button className="btn btn-outline-primary btn-sm rounded-pill fw-medium px-3">Cập nhật</button>
                            </div>

                            <div className="d-flex align-items-center justify-content-between p-3 border rounded-3 hover-bg-light transition-all cursor-pointer">
                                <div>
                                    <h6 className="fw-bold mb-1">Xác thực hai yếu tố (2FA)</h6>
                                    <div className="text-muted small">Tăng cường lớp bảo mật bổ sung bằng số điện thoại.</div>
                                </div>
                                <button className="btn btn-light btn-sm rounded-pill fw-medium px-3 text-secondary">Thiết lập</button>
                            </div>
                        </div>
                    </div>

                    <div className="card shadow-sm border-0 rounded-4 mt-4 bg-primary bg-opacity-10 border border-primary border-opacity-25">
                        <div className="card-body p-4 d-flex align-items-center gap-3">
                            <div className="bg-white p-3 rounded-circle text-primary shadow-sm">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h6 className="fw-bold text-primary mb-1">Tài khoản an toàn</h6>
                                <div className="text-primary text-opacity-75 small fw-medium">Không phát hiện hoạt động đăng nhập nào bất thường gần đây.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .hover-bg-light:hover { background-color: #f8f9fa !important; }
                .transition-all { transition: all 0.2s ease-in-out; }
                .cursor-pointer { cursor: pointer; }
            `}</style>
        </div>
    );
};

export default UserProfile;
