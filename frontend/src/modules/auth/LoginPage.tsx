/**
 * LoginPage.tsx — Phiên bản cải tiến
 *
 * THAY ĐỔI CHÍNH SO VỚI BẢN CŨ:
 * ① SEO    : react-helmet-async → <title> + <meta description> + preload ảnh nền
 * ② A11y   : <aside> badges → <div aria-hidden="true"> (badges chỉ là trang trí)
 * ③ A11y   : Inline error dưới từng input + aria-describedby + aria-invalid
 * ④ A11y   : aria-busy / aria-label đầy đủ trên các nút loading
 * ⑤ Perf   : LoadingState enum chống conflict giữa 2 luồng login song song
 * ⑥ UX     : Validation onBlur + clear lỗi khi user gõ lại
 * ⑦ Semantic: h1 = tên hệ thống (SEO), greeting xuống <p>
 * ⑧ A11y   : <div role="img"> cho cột ảnh, <nav> cho legal links
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Lock, Mail, Eye, EyeOff, Loader2, Users, BookOpen, Award } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

import authService from '../../services/auth.service';
import logoBAV from '../../assets/images/logo.jpg';
import './LoginPage.css';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ⑤ Enum thay cho 2 boolean loading riêng lẻ (tránh race condition)
type LoadingState = 'idle' | 'email' | 'google';

// ③ Kiểu lỗi inline
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
    // Chỉ hiện lỗi sau khi user rời khỏi field lần đầu
    const [touched, setTouched] = useState({ email: false, password: false });

    // Greeting theo giờ trong ngày
    const greeting = useMemo(() => {
        const h = new Date().getHours();
        if (h < 12) return 'Chào buổi sáng ☀️';
        if (h < 18) return 'Chào buổi chiều 🌤️';
        return 'Chào buổi tối 🌙';
    }, []);

    // Redirect sau khi đăng nhập thành công
    // useEffect(() => {
    //     if (!user) return;
    //     const routes: Record<string, string> = {
    //         ADMIN:         '/admin',
    //         TEACHER:       '/teacher',
    //         FACULTY_ADMIN: '/faculty-admin',
    //     };
    //     navigate(routes[user.role] ?? '/student', { replace: true });
    // }, [user, navigate]);

    // ⑥ Validation thuần — trả về object lỗi
    const validate = useCallback((): FormErrors => {
        const errs: FormErrors = {};
        if (!email.trim()) {
            errs.email = 'Vui lòng nhập email.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errs.email = 'Email không đúng định dạng.';
        }
        if (!password) {
            errs.password = 'Vui lòng nhập mật khẩu.';
        } else if (password.length < 6) {
            errs.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
        }
        return errs;
    }, [email, password]);

    const handleBlur = (field: 'email' | 'password') => {
        setTouched(prev => ({ ...prev, [field]: true }));
        setErrors(validate());
    };

    // Xử lý đăng nhập email
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
                toast.warning('🔒 Lần đầu đăng nhập, vui lòng đổi mật khẩu!');
                // Ép chuyển trang luôn, không chờ Context
                window.location.href = '/change-password';
            } else {
                toast.success('Đăng nhập thành công!');
                // Ép chuyển thẳng vào Dashboard ngay tức khắc
                window.location.href = '/dashboard';
            }
        } catch (err: any) {
            const msg = err.message || 'Email hoặc mật khẩu không đúng.';
            setErrors({ password: msg });
            toast.error('Đăng nhập thất bại.');
            setLoading('idle'); // Chỉ nhả loading khi có lỗi
        }
    };

    // Xử lý đăng nhập Google
    const handleGoogleLogin = async () => {
        setLoading('google');
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/dashboard` },
            });
            if (error) throw error;
            // OAuth redirect → page reload → loading tự reset
        } catch (err: any) {
            toast.error('Đăng nhập Google thất bại! ' + (err.message ?? ''));
            setLoading('idle');
        }
    };

    const isDisabled = loading !== 'idle';

    return (
        <>
            {/* ① Helmet: SEO meta tags */}
            <Helmet>
                <title>Đăng nhập — Hệ thống Thi & Đánh giá | Học viện Ngân hàng</title>
                <meta
                    name="description"
                    content="Đăng nhập vào hệ thống thi trắc nghiệm và đánh giá năng lực Học viện Ngân hàng Việt Nam dành cho sinh viên và giảng viên."
                />
                {/* noindex: trang login không cần index */}
                <meta name="robots" content="noindex, nofollow" />
                {/* ① Preload ảnh nền để tránh render blocking */}
                <link
                    rel="preload"
                    as="image"
                    href="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=75&fm=webp"
                />
            </Helmet>

            <main className="login-page-wrapper">

                {/* Background — aria-hidden: AT bỏ qua */}
                <div className="bg-pattern" aria-hidden="true" />
                <div className="bg-blob blob-blue" aria-hidden="true" />
                <div className="bg-blob blob-gold" aria-hidden="true" />

                {/* ② Floating badges: trang trí thuần tuý, không phải nội dung */}
                <div aria-hidden="true">
                    <div className="floating-badge badge-top-left">
                        <div className="badge-icon icon-blue"><Users size={20} /></div>
                        <div className="badge-text">
                            <strong>15.000+</strong>
                            <span>Sinh viên truy cập</span>
                        </div>
                    </div>
                    <div className="floating-badge badge-bottom-right">
                        <div className="badge-icon icon-gold"><BookOpen size={20} /></div>
                        <div className="badge-text">
                            <strong>50.000+</strong>
                            <span>Câu hỏi trắc nghiệm</span>
                        </div>
                    </div>
                    <div className="floating-badge badge-top-right">
                        <div className="badge-icon icon-green"><Award size={20} /></div>
                        <div className="badge-text">
                            <strong>Hệ thống chuẩn</strong>
                            <span>Đánh giá năng lực</span>
                        </div>
                    </div>
                </div>

                {/* Card chính */}
                <section className="login-card-centered relative-z" aria-label="Khu vực đăng nhập">

                    {/* Cột trái: ảnh minh hoạ
                        ⑧ role="img" + aria-label thay vì <article> (không phải nội dung độc lập) */}
                    <div
                        className="login-image-side"
                        role="img"
                        aria-label="Hình ảnh khuôn viên Học viện Ngân hàng Việt Nam"
                    >
                        <div className="image-overlay">
                            <div className="overlay-content">
                                <span className="glass-tag" aria-hidden="true">Phiên bản 2026</span>
                                {/* h2 vì h1 đã dùng cho tên hệ thống ở form bên phải */}
                                <h2> iReview - Hệ thống ôn luyện hỗ trợ sinh viên </h2>
                                <p>Đồng bộ, minh bạch và toàn diện. Chinh phục mọi kỳ thi tại Học viện Ngân hàng.</p>
                            </div>
                        </div>
                    </div>

                    {/* Cột phải: Form đăng nhập */}
                    <div className="login-form-side">
                        <div className="form-inner">
                            <header className="header-text">
                                <img
                                    src={logoBAV}
                                    alt="Logo Học viện Ngân hàng Việt Nam"
                                    className="bav-logo-mini"
                                    width="60"
                                    height="60"
                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                                {/* ⑦ h1 = tên hệ thống → quan trọng nhất cho SEO on-page */}
                                <h1>Học viện Ngân hàng</h1>
                                <p className="greeting-text">{greeting}</p>
                                <p className="subtitle-text">Vui lòng đăng nhập để vào hệ thống</p>
                            </header>

                            {/* ③ aria-live: Screen reader đọc lỗi tự động, ẩn về mặt thị giác */}
                            <div
                                role="alert"
                                aria-live="assertive"
                                aria-atomic="true"
                                className="sr-only"
                            >
                                {touched.email && errors.email ? `Lỗi email: ${errors.email}` : ''}
                                {touched.password && errors.password ? `Lỗi mật khẩu: ${errors.password}` : ''}
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="login-form-element"
                                noValidate
                                aria-label="Form đăng nhập hệ thống"
                            >
                                {/* Email */}
                                <div className="form-group-custom">
                                    <label htmlFor="user-email">Email HVNH</label>
                                    <div className={`input-box${touched.email && errors.email ? ' input-error' : ''}`}>
                                        <Mail className="icon-left" size={18} aria-hidden="true" />
                                        <input
                                            id="user-email"
                                            type="email"
                                            name="email"
                                            placeholder="tenban@hvnh.edu.vn"
                                            value={email}
                                            onChange={e => {
                                                setEmail(e.target.value);
                                                if (touched.email) setErrors(v => ({ ...v, email: undefined }));
                                            }}
                                            onBlur={() => handleBlur('email')}
                                            required
                                            disabled={isDisabled}
                                            autoComplete="username"
                                            aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
                                            aria-invalid={touched.email && !!errors.email}
                                        />
                                    </div>
                                    {touched.email && errors.email && (
                                        <span id="email-error" className="field-error" role="alert">
                                            {errors.email}
                                        </span>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="form-group-custom">
                                    <div className="label-row">
                                        <label htmlFor="user-password">Mật khẩu</label>
                                        <a
                                            href="/forgot-password"
                                            className="forgot-link"
                                            tabIndex={isDisabled ? -1 : 0}
                                        >
                                            Quên mật khẩu?
                                        </a>
                                    </div>
                                    <div className={`input-box${touched.password && errors.password ? ' input-error' : ''}`}>
                                        <Lock className="icon-left" size={18} aria-hidden="true" />
                                        <input
                                            id="user-password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => {
                                                setPassword(e.target.value);
                                                if (touched.password) setErrors(v => ({ ...v, password: undefined }));
                                            }}
                                            onBlur={() => handleBlur('password')}
                                            required
                                            disabled={isDisabled}
                                            autoComplete="current-password"
                                            aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
                                            aria-invalid={touched.password && !!errors.password}
                                        />
                                        {/* ③ Nút toggle với aria-pressed (trạng thái toggle) */}
                                        <button
                                            type="button"
                                            className="btn-eye"
                                            onClick={() => setShowPassword(s => !s)}
                                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                                            aria-pressed={showPassword}
                                        >
                                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                        </button>
                                    </div>
                                    {touched.password && errors.password && (
                                        <span id="password-error" className="field-error" role="alert">
                                            {errors.password}
                                        </span>
                                    )}
                                </div>

                                {/* ④ aria-busy thông báo trạng thái cho AT */}
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={isDisabled}
                                    aria-busy={loading === 'email'}
                                    aria-label={loading === 'email' ? 'Đang đăng nhập, vui lòng chờ' : 'Đăng nhập'}
                                >
                                    {loading === 'email' ? (
                                        <>
                                            <Loader2 className="icon-spin" size={19} aria-hidden="true" />
                                            <span>Đang đăng nhập...</span>
                                        </>
                                    ) : 'Đăng Nhập'}
                                </button>
                            </form>

                            <div className="divider-row">
                                <span>Hoặc tiếp tục với</span>
                            </div>

                            <button
                                type="button"
                                className="btn-google"
                                onClick={handleGoogleLogin}
                                disabled={isDisabled}
                                aria-busy={loading === 'google'}
                                aria-label={loading === 'google' ? 'Đang xử lý đăng nhập Google' : 'Đăng nhập bằng tài khoản Google'}
                            >
                                {loading === 'google' ? (
                                    <Loader2 className="icon-spin" size={19} color="#64748b" aria-hidden="true" />
                                ) : (
                                    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" focusable="false">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                )}
                                <span>{loading === 'google' ? 'Đang xử lý...' : 'Đăng nhập bằng Google'}</span>
                            </button>

                            <footer className="bottom-text">
                                <p>
                                    © {new Date().getFullYear()} Banking Academy of Vietnam.<br />
                                    Phát triển bởi <strong>IT Center</strong>.
                                </p>
                                {/* ⑧ <nav> cho nhóm link — đúng semantic */}
                                <nav className="legal-links" aria-label="Liên kết pháp lý">
                                    <a href="/terms">Điều khoản sử dụng</a>
                                    <span aria-hidden="true">•</span>
                                    <a href="/privacy">Chính sách bảo mật</a>
                                </nav>
                            </footer>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
};

export default LoginPage;