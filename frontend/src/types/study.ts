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
    processedCount?: number;
    flashcardCount?: number;
}

export interface Flashcard {
    id: string; // Unified ID
    flashcardId: string;
    studentDocumentId?: string;
    subjectId?: string;
    frontText: string;
    backText: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | string;
    nextReviewDate?: string;
    lastReviewedAt?: string;
    sourcePage?: number;
    sourceReference?: string;
    proficiencyLevel: 'NEW' | 'LEARN' | 'LEARNING' | 'KNOWN' | 'MASTERED' | string;
    createdAt: string;
}

export interface DocumentStatusResponse {
    status: ProcessingStatus;
    processedAt?: string;
}