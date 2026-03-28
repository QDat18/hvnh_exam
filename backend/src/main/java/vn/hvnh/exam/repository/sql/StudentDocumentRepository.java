package vn.hvnh.exam.repository.sql;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.hvnh.exam.entity.sql.StudentDocument;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Student Personal Documents
 * Manages student uploaded documents (textbooks, slides, notes)
 */
@Repository
public interface StudentDocumentRepository extends JpaRepository<StudentDocument, UUID> {
    
    // ============================================
    // BASIC QUERIES
    // ============================================
    
    /**
     * Find all documents uploaded by a specific student
     */
    List<StudentDocument> findByStudentIdOrderByUploadedAtDesc(UUID studentId);

    long countBySubjectIdAndStudentId(UUID subjectId, UUID studentId);
    
    List<StudentDocument> findBySubjectId(UUID subjectId);
    
    /**
     * Find documents by student and subject
     */
    List<StudentDocument> findByStudentIdAndSubjectIdOrderByUploadedAtDesc(
        UUID studentId, 
        UUID subjectId
    );
    
    /**
     * Find documents by student and document type
     */
    List<StudentDocument> findByStudentIdAndDocumentTypeOrderByUploadedAtDesc(
        UUID studentId, 
        String documentType
    );
    
    /**
     * Find documents by student, subject, and type
     */
    List<StudentDocument> findByStudentIdAndSubjectIdAndDocumentType(
        UUID studentId,
        UUID subjectId,
        String documentType
    );
    
    /**
     * Check if document exists by title for a student (prevent duplicates)
     */
    boolean existsByStudentIdAndDocumentTitle(UUID studentId, String documentTitle);
    
    // ============================================
    // PROCESSING STATUS QUERIES
    // ============================================
    
    /**
     * Find documents by processing status
     */
    List<StudentDocument> findByStudentIdAndProcessingStatus(
        UUID studentId, 
        String processingStatus
    );
    
    /**
     * Find pending/processing documents
     */
    @Query("SELECT sd FROM StudentDocument sd WHERE sd.studentId = :studentId " +
           "AND sd.processingStatus IN ('PENDING', 'PROCESSING') " +
           "ORDER BY sd.uploadedAt DESC")
    List<StudentDocument> findPendingDocuments(@Param("studentId") UUID studentId);
    
    /**
     * Find completed documents
     */
    @Query("SELECT sd FROM StudentDocument sd WHERE sd.studentId = :studentId " +
           "AND sd.processingStatus = 'COMPLETED' " +
           "ORDER BY sd.uploadedAt DESC")
    List<StudentDocument> findCompletedDocuments(@Param("studentId") UUID studentId);
    
    /**
     * Find failed processing documents
     */
    List<StudentDocument> findByProcessingStatusAndProcessedAtBefore(
        String processingStatus,
        LocalDateTime dateTime
    );
    
    /**
     * Count documents by processing status
     */
    long countByStudentIdAndProcessingStatus(UUID studentId, String processingStatus);
    
    // ============================================
    // AI-ENABLED DOCUMENTS
    // ============================================
    
    /**
     * Find AI-enabled documents for a student
     */
    List<StudentDocument> findByStudentIdAndIsAiEnabledTrueOrderByUploadedAtDesc(
        UUID studentId
    );
    
    /**
     * Find AI-enabled and completed documents
     */
    @Query("SELECT sd FROM StudentDocument sd WHERE sd.studentId = :studentId " +
           "AND sd.isAiEnabled = true " +
           "AND sd.processingStatus = 'COMPLETED' " +
           "ORDER BY sd.uploadedAt DESC")
    List<StudentDocument> findAIReadyDocuments(@Param("studentId") UUID studentId);
    
    // ============================================
    // STATISTICS & ANALYTICS
    // ============================================
    
    /**
     * Count total documents by student
     */
    long countByStudentId(UUID studentId);
    
    /**
     * Count documents by student and subject
     */
    long countByStudentIdAndSubjectId(UUID studentId, UUID subjectId);
    
    /**
     * Get total file size for student (in MB)
     */
    @Query("SELECT COALESCE(SUM(sd.fileSizeMb), 0) FROM StudentDocument sd " +
           "WHERE sd.studentId = :studentId")
    Double getTotalFileSizeByStudent(@Param("studentId") UUID studentId);
    
    /**
     * Count documents by type for a student
     */
    @Query("SELECT sd.documentType, COUNT(sd) FROM StudentDocument sd " +
           "WHERE sd.studentId = :studentId " +
           "GROUP BY sd.documentType")
    List<Object[]> countByDocumentType(@Param("studentId") UUID studentId);
    
    /**
     * Get upload statistics for student
     */
    @Query("SELECT " +
           "COUNT(sd) as totalDocs, " +
           "SUM(CASE WHEN sd.processingStatus = 'COMPLETED' THEN 1 ELSE 0 END) as completed, " +
           "SUM(CASE WHEN sd.processingStatus = 'PROCESSING' THEN 1 ELSE 0 END) as processing, " +
           "SUM(CASE WHEN sd.processingStatus = 'FAILED' THEN 1 ELSE 0 END) as failed, " +
           "SUM(sd.fileSizeMb) as totalSize " +
           "FROM StudentDocument sd " +
           "WHERE sd.studentId = :studentId")
    Object getStudentDocumentStats(@Param("studentId") UUID studentId);
    
    // ============================================
    // SEARCH & FILTER
    // ============================================
    
