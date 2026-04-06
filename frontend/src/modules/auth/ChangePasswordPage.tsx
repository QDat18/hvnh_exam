import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Lock, Eye, EyeOff, ShieldCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import authService from '../../services/auth.service';

// Kiểm tra độ mạnh mật khẩu
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
        { score: 4, label: 'Rất mạnh', color: '#4F46E5' },
    ];
    return map[score - 1] ?? { score: 0, label: '', color: '' };
};

const ChangePasswordPage = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState({ pw: false, confirm: false });

    const strength = getStrength(password);

    const pwError = touched.pw && password.length > 0 && password.length < 6 ? 'Mật khẩu phải từ 6 ký tự.' : '';
    const matchError = touched.confirm && confirmPassword && password !== confirmPassword ? 'Mật khẩu xác nhận không khớp.' : '';
    const isMatch = confirmPassword.length > 0 && password === confirmPassword;

    // Checklist rules
    const rules = [
        { label: 'Ít nhất 6 ký tự', ok: password.length >= 6 },
        { label: 'Có chữ hoa (A-Z)', ok: /[A-Z]/.test(password) },
        { label: 'Có chữ số (0-9)', ok: /[0-9]/.test(password) },
        { label: 'Mật khẩu xác nhận khớp', ok: isMatch },
    ];

    const canSubmit = password.length >= 6 && isMatch && !loading;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ pw: true, confirm: true });

        if (password !== confirmPassword) { toast.error('Mật khẩu xác nhận không khớp!'); return; }
        if (password.length < 6) { toast.error('Mật khẩu phải từ 6 ký tự!'); return; }

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
        <div className="cp-page">
            {/* Background */}
            <div className="cp-bg" aria-hidden="true" />

            {/* Card */}
            <div className="cp-card">

                {/* Top accent bar */}
                <div className="cp-accent-bar" aria-hidden="true" />

                {/* Icon header */}
                <div className="cp-icon-wrap" aria-hidden="true">
                    <ShieldCheck size={28} />
                </div>

                <h1 className="cp-title">Đổi Mật Khẩu</h1>
                <p className="cp-subtitle">
                    Vì lý do bảo mật, vui lòng đặt mật khẩu mới trong lần đăng nhập đầu tiên.
                </p>

                <form onSubmit={handleSubmit} noValidate className="cp-form">

                    {/* Password field */}
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
                                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                        {touched.pw && pwError && (
                            <span id="cp-pw-error" className="cp-field-error" role="alert">{pwError}</span>
                        )}

                        {/* Strength bar */}
                        {password && (
                            <div id="cp-strength" className="cp-strength-wrap" aria-live="polite" aria-label={`Độ mạnh mật khẩu: ${strength.label}`}>
                                <div className="cp-strength-track">
                                    {[1, 2, 3, 4].map(s => (
                                        <div
                                            key={s}
                                            className="cp-strength-seg"
                                            style={{ background: s <= strength.score ? strength.color : '#E5E7EB' }}
                                        />
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

                    {/* Confirm password field */}
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
                                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
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
                                    ? <CheckCircle2 size={14} aria-hidden="true" />
                                    : <XCircle size={14} aria-hidden="true" />
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
                        aria-label={loading ? 'Đang lưu mật khẩu' : 'Lưu mật khẩu mới'}
                    >
                        {loading
                            ? <><Loader2 size={18} className="cp-spin" aria-hidden="true" /> Đang lưu...</>
                            : <><ShieldCheck size={18} aria-hidden="true" /> Lưu &amp; Tiếp tục</>
                        }
                    </button>
                </form>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=DM+Sans:wght@700;900&display=swap');

                /* ── Page ── */
                .cp-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #F5F3FF;
                    font-family: 'Nunito', sans-serif;
                    padding: 1.25rem;
                    position: relative;
                    overflow: hidden;
                }

                .cp-bg {
                    position: absolute; inset: 0;
                    background:
                        radial-gradient(ellipse 70% 60% at 15% 15%, rgba(79,70,229,0.12) 0%, transparent 60%),
                        radial-gradient(ellipse 60% 60% at 85% 85%, rgba(124,58,237,0.1) 0%, transparent 60%);
                    pointer-events: none;
                }
                .cp-bg::before {
                    content: '';
                    position: absolute; inset: 0;
                    background-image: radial-gradient(circle, rgba(79,70,229,0.1) 1px, transparent 1px);
                    background-size: 28px 28px;
                }

                /* ── Card ── */
                .cp-card {
                    position: relative; z-index: 1;
                    background: white;
                    border-radius: 28px;
                    padding: 2.5rem 2.25rem 2.25rem;
                    width: 100%;
                    max-width: 440px;
                    box-shadow:
                        0 32px 64px -12px rgba(79,70,229,0.18),
                        0 0 0 1px rgba(79,70,229,0.06);
                    animation: cpIn 0.45s cubic-bezier(0.16,1,0.3,1) both;
                }

                @keyframes cpIn {
                    from { opacity: 0; transform: scale(0.97) translateY(20px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }

                /* Top bar */
                .cp-accent-bar {
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 4px;
                    border-radius: 28px 28px 0 0;
                    background: linear-gradient(90deg, #4F46E5, #7C3AED, #4F46E5);
                    background-size: 200% 100%;
                    animation: shimmerBar 3s ease-in-out infinite;
                }
                @keyframes shimmerBar {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                /* Icon */
                .cp-icon-wrap {
                    width: 60px; height: 60px;
                    border-radius: 20px;
                    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
                    color: white;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1.25rem;
                    box-shadow: 0 10px 24px rgba(79,70,229,0.3);
                }

                /* Header text */
                .cp-title {
                    font-size: 1.55rem;
                    font-weight: 900;
                    color: #1E1B4B;
                    font-family: 'DM Sans', sans-serif;
                    letter-spacing: -0.5px;
                    text-align: center;
                    margin-bottom: 8px;
                }

                .cp-subtitle {
                    font-size: 0.85rem;
                    color: #6B7280;
                    text-align: center;
                    line-height: 1.6;
                    font-weight: 600;
                    margin-bottom: 1.75rem;
                }

                /* ── Form ── */
                .cp-form { display: flex; flex-direction: column; gap: 1.1rem; }

                .cp-field { display: flex; flex-direction: column; gap: 6px; }

                .cp-label {
                    font-size: 0.78rem;
                    font-weight: 800;
                    color: #1E1B4B;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                /* Input wrap */
                .cp-input-wrap {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .cp-icon-left {
                    position: absolute; left: 14px;
                    color: #9CA3AF;
                    pointer-events: none;
                    transition: color 0.2s;
                }
                .cp-input-wrap:focus-within .cp-icon-left { color: #4F46E5; }

                .cp-input {
                    width: 100%;
                    padding: 12px 42px 12px 42px;
                    font-size: 0.9rem;
                    font-family: 'Nunito', sans-serif;
                    font-weight: 600;
                    color: #1E1B4B;
                    background: #F9F7FF;
                    border: 1.5px solid rgba(79,70,229,0.15);
                    border-radius: 14px;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
                    box-sizing: border-box;
                }
                .cp-input::placeholder { color: #9CA3AF; font-weight: 500; }
                .cp-input:focus {
                    background: white;
                    border-color: #4F46E5;
                    box-shadow: 0 0 0 4px rgba(79,70,229,0.12);
                }
                .cp-input:hover:not(:disabled) {
                    border-color: rgba(79,70,229,0.3);
                    background: #F3EFFE;
                }
                .cp-input:disabled { opacity: 0.55; cursor: not-allowed; }
                .cp-input:focus-visible { outline: 2px solid #4F46E5; outline-offset: 1px; }

                /* Error / OK variants */
                .cp-error .cp-input  { border-color: #EF4444; background: #FEF2F2; }
                .cp-error .cp-input:focus { box-shadow: 0 0 0 4px rgba(239,68,68,0.12); }
                .cp-ok .cp-input     { border-color: #10B981; }
                .cp-ok .cp-input:focus { box-shadow: 0 0 0 4px rgba(16,185,129,0.12); }

                .cp-field-error {
                    font-size: 0.77rem; color: #EF4444; font-weight: 700;
                    animation: errSlide 0.2s ease-out;
                }
                .cp-field-ok {
                    font-size: 0.77rem; color: #10B981; font-weight: 700;
                }
                @keyframes errSlide {
                    from { opacity: 0; transform: translateY(-3px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* Eye button */
                .cp-eye {
                    position: absolute; right: 12px;
                    background: none; border: none;
                    color: #9CA3AF;
                    cursor: pointer; padding: 4px;
                    display: flex; align-items: center;
                    border-radius: 8px;
                    transition: color 0.2s, background 0.2s;
                }
                .cp-eye:hover { color: #4F46E5; background: #EEF2FF; }
                .cp-eye:focus-visible { outline: 2px solid #4F46E5; outline-offset: 1px; }

                /* Strength bar */
                .cp-strength-wrap {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 4px;
                }
                .cp-strength-track {
                    display: flex; gap: 4px; flex: 1;
                }
                .cp-strength-seg {
                    flex: 1; height: 5px;
                    border-radius: 10px;
                    transition: background 0.3s;
                }
                .cp-strength-label {
                    font-size: 0.75rem;
                    font-weight: 800;
                    white-space: nowrap;
                    min-width: 72px;
                    text-align: right;
                }

                /* Checklist */
                .cp-checklist {
                    background: #F9F7FF;
                    border-radius: 14px;
                    padding: 0.875rem 1rem;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px 8px;
                    border: 1.5px solid rgba(79,70,229,0.1);
                }
                .cp-check-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.78rem;
                    font-weight: 700;
                    transition: color 0.2s;
                }
                .cp-check-ok { color: #10B981; }
                .cp-check-no { color: #9CA3AF; }

                /* Button */
                .cp-btn {
                    width: 100%;
                    padding: 13px;
                    font-size: 0.95rem;
                    font-weight: 800;
                    font-family: 'Nunito', sans-serif;
                    color: white;
                    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
                    border: none;
                    border-radius: 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 6px;
                    box-shadow: 0 8px 24px rgba(79,70,229,0.32);
                    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
                    will-change: transform, box-shadow;
                }
                .cp-btn:not(:disabled):hover {
                    transform: translateY(-2px) scale(1.01);
                    box-shadow: 0 12px 32px rgba(79,70,229,0.42);
                }
                .cp-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }
                .cp-btn:focus-visible { outline: 2px solid #4F46E5; outline-offset: 2px; }

                .cp-spin {
                    animation: spin 0.85s linear infinite;
                    flex-shrink: 0;
                }
                @keyframes spin { 100% { transform: rotate(360deg); } }

                /* ── Responsive ── */
                @media (max-width: 480px) {
                    .cp-page { padding: 0.75rem; }
                    .cp-card { padding: 2rem 1.5rem 1.75rem; border-radius: 22px; }
                    .cp-title { font-size: 1.3rem; }
                    .cp-checklist { grid-template-columns: 1fr; }
                }

                @media (prefers-reduced-motion: reduce) {
                    *, *::before, *::after {
                        animation-duration: 0.01ms !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ChangePasswordPage; import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Lock, Eye, EyeOff, ShieldCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import authService from '../../services/auth.service';

// Kiểm tra độ mạnh mật khẩu
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
        { score: 4, label: 'Rất mạnh', color: '#4F46E5' },
    ];
    return map[score - 1] ?? { score: 0, label: '', color: '' };
};

const ChangePasswordPage = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState({ pw: false, confirm: false });

    const strength = getStrength(password);

    const pwError = touched.pw && password.length > 0 && password.length < 6 ? 'Mật khẩu phải từ 6 ký tự.' : '';
    const matchError = touched.confirm && confirmPassword && password !== confirmPassword ? 'Mật khẩu xác nhận không khớp.' : '';
    const isMatch = confirmPassword.length > 0 && password === confirmPassword;

    // Checklist rules
    const rules = [
        { label: 'Ít nhất 6 ký tự', ok: password.length >= 6 },
        { label: 'Có chữ hoa (A-Z)', ok: /[A-Z]/.test(password) },
        { label: 'Có chữ số (0-9)', ok: /[0-9]/.test(password) },
        { label: 'Mật khẩu xác nhận khớp', ok: isMatch },
    ];

    const canSubmit = password.length >= 6 && isMatch && !loading;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ pw: true, confirm: true });

        if (password !== confirmPassword) { toast.error('Mật khẩu xác nhận không khớp!'); return; }
        if (password.length < 6) { toast.error('Mật khẩu phải từ 6 ký tự!'); return; }

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
        <div className="cp-page">
            {/* Background */}
            <div className="cp-bg" aria-hidden="true" />

            {/* Card */}
            <div className="cp-card">

                {/* Top accent bar */}
                <div className="cp-accent-bar" aria-hidden="true" />

                {/* Icon header */}
                <div className="cp-icon-wrap" aria-hidden="true">
                    <ShieldCheck size={28} />
                </div>

                <h1 className="cp-title">Đổi Mật Khẩu</h1>
                <p className="cp-subtitle">
                    Vì lý do bảo mật, vui lòng đặt mật khẩu mới trong lần đăng nhập đầu tiên.
                </p>

                <form onSubmit={handleSubmit} noValidate className="cp-form">

                    {/* Password field */}
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
                                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                        {touched.pw && pwError && (
                            <span id="cp-pw-error" className="cp-field-error" role="alert">{pwError}</span>
                        )}

                        {/* Strength bar */}
                        {password && (
                            <div id="cp-strength" className="cp-strength-wrap" aria-live="polite" aria-label={`Độ mạnh mật khẩu: ${strength.label}`}>
                                <div className="cp-strength-track">
                                    {[1, 2, 3, 4].map(s => (
                                        <div
                                            key={s}
                                            className="cp-strength-seg"
                                            style={{ background: s <= strength.score ? strength.color : '#E5E7EB' }}
                                        />
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

                    {/* Confirm password field */}
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
                                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
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
                                    ? <CheckCircle2 size={14} aria-hidden="true" />
                                    : <XCircle size={14} aria-hidden="true" />
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
                        aria-label={loading ? 'Đang lưu mật khẩu' : 'Lưu mật khẩu mới'}
                    >
                        {loading
                            ? <><Loader2 size={18} className="cp-spin" aria-hidden="true" /> Đang lưu...</>
                            : <><ShieldCheck size={18} aria-hidden="true" /> Lưu &amp; Tiếp tục</>
                        }
                    </button>
                </form>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=DM+Sans:wght@700;900&display=swap');

                /* ── Page ── */
                .cp-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #F5F3FF;
                    font-family: 'Nunito', sans-serif;
                    padding: 1.25rem;
                    position: relative;
                    overflow: hidden;
                }

                .cp-bg {
                    position: absolute; inset: 0;
                    background:
                        radial-gradient(ellipse 70% 60% at 15% 15%, rgba(79,70,229,0.12) 0%, transparent 60%),
                        radial-gradient(ellipse 60% 60% at 85% 85%, rgba(124,58,237,0.1) 0%, transparent 60%);
                    pointer-events: none;
                }
                .cp-bg::before {
                    content: '';
                    position: absolute; inset: 0;
                    background-image: radial-gradient(circle, rgba(79,70,229,0.1) 1px, transparent 1px);
                    background-size: 28px 28px;
                }

                /* ── Card ── */
                .cp-card {
                    position: relative; z-index: 1;
                    background: white;
                    border-radius: 28px;
                    padding: 2.5rem 2.25rem 2.25rem;
                    width: 100%;
                    max-width: 440px;
                    box-shadow:
                        0 32px 64px -12px rgba(79,70,229,0.18),
                        0 0 0 1px rgba(79,70,229,0.06);
                    animation: cpIn 0.45s cubic-bezier(0.16,1,0.3,1) both;
                }

                @keyframes cpIn {
                    from { opacity: 0; transform: scale(0.97) translateY(20px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }

                /* Top bar */
                .cp-accent-bar {
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 4px;
                    border-radius: 28px 28px 0 0;
                    background: linear-gradient(90deg, #4F46E5, #7C3AED, #4F46E5);
                    background-size: 200% 100%;
                    animation: shimmerBar 3s ease-in-out infinite;
                }
                @keyframes shimmerBar {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                /* Icon */
                .cp-icon-wrap {
                    width: 60px; height: 60px;
                    border-radius: 20px;
                    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
                    color: white;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1.25rem;
                    box-shadow: 0 10px 24px rgba(79,70,229,0.3);
                }

                /* Header text */
                .cp-title {
                    font-size: 1.55rem;
                    font-weight: 900;
                    color: #1E1B4B;
                    font-family: 'DM Sans', sans-serif;
                    letter-spacing: -0.5px;
                    text-align: center;
                    margin-bottom: 8px;
                }

                .cp-subtitle {
                    font-size: 0.85rem;
                    color: #6B7280;
                    text-align: center;
                    line-height: 1.6;
                    font-weight: 600;
                    margin-bottom: 1.75rem;
                }

                /* ── Form ── */
                .cp-form { display: flex; flex-direction: column; gap: 1.1rem; }

                .cp-field { display: flex; flex-direction: column; gap: 6px; }

                .cp-label {
                    font-size: 0.78rem;
                    font-weight: 800;
                    color: #1E1B4B;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                /* Input wrap */
                .cp-input-wrap {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .cp-icon-left {
                    position: absolute; left: 14px;
                    color: #9CA3AF;
                    pointer-events: none;
                    transition: color 0.2s;
                }
                .cp-input-wrap:focus-within .cp-icon-left { color: #4F46E5; }

                .cp-input {
                    width: 100%;
                    padding: 12px 42px 12px 42px;
                    font-size: 0.9rem;
                    font-family: 'Nunito', sans-serif;
                    font-weight: 600;
                    color: #1E1B4B;
                    background: #F9F7FF;
                    border: 1.5px solid rgba(79,70,229,0.15);
                    border-radius: 14px;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
                    box-sizing: border-box;
                }
                .cp-input::placeholder { color: #9CA3AF; font-weight: 500; }
                .cp-input:focus {
                    background: white;
                    border-color: #4F46E5;
                    box-shadow: 0 0 0 4px rgba(79,70,229,0.12);
                }
                .cp-input:hover:not(:disabled) {
                    border-color: rgba(79,70,229,0.3);
                    background: #F3EFFE;
                }
                .cp-input:disabled { opacity: 0.55; cursor: not-allowed; }
                .cp-input:focus-visible { outline: 2px solid #4F46E5; outline-offset: 1px; }

                /* Error / OK variants */
                .cp-error .cp-input  { border-color: #EF4444; background: #FEF2F2; }
                .cp-error .cp-input:focus { box-shadow: 0 0 0 4px rgba(239,68,68,0.12); }
                .cp-ok .cp-input     { border-color: #10B981; }
                .cp-ok .cp-input:focus { box-shadow: 0 0 0 4px rgba(16,185,129,0.12); }

                .cp-field-error {
                    font-size: 0.77rem; color: #EF4444; font-weight: 700;
                    animation: errSlide 0.2s ease-out;
                }
                .cp-field-ok {
                    font-size: 0.77rem; color: #10B981; font-weight: 700;
                }
                @keyframes errSlide {
                    from { opacity: 0; transform: translateY(-3px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* Eye button */
                .cp-eye {
                    position: absolute; right: 12px;
                    background: none; border: none;
                    color: #9CA3AF;
                    cursor: pointer; padding: 4px;
                    display: flex; align-items: center;
                    border-radius: 8px;
                    transition: color 0.2s, background 0.2s;
                }
                .cp-eye:hover { color: #4F46E5; background: #EEF2FF; }
                .cp-eye:focus-visible { outline: 2px solid #4F46E5; outline-offset: 1px; }

                /* Strength bar */
                .cp-strength-wrap {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 4px;
                }
                .cp-strength-track {
                    display: flex; gap: 4px; flex: 1;
                }
                .cp-strength-seg {
                    flex: 1; height: 5px;
                    border-radius: 10px;
                    transition: background 0.3s;
                }
                .cp-strength-label {
                    font-size: 0.75rem;
                    font-weight: 800;
                    white-space: nowrap;
                    min-width: 72px;
                    text-align: right;
                }

                /* Checklist */
                .cp-checklist {
                    background: #F9F7FF;
                    border-radius: 14px;
                    padding: 0.875rem 1rem;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px 8px;
                    border: 1.5px solid rgba(79,70,229,0.1);
                }
                .cp-check-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.78rem;
                    font-weight: 700;
                    transition: color 0.2s;
                }
                .cp-check-ok { color: #10B981; }
                .cp-check-no { color: #9CA3AF; }

                /* Button */
                .cp-btn {
                    width: 100%;
                    padding: 13px;
                    font-size: 0.95rem;
                    font-weight: 800;
                    font-family: 'Nunito', sans-serif;
                    color: white;
                    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
                    border: none;
                    border-radius: 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 6px;
                    box-shadow: 0 8px 24px rgba(79,70,229,0.32);
                    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
                    will-change: transform, box-shadow;
                }
                .cp-btn:not(:disabled):hover {
                    transform: translateY(-2px) scale(1.01);
                    box-shadow: 0 12px 32px rgba(79,70,229,0.42);
                }
                .cp-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }
                .cp-btn:focus-visible { outline: 2px solid #4F46E5; outline-offset: 2px; }

                .cp-spin {
                    animation: spin 0.85s linear infinite;
                    flex-shrink: 0;
                }
                @keyframes spin { 100% { transform: rotate(360deg); } }

                /* ── Responsive ── */
                @media (max-width: 480px) {
                    .cp-page { padding: 0.75rem; }
                    .cp-card { padding: 2rem 1.5rem 1.75rem; border-radius: 22px; }
                    .cp-title { font-size: 1.3rem; }
                    .cp-checklist { grid-template-columns: 1fr; }
                }

                @media (prefers-reduced-motion: reduce) {
                    *, *::before, *::after {
                        animation-duration: 0.01ms !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ChangePasswordPage;