// 1. Role
export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

// 2. User
export interface User {
    email: string;
    role: Role;
    fullName?: string;
    sub?: string;
}

// 3. Login Response
export interface LoginResponse {
    token: string;
    type?: string;
    id?: number;
    email?: string;
    roles?: string[];
}

// 4. Subject (Cái bạn đang bị báo lỗi thiếu 👇)
export interface Subject {
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    subjectGroup: 'THEORY' | 'FORMULA';
    credits: number;
}

// 5. Chapter
export interface Chapter {
    chapterId: string;
    chapterName: string;
    chapterNumber: number;
}

// 6. Formula Form
export interface FormulaTemplateForm {
    subjectId: string;
    chapterId: string;
    questionPattern: string;
    formulaCorrect: string;
    formulasDistractors: { value: string }[];
    variableRanges: { name: string; min: number; max: number }[];
    explanationTemplate: string;
}