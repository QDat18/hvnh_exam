import axios from "axios";
import authService from "./auth.service";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add token to headers (Đã xóa các log gây rác)
axiosClient.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh on 401 and redirect on 403
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // BẮT LỖI 401 (Hết hạn Token) -> Thử refresh token ngầm 1 lần
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await authService.refreshToken();
        
        if (newToken) {
          // Refresh thành công, gắn token mới và gọi lại API bị lỗi
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosClient(originalRequest);
        } else {
          // Refresh thất bại -> Xóa sạch và văng ra Login
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // BẮT LỖI 403 (Cấm truy cập do Token sai/không đủ quyền)
    if (error.response?.status === 403) {
      // Xóa dấu vết cũ tránh loop
      localStorage.removeItem('access_token');
      // Đá thẳng về trang đăng nhập
      window.location.href = '/login';
    }

    // BẮT LỖI 503 (Bảo trì hệ thống)
    if (error.response?.status === 503 && error.response.data?.maintenance) {
      // Chuyển hướng tới trang bảo trì (nếu không phải đang ở trang bảo trì)
      if (window.location.pathname !== '/maintenance') {
        window.location.href = '/maintenance';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;