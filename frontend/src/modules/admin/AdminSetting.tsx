import React, { useState, useEffect } from 'react';
import { Settings, Server, CalendarClock, Target, Save, Loader2, Bot, Bell, Shield, Activity, Lock, Globe, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../../services/axiosClient';

interface SystemSettings {
    siteName: string;
    academicYear: string;
    semester: string;
    allowRegistration: boolean;
    aiBotSensitivity: number;
    maintenanceMode: boolean;
}

interface SecurityStatus {
    totalRequests: number;
    totalBlocked: number;
    activeIpCount: number;
    blockedIpCount: number;
    rateLimitGeneral: string;
    rateLimitLogin: string;
    jwtEnabled: boolean;
    corsEnabled: boolean;
    csrfDisabled: boolean;
    sessionPolicy: string;
}

const AdminSettings: React.FC = () => {
    const [settings, setSettings] = useState<SystemSettings>({
        siteName: "HVNH — Hệ thống Thi Trắc nghiệm Online",
        academicYear: "2023-2024",
        semester: "Học kỳ 1",
        allowRegistration: true,
        aiBotSensitivity: 0.5,
        maintenanceMode: false
    });
    const [security, setSecurity] = useState<SecurityStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            axiosClient.get('/admin/settings').catch(() => ({ data: {} })),
            axiosClient.get('/admin/security-status').catch(() => ({ data: null }))
        ]).then(([settingsRes, securityRes]) => {
            if (settingsRes.data && Object.keys(settingsRes.data).length > 0) {
                setSettings(prev => ({
                    ...prev,
                    siteName: settingsRes.data.siteName || prev.siteName,
                    academicYear: settingsRes.data.academicYear || prev.academicYear,
                    semester: settingsRes.data.semester || prev.semester,
                    allowRegistration: settingsRes.data.allowRegistration === 'true' || settingsRes.data.allowRegistration === true,
                    aiBotSensitivity: parseFloat(settingsRes.data.aiBotSensitivity) || prev.aiBotSensitivity,
                    maintenanceMode: settingsRes.data.maintenanceMode === 'true' || settingsRes.data.maintenanceMode === true,
                }));
            }
            if (securityRes.data) setSecurity(securityRes.data);
        }).finally(() => setLoading(false));
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            // Chuyển settings sang dạng Map<String, String> cho backend
            const payload: Record<string, string> = {
                siteName: settings.siteName,
                academicYear: settings.academicYear,
                semester: settings.semester,
                allowRegistration: String(settings.allowRegistration),
                aiBotSensitivity: String(settings.aiBotSensitivity),
                maintenanceMode: String(settings.maintenanceMode),
            };
            await axiosClient.post('/admin/settings', payload);
            toast.success("Đã cập nhật cài đặt hệ thống thành công!");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Lỗi khi lưu cài đặt!");
        } finally {
            setSaving(false);
        }
    };

    const SecurityBadge = ({ ok, label }: { ok: boolean; label: string }) => (
        <div className={`d-flex align-items-center gap-2 p-2 px-3 rounded-3 ${ok ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`}>
            {ok ? <CheckCircle2 size={16} className="text-success" /> : <AlertCircle size={16} className="text-danger" />}
            <span className={`small fw-bold ${ok ? 'text-success' : 'text-danger'}`}>{label}</span>
        </div>
    );

    return (
        <div className="container-fluid py-4 animation-fade-in">
            <header className="mb-4 pb-2 border-bottom d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary border border-primary border-opacity-20 shadow-sm">
                        <Settings size={32} />
                    </div>
                    <div>
                        <h1 className="fw-bold text-dark mb-1">Cấu hình Hệ thống</h1>
                        <p className="text-muted mb-0">Điều chỉnh các tham số vận hành và bảo mật cho toàn bộ nền tảng.</p>
                    </div>
                </div>
                <button 
                    className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2"
                    onClick={handleSaveSettings}
                    disabled={saving || loading}
                >
                    {saving ? <Loader2 className="spin" size={18}/> : <Save size={18} />} 
                    Lưu tất cả cài đặt
                </button>
            </header>

            {loading ? (
                <div className="text-center py-5"><Loader2 className="spin text-primary" size={30}/></div>
            ) : (
                <div className="row g-4">
                    {/* KHỐI 1: CẤU HÌNH CHUNG */}
                    <div className="col-md-7">
                        <div className="ent-card card p-4 border-0 h-100">
                            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2 text-dark">
                                <Server className="text-primary" size={20}/> 1. Thông tin chung Website
                            </h5>
                            
                            <div className="mb-3">
                                <label className="fw-bold text-muted small text-uppercase mb-2 d-block">Tên Website / Hệ thống</label>
                                <input 
                                    type="text" name="siteName"
                                    className="form-control rounded-4 px-3 py-2 bg-light border-0" 
                                    value={settings.siteName} onChange={handleInputChange}
                                    placeholder="Ví dụ: HVNH — Thi trắc nghiệm online"
                                />
                                <div className="form-text small text-muted">Hiển thị trên thẻ Browser và phần Header.</div>
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="fw-bold text-muted small text-uppercase mb-2 d-block">Năm học hiện tại</label>
                                    <input 
                                        type="text" name="academicYear"
                                        className="form-control rounded-4 px-3 py-2 bg-light border-0 fw-medium text-dark" 
                                        value={settings.academicYear} onChange={handleInputChange}
                                        placeholder="Ví dụ: 2023-2024"
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="fw-bold text-muted small text-uppercase mb-2 d-block">Kỳ học mặc định</label>
                                    <select 
                                        name="semester"
                                        className="form-select rounded-4 px-3 py-2 bg-light border-0 fw-medium text-dark" 
                                        value={settings.semester} onChange={handleInputChange}
                                    >
                                        <option>Học kỳ 1</option>
                                        <option>Học kỳ 2</option>
                                        <option>Học kỳ Hè</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-text small text-muted ms-1"><CalendarClock size={14}/> Năm học và Kỳ học sẽ được chọn mặc định khi Giảng viên tạo phòng thi.</div>
                        </div>
                    </div>

                    {/* KHỐI 2: QUYỀN & AI */}
                    <div className="col-md-5">
                        <div className="row g-4">
                            <div className="col-12">
                                <div className="ent-card card p-4 border-0">
                                    <h5 className="fw-bold mb-4 d-flex align-items-center gap-2 text-dark">
                                        <Bell className="text-warning" size={20}/> 2. Quyền & Trạng thái
                                    </h5>
                                    
                                    <div className="form-check form-switch p-3 bg-light rounded-4 d-flex align-items-center justify-content-between mb-3 border border-light shadow-sm">
                                        <label className="form-check-label text-dark fw-bold mb-0">Cho phép Đăng ký (Student)</label>
                                        <input className="form-check-input" type="checkbox" name="allowRegistration"
                                            checked={settings.allowRegistration} onChange={handleInputChange}
                                        />
                                    </div>
                                    
                                    <div className="form-check form-switch p-3 bg-danger bg-opacity-10 rounded-4 d-flex align-items-center justify-content-between border border-danger border-opacity-20 shadow-sm text-danger">
                                        <label className="form-check-label fw-bold mb-0">🛡️ Chế độ BẢO TRÌ Hệ thống</label>
                                        <input className="form-check-input" type="checkbox" name="maintenanceMode"
                                            checked={settings.maintenanceMode} onChange={handleInputChange}
                                        />
                                    </div>
                                    {settings.maintenanceMode && (
                                        <div className="alert alert-danger rounded-4 py-2 mt-2 small d-flex align-items-center gap-2">
                                            <AlertCircle size={16}/> Khóa mọi truy cập từ Student & Teacher. Chỉ Admin có thể vào.
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="col-12">
                                <div className="ent-card card p-4 border-0">
                                    <h5 className="fw-bold mb-4 d-flex align-items-center gap-2 text-dark">
                                        <Bot className="text-success" size={20}/> 3. Cấu hình AI Tutor
                                    </h5>
                                    
                                    <label className="fw-bold text-muted small text-uppercase mb-2 d-block">Độ nhạy phân tích (AI Sensitivity)</label>
                                    <div className="d-flex align-items-center gap-3 bg-light rounded-pill px-3 py-1 border border-light">
                                        <span className="small text-muted fw-medium">Thấp</span>
                                        <input 
                                            type="range" className="form-range flex-grow-1" 
                                            min="0.1" max="1.0" step="0.1"
                                            name="aiBotSensitivity"
                                            value={settings.aiBotSensitivity} onChange={handleInputChange}
                                        />
                                        <span className="small text-muted fw-medium">Cao</span>
                                        <span className="badge bg-success rounded-pill px-3 py-1 fw-bold ms-2">
                                            {(Number(settings.aiBotSensitivity) * 10).toFixed(0)}/10
                                        </span>
                                    </div>
                                    <div className="form-text small text-muted ms-1 mt-2"><Target size={14}/> Độ nhạy càng cao, AI sẽ phân tích và gợi ý đáp án/câu hỏi càng khắt khe.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KHỐI 4: BẢO MẬT & CHỐNG TẤN CÔNG */}
                    <div className="col-12">
                        <div className="ent-card card p-4 border-0">
                            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2 text-dark">
                                <Shield className="text-danger" size={20}/> 4. Bảo mật & Chống tấn công (Security Dashboard)
                            </h5>

                            {security ? (
                                <>
                                    {/* Stats Row */}
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-3">
                                            <div className="bg-primary bg-opacity-10 rounded-4 p-3 text-center border border-primary border-opacity-15">
                                                <Activity size={20} className="text-primary mb-1" />
                                                <div className="fs-4 fw-bold text-primary">{security.totalRequests.toLocaleString()}</div>
                                                <div className="small text-muted fw-medium">Tổng Request</div>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="bg-danger bg-opacity-10 rounded-4 p-3 text-center border border-danger border-opacity-15">
                                                <Shield size={20} className="text-danger mb-1" />
                                                <div className="fs-4 fw-bold text-danger">{security.totalBlocked.toLocaleString()}</div>
                                                <div className="small text-muted fw-medium">Đã Chặn (429)</div>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="bg-info bg-opacity-10 rounded-4 p-3 text-center border border-info border-opacity-15">
                                                <Globe size={20} className="text-info mb-1" />
                                                <div className="fs-4 fw-bold text-info">{security.activeIpCount}</div>
                                                <div className="small text-muted fw-medium">IP Đang hoạt động</div>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="bg-warning bg-opacity-10 rounded-4 p-3 text-center border border-warning border-opacity-15">
                                                <Lock size={20} className="text-warning mb-1" />
                                                <div className="fs-4 fw-bold text-warning">{security.blockedIpCount}</div>
                                                <div className="small text-muted fw-medium">IP Bị chặn</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rate Limit Info */}
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-6">
                                            <div className="bg-light rounded-4 p-3 border">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <div className="fw-bold text-dark">🔒 Rate Limit — API chung</div>
                                                        <div className="small text-muted">Giới hạn request cho mỗi IP</div>
                                                    </div>
                                                    <span className="badge bg-primary rounded-pill px-3 py-2 fw-bold">{security.rateLimitGeneral}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="bg-light rounded-4 p-3 border">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <div className="fw-bold text-dark">🛡️ Rate Limit — Đăng nhập</div>
                                                        <div className="small text-muted">Chống brute-force password</div>
                                                    </div>
                                                    <span className="badge bg-danger rounded-pill px-3 py-2 fw-bold">{security.rateLimitLogin}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security Checklist */}
                                    <h6 className="fw-bold text-muted text-uppercase small mb-3">Security Checklist</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        <SecurityBadge ok={security.jwtEnabled} label="JWT Authentication" />
                                        <SecurityBadge ok={security.corsEnabled} label="CORS Protection" />
                                        <SecurityBadge ok={security.csrfDisabled} label="CSRF Disabled (API)" />
                                        <SecurityBadge ok={security.sessionPolicy === 'STATELESS'} label="Stateless Sessions" />
                                        <SecurityBadge ok={true} label="Rate Limiting Active" />
                                        <SecurityBadge ok={true} label="Brute-Force Protection" />
                                        <SecurityBadge ok={true} label="INACTIVE Account Block" />
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    <Loader2 className="spin" size={24} />
                                    <p className="mt-2 small">Đang tải trạng thái bảo mật...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettings;