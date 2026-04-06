package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity lưu cài đặt hệ thống dạng key-value
 * Ví dụ: siteName = "HVNH Online", maintenanceMode = "false"
 */
@Entity
@Table(name = "system_settings")
public class SystemSetting {

    @Id
    @Column(name = "setting_key", length = 100)
    private String settingKey;

    @Column(name = "setting_value", columnDefinition = "text")
    private String settingValue;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public SystemSetting() {}

    public SystemSetting(String settingKey, String settingValue, LocalDateTime updatedAt) {
        this.settingKey = settingKey;
        this.settingValue = settingValue;
        this.updatedAt = updatedAt;
    }

    public String getSettingKey() { return settingKey; }
    public void setSettingKey(String settingKey) { this.settingKey = settingKey; }
    public String getSettingValue() { return settingValue; }
    public void setSettingValue(String settingValue) { this.settingValue = settingValue; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.updatedAt = LocalDateTime.now();
    }

    public static SystemSettingBuilder builder() {
        return new SystemSettingBuilder();
    }

    public static class SystemSettingBuilder {
        private String settingKey;
        private String settingValue;
        private LocalDateTime updatedAt;

        public SystemSettingBuilder settingKey(String settingKey) {
            this.settingKey = settingKey;
            return this;
        }

        public SystemSettingBuilder settingValue(String settingValue) {
            this.settingValue = settingValue;
            return this;
        }

        public SystemSettingBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public SystemSetting build() {
            return new SystemSetting(settingKey, settingValue, updatedAt);
        }
    }
}
