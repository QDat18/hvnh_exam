package vn.hvnh.exam.service;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import vn.hvnh.exam.entity.sql.SystemSetting;
import vn.hvnh.exam.repository.sql.SystemSettingRepository;

import java.util.Optional;

@Service
public class SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;

    public SystemSettingService(SystemSettingRepository systemSettingRepository) {
        this.systemSettingRepository = systemSettingRepository;
    }

    @Cacheable(value = "systemSettings", key = "#key")
    public Optional<String> getSettingValue(String key) {
        System.out.println("🌐 Querying DB for System Setting: " + key);
        return systemSettingRepository.findById(key)
                .map(SystemSetting::getSettingValue);
    }

    @CacheEvict(value = "systemSettings", allEntries = true)
    public void updateSetting(String key, String value) {
        SystemSetting setting = systemSettingRepository.findById(key)
                .orElseGet(() -> {
                    SystemSetting s = new SystemSetting();
                    s.setSettingKey(key);
                    return s;
                });
        setting.setSettingValue(value);
        systemSettingRepository.save(setting);
    }

    @CacheEvict(value = "systemSettings", allEntries = true)
    public void clearCache() {
        // Manual cache eviction for administrative use
    }
}
