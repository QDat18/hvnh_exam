package vn.hvnh.exam.dto;

import java.util.UUID;

public class GenerateFlashcardsRequest {
    private UUID studentDocId;
    private Integer count; // Preferred number of cards to generate

    public GenerateFlashcardsRequest() {}

    public UUID getStudentDocId() {
        return studentDocId;
    }

    public void setStudentDocId(UUID studentDocId) {
        this.studentDocId = studentDocId;
    }

    public Integer getCount() {
        return count;
    }

    public void setCount(Integer count) {
        this.count = count;
    }
}
