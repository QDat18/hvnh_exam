import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import authService from "../services/auth.service";

// Định nghĩa kiểu User cho toàn App
export interface AppUser {
    id: string;
    email: string | undefined;
    fullName: string;
    role: "ADMIN" | "STUDENT" | "TEACHER" | "FACULTY_ADMIN";
    isFirstLogin: boolean;
    facultyId?: string; // Thêm trường facultyId để phân quyền theo khoa nếu cần
    departmentId?: string; // Thêm trường departmentId để phân quyền theo bộ môn nếu cần
    facultyName?: string;
    departmentName?: string;
}

export interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Hàm đồng bộ dữ liệu user
    const syncUser = async () => {
        try {
            const userData = await authService.getCurrentUser();
            if (userData) {
                // Ép kiểu về AppUser để đảm bảo đúng Type
                setUser(userData as AppUser);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Lỗi đồng bộ User:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // 1. Kiểm tra session hiện tại khi F5
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                syncUser();
            } else {
                setLoading(false);
            }
        });

        // 2. Lắng nghe sự kiện thay đổi (Login/Logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                syncUser();
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};