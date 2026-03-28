import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Trỏ đúng đường dẫn tới hook useAuth của bác

interface ProtectedRouteProps {
    allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { user, loading } = useAuth(); // Giả sử bác có state loading trong useAuth

    // Đang tải thông tin user thì hiện loading
    if (loading) {
        return <div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-primary"></div></div>;
    }

    // 1. CHƯA ĐĂNG NHẬP -> Đá văng ra trang Login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 2. SAI QUYỀN (Ví dụ: Sinh viên đòi vào trang Quản lý Khoa) -> Đá về đúng nhà của nó
    if (!allowedRoles.includes(user.role)) {
        console.warn(`[BẢO VỆ] User role '${user.role}' cố gắng truy cập trái phép!`);
        
        switch (user.role) {
            case 'STUDENT':
                return <Navigate to="/student/dashboard" replace />;
            case 'TEACHER':
                return <Navigate to="/teacher/dashboard" replace />;
            case 'FACULTY_ADMIN':
                return <Navigate to="/faculty-admin/dashboard" replace />;
            case 'ADMIN':
                return <Navigate to="/admin/dashboard" replace />;
            default:
                return <Navigate to="/login" replace />;
        }
    }

    // 3. ĐÚNG QUYỀN -> Mở cửa cho vào (Render các component con bên trong)
    return <Outlet />;
};

export default ProtectedRoute;