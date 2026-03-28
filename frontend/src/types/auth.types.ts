export interface LoginResponse {
    token?: string;
    access_token?: string;
    refreshToken?: string;
}

// 👇 Đảm bảo đoạn này CÓ TỒN TẠI
export interface User {
    email: string;
    role: "ADMIN" | "TEACHER" | "STUDENT";
    fullName?: string;
}