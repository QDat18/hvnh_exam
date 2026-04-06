package vn.hvnh.exam;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableAsync
public class ExamSystemApplication {

    public static void main(String[] args) {
        // Load .env from root directory (..)
        Dotenv dotenv = Dotenv.configure()
                .directory("..")
                .ignoreIfMissing()
                .load();
        dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));

        SpringApplication.run(ExamSystemApplication.class, args);
    }
}
