/**
 * LoginPage.tsx — Modern Redesign 2026
 * Thiết kế hiện đại, tối giản, focus vào trải nghiệm người dùng
 * Bảng màu: BAV Navy & Gold phối hợp SaaS Interactive
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    Lock, Mail, Eye, EyeOff, Loader2,
    ArrowRight, Sparkles, BookOpen, Users, TrendingUp, Zap
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

import authService from '../../services/auth.service';
import logoBAV from '../../assets/images/logo.jpg';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

type LoadingState = 'idle' | 'email' | 'google';

interface FormErrors {
    email?: string;
    password?: string;
}

const LoginPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState<LoadingState>('idle');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState({ email: false, password: false });
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Redirect if already logged in
    useEffect(() => {
        if (user && !loading) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    // Track mouse for the cursor glow effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const greeting = useMemo(() => {
        const h = new Date().getHours();
        if (h < 12) return 'Chào buổi sáng';
        if (h < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    }, []);

    const validate = useCallback((): FormErrors => {
        const errs: FormErrors = {};
        if (!email.trim()) errs.email = 'Vui lòng nhập email Học viện';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Email không đúng định dạng';
        if (!password) errs.password = 'Vui lòng nhập mật khẩu';
        else if (password.length < 6) errs.password = 'Mật khẩu tối thiểu 6 ký tự';
        return errs;
    }, [email, password]);

    const handleBlur = (field: 'email' | 'password') => {
        setTouched(prev => ({ ...prev, [field]: true }));
        setErrors(validate());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ email: true, password: true });
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setLoading('email');
        try {
            const res = await authService.login(email.trim(), password);
            if (res.isFirstLogin) {
                toast.info('🔐 Lần đầu đăng nhập, vui lòng đổi mật khẩu');
                navigate('/change-password');
            } else {
                toast.success('Đăng nhập thành công');
                navigate('/');
            }
        } catch (err: any) {
            setErrors({ password: err.message || 'Email hoặc mật khẩu không đúng' });
            toast.error('Đăng nhập thất bại');
            setLoading('idle');
        }
    };

    const handleGoogleLogin = async () => {
        setLoading('google');
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/dashboard` },
            });
            if (error) throw error;
        } catch (err: any) {
            toast.error('Đăng nhập Google thất bại');
            setLoading('idle');
        }
    };

    const isDisabled = loading !== 'idle';

    const features = [
        { icon: BookOpen, title: '50.000+ câu hỏi', desc: 'Đa dạng môn học, cập nhật liên tục' },
        { icon: TrendingUp, title: 'Lộ trình AI', desc: 'Cá nhân hóa theo năng lực' },
        { icon: Users, title: '15.000+ học viên', desc: 'Hệ thống thi chuẩn đầu ra' },
    ];

    return (
        <>
            <Helmet>
                <title>Đăng nhập · iReview | BAV</title>
                <meta name="description" content="Nền tảng ôn luyện thông minh cho sinh viên Học viện Ngân hàng" />
            </Helmet>

            <div className="modern-login">
                {/* Background animations */}
                <div className="login-bg">
                    <div className="bg-gradient-1" />
                    <div className="bg-gradient-2" />
                    <div className="bg-gradient-3" />
                </div>

                {/* Mouse dynamic glow */}
                <div
                    className="cursor-glow"
                    style={{
                        left: mousePosition.x,
                        top: mousePosition.y
                    }}
                />

                <div className="login-container">
                    {/* Left Panel: Branding & Impact */}
                    <div className="login-left">
                        <div className="left-content">
                            <div className="brand">
                                <div className="brand-icon">
                                    <img src={logoBAV} alt="Logo BAV" />
                                </div>
                                <div className="brand-text">
                                    <span className="brand-name">iReview</span>
                                    <span className="brand-sub">Banking Academy of Vietnam</span>
                                </div>
                            </div>

                            <div className="hero">
                                <div className="hero-badge">
                                    <Sparkles size={14} />
                                    <span>Hệ thống đào tạo thế hệ mới</span>
                                </div>
                                <h1 className="hero-title">
                                    Học tập thông minh,
                                    <br />
                                    <span className="gradient-text">vững bước tương lai</span>
                                </h1>
                                <p className="hero-desc">
                                    Nền tảng ôn luyện trắc nghiệm tích hợp AI giúp sinh viên tối ưu hóa lộ trình học tập và đạt kết quả cao nhất trong mọi kỳ thi.
                                </p>
                            </div>

                            <div className="features">
                                {features.map((feat, idx) => (
                                    <div key={idx} className="feature-card">
                                        <div className="feature-icon">
                                            <feat.icon size={20} />
                                        </div>
                                        <div className="feature-info">
                                            <h4>{feat.title}</h4>
                                            <p>{feat.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="stats">
                                <div className="stat-item">
                                    <div className="stat-value">98%</div>
                                    <div className="stat-label">Tỷ lệ hài lòng</div>
                                </div>
                                <div className="stat-divider" />
                                <div className="stat-item">
                                    <div className="stat-value">24/7</div>
                                    <div className="stat-label">Tiếp cận kiến thức</div>
                                </div>
                                <div className="stat-divider" />
                                <div className="stat-item">
                                    <div className="stat-value">MIỄN PHÍ</div>
                                    <div className="stat-label">Dành cho sinh viên</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Interactive Form */}
                    <div className="login-right">
                        <div className="form-wrapper">
                            <div className="form-header">
                                <div className="greeting-badge">
                                    <Zap size={14} />
                                    <span>{greeting}, Sẵn sàng chưa?</span>
                                </div>
                                <h2>Chào mừng trở lại</h2>
                                <p>Đăng nhập để vào cổng thông tin thi trực tuyến</p>
                            </div>

                            <form onSubmit={handleSubmit} className="login-form" noValidate>
                                <div className="input-group">
                                    <label htmlFor="student-email">Email sinh viên</label>
                                    <div className={`input-field ${touched.email && errors.email ? 'error' : ''}`}>
                                        <Mail size={18} />
                                        <input
                                            id="student-email"
                                            type="email"
                                            placeholder="mssv@hvnh.edu.vn"
                                            value={email}
                                            onChange={e => {
                                                setEmail(e.target.value);
                                                if (touched.email) setErrors(v => ({ ...v, email: undefined }));
                                            }}
                                            onBlur={() => handleBlur('email')}
                                            disabled={isDisabled}
                                            autoComplete="username"
                                        />
                                    </div>
                                    {touched.email && errors.email && (
                                        <span className="error-message">{errors.email}</span>
                                    )}
                                </div>

                                <div className="input-group">
                                    <div className="label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginBottom: '8px' }}>
                                        <label htmlFor="student-password" style={{ marginBottom: 0 }}>Mật khẩu</label>
                                        <a href="/forgot-password" className="forgot-link">Quên mật khẩu?</a>
                                    </div>
                                    <div className={`input-field ${touched.password && errors.password ? 'error' : ''}`}>
                                        <Lock size={18} />
                                        <input
                                            id="student-password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Nhập mật khẩu của bạn"
                                            value={password}
                                            onChange={e => {
                                                setPassword(e.target.value);
                                                if (touched.password) setErrors(v => ({ ...v, password: undefined }));
                                            }}
                                            onBlur={() => handleBlur('password')}
                                            disabled={isDisabled}
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {touched.password && errors.password && (
                                        <span className="error-message">{errors.password}</span>
                                    )}
                                </div>

                                <button type="submit" className="submit-btn" disabled={isDisabled}>
                                    {loading === 'email' ? (
                                        <>
                                            <Loader2 size={20} className="spinning" />
                                            Đang xác thực...
                                        </>
                                    ) : (
                                        <>
                                            Đăng nhập ngay
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>

                                <div className="divider">
                                    <span>Hoặc đăng nhập với</span>
                                </div>

                                <button
                                    type="button"
                                    className="google-btn"
                                    onClick={handleGoogleLogin}
                                    disabled={isDisabled}
                                >
                                    {loading === 'google' ? (
                                        <Loader2 size={20} className="spinning" />
                                    ) : (
                                        <svg viewBox="0 0 24 24" width="20" height="20">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                    )}
                                    <span>Tài khoản Google</span>
                                </button>
                            </form>

                            <div className="form-footer">
                                <p>
                                    Chào mừng bạn đến với hệ thống chính thức của Học viện.<br />
                                    Xem <a href="/terms">Điều khoản</a> & <a href="/privacy">Bảo mật</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;