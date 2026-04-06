package vn.hvnh.exam.util;

import java.text.Normalizer;
import java.util.regex.Pattern;

public class SimilarityUtils {

    /**
     * Chuẩn hóa chuỗi Tiếng Việt: Chuyển thường, xóa dấu, xóa khoảng trắng thừa, xóa dấu câu
     */
    public static String normalize(String input) {
        if (input == null || input.isEmpty()) return "";

        // 1. Chuyển sang chữ thường
        String temp = input.toLowerCase().trim();

        // 2. Loại bỏ dấu tiếng Việt (Normalizer NFD + Regex)
        temp = Normalizer.normalize(temp, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        temp = pattern.matcher(temp).replaceAll("");

        // 3. Thay đ -> d
        temp = temp.replace('đ', 'd').replace('Đ', 'd');

        // 4. Xóa các ký tự đặc biệt/dấu câu, chỉ giữ chữ và số
        temp = temp.replaceAll("[^a-z0-9\\s]", "");

        // 5. Thay khoảng trắng nhiều thành 1
        temp = temp.replaceAll("\\s+", " ");

        return temp.trim();
    }
}
