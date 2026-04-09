/**
 * UpdatePasswordPage.tsx — Đặt lại mật khẩu mới
 * Trang landing từ email reset link (Supabase truyền session token qua URL)
 * Sau khi cập nhật xong → redirect thẳng vào Dashboard (session đã sẵn có)
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
import {
    Lock, Eye, EyeOff, ShieldCheck, Loader2,
    CheckCircle2, XCircle, KeyRound, AlertTriangle
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// Password strength checker
const getStrength = (pw: string): { score: number; label: string; color: string } => {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const map = [
        { score: 1, label: 'Yếu', color: '#EF4444' },
        { score: 2, label: 'Trung bình', color: '#F59E0B' },
        { score: 3, label: 'Khá mạnh', color: '#10B981' },
        { score: 4, label: 'Rất mạnh', color: '#1B2964' },
    ];
    return map[score - 1] ?? { score: 0, label: '', color: '' };
};

type PageStatus = 'ready' | 'loading' | 'success' | 'error';

const UpdatePasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [status, setStatus] = useState<PageStatus>('ready');
    const [touched, setTouched] = useState({ pw: false, confirm: false });
    const [errorMessage, setErrorMessage] = useState('');
    const [sessionReady, setSessionReady] = useState(false);

    const strength = getStrength(password);
    const pwError = touched.pw && password.length > 0 && password.length < 6 ? 'Mật khẩu phải từ 6 ký tự.' : '';
    const matchError = touched.confirm && confirmPassword && password !== confirmPassword ? 'Mật khẩu xác nhận không khớp.' : '';
    const isMatch = confirmPassword.length > 0 && password === confirmPassword;

    const rules = [
        { label: 'Ít nhất 6 ký tự', ok: password.length >= 6 },
        { label: 'Có chữ hoa (A-Z)', ok: /[A-Z]/.test(password) },
        { label: 'Có chữ số (0-9)', ok: /[0-9]/.test(password) },
        { label: 'Mật khẩu xác nhận khớp', ok: isMatch },
    ];

    const canSubmit = password.length >= 6 && isMatch && status === 'ready';

    // Verify that we have a valid session from the reset link
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                setSessionReady(true);
            } else {
                // No session — the reset link may be expired or invalid
                // Wait briefly for Supabase to process the URL hash
                const timeout = setTimeout(async () => {
                    const { data: { session: retrySession } } = await supabase.auth.getSession();
                    if (retrySession) {
                        setSessionReady(true);
                    } else {
                        setStatus('error');
                        setErrorMessage('Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu link mới.');
                    }
                }, 2000);
                return () => clearTimeout(timeout);
            }
        };

        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ pw: true, confirm: true });

        if (password !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp!');
            return;
        }
        if (password.length < 6) {
            toast.error('Mật khẩu phải từ 6 ký tự!');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                // Handle specific errors
                if (error.message?.includes('same_password') ||
                    error.message?.toLowerCase().includes('same password')) {
                    setErrorMessage('Mật khẩu mới không được trùng với mật khẩu cũ.');
                } else if (error.message?.includes('weak') ||
                           error.message?.toLowerCase().includes('too short')) {
                    setErrorMessage('Mật khẩu không đạt yêu cầu bảo mật. Vui lòng chọn mật khẩu mạnh hơn.');
                } else if (error.message?.includes('expired') ||
                           error.message?.includes('invalid')) {
                    setErrorMessage('Phiên đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu link mới.');
                    setStatus('error');
                    return;
                } else {
                    setErrorMessage(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
                }
                setStatus('ready');
                return;
            }

            // ✅ Success! Session đã có sẵn → Refresh user context → Redirect thẳng Dashboard
            setStatus('success');
            toast.success('🎉 Đổi mật khẩu thành công!');

            // Refresh user data in AuthContext then navigate to dashboard
            await refreshUser();

            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 1500);

        } catch (err: any) {
            console.error('[UPDATE_PASSWORD] Error:', err);
            setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
            setStatus('ready');
        }
    };

    // ── Error state: invalid/expired link ──
    if (status === 'error' && !sessionReady) {
        return (
            <>
                <Helmet>
                    <title>Link hết hạn · iReview | BAV</title>
                </Helmet>
                <div className="up-page">
                    <div className="up-bg" aria-hidden="true" />
                    <div className="up-card">
                        <div className="up-accent-bar" aria-hidden="true" />
                        <div className="up-error-state">
                            <div className="up-error-icon">
                                <AlertTriangle size={36} />
                            </div>
                            <h1 className="up-title">Link Đã Hết Hạn</h1>
                            <p className="up-subtitle">
                                Link đặt lại mật khẩu đã hết hạn hoặc đã được sử dụng.
                                Vui lòng yêu cầu link mới.
                            </p>
                            <button
                                className="up-btn"
                                onClick={() => navigate('/forgot-password', { replace: true })}
                            >
                                <KeyRound size={18} />
                                Yêu cầu link mới
                            </button>
                        </div>
                    </div>
                    {renderStyles()}
                </div>
            </>
        );
    }

    // ── Loading session state ──
    if (!sessionReady && status !== 'error') {
        return (
            <>
                <Helmet>
                    <title>Đang xác minh... · iReview | BAV</title>
                </Helmet>
                <div className="up-page">
                    <div className="up-bg" aria-hidden="true" />
                    <div className="up-card">
                        <div className="up-accent-bar" aria-hidden="true" />
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <Loader2 size={36} className="up-spin" style={{ color: '#1B2964', margin: '0 auto 1rem' }} />
                            <p style={{ color: '#64748b', fontWeight: 600 }}>Đang xác minh link đặt lại mật khẩu...</p>
                        </div>
                    </div>
                    {renderStyles()}
                </div>
            </>
        );
    }

    return (
        <>
            <Helmet>
                <title>Đặt lại mật khẩu · iReview | BAV</title>
                <meta name="description" content="Đặt lại mật khẩu mới cho tài khoản iReview" />
            </Helmet>

            <div className="up-page">
                <div className="up-bg" aria-hidden="true" />

                <div className="up-card">
                    <div className="up-accent-bar" aria-hidden="true" />

                    {status === 'success' ? (
                        <div className="up-success">
                            <div className="up-success-icon">
                                <CheckCircle2 size={36} />
                            </div>
                            <h1 className="up-title">Thành Công!</h1>
                            <p className="up-subtitle">
                                Mật khẩu đã được cập nhật. Đang chuyển hướng vào hệ thống...
                            </p>
                            <Loader2 size={24} className="up-spin" style={{ color: '#1B2964', margin: '0 auto' }} />
                        </div>
                    ) : (
                        <>
                            <div className="up-icon-wrap" aria-hidden="true">
                                <KeyRound size={28} />
                            </div>

                            <h1 className="up-title">Đặt Mật Khẩu Mới</h1>
                            <p className="up-subtitle">
                                Tạo mật khẩu mới cho tài khoản của bạn. Hãy chọn mật khẩu mạnh để bảo vệ tài khoản.
                            </p>

                            <form onSubmit={handleSubmit} noValidate className="up-form">
                                {/* Password field */}
                                <div className="up-field">
                                    <label htmlFor="up-pw" className="up-label">Mật khẩu mới</label>
                                    <div className={`up-input-wrap${touched.pw && pwError ? ' up-error' : ''}`}>
                                        <Lock size={16} className="up-icon-left" aria-hidden="true" />
                                        <input
                                            id="up-pw"
                                            type={showPw ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            onBlur={() => setTouched(t => ({ ...t, pw: true }))}
                                            placeholder="Nhập mật khẩu mới..."
                                            autoComplete="new-password"
                                            disabled={status === 'loading'}
                                            className="up-input"
                                            aria-invalid={touched.pw && !!pwError}
                                        />
                                        <button
                                            type="button"
                                            className="up-eye"
                                            onClick={() => setShowPw(s => !s)}
                                            aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        >
                                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {touched.pw && pwError && (
                                        <span className="up-field-error" role="alert">{pwError}</span>
                                    )}

                                    {/* Strength bar */}
                                    {password && (
                                        <div className="up-strength-wrap" aria-live="polite">
                                            <div className="up-strength-track">
                                                {[1, 2, 3, 4].map(s => (
                                                    <div
                                                        key={s}
                                                        className="up-strength-seg"
                                                        style={{ background: s <= strength.score ? strength.color : '#E5E7EB' }}
                                                    />
                                                ))}
                                            </div>
                                            {strength.label && (
                                                <span className="up-strength-label" style={{ color: strength.color }}>
                                                    {strength.label}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Confirm password */}
                                <div className="up-field">
                                    <label htmlFor="up-confirm" className="up-label">Xác nhận mật khẩu</label>
                                    <div className={`up-input-wrap${touched.confirm && matchError ? ' up-error' : isMatch ? ' up-ok' : ''}`}>
                                        <Lock size={16} className="up-icon-left" aria-hidden="true" />
                                        <input
                                            id="up-confirm"
                                            type={showConfirm ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            onBlur={() => setTouched(t => ({ ...t, confirm: true }))}
                                            placeholder="Nhập lại mật khẩu..."
                                            autoComplete="new-password"
                                            disabled={status === 'loading'}
                                            className="up-input"
                                            aria-invalid={touched.confirm && !!matchError}
                                        />
                                        <button
                                            type="button"
                                            className="up-eye"
                                            onClick={() => setShowConfirm(s => !s)}
                                            aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        >
                                            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {touched.confirm && matchError && (
                                        <span className="up-field-error" role="alert">{matchError}</span>
                                    )}
                                    {isMatch && (
                                        <span className="up-field-ok" role="status">Mật khẩu khớp ✓</span>
                                    )}
                                </div>

                                {/* Checklist */}
                                <div className="up-checklist">
                                    {rules.map((r, i) => (
                                        <div key={i} className={`up-check-item ${r.ok ? 'up-check-ok' : 'up-check-no'}`}>
                                            {r.ok
                                                ? <CheckCircle2 size={14} aria-hidden="true" />
                                                : <XCircle size={14} aria-hidden="true" />
                                            }
                                            <span>{r.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* General error */}
                                {errorMessage && (
                                    <div className="up-general-error" role="alert">
                                        {errorMessage}
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    className="up-btn"
                                    disabled={!canSubmit}
                                    aria-busy={status === 'loading'}
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <Loader2 size={18} className="up-spin" aria-hidden="true" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck size={18} aria-hidden="true" />
                                            Cập nhật mật khẩu
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                {renderStyles()}
            </div>
        </>
    );
};

/** Shared styles extracted to keep JSX clean */
function renderStyles() {
    return (
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

            .up-page {
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
            .up-bg {
                position: fixed; inset: 0;
                background:
                    radial-gradient(ellipse 60% 50% at 20% 20%, rgba(27, 41, 100, 0.35) 0%, transparent 60%),
                    radial-gradient(ellipse 50% 50% at 80% 80%, rgba(217, 146, 30, 0.12) 0%, transparent 60%);
                pointer-events: none;
            }

            .up-card {
                position: relative; z-index: 1;
                background: #fff;
                border-radius: 28px;
                padding: 2.75rem 2.5rem 2.25rem;
                width: 100%;
                max-width: 460px;
                box-shadow:
                    0 32px 64px -12px rgba(0,0,0,0.4),
                    0 0 0 1px rgba(255,255,255,0.05);
                animation: upCardIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
            }
            @keyframes upCardIn {
                from { opacity: 0; transform: scale(0.96) translateY(24px); }
                to   { opacity: 1; transform: scale(1) translateY(0); }
            }

            .up-accent-bar {
                position: absolute;
                top: 0; left: 0; right: 0;
                height: 4px;
                border-radius: 28px 28px 0 0;
                background: linear-gradient(90deg, #1B2964, #D9921E, #1B2964);
                background-size: 200% 100%;
                animation: upShimmer 4s ease-in-out infinite;
            }
            @keyframes upShimmer {
                0%   { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }

            .up-icon-wrap {
                width: 64px; height: 64px;
                border-radius: 20px;
                background: linear-gradient(135deg, #1B2964 0%, #2a3d7a 100%);
                color: #D9921E;
                display: flex; align-items: center; justify-content: center;
                margin: 0 auto 1.5rem;
                box-shadow: 0 12px 28px rgba(27, 41, 100, 0.35);
            }

            .up-title {
                font-size: 1.65rem;
                font-weight: 800;
                color: #1B2964;
                letter-spacing: -0.5px;
                text-align: center;
                margin-bottom: 10px;
            }
            .up-subtitle {
                font-size: 0.9rem;
                color: #64748b;
                text-align: center;
                line-height: 1.65;
                font-weight: 500;
                margin-bottom: 2rem;
            }

            .up-form { display: flex; flex-direction: column; gap: 1.1rem; }
            .up-field { display: flex; flex-direction: column; gap: 6px; }

            .up-label {
                font-size: 0.8rem;
                font-weight: 700;
                color: #1B2964;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .up-input-wrap {
                position: relative;
                display: flex;
                align-items: center;
            }
            .up-icon-left {
                position: absolute; left: 14px;
                color: #94a3b8;
                pointer-events: none;
                transition: color 0.2s;
            }
            .up-input-wrap:focus-within .up-icon-left { color: #1B2964; }

            .up-input {
                width: 100%;
                padding: 14px 44px 14px 44px;
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
            .up-input::placeholder { color: #94a3b8; font-weight: 400; }
            .up-input:focus {
                background: #fff;
                border-color: #1B2964;
                box-shadow: 0 0 0 4px rgba(27, 41, 100, 0.08);
            }
            .up-input:disabled { opacity: 0.55; cursor: not-allowed; }

            .up-error .up-input { border-color: #ef4444; background: #fef2f2; }
            .up-error .up-input:focus { box-shadow: 0 0 0 4px rgba(239,68,68,0.1); }
            .up-ok .up-input { border-color: #10B981; }
            .up-ok .up-input:focus { box-shadow: 0 0 0 4px rgba(16,185,129,0.12); }

            .up-field-error {
                font-size: 0.78rem; color: #ef4444; font-weight: 600;
                animation: upErrSlide 0.2s ease-out;
            }
            .up-field-ok { font-size: 0.78rem; color: #10B981; font-weight: 600; }

            .up-general-error {
                padding: 12px 16px;
                background: #fef2f2;
                border: 1.5px solid #fecaca;
                border-radius: 12px;
                color: #dc2626;
                font-size: 0.85rem;
                font-weight: 600;
                text-align: center;
                animation: upErrSlide 0.25s ease-out;
            }

            @keyframes upErrSlide {
                from { opacity: 0; transform: translateY(-4px); }
                to   { opacity: 1; transform: translateY(0); }
            }

            .up-eye {
                position: absolute; right: 12px;
                background: none; border: none;
                color: #94a3b8;
                cursor: pointer; padding: 4px;
                display: flex; align-items: center;
                border-radius: 8px;
                transition: color 0.2s, background 0.2s;
            }
            .up-eye:hover { color: #1B2964; background: #f1f5f9; }

            .up-strength-wrap {
                display: flex; align-items: center; gap: 8px; margin-top: 4px;
            }
            .up-strength-track { display: flex; gap: 4px; flex: 1; }
            .up-strength-seg {
                flex: 1; height: 5px;
                border-radius: 10px;
                transition: background 0.3s;
            }
            .up-strength-label {
                font-size: 0.75rem;
                font-weight: 800;
                white-space: nowrap;
                min-width: 72px;
                text-align: right;
            }

            .up-checklist {
                background: #f8fafc;
                border-radius: 14px;
                padding: 0.875rem 1rem;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 6px 8px;
                border: 1.5px solid #e2e8f0;
            }
            .up-check-item {
                display: flex; align-items: center; gap: 6px;
                font-size: 0.78rem; font-weight: 700;
                transition: color 0.2s;
            }
            .up-check-ok { color: #10B981; }
            .up-check-no { color: #94a3b8; }

            .up-btn {
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
                margin-top: 6px;
                box-shadow: 0 8px 24px rgba(27, 41, 100, 0.25);
                transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
            }
            .up-btn:not(:disabled):hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 32px rgba(27, 41, 100, 0.35);
            }
            .up-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

            .up-spin { animation: upSpin 0.85s linear infinite; }
            @keyframes upSpin { to { transform: rotate(360deg); } }

            /* Success state */
            .up-success {
                text-align: center;
                animation: upSuccessIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
            }
            @keyframes upSuccessIn {
                from { opacity: 0; transform: scale(0.95); }
                to   { opacity: 1; transform: scale(1); }
            }
            .up-success-icon {
                width: 72px; height: 72px;
                border-radius: 50%;
                background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
                color: #16a34a;
                display: flex; align-items: center; justify-content: center;
                margin: 0 auto 1.5rem;
                box-shadow: 0 8px 24px rgba(22, 163, 74, 0.15);
            }

            /* Error state */
            .up-error-state {
                text-align: center;
                animation: upSuccessIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
            }
            .up-error-icon {
                width: 72px; height: 72px;
                border-radius: 50%;
                background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
                color: #dc2626;
                display: flex; align-items: center; justify-content: center;
                margin: 0 auto 1.5rem;
                box-shadow: 0 8px 24px rgba(220, 38, 38, 0.12);
            }

            @media (max-width: 480px) {
                .up-page { padding: 0.75rem; }
                .up-card { padding: 2rem 1.5rem 1.75rem; border-radius: 22px; }
                .up-title { font-size: 1.35rem; }
                .up-checklist { grid-template-columns: 1fr; }
            }

            @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `}</style>
    );
}

export default UpdatePasswordPage;
