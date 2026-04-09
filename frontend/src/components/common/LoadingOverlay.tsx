import React from 'react';

interface LoadingOverlayProps {
    message?: string;
    show?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Đang tải dữ liệu...', show = true }) => {
    if (!show) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'inherit'
        }}>
            <div style={{
                background: 'white',
                padding: '2rem 3rem',
                borderRadius: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                gap: '1.25rem',
                animation: 'overlay-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* FontAwesome spinner */}
                <i className="fas fa-circle-notch fa-spin" style={{
                    fontSize: '2.5rem',
                    color: '#4F46E5', // primary color
                    background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}></i>
                <p style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: '#1E1B4B',
                    fontFamily: "'Nunito', sans-serif",
                    letterSpacing: '-0.3px',
                    animation: 'pulse 1.5s infinite var(--ease-out)'
                }}>
                    {message}
                </p>
            </div>
            <style>{`
                @keyframes overlay-fade-in {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
};

export default LoadingOverlay;
