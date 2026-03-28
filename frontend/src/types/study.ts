export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type DocumentType = 'TEXTBOOK' | 'SLIDE' | 'SYLLABUS' | 'NOTE';

export interface StudentDocument {
    studentDocId: string;
    studentId: string;
    subjectId: string;
    documentType: DocumentType;
    documentTitle: string;
    fileUrl: string;
    fileType: string;
    fileSizeMb: number;
    processingStatus: ProcessingStatus;
    uploadedAt: string;
}

export interface Flashcard {
    flashcardId: string;
    frontText: string;
    backText: string;
    sourcePage?: number;
    sourceReference?: string;
    proficiencyLevel: 'NEW' | 'LEARNING' | 'KNOWN' | 'MASTERED';
    createdAt: string;
}

export interface DocumentStatusResponse {
    status: ProcessingStatus;
    processedAt?: string;
}