package vn.hvnh.exam.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hvnh.exam.entity.sql.User;
import vn.hvnh.exam.repository.sql.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.HashMap;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;
import java.util.ArrayList;

@Service
public class UserCreationService {
    
    private final UserRepository userRepository;
    private final SupabaseService supabaseService;
    
    private static final String LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    private static final String UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "!@#$%^&*";
    private static final String ALL_CHARS = LOWERCASE + UPPERCASE + DIGITS + SPECIAL;
    private static final SecureRandom random = new SecureRandom();

    public UserCreationService(UserRepository userRepository, SupabaseService supabaseService) {
        this.userRepository = userRepository;
        this.supabaseService = supabaseService;
    }
    
    /**
     * Tạo mật khẩu ngẫu nhiên mạnh
     * Format: Hvnh@2024Abc (ít nhất 12 ký tự)
     */
    public String generateSecurePassword() {
        int length = 12;
        StringBuilder password = new StringBuilder(length);
        
        // Đảm bảo có ít nhất 1 ký tự mỗi loại
        password.append(UPPERCASE.charAt(random.nextInt(UPPERCASE.length())));
        password.append(LOWERCASE.charAt(random.nextInt(LOWERCASE.length())));
        password.append(DIGITS.charAt(random.nextInt(DIGITS.length())));
        password.append(SPECIAL.charAt(random.nextInt(SPECIAL.length())));
        
        // Fill còn lại với random
        for (int i = 4; i < length; i++) {
            password.append(ALL_CHARS.charAt(random.nextInt(ALL_CHARS.length())));
        }
        
        // Shuffle để không predictable
        return shuffleString(password.toString());
    }
    
    /**
     * Tạo mật khẩu dễ nhớ theo pattern
     * Format: Hvnh@YYYY + 4 số ngẫu nhiên (VD: Hvnh@20241234)
     */
    public String generateEasyPassword() {
        int year = LocalDateTime.now().getYear();
        int randomNum = 1000 + random.nextInt(9000); // 1000-9999
        return "Hvnh@" + year + randomNum;
    }
    
    /**
     * Shuffle string
     */
    private String shuffleString(String input) {
        char[] characters = input.toCharArray();
        for (int i = characters.length - 1; i > 0; i--) {
            int index = random.nextInt(i + 1);
            char temp = characters[index];
            characters[index] = characters[i];
            characters[i] = temp;
        }
        return new String(characters);
    }
    
    /**
     * Tạo Faculty Admin khi tạo khoa mới
     */
    @Transactional
    public User createFacultyAdmin(String facultyCode, String facultyName, UUID createdById) {
        // Tạo email: khoa.cntt@hvnh.edu.vn
        String email = "khoa." + facultyCode.toLowerCase() + "@hvnh.edu.vn";
        
        // Check if exists
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Faculty Admin đã tồn tại: " + email);
        }
        
        // Generate password
        String password = generateEasyPassword();
        
        // Create in Supabase
        String supabaseUserId = supabaseService.createUser(email, password);
        
        // Create in database
        User facultyAdmin = User.builder()
                .id(UUID.fromString(supabaseUserId))
                .email(email)
                .fullName("Khoa " + facultyName)
                .role("FACULTY_ADMIN")
                .status("ACTIVE")
                .isFirstLogin(true)
                .defaultPassword(password) // Store for first login
                .passwordChanged(false)
                .createdBy(userRepository.findById(createdById).orElse(null))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        User saved = userRepository.save(facultyAdmin);
        
        System.out.println("✅ Created Faculty Admin: " + email + " | Password: " + password);
        
