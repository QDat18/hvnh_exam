// src/types/subject.types.ts

// ✅ Đảm bảo có từ khóa 'export' trước mỗi interface
export interface Faculty {
    id: string;
    facultyCode: string;
    facultyName: string;
}

export interface Department {
    id: string;
    departmentName: string;
    faculty?: Faculty;
}

export interface Subject {
    id: string;
    subjectCode: string;
    subjectName: string;
    credits: number;
    departmentName: string;
    facultyName: string;
    description?: string;
    isActive: boolean;
    subjectGroup: 'THEORY' | 'PRACTICE' | 'FORMULA';
}

export interface SubjectPayload {
    subjectCode: string;
    subjectName: string;
    credits: number;
    departmentId: string; 
    description: string;
    isActive: boolean;
    subjectGroup: string;
}