package vn.hvnh.exam.entity.nosql;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "action_logs")
public class ActionLog {
    @Id
    private String id;
    
    private String email;          
    private String role;           
    private String action;         
    private String ipAddress;      
    private String endPoint;       
    private String details;        
    
    private LocalDateTime timestamp;

    public ActionLog() {}

    public ActionLog(String id, String email, String role, String action, String ipAddress, String endPoint, String details, LocalDateTime timestamp) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.action = action;
        this.ipAddress = ipAddress;
        this.endPoint = endPoint;
        this.details = details;
        this.timestamp = timestamp;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getEndPoint() { return endPoint; }
    public void setEndPoint(String endPoint) { this.endPoint = endPoint; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String email;
        private String role;
        private String action;
        private String ipAddress;
        private String endPoint;
        private String details;
        private LocalDateTime timestamp;

        public Builder id(String id) { this.id = id; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder role(String role) { this.role = role; return this; }
        public Builder action(String action) { this.action = action; return this; }
        public Builder ipAddress(String ipAddress) { this.ipAddress = ipAddress; return this; }
        public Builder endPoint(String endPoint) { this.endPoint = endPoint; return this; }
        public Builder details(String details) { this.details = details; return this; }
        public Builder timestamp(LocalDateTime timestamp) { this.timestamp = timestamp; return this; }

        public ActionLog build() {
            return new ActionLog(id, email, role, action, ipAddress, endPoint, details, timestamp);
        }
    }
}