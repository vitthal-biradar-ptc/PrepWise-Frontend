# Backend Specification for PrepWise Interview System

## Overview
This document outlines the backend requirements for the PrepWise Interview System, which needs to be implemented in Java Spring Boot.

## Technology Stack
- **Framework**: Spring Boot 3.x
- **Language**: Java 17+
- **Database**: PostgreSQL (recommended) or MySQL
- **Authentication**: JWT-based authentication
- **Build Tool**: Maven or Gradle

## Core Entities

### 1. User Entity
```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false)
    private String firstName;
    
    @Column(nullable = false)
    private String lastName;
    
    @Enumerated(EnumType.STRING)
    private UserRole role;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Getters, setters, constructors
}
```

### 2. Interview Entity
```java
@Entity
@Table(name = "interviews")
public class Interview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private String role;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterviewLevel level;
    
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;
    
    @Column(name = "end_time")
    private LocalDateTime endTime;
    
    @Column(name = "duration_minutes")
    private Integer durationMinutes;
    
    @Column(name = "overall_score")
    private Integer overallScore;
    
    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private InterviewStatus status;
    
    @OneToMany(mappedBy = "interview", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<InterviewQuestion> questions;
    
    @OneToOne(mappedBy = "interview", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private InterviewFeedback feedback;
    
    // Getters, setters, constructors
}
```

### 3. InterviewQuestion Entity
```java
@Entity
@Table(name = "interview_questions")
public class InterviewQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false)
    private Interview interview;
    
    @Column(nullable = false)
    private String question;
    
    @Column(name = "user_answer")
    private String userAnswer;
    
    @Column(name = "correct_answer")
    private String correctAnswer;
    
    @Column(name = "feedback")
    private String feedback;
    
    @Column(name = "score")
    private Integer score;
    
    @Column(name = "question_order")
    private Integer questionOrder;
    
    // Getters, setters, constructors
}
```

### 4. InterviewFeedback Entity
```java
@Entity
@Table(name = "interview_feedbacks")
public class InterviewFeedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false)
    private Interview interview;
    
    @ElementCollection
    @CollectionTable(name = "feedback_strengths", joinColumns = @JoinColumn(name = "feedback_id"))
    @Column(name = "strength")
    private List<String> strengths;
    
    @ElementCollection
    @CollectionTable(name = "feedback_improvement_areas", joinColumns = @JoinColumn(name = "feedback_id"))
    @Column(name = "improvement_area")
    private List<String> improvementAreas;
    
    @Column(name = "detailed_feedback", columnDefinition = "TEXT")
    private String detailedFeedback;
    
    // Getters, setters, constructors
}
```

## Enums

### InterviewLevel
```java
public enum InterviewLevel {
    EASY, MEDIUM, HARD
}
```

### InterviewStatus
```java
public enum InterviewStatus {
    NOT_STARTED, IN_PROGRESS, COMPLETED, CANCELLED
```

### UserRole
```java
public enum UserRole {
    USER, ADMIN
}
```

## API Endpoints

### Authentication
```
POST /api/auth/signup
POST /api/auth/signin
POST /api/auth/refresh
POST /api/auth/logout
```

### Interviews
```
GET    /api/interviews                    - Get user's interviews
POST   /api/interviews                    - Create new interview
GET    /api/interviews/{id}               - Get interview details
PUT    /api/interviews/{id}               - Update interview
DELETE /api/interviews/{id}               - Delete interview
POST   /api/interviews/{id}/start         - Start interview
POST   /api/interviews/{id}/end           - End interview
POST   /api/interviews/{id}/questions     - Add question
PUT    /api/interviews/{id}/questions     - Update question
```

### Questions
```
GET    /api/interviews/{id}/questions     - Get interview questions
POST   /api/interviews/{id}/questions     - Add question
PUT    /api/interviews/{id}/questions/{qId} - Update question
DELETE /api/interviews/{id}/questions/{qId} - Delete question
```

