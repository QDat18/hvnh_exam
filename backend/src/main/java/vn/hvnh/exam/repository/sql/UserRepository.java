package vn.hvnh.exam.repository.sql;

import vn.hvnh.exam.entity.sql.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    // Các hàm không dính tới Role thì giữ nguyên, JPA tự lo được
    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.faculty WHERE u.email = :email")
    Optional<User> findByEmailWithFaculty(@Param("email") String email);
    boolean existsByEmail(String email);
    List<User> findByDepartment_Id(UUID departmentId);
    // ==========================================
    // CÁC HÀM XỬ LÝ ROLE PHẢI DÙNG NATIVE QUERY
    // ==========================================

    @Query(value = "SELECT COUNT(*) FROM users WHERE role = CAST(:role AS user_role)", nativeQuery = true)
    long countByRole(@Param("role") String role);
    
    @Query(value = "SELECT COUNT(*) FROM users WHERE role = CAST(:role AS user_role) AND faculty_id = :facultyId", nativeQuery = true)
    long countByRoleAndFaculty_Id(@Param("role") String role, @Param("facultyId") UUID facultyId);
    
    @Query(value = "SELECT * FROM users WHERE role = CAST(:role AS user_role) AND faculty_id = :facultyId", nativeQuery = true)
    List<User> findByRoleAndFaculty_Id(@Param("role") String role, @Param("facultyId") UUID facultyId);
    @Query("SELECT u FROM User u WHERE CAST(u.role as string) = :role")
    Page<User> findByRole(@Param("role") String role, Pageable pageable);
    @Query(
        value = """
            SELECT * FROM users
            WHERE (CAST(:role AS text) IS NULL OR CAST(role AS text) = CAST(:role AS text))
              AND (CAST(:keyword AS text) IS NULL
                   OR LOWER(full_name) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%'))
                   OR LOWER(email)     LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%')))
            """,
        countQuery = """
            SELECT COUNT(*) FROM users
            WHERE (CAST(:role AS text) IS NULL OR CAST(role AS text) = CAST(:role AS text))
              AND (CAST(:keyword AS text) IS NULL
                   OR LOWER(full_name) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%'))
                   OR LOWER(email)     LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%')))
            """,
        nativeQuery = true
    )
    Page<User> searchUsers(
        @Param("role")    String role,
        @Param("keyword") String keyword,
        Pageable pageable
    );
}