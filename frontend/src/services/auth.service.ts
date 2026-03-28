import { supabase } from "./supabaseClient";
import axios from "axios";

interface LoginResponse {
    user: any;
    session: any;
    isFirstLogin: boolean;
}

const BACKEND_URL = 'http://localhost:8080';

const authService = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        try {
            const backendResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, { email: email });
            localStorage.setItem('access_token', backendResponse.data.token);
        } catch (err: any) {
            console.error('[AUTH] Failed to get backend token:', err.response?.data || err.message);
            throw new Error('Failed to authenticate with backend');
        }

        return { user: data.user, session: data.session, isFirstLogin: false };
    },

    loginWithGoogle: async (email: string, googleToken: string, userData: any) => {
        try {
            const backendResponse = await axios.post(`${BACKEND_URL}/api/auth/google-login`, {
                email: email,
                googleToken: googleToken,
                fullName: userData.fullName,
                avatarUrl: userData.avatarUrl
            });
            localStorage.setItem('access_token', backendResponse.data.token);
            return { user: backendResponse.data.user, token: backendResponse.data.token };
        } catch (err: any) {
            throw new Error(err.response?.data?.message || 'Failed to authenticate with backend');
        }
    },

    logout: async () => {
        localStorage.removeItem('access_token');
        await supabase.auth.signOut();
    },

    getCurrentUser: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        let token = localStorage.getItem('access_token');

        // Handle Google OAuth Redirect case where Supabase has session but backend hasn't issued token yet
        if (!token) {
            if (user.app_metadata?.provider === 'google') {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const providerToken = session?.provider_token || 'dummy-token';
                    const fullName = user.user_metadata?.full_name || 'Người dùng Google';
                    const avatarUrl = user.user_metadata?.avatar_url || '';

                    const backendResponse = await axios.post(`${BACKEND_URL}/api/auth/google-login`, {
                        email: user.email,
                        googleToken: providerToken,
                        fullName: fullName,
                        avatarUrl: avatarUrl
                    });
                    token = backendResponse.data.token;
                    if (token) {
                        localStorage.setItem('access_token', token);
                    } else {
                        return null;
                    }
                } catch (err) {
                    console.error("Failed to authenticate Google user with backend:", err);
                    return null;
                }
            } else {
                // If not Google (e.g., standard email/password), the token is probably still being fetched by the login() function.
                // We should back off and let the login() flow finish.
                return null;
            }
        }

        try {
            const response = await axios.get(`${BACKEND_URL}/api/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (err) {
            // Fallback nếu API lỗi (chưa có token hợp lệ)
            return {
                id: user.id,
                email: user.email,
                fullName: user.user_metadata?.full_name || "Người dùng",
                role: "STUDENT",
                isFirstLogin: false
            };
        }
    },

    validateEmailDomain: (email: string): boolean => {
        return email.endsWith('@hvnh.edu.vn');
    },

    getAccessToken: () => {
        return localStorage.getItem('access_token');
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('access_token');
    },

    refreshToken: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !user.email) return null;

            const response = await axios.post(`${BACKEND_URL}/api/auth/login`, { email: user.email });
            const newToken = response.data.token;
            localStorage.setItem('access_token', newToken);

            return newToken;
        } catch (error) {
            return null;
        }
    },

    updateAvatar: async (file: File) => {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error("Vui lòng đăng nhập lại");

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${BACKEND_URL}/api/users/avatar`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || "Lỗi tải ảnh lên");
        }
    }
};

export default authService;