package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;
import java.security.SecureRandom;

@Entity
@Table(name = "course_classes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseClass {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "course_class_id")
    private UUID id;

    @Column(name = "class_code", nullable = false, unique = true, length = 50)
    private String classCode;

    @Column(name = "class_name", nullable = false, length = 255)
    private String className;

    @Column(name = "semester", nullable = false, length = 20)
    private String semester;

    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private User teacher;

    // 🔥 CỘT LƯU MÃ THAM GIA LỚP
    @Column(name = "join_code", unique = true, length = 10)
    private String joinCode;

    @Column(name = "max_students")
    private Integer maxStudents;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "ACTIVE";
        if (maxStudents == null) maxStudents = 60;

        if (joinCode == null || joinCode.isEmpty()) {
            this.joinCode = generateJoinCode(6);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Hàm tiện ích sinh chuỗi random chữ + số
    private String generateJoinCode(int length) {
        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(characters.charAt(random.nextInt(characters.length())));
        }
        return sb.toString();
    }
}