    /**
     * Search documents by title (case-insensitive)
     */
    @Query("SELECT sd FROM StudentDocument sd WHERE sd.studentId = :studentId " +
           "AND LOWER(sd.documentTitle) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "ORDER BY sd.uploadedAt DESC")
    List<StudentDocument> searchByTitle(
        @Param("studentId") UUID studentId,
        @Param("searchTerm") String searchTerm
    );
    
    /**
     * Find recent documents (last N days)
     */
    @Query("SELECT sd FROM StudentDocument sd WHERE sd.studentId = :studentId " +
           "AND sd.uploadedAt >= :fromDate " +
           "ORDER BY sd.uploadedAt DESC")
    List<StudentDocument> findRecentDocuments(
        @Param("studentId") UUID studentId,
        @Param("fromDate") LocalDateTime fromDate
    );
    
    /**
     * Find documents uploaded in date range
     */
    @Query("SELECT sd FROM StudentDocument sd WHERE sd.studentId = :studentId " +
           "AND sd.uploadedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY sd.uploadedAt DESC")
    List<StudentDocument> findByDateRange(
        @Param("studentId") UUID studentId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    // ============================================
    // ADVANCED QUERIES
    // ============================================
    
    /**
     * Find documents with most AI generated content
     */
    // @Query("SELECT sd FROM StudentDocument sd " +
    //        "LEFT JOIN StudentAIContent sac ON sd.studentDocId = sac.studentDocId " +
    //        "WHERE sd.studentId = :studentId " +
    //        "AND sd.processingStatus = 'COMPLETED' " +
    //        "GROUP BY sd.studentDocId " +
    //        "ORDER BY COUNT(sac.contentId) DESC")
    // List<StudentDocument> findDocumentsWithMostAIContent(@Param("studentId") UUID studentId);
    
    /**
     * Find documents by subject with statistics
     */
    // @Query("SELECT sd, " +
    //        "COUNT(DISTINCT sac.contentId) as aiContentCount " +
    //        "FROM StudentDocument sd " +
    //        "LEFT JOIN StudentAIContent sac ON sd.studentDocId = sac.studentDocId " +
    //        "WHERE sd.studentId = :studentId AND sd.subjectId = :subjectId " +
    //        "GROUP BY sd.studentDocId " +
    //        "ORDER BY sd.uploadedAt DESC")
    // List<Object[]> findBySubjectWithStats(
    //     @Param("studentId") UUID studentId,
    //     @Param("subjectId") UUID subjectId
    // );
    
    /**
     * Find documents that need reprocessing (failed or stuck)
     */
    @Query("SELECT sd FROM StudentDocument sd WHERE " +
           "(sd.processingStatus = 'PROCESSING' AND sd.uploadedAt < :stuckThreshold) " +
           "OR (sd.processingStatus = 'FAILED')")
    List<StudentDocument> findDocumentsNeedingReprocessing(
        @Param("stuckThreshold") LocalDateTime stuckThreshold
    );
    
    /**
     * Find largest documents by student
     */
    @Query("SELECT sd FROM StudentDocument sd WHERE sd.studentId = :studentId " +
           "ORDER BY sd.fileSizeMb DESC")
    List<StudentDocument> findLargestDocuments(@Param("studentId") UUID studentId);
    
    /**
     * Get documents grouped by subject
     */
    // @Query("SELECT s.subjectName, COUNT(sd), SUM(sd.fileSizeMb) " +
    //        "FROM StudentDocument sd " +
    //        "JOIN Subject s ON sd.subjectId = s.subjectId " +
    //        "WHERE sd.studentId = :studentId " +
    //        "GROUP BY s.subjectName " +
    //        "ORDER BY COUNT(sd) DESC")
    // List<Object[]> getDocumentsBySubjectSummary(@Param("studentId") UUID studentId);
    
    // ============================================
    // DELETION & CLEANUP
    // ============================================
    
    /**
     * Delete old failed documents (cleanup)
     */
    @Query("DELETE FROM StudentDocument sd WHERE sd.processingStatus = 'FAILED' " +
           "AND sd.uploadedAt < :beforeDate")
    void deleteOldFailedDocuments(@Param("beforeDate") LocalDateTime beforeDate);
    
    /**
     * Find documents for deletion (old, failed, large)
     */
    @Query("SELECT sd FROM StudentDocument sd WHERE sd.studentId = :studentId " +
           "AND (sd.processingStatus = 'FAILED' OR sd.fileSizeMb > :sizeLimitMb) " +
           "AND sd.uploadedAt < :beforeDate")
    List<StudentDocument> findDocumentsForCleanup(
        @Param("studentId") UUID studentId,
        @Param("sizeLimitMb") Double sizeLimitMb,
        @Param("beforeDate") LocalDateTime beforeDate
    );
    
    // ============================================
    // BATCH OPERATIONS
    // ============================================
    
    /**
     * Update processing status for multiple documents
     */
    @Query("UPDATE StudentDocument sd SET sd.processingStatus = :status " +
           "WHERE sd.studentDocId IN :documentIds")
    void updateProcessingStatus(
        @Param("documentIds") List<UUID> documentIds,
        @Param("status") String status
    );
    
    /**
     * Mark documents as AI-enabled
     */
    @Query("UPDATE StudentDocument sd SET sd.isAiEnabled = :enabled " +
           "WHERE sd.studentDocId IN :documentIds")
    void updateAIEnabled(
        @Param("documentIds") List<UUID> documentIds,
        @Param("enabled") boolean enabled
    );
}