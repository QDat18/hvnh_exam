package vn.hvnh.exam.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import lombok.RequiredArgsConstructor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Path;
import java.nio.file.Paths;


@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Ánh xạ URL /uploads/** tới thư mục vật lý "uploads" trong máy tính
        Path uploadDir = Paths.get("uploads");
        String uploadPath = uploadDir.toFile().getAbsolutePath();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath + "/");
    }

    private final GlobalAuditInterceptor globalAuditInterceptor;
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Gắn cổng an ninh vào tất cả các đường dẫn bắt đầu bằng /api/
        registry.addInterceptor(globalAuditInterceptor)
                .addPathPatterns("/api/**"); 
    }
}