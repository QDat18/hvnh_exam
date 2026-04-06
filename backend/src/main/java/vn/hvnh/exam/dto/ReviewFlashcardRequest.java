package vn.hvnh.exam.dto;

import java.util.*;

public class ReviewFlashcardRequest {
    private Integer quality; // 0-5 (SM-2 algorithm)

    public ReviewFlashcardRequest() {}

    public ReviewFlashcardRequest(Integer quality) {
        this.quality = quality;
    }

    public Integer getQuality() {
        return quality;
    }

    public void setQuality(Integer quality) {
        this.quality = quality;
    }
}