package vn.hvnh.exam.repository.sql;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.hvnh.exam.entity.sql.StudentDocument;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentDocumentRepository extends JpaRepository<StudentDocument, UUID> {
    
    // ============================================
    // [TỐI ƯU HIỆU NĂNG]: BULK QUERIES
    // ============================================
    /**
     * Tối ưu hóa N+1: Đếm tài liệu của nhiều môn học trong 1 lần query (Dùng cho getMyClasses)
     */
    @Query("SELECT sd.subjectId, COUNT(sd) FROM StudentDocument sd " +
           "WHERE sd.studentId = :studentId AND sd.subjectId IN :subjectIds " +
           "GROUP BY sd.subjectId")
    List<Object[]> countDocsBySubjectIds(
        @Param("studentId") UUID studentId, 
        @Param("subjectIds") List<UUID> subjectIds
    );

    // ============================================
    // BASIC QUERIES
    // ============================================
    
    Page<StudentDocument> findByStudentIdOrderByUploadedAtDesc(UUID studentId, Pageable pageable);

    long countBySubjectIdAndStudentId(UUID subjectId, UUID studentId);
    
    List<StudentDocument> findBySubjectId(UUID subjectId);
    
    Page<StudentDocument> findByStudentIdAndSubjectIdOrderByUploadedAtDesc(
        UUID studentId, 
        UUID subjectId,
        Pageable pageable
    );
    
    Page<StudentDocument> findByStudentIdAndDocumentTypeOrderByUploadedAtDesc(
        UUID studentId, 
        String documentType,
        Pageable pageable
    );
    
    List<StudentDocument> findByStudentIdAndSubjectIdAndDocumentType(
        UUID studentId,
        UUID subjectId,
        String documentType
    );
    
    boolean existsByStudentIdAndDocumentTitle(UUID studentId, String documentTitle);
    
    // ============================================
    // PROCESSING STATUS QUERIES
    // ============================================
    
    List<StudentDocument> findByStudentIdAndProcessingStatus(
        UUID studentId, 
        String processingStatus
    );
    
    @Query("SELECT sd FROM StudentDocument sd WHERE sd.studentId = :studentId " +
           "AND sd.processingStatus IN ('PENDING', 'PROCESSING') " +
           "ORDER BY sd.uploadedAt DESC")
    List<StudentDocument> findPendingDocuments(@Param("studentId") UUID studentId);
    
    @Query("SELECT sd FROM StudentDocument sd WHERE sd.studentId = :studentId " +
           "AND sd.processingStatus = 'COMPLETED' " +
           "ORDER BY sd.uploadedAt DESC")
    List<StudentDocument> findCompletedDocuments(@Param("studentId") UUID studentId);
    
    List<StudentDocument> findByProcessingStatusAndProcessedAtBefore(
        String processingStatus,
        LocalDateTime dateTime
    );
    
    long countByStudentIdAndProcessingStatus(UUID studentId, String processingStatus);
    
    // ============================================
    // AI-ENABLED DOCUMENTS
    // ============================================
    
    List<StudentDocument> findByStudentIdAndIsAiEnabledTrueOrderByUploadedAtDesc(
        UUID studentId
    );
    
    @Query("SELECT sd FROM StudentDocument sd WHERE sd.studentId = :studentId " +
           "AND sd.isAiEnabled = true " +
           "AND sd.processingStatus = 'COMPLETED' " +
           "ORDER BY sd.uploadedAt DESC")
    List<StudentDocument> findAIReadyDocuments(@Param("studentId") UUID studentId);
    
    // ============================================
    // STATISTICS & ANALYTICS
    // ============================================
    
    long countByStudentId(UUID studentId);
    
    long countByStudentIdAndSubjectId(UUID studentId, UUID subjectId);
    
    @Query("SELECT COALESCE(SUM(sd.fileSizeMb), 0) FROM StudentDocument sd " +
           "WHERE sd.studentId = :studentId")
    Double getTotalFileSizeByStudent(@Param("studentId") UUID studentId);
    
    @Query("SELECT sd.documentType, COUNT(sd) FROM StudentDocument sd " +
           "WHERE sd.studentId = :studentId " +
           "GROUP BY sd.documentType")
    List<Object[]> countByDocumentType(@Param("studentId") UUID studentId);
    
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
    
    @Query("SELECT sd FROM StudentDocument sd WHERE sd.studentId = :studentId " +
           "AND LOWER(sd.documentTitle) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "ORDER BY sd.uploadedAt DESC")
    List<StudentDocument> searchByTitle(
        @Param("studentId") UUID studentId,
        @Param("searchTerm") String searchTerm
    );
    
    @Query("SELECT sd FROM StudentDocument sd WHERE sd.studentId = :studentId " +
           "AND sd.uploadedAt >= :fromDate " +
           "ORDER BY sd.uploadedAt DESC")
    List<StudentDocument> findRecentDocuments(
        @Param("studentId") UUID studentId,
        @Param("fromDate") LocalDateTime fromDate
    );
    
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
    
    @Query("SELECT sd FROM StudentDocument sd WHERE " +
           "(sd.processingStatus = 'PROCESSING' AND sd.uploadedAt < :stuckThreshold) " +
           "OR (sd.processingStatus = 'FAILED')")
    List<StudentDocument> findDocumentsNeedingReprocessing(
        @Param("stuckThreshold") LocalDateTime stuckThreshold
    );
    
    @Query("SELECT sd FROM StudentDocument sd WHERE sd.studentId = :studentId " +
           "ORDER BY sd.fileSizeMb DESC")
    List<StudentDocument> findLargestDocuments(@Param("studentId") UUID studentId);
    
    // ============================================
    // DELETION & CLEANUP
    // ============================================
    
    @Query("DELETE FROM StudentDocument sd WHERE sd.processingStatus = 'FAILED' " +
           "AND sd.uploadedAt < :beforeDate")
    void deleteOldFailedDocuments(@Param("beforeDate") LocalDateTime beforeDate);
    
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
    
    @Query("UPDATE StudentDocument sd SET sd.processingStatus = :status " +
           "WHERE sd.studentDocId IN :documentIds")
    void updateProcessingStatus(
        @Param("documentIds") List<UUID> documentIds,
        @Param("status") String status
    );
    
    @Query("UPDATE StudentDocument sd SET sd.isAiEnabled = :enabled " +
           "WHERE sd.studentDocId IN :documentIds")
    void updateAIEnabled(
        @Param("documentIds") List<UUID> documentIds,
        @Param("enabled") boolean enabled
    );
}