### Feedback
```
GET    /api/interviews/{id}/feedback      - Get interview feedback
POST   /api/interviews/{id}/feedback      - Create feedback
PUT    /api/interviews/{id}/feedback      - Update feedback
```

## DTOs (Data Transfer Objects)

### InterviewCreateDTO
```java
public class InterviewCreateDTO {
    private String role;
    private InterviewLevel level;
    private Long userId;
}
```

### InterviewResponseDTO
```java
public class InterviewResponseDTO {
    private Long id;
    private String role;
    private InterviewLevel level;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private Integer overallScore;
    private InterviewStatus status;
    private List<QuestionResponseDTO> questions;
    private FeedbackResponseDTO feedback;
}
```

### QuestionResponseDTO
```java
public class QuestionResponseDTO {
    private Long id;
    private String question;
    private String userAnswer;
    private String correctAnswer;
    private String feedback;
    private Integer score;
    private Integer questionOrder;
}
```

### FeedbackResponseDTO
```java
public class FeedbackResponseDTO {
    private Long id;
    private List<String> strengths;
    private List<String> improvementAreas;
    private String detailedFeedback;
}
```

## Security Configuration

### JWT Configuration
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Interviews Table
```sql
CREATE TABLE interviews (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    role VARCHAR(255) NOT NULL,
    level VARCHAR(20) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    overall_score INTEGER,
    status VARCHAR(20) DEFAULT 'NOT_STARTED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Interview Questions Table
```sql
CREATE TABLE interview_questions (
    id BIGSERIAL PRIMARY KEY,
    interview_id BIGINT NOT NULL REFERENCES interviews(id),
    question TEXT NOT NULL,
    user_answer TEXT,
    correct_answer TEXT,
    feedback TEXT,
    score INTEGER,
    question_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Interview Feedback Table
```sql
CREATE TABLE interview_feedbacks (
    id BIGSERIAL PRIMARY KEY,
    interview_id BIGINT UNIQUE NOT NULL REFERENCES interviews(id),
    detailed_feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Feedback Strengths Table
```sql
CREATE TABLE feedback_strengths (
    feedback_id BIGINT NOT NULL REFERENCES interview_feedbacks(id),
    strength VARCHAR(500) NOT NULL
);
```

### Feedback Improvement Areas Table
```sql
CREATE TABLE feedback_improvement_areas (
    feedback_id BIGINT NOT NULL REFERENCES interview_feedbacks(id),
    improvement_area VARCHAR(500) NOT NULL
);
```

## Implementation Steps

1. **Setup Spring Boot Project**
   - Create new Spring Boot project with dependencies:
     - Spring Web
     - Spring Data JPA
     - Spring Security
     - Spring Boot Starter Validation
     - PostgreSQL Driver (or MySQL)
     - JWT library

2. **Configure Database**
   - Set up database connection
   - Configure JPA properties
   - Create database schema

3. **Implement Entities and Repositories**
   - Create all entity classes
   - Create JPA repositories
   - Implement basic CRUD operations

4. **Implement Services**
   - UserService
   - InterviewService
   - QuestionService
   - FeedbackService

5. **Implement Controllers**
   - AuthController
   - InterviewController
   - QuestionController
   - FeedbackController

6. **Implement Security**
   - JWT authentication
   - Password encryption
   - Role-based access control

7. **Testing**
   - Unit tests for services
   - Integration tests for controllers
   - API testing with Postman or similar

## Environment Variables
```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/prepwise
spring.datasource.username=your_username
spring.datasource.password=your_password

# JWT
jwt.secret=your_jwt_secret_key_here
jwt.expiration=86400000

# Server
server.port=8080
```

## Notes
- Implement proper error handling and validation
- Add logging for debugging and monitoring
- Implement rate limiting for API endpoints
- Add API documentation using Swagger/OpenAPI
- Consider implementing caching for frequently accessed data
- Implement proper transaction management
- Add health check endpoints for monitoring
