package vn.hvnh.exam.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hvnh.exam.dto.StudentRequest;
import vn.hvnh.exam.entity.sql.Classes;
import vn.hvnh.exam.entity.sql.ClassStudent;
import vn.hvnh.exam.entity.sql.User;
import vn.hvnh.exam.repository.sql.ClassRepository;
import vn.hvnh.exam.repository.sql.ClassStudentRepository;
import vn.hvnh.exam.repository.sql.UserRepository;;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudentManagementService {

    private final UserRepository userRepository;
    private final ClassRepository classRepository;
    private final ClassStudentRepository classStudentRepository;
    private final UserCreationService userCreationService; // Gọi lại service tạo user qua Supabase/Auth

    @Transactional
    public ClassStudent addStudentToClass(UUID classId, StudentRequest request, String adminEmail) {
        Classes targetClass = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Lớp niên chế này!"));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Lỗi xác thực Admin"));
        
        // 2. Tạo email "siêu sạch"
        String rawStudentId = request.getStudentID() != null ? request.getStudentID() : "";
        String cleanStudentId = rawStudentId.replaceAll("\\s+", "").toLowerCase();
        
        if (cleanStudentId.isEmpty()) {
            throw new RuntimeException("Mã sinh viên bị trống, vui lòng kiểm tra file Excel!");
        }

        // 2. TẠO EMAIL THÔNG MINH (Chống bị nhân đôi đuôi @hvnh.edu.vn)
        String autoEmail;
        if (cleanStudentId.endsWith("@hvnh.edu.vn")) {
            autoEmail = cleanStudentId; // Nếu Excel đã có sẵn đuôi thì giữ nguyên
            cleanStudentId = cleanStudentId.replace("@hvnh.edu.vn", ""); // Tách lấy mã SV thuần túy
        } else {
            autoEmail = cleanStudentId + "@hvnh.edu.vn"; // Nếu chưa có đuôi thì mới gắn vào
        }
        
        request.setEmail(autoEmail);
        System.out.println("🚀 [DEBUG] Mã SV lấy từ Excel: ->|" + rawStudentId + "|<-");
        System.out.println("🚀 [DEBUG] Email chuẩn bị gửi đi: ->|" + autoEmail + "|<-");

        // Kiểm tra định dạng chuẩn quốc tế trước khi gửi cho Supabase
        if (!autoEmail.matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")) {
            throw new RuntimeException("Email tạo ra bị sai định dạng chuẩn: " + autoEmail);
        }
        if (!autoEmail.endsWith("@hvnh.edu.vn") || autoEmail.contains("@hvnh.edu.vn@")) {
            throw new RuntimeException("Lỗi định dạng email: " + autoEmail);
        }

        // 3. Kiểm tra xem sinh viên đã có tài khoản trên hệ thống chưa
        Optional<User> existingUser = userRepository.findByEmail(autoEmail);
        User student;

        if (existingUser.isPresent()) {
            student = existingUser.get();
            // Nếu đã tồn tại nhưng đang bị khóa thì mở lại
            if ("INACTIVE".equals(student.getStatus())) {
                student.setStatus("ACTIVE");
                userRepository.save(student);
            }
        } else {
            String DEFAULT_PASSWORD = "Hvnh1961";
            
            // 4. Gọi Service tạo User trên Supabase (Truyền autoEmail chuẩn đét vào tham số 1)
            student = userCreationService.createStudent(
                cleanStudentId,             // Tham số 1: Truyền Email (Hoặc Mã SV đã làm sạch tùy code của bác)
                request.getFullName(),      // Tham số 2: Họ tên
                targetClass.getId(),        // Tham số 3: ID lớp
                admin.getId()               // Tham số 4: ID người tạo
            );
            
            // 5. Cập nhật Entity User để lưu xuống Postgres (Khớp với Supabase)
            student.setEmail(autoEmail); 
            student.setStudentId(cleanStudentId); // Dùng mã SV đã làm sạch
            student.setGender(request.getGender());
            student.setPhoneNumber(request.getPhoneNumber());
            student.setAddress(request.getAddress());
            student.setFaculty(admin.getFaculty()); // 🔥 QUAN TRỌNG: Gắn Khoa để User không bị "mồ côi"

            // Gắn thêm các thông tin cá nhân (Có try-catch để an toàn)
            if (request.getDateOfBirth() != null && !request.getDateOfBirth().trim().isEmpty()) {
                try {
                    student.setDateOfBirth(LocalDate.parse(request.getDateOfBirth().trim()));
                } catch (Exception e) {
                    System.err.println("Lỗi parse ngày sinh của SV " + cleanStudentId);
                }
            }
            
            student.setDefaultPassword(DEFAULT_PASSWORD); 
            student.setPasswordChanged(false); 
            
            // 6. Lưu xuống bảng public.users
            student = userRepository.save(student);
        }

        // 7. Kiểm tra xem sinh viên đã nằm trong lớp này chưa
        boolean alreadyInClass = classStudentRepository.existsByClassEntity_IdAndStudent_Id(classId, student.getId());
        if (alreadyInClass) {
            throw new RuntimeException("Sinh viên " + student.getEmail() + " đã có tên trong lớp này rồi!");
        }

        // 8. Xếp sinh viên vào lớp (Tạo bản ghi ClassStudent)
        ClassStudent classStudent = ClassStudent.builder()
                .classEntity(targetClass)
                .student(student)
                .enrollmentDate(LocalDate.now())
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .createdBy(admin)
                .build();

        return classStudentRepository.save(classStudent);
    }

    
}