import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Lock, Save } from 'lucide-react';
import authService from '../../services/auth.service';

const ChangePasswordPage = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp!");
            return;
        }

        if (password.length < 6) {
            toast.error("Mật khẩu phải từ 6 ký tự trở lên!");
            return;
        }

        setLoading(true);
        try {
            // 1. Đổi mật khẩu trên Supabase
            await authService.changePassword(password);
            
            // 2. Gọi Backend Java để tắt cờ isFirstLogin
            await authService.confirmFirstLogin();

            toast.success("Đổi mật khẩu thành công! Chào mừng bạn.");
            
            // 3. Chuyển vào Dashboard (tải lại trang để cập nhật Context)
            window.location.href = '/dashboard'; 

        } catch (error: any) {
            toast.error(error.message || "Có lỗi xảy ra khi đổi mật khẩu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f4f6f8' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '400px' }}>
                <h2 style={{ textAlign: 'center', color: '#1a237e', marginBottom: '10px' }}>Đổi Mật Khẩu</h2>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px', fontSize: '0.9rem' }}>
                    Vì lý do bảo mật, vui lòng đổi mật khẩu trong lần đăng nhập đầu tiên.
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mật khẩu mới</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', top: '12px', left: '10px', color: '#888' }} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '6px', border: '1px solid #ddd' }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nhập lại mật khẩu</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', top: '12px', left: '10px', color: '#888' }} />
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '6px', border: '1px solid #ddd' }}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ 
                            width: '100%', padding: '12px', background: '#1a237e', color: 'white', 
                            border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold'
                        }}
                    >
                        {loading ? 'Đang xử lý...' : <><Save size={18} /> Lưu & Tiếp tục</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordPage;