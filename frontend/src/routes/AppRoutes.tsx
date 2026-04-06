import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from '../modules/auth/LoginPage.tsx';
import DashboardPage from '../modules/DashboardHome.tsx';
import ChangePasswordPage from '../modules/auth/ChangePasswordPage.tsx';
import CompetencyAnalysisPage from '../modules/student/CompetencyAnalysisPage.tsx';
import LearningStatisticsPage from '../modules/student/LearningStatisticsPage.tsx';
import { useAuth } from '../context/AuthContext';
import SubjectManager from '../modules/SubjectManager.tsx';

// Component bảo vệ & Điều hướng thông minh
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // 1. Đang tải -> Hiện màn hình chờ
    if (loading) return (
        <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
            <div className="spinner">Đang tải dữ liệu...</div>
        </div>
    );

    // 2. Chưa đăng nhập -> Đá về Login
    if (!user) return <Navigate to="/login" replace />;

    // 🔥 3. LOGIC MỚI: Nếu là lần đầu đăng nhập -> Bắt buộc sang trang đổi mật khẩu
    // (Trừ khi đang ở chính trang change-password rồi thì thôi)
    if (user.isFirstLogin && location.pathname !== '/change-password') {
        return <Navigate to="/change-password" replace />;
    }

    // 4. Nếu đã đổi mật khẩu rồi mà cố vào trang change-password -> Đá về Dashboard
    if (!user.isFirstLogin && location.pathname === '/change-password') {
        return <Navigate to="/dashboard" replace />;
    }

    // 5. Hợp lệ -> Cho hiển thị
    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Trang Dashboard (Được bảo vệ) */}
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                } 
            />

            {/* Trang Đổi mật khẩu (Cũng phải được bảo vệ để có User Context) */}
            <Route 
                path="/change-password" 
                element={
                    <ProtectedRoute>
                        <ChangePasswordPage />
                    </ProtectedRoute>
                } 
            />

            {/* Trang Phân tích Hồ sơ Năng lực */}
            <Route 
                path="/student/competency-analysis" 
                element={
                    <ProtectedRoute>
                        <CompetencyAnalysisPage />
                    </ProtectedRoute>
                } 
            />

            {/* Trang Thống kê Học tập */}
            <Route 
                path="/student/analytics" 
                element={
                    <ProtectedRoute>
                        <LearningStatisticsPage />
                    </ProtectedRoute>
                } 
            />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/subjects" element={<SubjectManager />} />
            <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
    );
};

export default AppRoutes;