        return saved;
    }
    
    /**
     * Tạo Teacher bởi Faculty Admin
     */
    @Transactional
    public User createTeacher(String email, String fullName, UUID facultyId, UUID createdById) {
        // Validate email domain
        if (!email.endsWith("@hvnh.edu.vn")) {
            throw new RuntimeException("Hãy sử dụng mail của HVNH với domain @hvnh.edu.vn");
        }
        
        // Check if exists
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email đã tồn tại: " + email);
        }
        
        // Generate password
        String password = generateEasyPassword();
        
        // Create in Supabase
        String supabaseUserId = supabaseService.createUser(email, password);
        
        // Create in database
        User teacher = User.builder()
                .id(UUID.fromString(supabaseUserId))
                .email(email)
                .fullName(fullName)
                .role("TEACHER")
                .status("ACTIVE")
                .isFirstLogin(true)
                .defaultPassword(password)
                .passwordChanged(false)
                .createdBy(userRepository.findById(createdById).orElse(null))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        User saved = userRepository.save(teacher);
        
        System.out.println("✅ Created Teacher: " + email + " | Password: " + password);
        
        return saved;
    }
    
    /**
     * Tạo Student bởi Teacher (với MSSV)
     */
    @Transactional
    public User createStudent(String studentId, String fullName, UUID classId, UUID createdById) {
        // Email format: mssv@hvnh.edu.vn
        String email = studentId.toLowerCase() + "@hvnh.edu.vn";
        
        // Check if exists
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Sinh viên đã tồn tại: " + email);
        }
        
        // Generate password
        String password = "Hvnh1961"; // Mật khẩu mặc định, bắt buộc đổi lần đầu
        
        // Create in Supabase
        String supabaseUserId = supabaseService.createUser(email, password);
        
        // Create in database
        User student = User.builder()
                .id(UUID.fromString(supabaseUserId))
                .email(email)
                .studentId(studentId) // MSSV
                .fullName(fullName)
                .role("STUDENT")
                .status("ACTIVE")
                .isFirstLogin(true)
                .defaultPassword(password)
                .passwordChanged(false)
                .createdBy(userRepository.findById(createdById).orElse(null))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        User saved = userRepository.save(student);
        
        System.out.println("✅ Created Student: " + email + " (MSSV: " + studentId + ") | Password: " + password);
        
        return saved;
    }
    
    /**
     * Tạo nhiều students cùng lúc
     */
    @Transactional
    public List<User> createBulkStudents(
            List<StudentCreateRequest> students, 
            UUID classId, 
            UUID createdById
    ) {
        List<User> createdStudents = new ArrayList<>();
        
        for (StudentCreateRequest req : students) {
            try {
                User student = createStudent(req.getStudentId(), req.getFullName(), classId, createdById);
                createdStudents.add(student);
            } catch (Exception e) {
                System.err.println("❌ Failed to create student " + req.getStudentId() + ": " + e.getMessage());
                // Continue with others
            }
        }
        
        System.out.println("✅ Bulk create completed: " + createdStudents.size() + "/" + students.size() + " students");
        
        return createdStudents;
    }
    
    /**
     * DTO for bulk student creation
     */
    public static class StudentCreateRequest {
        private String studentId; // MSSV
        private String fullName;
        
        public StudentCreateRequest() {}
        public StudentCreateRequest(String studentId, String fullName) {
            this.studentId = studentId;
            this.fullName = fullName;
        }
        
        public String getStudentId() { return studentId; }
        public void setStudentId(String studentId) { this.studentId = studentId; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
    }

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key.service-role-key}")
    private String supabaseServiceKey;

    public void updateSupabasePassword(UUID userId, String newPassword) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", supabaseServiceKey);
            headers.set("Authorization", "Bearer " + supabaseServiceKey);

            Map<String, String> body = new HashMap<>();
            body.put("password", newPassword);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
            String url = supabaseUrl + "/auth/v1/admin/users/" + userId.toString();

            // Gọi API PUT để đè mật khẩu mới lên Supabase
            restTemplate.exchange(url, HttpMethod.PUT, entity, String.class);
            System.out.println("✅ Đã đồng bộ mật khẩu mới lên Supabase Auth cho User: " + userId);
            
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi update password trên Supabase: " + e.getMessage());
            throw new RuntimeException("Không thể đồng bộ mật khẩu với máy chủ xác thực.");
        }
    }
}