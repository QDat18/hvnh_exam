import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Lock, Eye, EyeOff, ShieldCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import authService from '../../services/auth.service';

const getStrength = (pw: string): { score: number; label: string; color: string } => {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8)           score++;
    if (/[A-Z]/.test(pw))         score++;
    if (/[0-9]/.test(pw))         score++;
    if (/[^A-Za-z0-9]/.test(pw))  score++;
    const map = [
        { score: 1, label: 'Yếu',       color: '#EF4444' },
        { score: 2, label: 'Trung bình', color: '#F59E0B' },
        { score: 3, label: 'Khá mạnh',  color: '#10B981' },
        { score: 4, label: 'Rất mạnh',  color: '#1B2964' },
    ];
    return map[score - 1] ?? { score: 0, label: '', color: '' };
};

const ChangePasswordPage = () => {
    const [password, setPassword]               = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPw, setShowPw]                   = useState(false);
    const [showConfirm, setShowConfirm]         = useState(false);
    const [loading, setLoading]                 = useState(false);
    const [touched, setTouched]                 = useState({ pw: false, confirm: false });

    const strength   = getStrength(password);
    const pwError    = touched.pw && password.length > 0 && password.length < 6 ? 'Mật khẩu phải từ 6 ký tự.' : '';
    const matchError = touched.confirm && confirmPassword && password !== confirmPassword ? 'Mật khẩu xác nhận không khớp.' : '';
    const isMatch    = confirmPassword.length > 0 && password === confirmPassword;
    const canSubmit  = password.length >= 6 && isMatch && !loading;

    const rules = [
        { label: 'Ít nhất 6 ký tự',           ok: password.length >= 6 },
        { label: 'Có chữ hoa (A-Z)',            ok: /[A-Z]/.test(password) },
        { label: 'Có chữ số (0-9)',             ok: /[0-9]/.test(password) },
        { label: 'Mật khẩu xác nhận khớp',     ok: isMatch },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ pw: true, confirm: true });
        if (password !== confirmPassword) { toast.error('Mật khẩu xác nhận không khớp!'); return; }
        if (password.length < 6)           { toast.error('Mật khẩu phải từ 6 ký tự!');     return; }

        setLoading(true);
        try {
            await authService.changePassword(password);
            await authService.confirmFirstLogin();
            toast.success('🎉 Đổi mật khẩu thành công! Chào mừng bạn.');
            window.location.href = '/dashboard';
        } catch (error: any) {
            toast.error(error.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Styles — KHÔNG dùng overflow:hidden trên .cp-page */}
            <style>{`
                /* ★ KHÔNG overflow:hidden trên container page
                   overflow:hidden chặn scroll khi bàn phím ảo mở trên mobile */
                .cp-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    background: #0a0a0f;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    padding: 3rem 1.25rem;
                    position: relative;
                    /* overflow-x: hidden OK, overflow-y KHÔNG được hidden */
                    overflow-x: hidden;
                }

                /* Background gradient — pointer-events:none bắt buộc */
                .cp-bg {
                    position: fixed; inset: 0; z-index: 0;
                    background:
                        radial-gradient(ellipse 70% 60% at 10% 10%, rgba(27,41,100,0.45) 0%, transparent 60%),
                        radial-gradient(ellipse 60% 60% at 90% 90%, rgba(124,58,237,0.2) 0%, transparent 60%),
                        radial-gradient(ellipse 50% 50% at 50% 100%, rgba(217,146,30,0.1) 0%, transparent 60%);
                    pointer-events: none; /* ★ BẮT BUỘC */
                }
                .cp-bg::before {
                    content: '';
                    position: absolute; inset: 0;
                    background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
                    background-size: 28px 28px;
                }

                /* Card */
                .cp-card {
                    position: relative; z-index: 1;
                    background: white;
                    border-radius: 24px;
                    padding: 2.25rem 2rem;
                    width: 100%;
                    max-width: 420px;
                    box-shadow: 0 24px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06);
                    animation: cpIn 0.45s cubic-bezier(0.16,1,0.3,1) both;
                    /* ★ KHÔNG overflow:hidden — cắt focus ring và input tap area */
                }
                @keyframes cpIn {
                    from { opacity: 0; transform: scale(0.97) translateY(20px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }

                /* Top bar gradient shimmer */
                .cp-accent-bar {
                    position: absolute; top: 0; left: 0; right: 0; height: 4px;
                    border-radius: 24px 24px 0 0;
                    background: linear-gradient(90deg, #1B2964, #D9921E, #1B2964);
                    background-size: 200% 100%;
                    animation: shimmerBar 3s ease-in-out infinite;
                }
                @keyframes shimmerBar { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

                /* Icon */
                .cp-icon-wrap {
                    width: 58px; height: 58px; border-radius: 18px;
                    background: linear-gradient(135deg, #1B2964 0%, #2d3d9e 100%);
                    color: white;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1.25rem;
                    box-shadow: 0 10px 24px rgba(27,41,100,0.35);
                }

                /* Text */
                .cp-title {
                    font-size: 1.5rem; font-weight: 800; color: #1B2964;
                    letter-spacing: -0.5px; text-align: center; margin-bottom: 8px;
                }
                .cp-subtitle {
                    font-size: 0.875rem; color: #64748b; text-align: center;
                    line-height: 1.6; font-weight: 500; margin-bottom: 1.75rem;
                }

                /* Form */
                .cp-form { display: flex; flex-direction: column; gap: 1.1rem; }
                .cp-field { display: flex; flex-direction: column; gap: 6px; }
                .cp-label {
                    font-size: 0.8rem; font-weight: 700; color: #1B2964;
                    text-transform: uppercase; letter-spacing: 0.4px;
                }

                /* Input wrap */
                .cp-input-wrap {
                    position: relative;
                    display: flex;
                    align-items: center;
                    background: #f8fafc;
                    border: 2px solid #e2e8f0;
                    border-radius: 13px;
                    min-height: 50px;
                    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
                    /* ★ KHÔNG overflow:hidden */
                }
                .cp-input-wrap:focus-within {
                    border-color: #1B2964;
                    background: #fff;
                    box-shadow: 0 0 0 4px rgba(27,41,100,0.08);
                }
                .cp-error { border-color: #ef4444 !important; background: #fff5f5 !important; }
                .cp-error:focus-within { box-shadow: 0 0 0 4px rgba(239,68,68,0.1) !important; }
                .cp-ok    { border-color: #10b981 !important; }
                .cp-ok:focus-within { box-shadow: 0 0 0 4px rgba(16,185,129,0.1) !important; }

                /* Icon inside input */
                .cp-icon-left {
                    position: absolute; left: 13px;
                    color: #94a3b8;
                    pointer-events: none; /* ★ icon không nuốt touch event */
                    transition: color 0.2s; flex-shrink: 0;
                }
                .cp-input-wrap:focus-within .cp-icon-left { color: #1B2964; }

                /*
                 * ★ INPUT FIXES:
                 * - flex:1 + min-width:0: không bị overflow trong flexbox
                 * - font-size:16px: ngăn iOS Safari auto-zoom khi focus
                 * - -webkit-appearance:none: loại bỏ style mặc định iOS
                 * - position:relative + z-index:1: trên icon để tap được
                 */
                .cp-input {
                    flex: 1;
                    min-width: 0;
                    padding: 13px 42px 13px 40px;
                    border: none;
                    background: transparent;
                    font-size: 16px; /* ★ 16px ngăn iOS zoom */
                    font-weight: 500;
                    color: #1e293b;
                    outline: none;
                    font-family: inherit;
                    position: relative; z-index: 1;
                    -webkit-appearance: none;
                    appearance: none;
                }
                .cp-input::placeholder { color: #94a3b8; font-weight: 400; font-size: 0.9rem; }
                .cp-input:disabled { opacity: 0.55; cursor: not-allowed; }

                /* Eye button — padding lớn để tap dễ hơn */
                .cp-eye {
                    position: absolute; right: 10px;
                    background: none; border: none; color: #94a3b8;
                    cursor: pointer; padding: 8px;
                    display: flex; align-items: center;
                    border-radius: 8px; flex-shrink: 0;
                    transition: color 0.2s, background 0.2s;
                    position: relative; z-index: 2;
                    -webkit-tap-highlight-color: transparent;
                    /* ★ Tap target tối thiểu 44×44px theo WCAG */
                    min-width: 36px; min-height: 36px;
                    justify-content: center;
                }
                .cp-eye { position: absolute; right: 8px; } /* override */
                .cp-eye:hover { color: #1B2964; background: #f1f5f9; }
                .cp-eye:focus-visible { outline: 2px solid #1B2964; outline-offset: 1px; }

                /* Error / ok text */
                .cp-field-error {
                    font-size: 0.77rem; color: #ef4444; font-weight: 700;
                    animation: errIn 0.2s ease-out;
                }
                .cp-field-ok { font-size: 0.77rem; color: #10b981; font-weight: 700; }
                @keyframes errIn { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: translateY(0); } }

                /* Strength bar */
                .cp-strength-wrap {
                    display: flex; align-items: center; gap: 8px; margin-top: 4px;
                }
                .cp-strength-track { display: flex; gap: 4px; flex: 1; }
                .cp-strength-seg { flex: 1; height: 5px; border-radius: 10px; transition: background 0.3s; }
                .cp-strength-label {
                    font-size: 0.72rem; font-weight: 800; white-space: nowrap;
                    min-width: 68px; text-align: right;
                }

                /* Checklist */
                .cp-checklist {
                    background: #f8fafc;
                    border-radius: 13px;
                    padding: 0.875rem 1rem;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 7px 8px;
                    border: 1.5px solid #e2e8f0;
                }
                .cp-check-item {
                    display: flex; align-items: center; gap: 6px;
                    font-size: 0.78rem; font-weight: 600;
                    transition: color 0.2s;
                }
                .cp-check-ok { color: #10b981; }
                .cp-check-no { color: #94a3b8; }

                /* Submit button */
                .cp-btn {
                    width: 100%; padding: 15px;
                    font-size: 0.95rem; font-weight: 700;
                    font-family: inherit; color: white;
                    background: #1B2964;
                    border: none; border-radius: 13px;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    margin-top: 4px;
                    box-shadow: 0 8px 20px rgba(27,41,100,0.25);
                    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
                    -webkit-tap-highlight-color: transparent;
                }
                .cp-btn:not(:disabled):hover {
                    transform: translateY(-2px);
                    box-shadow: 0 14px 28px rgba(27,41,100,0.32);
                    background: #141e52;
                }
                .cp-btn:not(:disabled):active { transform: translateY(0); }
                .cp-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
                .cp-btn:focus-visible { outline: 2px solid #1B2964; outline-offset: 2px; }

                .cp-spin { animation: spin 0.85s linear infinite; flex-shrink: 0; }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* ── Responsive ── */
                @media (max-width: 480px) {
                    .cp-page { padding: 1.5rem 1rem; align-items: flex-start; }
                    .cp-card { padding: 1.75rem 1.25rem; border-radius: 20px; }
                    .cp-title { font-size: 1.35rem; }
                    .cp-checklist { grid-template-columns: 1fr; }
                    .cp-input { font-size: 16px; }
                    .cp-btn { padding: 14px; }
                }

                @media (max-width: 360px) {
                    .cp-page { padding: 1.25rem 0.75rem; }
                    .cp-card { padding: 1.5rem 1rem; }
                }

                @media (prefers-reduced-motion: reduce) {
                    *, *::before, *::after {
                        animation-duration: 0.01ms !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>
<<<<<<< HEAD
        </div>
=======

            <div className="cp-page">
                <div className="cp-bg" aria-hidden="true" />

                <div className="cp-card">
                    <div className="cp-accent-bar" aria-hidden="true" />

                    <div className="cp-icon-wrap" aria-hidden="true">
                        <ShieldCheck size={26} />
                    </div>

                    <h1 className="cp-title">Đổi Mật Khẩu</h1>
                    <p className="cp-subtitle">
                        Vì lý do bảo mật, vui lòng đặt mật khẩu mới trong lần đăng nhập đầu tiên.
                    </p>

                    <form onSubmit={handleSubmit} noValidate className="cp-form">

                        {/* Password */}
                        <div className="cp-field">
                            <label htmlFor="cp-pw" className="cp-label">Mật khẩu mới</label>
                            <div className={`cp-input-wrap${touched.pw && pwError ? ' cp-error' : ''}`}>
                                <Lock size={16} className="cp-icon-left" aria-hidden="true" />
                                <input
                                    id="cp-pw"
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onBlur={() => setTouched(t => ({ ...t, pw: true }))}
                                    placeholder="Nhập mật khẩu mới..."
                                    autoComplete="new-password"
                                    aria-describedby={pwError ? 'cp-pw-error' : 'cp-strength'}
                                    aria-invalid={touched.pw && !!pwError}
                                    disabled={loading}
                                    className="cp-input"
                                />
                                <button
                                    type="button"
                                    className="cp-eye"
                                    onClick={() => setShowPw(s => !s)}
                                    aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    aria-pressed={showPw}
                                >
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {touched.pw && pwError && (
                                <span id="cp-pw-error" className="cp-field-error" role="alert">{pwError}</span>
                            )}

                            {password && (
                                <div id="cp-strength" className="cp-strength-wrap" aria-live="polite">
                                    <div className="cp-strength-track">
                                        {[1,2,3,4].map(s => (
                                            <div key={s} className="cp-strength-seg"
                                                style={{ background: s <= strength.score ? strength.color : '#E2E8F0' }} />
                                        ))}
                                    </div>
                                    {strength.label && (
                                        <span className="cp-strength-label" style={{ color: strength.color }}>
                                            {strength.label}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Confirm */}
                        <div className="cp-field">
                            <label htmlFor="cp-confirm" className="cp-label">Xác nhận mật khẩu</label>
                            <div className={`cp-input-wrap${touched.confirm && matchError ? ' cp-error' : isMatch ? ' cp-ok' : ''}`}>
                                <Lock size={16} className="cp-icon-left" aria-hidden="true" />
                                <input
                                    id="cp-confirm"
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    onBlur={() => setTouched(t => ({ ...t, confirm: true }))}
                                    placeholder="Nhập lại mật khẩu..."
                                    autoComplete="new-password"
                                    aria-describedby={matchError ? 'cp-confirm-error' : undefined}
                                    aria-invalid={touched.confirm && !!matchError}
                                    disabled={loading}
                                    className="cp-input"
                                />
                                <button
                                    type="button"
                                    className="cp-eye"
                                    onClick={() => setShowConfirm(s => !s)}
                                    aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    aria-pressed={showConfirm}
                                >
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {touched.confirm && matchError && (
                                <span id="cp-confirm-error" className="cp-field-error" role="alert">{matchError}</span>
                            )}
                            {isMatch && (
                                <span className="cp-field-ok" role="status">Mật khẩu khớp ✓</span>
                            )}
                        </div>

                        {/* Checklist */}
                        <div className="cp-checklist" aria-label="Yêu cầu mật khẩu">
                            {rules.map((r, i) => (
                                <div key={i} className={`cp-check-item ${r.ok ? 'cp-check-ok' : 'cp-check-no'}`}>
                                    {r.ok
                                        ? <CheckCircle2 size={13} aria-hidden="true" />
                                        : <XCircle size={13} aria-hidden="true" />
                                    }
                                    <span>{r.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="cp-btn"
                            disabled={!canSubmit}
                            aria-busy={loading}
                        >
                            {loading
                                ? <><Loader2 size={18} className="cp-spin" aria-hidden="true" /> Đang lưu...</>
                                : <><ShieldCheck size={18} aria-hidden="true" /> Lưu &amp; Tiếp tục</>
                            }
                        </button>
                    </form>
                </div>
            </div>
        </>
>>>>>>> 8d091aa775be5c92b9be7db3e19c1d21a927b410
    );
};

export default ChangePasswordPage;
