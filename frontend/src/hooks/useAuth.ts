import { useContext } from 'react';

// 👇 Kiểm tra kỹ dòng import này
import { AuthContext, type AuthContextType } from '../context/AuthContext';

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};