package vn.hvnh.exam.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key.service-role-key}")
    private String serviceRoleKey;

    @Value("${supabase.bucket:documents}") 
    private String bucketName;

    public String uploadFile(MultipartFile file) {
        try {
            String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = originalFileName.contains(".") ? originalFileName.substring(originalFileName.lastIndexOf(".")) : "";
            String newFileName = UUID.randomUUID().toString() + fileExtension;

            // URL API của Supabase
            String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + newFileName;

            // Setup Header có nhét service-role-key
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(serviceRoleKey);
            String contentType = file.getContentType() != null ? file.getContentType() : "application/pdf";
            headers.setContentType(MediaType.parseMediaType(contentType));

            HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> response = restTemplate.exchange(
                    uploadUrl, 
                    HttpMethod.POST, 
                    requestEntity, 
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                // Trả về link Public
                return supabaseUrl + "/storage/v1/object/public/" + bucketName + "/" + newFileName;
            } else {
                throw new RuntimeException("Lỗi từ Supabase: " + response.getBody());
            }

        } catch (Exception ex) {
            throw new RuntimeException("Không thể lưu file lên Supabase: " + ex.getMessage(), ex);
        }
    }
}