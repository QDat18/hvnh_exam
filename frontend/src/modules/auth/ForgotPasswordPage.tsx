/**
 * ForgotPasswordPage.tsx — Quên Mật Khẩu
 * Gửi email reset password qua Supabase Auth
 * Design: BAV Navy & Gold, matching LoginPage aesthetic
 */
import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, ArrowLeft, Loader2, CheckCircle2, Send, ShieldCheck } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

type PageState = 'form' | 'success';

const COOLDOWN_SECONDS = 60;

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [pageState, setPageState] = useState<PageState>('form');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [touched, setTouched] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // Validate email format
    const validateEmail = useCallback((value: string): string => {
        if (!value.trim()) return 'Vui lòng nhập email Học viện';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email không đúng định dạng';
        return '';
    }, []);

    // Start cooldown timer to prevent rate limiting
    const startCooldown = () => {
        setCooldown(COOLDOWN_SECONDS);
        const interval = setInterval(() => {
            setCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);

        const validationError = validateEmail(email);
        if (validationError) {
            setError(validationError);
            return;
        }

        // Prevent spam submissions
        if (cooldown > 0) {
            setError(`Vui lòng đợi ${cooldown}s trước khi gửi lại`);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const redirectUrl = `${window.location.origin}/update-password`;

            const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(
                email.trim(),
                { redirectTo: redirectUrl }
            );

            if (supabaseError) {
                // Handle specific Supabase errors
                if (supabaseError.message?.includes('rate limit') ||
                    supabaseError.status === 429) {
                    setError('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.');
                    startCooldown();
                } else if (supabaseError.message?.includes('not found') ||
                           supabaseError.message?.includes('invalid')) {
                    // Don't reveal if email exists or not (security best practice)
                    // Show success state anyway
                    setPageState('success');
                    startCooldown();
                } else {
                    setError(supabaseError.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
                }
                return;
            }

            // Success — switch to success state
            setPageState('success');
            startCooldown();

        } catch (err: any) {
            console.error('[FORGOT_PASSWORD] Error:', err);
            setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
        } finally {
            setLoading(false);
        }
    };

    const emailError = touched ? validateEmail(email) : '';

    return (
        <>
            <Helmet>
                <title>Quên mật khẩu · iReview | BAV</title>
                <meta name="description" content="Đặt lại mật khẩu tài khoản iReview - Học viện Ngân hàng" />
            </Helmet>

            <div className="fp-page">
                {/* Background */}
                <div className="fp-bg" aria-hidden="true">
                    <div className="fp-bg-grad-1" />
                    <div className="fp-bg-grad-2" />
                </div>

                <div className="fp-card">
                    {/* Accent bar */}
                    <div className="fp-accent-bar" aria-hidden="true" />

                    {pageState === 'form' ? (
                        <>
                            {/* Icon */}
                            <div className="fp-icon-wrap" aria-hidden="true">
                                <Mail size={28} />
                            </div>

                            <h1 className="fp-title">Quên Mật Khẩu?</h1>
                            <p className="fp-subtitle">
                                Nhập email Học viện của bạn và chúng tôi sẽ gửi
                                link đặt lại mật khẩu an toàn.
                            </p>

                            <form onSubmit={handleSubmit} noValidate className="fp-form">
                                <div className="fp-field">
                                    <label htmlFor="fp-email" className="fp-label">Email sinh viên</label>
                                    <div className={`fp-input-wrap${touched && emailError ? ' fp-error' : ''}`}>
                                        <Mail size={16} className="fp-icon-left" aria-hidden="true" />
                                        <input
                                            id="fp-email"
                                            type="email"
                                            value={email}
                                            onChange={e => {
                                                setEmail(e.target.value);
                                                if (touched) setError('');
                                            }}
                                            onBlur={() => setTouched(true)}
                                            placeholder="mssv@hvnh.edu.vn"
                                            autoComplete="email"
                                            disabled={loading}
                                            className="fp-input"
                                            aria-invalid={touched && !!emailError}
                                            aria-describedby={emailError ? 'fp-email-error' : undefined}
                                        />
                                    </div>
                                    {touched && emailError && (
                                        <span id="fp-email-error" className="fp-field-error" role="alert">
                                            {emailError}
                                        </span>
                                    )}
                                </div>

                                {/* General error */}
                                {error && (
                                    <div className="fp-general-error" role="alert">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="fp-btn"
                                    disabled={loading || cooldown > 0}
                                    aria-busy={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="fp-spin" aria-hidden="true" />
                                            Đang gửi...
                                        </>
                                    ) : cooldown > 0 ? (
                                        <>Gửi lại sau {cooldown}s</>
                                    ) : (
                                        <>
                                            <Send size={18} aria-hidden="true" />
                                            Gửi link đặt lại mật khẩu
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="fp-footer">
                                <Link to="/login" className="fp-back-link">
                                    <ArrowLeft size={16} />
                                    Quay lại đăng nhập
                                </Link>
                            </div>
                        </>
                    ) : (
                        /* ── Success State ── */
                        <div className="fp-success">
                            <div className="fp-success-icon" aria-hidden="true">
                                <CheckCircle2 size={36} />
                            </div>
                            <h1 className="fp-title">Kiểm tra Email!</h1>
                            <p className="fp-subtitle">
                                Nếu tài khoản <strong>{email}</strong> tồn tại trong hệ thống,
                                bạn sẽ nhận được email chứa link đặt lại mật khẩu.
                            </p>

                            <div className="fp-tips">
                                <div className="fp-tip-item">
                                    <ShieldCheck size={16} />
                                    <span>Link có hiệu lực trong <strong>1 giờ</strong></span>
                                </div>
                                <div className="fp-tip-item">
                                    <Mail size={16} />
                                    <span>Kiểm tra cả thư mục <strong>Spam/Junk</strong></span>
                                </div>
                            </div>

                            <div className="fp-success-actions">
                                {cooldown > 0 ? (
                                    <button className="fp-btn fp-btn-secondary" disabled>
                                        Gửi lại sau {cooldown}s
                                    </button>
                                ) : (
                                    <button
                                        className="fp-btn fp-btn-secondary"
                                        onClick={() => {
                                            setPageState('form');
                                            setError('');
                                        }}
                                    >
                                        <Send size={16} />
                                        Gửi lại email
                                    </button>
                                )}

                                <Link to="/login" className="fp-back-link">
                                    <ArrowLeft size={16} />
                                    Quay lại đăng nhập
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

                    /* ── Page ── */
                    .fp-page {
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: #0a0a0f;
                        font-family: 'Inter', system-ui, sans-serif;
                        padding: 1.25rem;
                        position: relative;
                        overflow: hidden;
                    }

                    .fp-bg {
                        position: fixed; inset: 0;
                        pointer-events: none;
                    }
                    .fp-bg-grad-1 {
                        position: absolute;
                        top: -30%; left: -20%;
                        width: 80%; height: 80%;
                        background: radial-gradient(circle, rgba(27, 41, 100, 0.4) 0%, transparent 70%);
                        animation: fpFloat 20s infinite alternate ease-in-out;
                    }
                    .fp-bg-grad-2 {
                        position: absolute;
                        bottom: -20%; right: -10%;
                        width: 60%; height: 60%;
                        background: radial-gradient(circle, rgba(217, 146, 30, 0.15) 0%, transparent 70%);
                        animation: fpFloat 18s infinite alternate-reverse ease-in-out;
                    }
                    @keyframes fpFloat {
                        0% { transform: translate(0, 0) scale(1); }
                        100% { transform: translate(40px, 30px) scale(1.1); }
                    }

                    /* ── Card ── */
                    .fp-card {
                        position: relative; z-index: 1;
                        background: #fff;
                        border-radius: 28px;
                        padding: 2.75rem 2.5rem 2.25rem;
                        width: 100%;
                        max-width: 460px;
                        box-shadow:
                            0 32px 64px -12px rgba(0,0,0,0.4),
                            0 0 0 1px rgba(255,255,255,0.05);
                        animation: fpCardIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
                    }
                    @keyframes fpCardIn {
                        from { opacity: 0; transform: scale(0.96) translateY(24px); }
                        to   { opacity: 1; transform: scale(1) translateY(0); }
                    }

                    /* Top accent bar */
                    .fp-accent-bar {
                        position: absolute;
                        top: 0; left: 0; right: 0;
                        height: 4px;
                        border-radius: 28px 28px 0 0;
                        background: linear-gradient(90deg, #1B2964, #D9921E, #1B2964);
                        background-size: 200% 100%;
                        animation: fpShimmer 4s ease-in-out infinite;
                    }
                    @keyframes fpShimmer {
                        0%   { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }

                    /* Icon */
                    .fp-icon-wrap {
                        width: 64px; height: 64px;
                        border-radius: 20px;
                        background: linear-gradient(135deg, #1B2964 0%, #2a3d7a 100%);
                        color: #D9921E;
                        display: flex; align-items: center; justify-content: center;
                        margin: 0 auto 1.5rem;
                        box-shadow: 0 12px 28px rgba(27, 41, 100, 0.35);
                    }

                    /* Text */
                    .fp-title {
                        font-size: 1.65rem;
                        font-weight: 800;
                        color: #1B2964;
                        letter-spacing: -0.5px;
                        text-align: center;
                        margin-bottom: 10px;
                    }
                    .fp-subtitle {
                        font-size: 0.9rem;
                        color: #64748b;
                        text-align: center;
                        line-height: 1.65;
                        font-weight: 500;
                        margin-bottom: 2rem;
                    }
                    .fp-subtitle strong {
                        color: #1B2964;
                        font-weight: 700;
                    }

                    /* ── Form ── */
                    .fp-form { display: flex; flex-direction: column; gap: 1.1rem; }
                    .fp-field { display: flex; flex-direction: column; gap: 6px; }

                    .fp-label {
                        font-size: 0.8rem;
                        font-weight: 700;
                        color: #1B2964;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    /* Input */
                    .fp-input-wrap {
                        position: relative;
                        display: flex;
                        align-items: center;
                    }
                    .fp-icon-left {
                        position: absolute; left: 14px;
                        color: #94a3b8;
                        pointer-events: none;
                        transition: color 0.2s;
                    }
                    .fp-input-wrap:focus-within .fp-icon-left { color: #1B2964; }

                    .fp-input {
                        width: 100%;
                        padding: 14px 16px 14px 44px;
                        font-size: 0.95rem;
                        font-family: inherit;
                        font-weight: 500;
                        color: #1e293b;
                        background: #f8fafc;
                        border: 2px solid #e2e8f0;
                        border-radius: 14px;
                        outline: none;
                        transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
                        box-sizing: border-box;
                        -webkit-appearance: none;
                    }
                    .fp-input::placeholder { color: #94a3b8; font-weight: 400; }
                    .fp-input:focus {
                        background: #fff;
                        border-color: #1B2964;
                        box-shadow: 0 0 0 4px rgba(27, 41, 100, 0.08);
                    }
                    .fp-input:disabled { opacity: 0.55; cursor: not-allowed; }

                    /* Error states */
                    .fp-error .fp-input { border-color: #ef4444; background: #fef2f2; }
                    .fp-error .fp-input:focus { box-shadow: 0 0 0 4px rgba(239,68,68,0.1); }
                    .fp-field-error {
                        font-size: 0.78rem; color: #ef4444; font-weight: 600;
                        animation: fpErrSlide 0.2s ease-out;
                    }

                    .fp-general-error {
                        padding: 12px 16px;
                        background: #fef2f2;
                        border: 1.5px solid #fecaca;
                        border-radius: 12px;
                        color: #dc2626;
                        font-size: 0.85rem;
                        font-weight: 600;
                        text-align: center;
                        animation: fpErrSlide 0.25s ease-out;
                    }

                    @keyframes fpErrSlide {
                        from { opacity: 0; transform: translateY(-4px); }
                        to   { opacity: 1; transform: translateY(0); }
                    }

                    /* Buttons */
                    .fp-btn {
                        width: 100%;
                        padding: 14px;
                        font-size: 0.95rem;
                        font-weight: 700;
                        font-family: inherit;
                        color: #fff;
                        background: linear-gradient(135deg, #1B2964 0%, #2a3d7a 100%);
                        border: none;
                        border-radius: 14px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        margin-top: 4px;
                        box-shadow: 0 8px 24px rgba(27, 41, 100, 0.25);
                        transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
                    }
                    .fp-btn:not(:disabled):hover {
                        transform: translateY(-2px);
                        box-shadow: 0 12px 32px rgba(27, 41, 100, 0.35);
                    }
                    .fp-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

                    .fp-btn-secondary {
                        background: #f1f5f9;
                        color: #1B2964;
                        border: 2px solid #e2e8f0;
                        box-shadow: none;
                    }
                    .fp-btn-secondary:not(:disabled):hover {
                        background: #e2e8f0;
                        box-shadow: none;
                    }

                    .fp-spin { animation: fpSpin 0.85s linear infinite; }
                    @keyframes fpSpin { to { transform: rotate(360deg); } }

                    /* Footer */
                    .fp-footer {
                        margin-top: 1.75rem;
                        text-align: center;
                    }

                    .fp-back-link {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        color: #1B2964;
                        font-size: 0.88rem;
                        font-weight: 700;
                        text-decoration: none;
                        transition: opacity 0.2s;
                    }
                    .fp-back-link:hover { opacity: 0.7; }

                    /* ── Success State ── */
                    .fp-success {
                        text-align: center;
                        animation: fpSuccessIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
                    }
                    @keyframes fpSuccessIn {
                        from { opacity: 0; transform: scale(0.95); }
                        to   { opacity: 1; transform: scale(1); }
                    }

                    .fp-success-icon {
                        width: 72px; height: 72px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
                        color: #16a34a;
                        display: flex; align-items: center; justify-content: center;
                        margin: 0 auto 1.5rem;
                        box-shadow: 0 8px 24px rgba(22, 163, 74, 0.15);
                    }

                    .fp-tips {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        margin-bottom: 2rem;
                        padding: 1rem 1.25rem;
                        background: #f8fafc;
                        border-radius: 14px;
                        border: 1.5px solid #e2e8f0;
                    }
                    .fp-tip-item {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        font-size: 0.85rem;
                        font-weight: 500;
                        color: #475569;
                    }
                    .fp-tip-item svg { color: #1B2964; flex-shrink: 0; }
                    .fp-tip-item strong { color: #1B2964; }

                    .fp-success-actions {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                        align-items: center;
                    }

                    /* ── Responsive ── */
                    @media (max-width: 480px) {
                        .fp-page { padding: 0.75rem; }
                        .fp-card { padding: 2rem 1.5rem 1.75rem; border-radius: 22px; }
                        .fp-title { font-size: 1.35rem; }
                    }

                    @media (prefers-reduced-motion: reduce) {
                        *, *::before, *::after {
                            animation-duration: 0.01ms !important;
                            transition-duration: 0.01ms !important;
                        }
                    }
                `}</style>
            </div>
        </>
    );
};

export default ForgotPasswordPage;
