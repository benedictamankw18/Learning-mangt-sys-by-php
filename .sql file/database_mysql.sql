-- =========================================
-- MySQL Database Schema for School Management System
-- =========================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- =========================================
-- ROLES
-- =========================================
CREATE TABLE Roles (
    RoleId INT AUTO_INCREMENT PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- USERS
-- =========================================
CREATE TABLE Users (
    UserId INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    IsActive BOOLEAN DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE UserRoles (
    UserRoleId INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    RoleId INT NOT NULL,
    CONSTRAINT FK_UserRoles_User FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT FK_UserRoles_Role FOREIGN KEY (RoleId) REFERENCES Roles(RoleId),
    UNIQUE(UserId, RoleId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- ACADEMIC STRUCTURE
-- =========================================
CREATE TABLE AcademicYears (
    AcademicYearId INT AUTO_INCREMENT PRIMARY KEY,
    YearName VARCHAR(20) NOT NULL UNIQUE, -- e.g. 2025/2026
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    IsCurrent BOOLEAN DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Semesters (
    SemesterId INT AUTO_INCREMENT PRIMARY KEY,
    AcademicYearId INT NOT NULL,
    SemesterName VARCHAR(20) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    IsCurrent BOOLEAN DEFAULT 0,
    CONSTRAINT FK_Semesters_AcademicYear FOREIGN KEY (AcademicYearId)
        REFERENCES AcademicYears(AcademicYearId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Levels (
    LevelId INT AUTO_INCREMENT PRIMARY KEY,
    LevelName VARCHAR(20) NOT NULL UNIQUE, -- SHS 1, SHS 2
    LevelOrder INT NOT NULL UNIQUE -- 1,2,3
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Classes (
    ClassId INT AUTO_INCREMENT PRIMARY KEY,
    ClassName VARCHAR(50) NOT NULL,
    LevelId INT NOT NULL,
    AcademicYearId INT NOT NULL,
    CONSTRAINT FK_Classes_Level FOREIGN KEY (LevelId) REFERENCES Levels(LevelId),
    CONSTRAINT FK_Classes_AcademicYear FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(AcademicYearId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- USERS SUBTYPES
-- =========================================
CREATE TABLE Students (
    StudentId INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT UNIQUE,
    AdmissionNumber VARCHAR(50) NOT NULL UNIQUE,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Gender VARCHAR(10) NOT NULL, -- male, female
    DateOfBirth DATE,
    AdmissionDate DATE NOT NULL,
    Status VARCHAR(20) DEFAULT 'active', -- active, graduated, withdrawn, suspended
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Students_User FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Teachers (
    TeacherId INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT UNIQUE,
    StaffNumber VARCHAR(50) NOT NULL UNIQUE,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    EmploymentDate DATE,
    CONSTRAINT FK_Teachers_User FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Admins (
    AdminId INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL UNIQUE,
    StaffNumber VARCHAR(50) UNIQUE,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    RoleTitle VARCHAR(100),
    Phone VARCHAR(20),
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Admins_User FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Parents (
    ParentId INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL UNIQUE,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Phone VARCHAR(20),
    Email VARCHAR(100),
    Occupation VARCHAR(100),
    Address TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Parents_User FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ParentStudents (
    ParentStudentId INT AUTO_INCREMENT PRIMARY KEY,
    ParentId INT NOT NULL,
    StudentId INT NOT NULL,
    Relationship VARCHAR(20) NOT NULL, -- father, mother, guardian, sponsor, other
    IsPrimary BOOLEAN DEFAULT 0,
    UNIQUE(ParentId, StudentId),
    CONSTRAINT FK_ParentStudents_Parent FOREIGN KEY (ParentId) REFERENCES Parents(ParentId) ON DELETE CASCADE,
    CONSTRAINT FK_ParentStudents_Student FOREIGN KEY (StudentId) REFERENCES Students(StudentId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- ENROLLMENTS & PROMOTIONS
-- =========================================
CREATE TABLE Enrollments (
    EnrollmentId INT AUTO_INCREMENT PRIMARY KEY,
    StudentId INT NOT NULL,
    AcademicYearId INT NOT NULL,
    LevelId INT NOT NULL,
    ClassId INT NULL,
    EnrollmentStatus VARCHAR(20) DEFAULT 'active', -- active, promoted, repeated, withdrawn
    PromotionStatus VARCHAR(20) DEFAULT 'pending', -- pending, promoted, repeated
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(StudentId, AcademicYearId),
    CONSTRAINT FK_Enrollments_Student FOREIGN KEY (StudentId) REFERENCES Students(StudentId) ON DELETE CASCADE,
    CONSTRAINT FK_Enrollments_Year FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(AcademicYearId),
    CONSTRAINT FK_Enrollments_Level FOREIGN KEY (LevelId) REFERENCES Levels(LevelId),
    CONSTRAINT FK_Enrollments_Class FOREIGN KEY (ClassId) REFERENCES Classes(ClassId) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE PromotionDecisions (
    DecisionId INT AUTO_INCREMENT PRIMARY KEY,
    StudentId INT NOT NULL,
    AcademicYearId INT NOT NULL,
    CurrentLevelId INT NOT NULL,
    NextLevelId INT NULL,
    Decision VARCHAR(20) NOT NULL, -- promoted, repeated, withdrawn, graduated
    DecisionDate DATE NOT NULL,
    ApprovedBy INT NULL,
    Remarks TEXT,
    CONSTRAINT FK_PromotionDecisions_Student FOREIGN KEY (StudentId) REFERENCES Students(StudentId),
    CONSTRAINT FK_PromotionDecisions_Year FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(AcademicYearId),
    CONSTRAINT FK_PromotionDecisions_CurrentLevel FOREIGN KEY (CurrentLevelId) REFERENCES Levels(LevelId),
    CONSTRAINT FK_PromotionDecisions_NextLevel FOREIGN KEY (NextLevelId) REFERENCES Levels(LevelId) ON DELETE SET NULL,
    CONSTRAINT FK_PromotionDecisions_ApprovedBy FOREIGN KEY (ApprovedBy) REFERENCES Users(UserId) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- SUBJECTS & TEACHERS
-- =========================================
CREATE TABLE Subjects (
    SubjectId INT AUTO_INCREMENT PRIMARY KEY,
    SubjectName VARCHAR(100) NOT NULL UNIQUE,
    SubjectCode VARCHAR(20) UNIQUE,
    IsCore BOOLEAN DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE LevelSubjects (
    LevelSubjectId INT AUTO_INCREMENT PRIMARY KEY,
    LevelId INT NOT NULL,
    SubjectId INT NOT NULL,
    UNIQUE(LevelId, SubjectId),
    CONSTRAINT FK_LevelSubjects_Level FOREIGN KEY (LevelId) REFERENCES Levels(LevelId) ON DELETE CASCADE,
    CONSTRAINT FK_LevelSubjects_Subject FOREIGN KEY (SubjectId) REFERENCES Subjects(SubjectId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE TeacherSubjects (
    TeacherSubjectId INT AUTO_INCREMENT PRIMARY KEY,
    TeacherId INT NOT NULL,
    SubjectId INT NOT NULL,
    ClassId INT NOT NULL,
    LevelId INT NOT NULL,
    UNIQUE(TeacherId, SubjectId, ClassId, LevelId),
    CONSTRAINT FK_TeacherSubjects_Teacher FOREIGN KEY (TeacherId) REFERENCES Teachers(TeacherId) ON DELETE CASCADE,
    CONSTRAINT FK_TeacherSubjects_Subject FOREIGN KEY (SubjectId) REFERENCES Subjects(SubjectId),
    CONSTRAINT FK_TeacherSubjects_Class FOREIGN KEY (ClassId) REFERENCES Classes(ClassId) ON DELETE CASCADE,
    CONSTRAINT FK_TeacherSubjects_Level FOREIGN KEY (LevelId) REFERENCES Levels(LevelId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- RESULTS
-- =========================================
CREATE TABLE Results (
    ResultId INT AUTO_INCREMENT PRIMARY KEY,
    StudentId INT NOT NULL,
    SubjectId INT NOT NULL,
    SemesterId INT NOT NULL,
    ClassScore DECIMAL(5,2) DEFAULT 0,
    ExamScore DECIMAL(5,2) DEFAULT 0,
    TotalScore DECIMAL(5,2) AS (ClassScore + ExamScore) STORED,
    Grade VARCHAR(5),
    Remark VARCHAR(10), -- Pass / Fail
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(StudentId, SubjectId, SemesterId),
    CONSTRAINT FK_Results_Student FOREIGN KEY (StudentId) REFERENCES Students(StudentId) ON DELETE CASCADE,
    CONSTRAINT FK_Results_Subject FOREIGN KEY (SubjectId) REFERENCES Subjects(SubjectId),
    CONSTRAINT FK_Results_Semester FOREIGN KEY (SemesterId) REFERENCES Semesters(SemesterId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- ATTENDANCE
-- =========================================
CREATE TABLE Attendance (
    AttendanceId INT AUTO_INCREMENT PRIMARY KEY,
    StudentId INT NOT NULL,
    ClassId INT NOT NULL,
    AttendanceDate DATE NOT NULL,
    Status VARCHAR(10) NOT NULL, -- present, absent, late
    UNIQUE(StudentId, ClassId, AttendanceDate),
    CONSTRAINT FK_Attendance_Student FOREIGN KEY (StudentId) REFERENCES Students(StudentId) ON DELETE CASCADE,
    CONSTRAINT FK_Attendance_Class FOREIGN KEY (ClassId) REFERENCES Classes(ClassId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- ASSESSMENTS
-- =========================================
CREATE TABLE AssessmentCategories (
    CategoryId INT AUTO_INCREMENT PRIMARY KEY,
    CategoryName VARCHAR(100) NOT NULL, -- Assignment, Quiz, Exam
    WeightPercentage DECIMAL(5,2) NOT NULL,
    LevelId INT NOT NULL,
    SubjectId INT NOT NULL,
    AcademicYearId INT NOT NULL,
    CONSTRAINT FK_AC_Level FOREIGN KEY (LevelId) REFERENCES Levels(LevelId) ON DELETE CASCADE,
    CONSTRAINT FK_AC_Subject FOREIGN KEY (SubjectId) REFERENCES Subjects(SubjectId) ON DELETE CASCADE,
    CONSTRAINT FK_AC_Year FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(AcademicYearId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Assessments (
    AssessmentId INT AUTO_INCREMENT PRIMARY KEY,
    CategoryId INT NOT NULL,
    Title VARCHAR(255) NOT NULL,
    TotalMarks DECIMAL(5,2) NOT NULL,
    AssessmentDate DATE,
    SemesterId INT NOT NULL,
    CreatedBy INT NOT NULL,
    CONSTRAINT FK_Assessments_Category FOREIGN KEY (CategoryId) REFERENCES AssessmentCategories(CategoryId) ON DELETE CASCADE,
    CONSTRAINT FK_Assessments_Semester FOREIGN KEY (SemesterId) REFERENCES Semesters(SemesterId) ON DELETE CASCADE,
    CONSTRAINT FK_Assessments_Creator FOREIGN KEY (CreatedBy) REFERENCES Users(UserId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE AssessmentScores (
    ScoreId INT AUTO_INCREMENT PRIMARY KEY,
    AssessmentId INT NOT NULL,
    StudentId INT NOT NULL,
    Score DECIMAL(5,2) NOT NULL,
    GradedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(AssessmentId, StudentId),
    CONSTRAINT FK_AssessmentScores_Assessment FOREIGN KEY (AssessmentId) REFERENCES Assessments(AssessmentId) ON DELETE CASCADE,
    CONSTRAINT FK_AssessmentScores_Student FOREIGN KEY (StudentId) REFERENCES Students(StudentId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- GRADE SCALES
-- =========================================
CREATE TABLE GradeScales (
    GradeId INT AUTO_INCREMENT PRIMARY KEY,
    GradeLetter VARCHAR(5),
    MinScore DECIMAL(5,2),
    MaxScore DECIMAL(5,2),
    Remark VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- LEARNING MATERIALS
-- =========================================
CREATE TABLE LearningMaterials (
    MaterialId INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Description TEXT NULL,
    FileName VARCHAR(255) NOT NULL,
    FilePath VARCHAR(500) NOT NULL,
    FileSize BIGINT NOT NULL,
    FileType VARCHAR(20) NOT NULL,
    MimeType VARCHAR(100) NULL,
    UploadedBy INT NOT NULL,
    SubjectId INT NOT NULL,
    ClassId INT NOT NULL,
    SemesterId INT NULL,
    AcademicYearId INT NOT NULL,
    IsVisible BOOLEAN DEFAULT 1,
    AllowDownload BOOLEAN DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NULL,
    CONSTRAINT FK_LearningMaterials_Uploader FOREIGN KEY (UploadedBy) REFERENCES Users(UserId) ON DELETE CASCADE,
    CONSTRAINT FK_LearningMaterials_Subject FOREIGN KEY (SubjectId) REFERENCES Subjects(SubjectId) ON DELETE CASCADE,
    CONSTRAINT FK_LearningMaterials_Class FOREIGN KEY (ClassId) REFERENCES Classes(ClassId) ON DELETE CASCADE,
    CONSTRAINT FK_LearningMaterials_Semester FOREIGN KEY (SemesterId) REFERENCES Semesters(SemesterId) ON DELETE SET NULL,
    CONSTRAINT FK_LearningMaterials_Year FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(AcademicYearId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE MaterialDownloads (
    DownloadId INT AUTO_INCREMENT PRIMARY KEY,
    MaterialId INT NOT NULL,
    UserId INT NOT NULL,
    DownloadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_MaterialDownloads_Material FOREIGN KEY (MaterialId) REFERENCES LearningMaterials(MaterialId) ON DELETE CASCADE,
    CONSTRAINT FK_MaterialDownloads_User FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE MaterialVersions (
    VersionId INT AUTO_INCREMENT PRIMARY KEY,
    MaterialId INT NOT NULL,
    VersionNumber INT NOT NULL,
    FilePath VARCHAR(500) NOT NULL,
    UploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(MaterialId, VersionNumber),
    CONSTRAINT FK_MaterialVersions_Material FOREIGN KEY (MaterialId) REFERENCES LearningMaterials(MaterialId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE MaterialAccess (
    AccessId INT AUTO_INCREMENT PRIMARY KEY,
    MaterialId INT NOT NULL,
    StudentId INT NOT NULL,
    UNIQUE(MaterialId, StudentId),
    CONSTRAINT FK_MaterialAccess_Material FOREIGN KEY (MaterialId) REFERENCES LearningMaterials(MaterialId) ON DELETE CASCADE,
    CONSTRAINT FK_MaterialAccess_Student FOREIGN KEY (StudentId) REFERENCES Students(StudentId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- COURSES AND COURSE MATERIALS
-- =========================================
CREATE TABLE Courses (
    CourseId INT AUTO_INCREMENT PRIMARY KEY,
    CourseName VARCHAR(200) NOT NULL,
    Description TEXT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE CourseSections (
    SectionId INT AUTO_INCREMENT PRIMARY KEY,
    CourseId INT NOT NULL,
    Title VARCHAR(200) NOT NULL,
    Description TEXT NULL,
    DisplayOrder INT DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_CourseSections_Course FOREIGN KEY (CourseId) REFERENCES Courses(CourseId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE CourseMaterials (
    MaterialId INT AUTO_INCREMENT PRIMARY KEY,
    SectionId INT NOT NULL,
    Title VARCHAR(200) NOT NULL,
    FilePath VARCHAR(500) NOT NULL,
    FileType VARCHAR(20) NULL,
    FileSizeKB INT NULL,
    Description TEXT NULL,
    UploadedBy INT NOT NULL,
    UploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    IsActive BOOLEAN DEFAULT 1,
    CONSTRAINT FK_CourseMaterials_Section FOREIGN KEY (SectionId) REFERENCES CourseSections(SectionId) ON DELETE CASCADE,
    CONSTRAINT FK_CourseMaterials_User FOREIGN KEY (UploadedBy) REFERENCES Users(UserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- NOTIFICATIONS SYSTEM
-- =========================================
CREATE TABLE Notifications (
    NotificationId INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    Title VARCHAR(200) NOT NULL,
    Message TEXT NOT NULL,
    NotificationType VARCHAR(50) NULL,
    PriorityLevel VARCHAR(20) DEFAULT 'Normal',
    IsRead BOOLEAN DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt DATETIME NULL,
    CONSTRAINT FK_Notifications_User FOREIGN KEY (UserId) REFERENCES Users(UserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE NotificationReads (
    NotificationReadId INT AUTO_INCREMENT PRIMARY KEY,
    NotificationId INT NOT NULL,
    UserId INT NOT NULL,
    ReadAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_NotificationReads_Notification FOREIGN KEY (NotificationId) REFERENCES Notifications(NotificationId),
    CONSTRAINT FK_NotificationReads_User FOREIGN KEY (UserId) REFERENCES Users(UserId),
    UNIQUE(NotificationId, UserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- ACTIVITY LOG
-- =========================================
CREATE TABLE ActivityLog (
    ActivityId INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    ActivityType VARCHAR(100),
    Description TEXT,
    IPAddress VARCHAR(50),
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_ActivityLog_User FOREIGN KEY (UserId) REFERENCES Users(UserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add missing tables for error logs and login activity
CREATE TABLE ErrorLogs (
    ErrorLogId INT AUTO_INCREMENT PRIMARY KEY,
    ErrorMessage TEXT,
    StackTrace TEXT NULL,
    Source VARCHAR(255) NULL,
    InnerException TEXT NULL,
    SeverityLevel VARCHAR(20) DEFAULT 'Error',
    Resolved BOOLEAN DEFAULT 0,
    ResolvedBy INT NULL,
    ResolvedAt DATETIME NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_ErrorLogs_ResolvedBy FOREIGN KEY (ResolvedBy) REFERENCES Users(UserId) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ClientErrorLogs (
    ClientErrorId INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NULL,
    ErrorMessage TEXT,
    PageUrl VARCHAR(500) NULL,
    LineNumber INT NULL,
    ColumnNumber INT NULL,
    UserAgent VARCHAR(500) NULL,
    LoggedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    Resolved BOOLEAN DEFAULT 0,
    ResolvedBy INT NULL,
    ResolvedAt DATETIME NULL,
    CONSTRAINT FK_ClientErrorLogs_User FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE SET NULL,
    CONSTRAINT FK_ClientErrorLogs_ResolvedBy FOREIGN KEY (ResolvedBy) REFERENCES Users(UserId) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE LoginActivity (
    LoginActivityId INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    LoginTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    LogoutTime DATETIME NULL,
    IPAddress VARCHAR(50) NULL,
    UserAgent VARCHAR(500) NULL,
    IsSuccessful BOOLEAN DEFAULT 1,
    CONSTRAINT FK_LoginActivity_User FOREIGN KEY (UserId) REFERENCES Users(UserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- STORED PROCEDURES, VIEWS, AND FUNCTIONS
-- =========================================

DELIMITER $$

-- ------------------------
-- NOTIFICATIONS
-- ------------------------
CREATE PROCEDURE sp_CreateNotification(
    IN p_UserId INT,
    IN p_Title VARCHAR(200),
    IN p_Message TEXT,
    IN p_NotificationType VARCHAR(50),
    IN p_PriorityLevel VARCHAR(20),
    IN p_ExpiresAt DATETIME
)
BEGIN
    INSERT INTO Notifications
        (UserId, Title, Message, NotificationType, PriorityLevel, ExpiresAt)
    VALUES
        (p_UserId, p_Title, p_Message, p_NotificationType, p_PriorityLevel, p_ExpiresAt);
END$$

CREATE PROCEDURE sp_GetUserNotifications(
    IN p_UserId INT,
    IN p_TopCount INT
)
BEGIN
    SELECT
        NotificationId,
        Title,
        Message,
        NotificationType,
        PriorityLevel,
        IsRead,
        CreatedAt,
        ExpiresAt
    FROM Notifications
    WHERE UserId = p_UserId
      AND (ExpiresAt IS NULL OR ExpiresAt > NOW())
    ORDER BY CreatedAt DESC
    LIMIT p_TopCount;
END$$

CREATE PROCEDURE sp_MarkNotificationAsRead(
    IN p_NotificationId INT
)
BEGIN
    UPDATE Notifications
    SET IsRead = 1
    WHERE NotificationId = p_NotificationId;
END$$

CREATE FUNCTION fn_GetUnreadNotificationCount(p_UserId INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_Count INT;

    SELECT COUNT(*) INTO v_Count
    FROM Notifications
    WHERE UserId = p_UserId
      AND IsRead = 0
      AND (ExpiresAt IS NULL OR ExpiresAt > NOW());

    RETURN v_Count;
END$$

-- ------------------------
-- CLIENT ERROR LOGS
-- ------------------------
CREATE PROCEDURE GetRecentClientErrors(
    IN p_TopCount INT
)
BEGIN
    SELECT
        ClientErrorId,
        UserId,
        ErrorMessage,
        PageUrl,
        LineNumber,
        ColumnNumber,
        UserAgent,
        LoggedAt,
        Resolved
    FROM ClientErrorLogs
    ORDER BY LoggedAt DESC
    LIMIT p_TopCount;
END$$

CREATE PROCEDURE MarkClientErrorAsResolved(
    IN p_ClientErrorId INT,
    IN p_ResolvedBy INT
)
BEGIN
    UPDATE ClientErrorLogs
    SET Resolved = 1,
        ResolvedBy = p_ResolvedBy,
        ResolvedAt = NOW()
    WHERE ClientErrorId = p_ClientErrorId;
END$$

-- ------------------------
-- ACTIVITY LOG / LOGIN ACTIVITY
-- ------------------------
CREATE PROCEDURE sp_LogUserActivity(
    IN p_UserId INT,
    IN p_ActivityType VARCHAR(100),
    IN p_Description TEXT,
    IN p_IPAddress VARCHAR(50)
)
BEGIN
    INSERT INTO ActivityLog (UserId, ActivityType, Description, IPAddress)
    VALUES (p_UserId, p_ActivityType, p_Description, p_IPAddress);
END$$

CREATE PROCEDURE sp_LogUserLogin(
    IN p_UserId INT,
    IN p_IPAddress VARCHAR(50),
    IN p_UserAgent VARCHAR(500),
    IN p_IsSuccessful BOOLEAN
)
BEGIN
    INSERT INTO LoginActivity (UserId, LoginTime, IPAddress, UserAgent, IsSuccessful)
    VALUES (p_UserId, NOW(), p_IPAddress, p_UserAgent, p_IsSuccessful);
END$$

CREATE PROCEDURE sp_LogUserLogout(
    IN p_LoginActivityId INT
)
BEGIN
    UPDATE LoginActivity
    SET LogoutTime = NOW()
    WHERE LoginActivityId = p_LoginActivityId;
END$$

-- ------------------------
-- ERROR LOGS
-- ------------------------
CREATE PROCEDURE sp_LogError(
    IN p_ErrorMessage TEXT,
    IN p_StackTrace TEXT,
    IN p_Source VARCHAR(255),
    IN p_InnerException TEXT,
    IN p_SeverityLevel VARCHAR(20)
)
BEGIN
    INSERT INTO ErrorLogs (ErrorMessage, StackTrace, Source, InnerException, SeverityLevel)
    VALUES (p_ErrorMessage, p_StackTrace, p_Source, p_InnerException, p_SeverityLevel);
END$$

CREATE PROCEDURE sp_MarkErrorAsResolved(
    IN p_ErrorLogId INT,
    IN p_ResolvedBy INT
)
BEGIN
    UPDATE ErrorLogs
    SET Resolved = 1,
        ResolvedBy = p_ResolvedBy,
        ResolvedAt = NOW()
    WHERE ErrorLogId = p_ErrorLogId;
END$$

-- =========================================
-- COURSES AND MATERIALS
-- =========================================

CREATE PROCEDURE sp_AddCourse(
    IN p_CourseName VARCHAR(200),
    IN p_Description TEXT
)
BEGIN
    INSERT INTO Courses (CourseName, Description, CreatedAt)
    VALUES (p_CourseName, p_Description, NOW());
END$$

CREATE PROCEDURE sp_AddCourseSection(
    IN p_CourseId INT,
    IN p_Title VARCHAR(200),
    IN p_Description TEXT,
    IN p_DisplayOrder INT
)
BEGIN
    INSERT INTO CourseSections (CourseId, Title, Description, DisplayOrder, CreatedAt)
    VALUES (p_CourseId, p_Title, p_Description, p_DisplayOrder, NOW());
END$$

CREATE PROCEDURE sp_AddCourseMaterial(
    IN p_SectionId INT,
    IN p_Title VARCHAR(200),
    IN p_FilePath VARCHAR(500),
    IN p_FileType VARCHAR(20),
    IN p_FileSizeKB INT,
    IN p_Description TEXT,
    IN p_UploadedBy INT
)
BEGIN
    INSERT INTO CourseMaterials (SectionId, Title, FilePath, FileType, FileSizeKB, Description, UploadedBy, UploadedAt)
    VALUES (p_SectionId, p_Title, p_FilePath, p_FileType, p_FileSizeKB, p_Description, p_UploadedBy, NOW());
END$$

CREATE PROCEDURE sp_GetCourseMaterials(
    IN p_SectionId INT
)
BEGIN
    SELECT MaterialId, Title, FilePath, FileType, FileSizeKB, Description, UploadedBy, UploadedAt, IsActive
    FROM CourseMaterials
    WHERE SectionId = p_SectionId
      AND IsActive = 1
    ORDER BY UploadedAt DESC;
END$$

CREATE PROCEDURE sp_DeactivateCourseMaterial(
    IN p_MaterialId INT
)
BEGIN
    UPDATE CourseMaterials
    SET IsActive = 0
    WHERE MaterialId = p_MaterialId;
END$$

-- =========================================
-- ASSESSMENTS AND SCORES
-- =========================================

CREATE PROCEDURE sp_AddAssessmentCategory(
    IN p_CategoryName VARCHAR(100),
    IN p_WeightPercentage DECIMAL(5,2),
    IN p_LevelId INT,
    IN p_SubjectId INT,
    IN p_AcademicYearId INT
)
BEGIN
    INSERT INTO AssessmentCategories (CategoryName, WeightPercentage, LevelId, SubjectId, AcademicYearId)
    VALUES (p_CategoryName, p_WeightPercentage, p_LevelId, p_SubjectId, p_AcademicYearId);
END$$

CREATE PROCEDURE sp_AddAssessment(
    IN p_CategoryId INT,
    IN p_Title VARCHAR(255),
    IN p_TotalMarks DECIMAL(5,2),
    IN p_AssessmentDate DATE,
    IN p_SemesterId INT,
    IN p_CreatedBy INT
)
BEGIN
    INSERT INTO Assessments (CategoryId, Title, TotalMarks, AssessmentDate, SemesterId, CreatedBy)
    VALUES (p_CategoryId, p_Title, p_TotalMarks, p_AssessmentDate, p_SemesterId, p_CreatedBy);
END$$

CREATE PROCEDURE sp_AddAssessmentScore(
    IN p_AssessmentId INT,
    IN p_StudentId INT,
    IN p_Score DECIMAL(5,2)
)
BEGIN
    INSERT INTO AssessmentScores (AssessmentId, StudentId, Score)
    VALUES (p_AssessmentId, p_StudentId, p_Score);
END$$

CREATE PROCEDURE sp_GetStudentScores(
    IN p_StudentId INT,
    IN p_SemesterId INT
)
BEGIN
    SELECT s.ScoreId, a.Title AS AssessmentTitle, a.TotalMarks, s.Score, ac.CategoryName,
           su.SubjectName, a.AssessmentDate
    FROM AssessmentScores s
    INNER JOIN Assessments a ON s.AssessmentId = a.AssessmentId
    INNER JOIN AssessmentCategories ac ON a.CategoryId = ac.CategoryId
    INNER JOIN Subjects su ON ac.SubjectId = su.SubjectId
    WHERE s.StudentId = p_StudentId
      AND (p_SemesterId IS NULL OR a.SemesterId = p_SemesterId)
    ORDER BY a.AssessmentDate DESC;
END$$

-- =========================================
-- RESULTS
-- =========================================

CREATE PROCEDURE sp_AddOrUpdateResult(
    IN p_StudentId INT,
    IN p_SubjectId INT,
    IN p_SemesterId INT,
    IN p_ClassScore DECIMAL(5,2),
    IN p_ExamScore DECIMAL(5,2),
    IN p_Grade VARCHAR(5),
    IN p_Remark VARCHAR(10)
)
BEGIN
    IF EXISTS (SELECT 1 FROM Results
               WHERE StudentId = p_StudentId AND SubjectId = p_SubjectId AND SemesterId = p_SemesterId) THEN
        UPDATE Results
        SET ClassScore = p_ClassScore,
            ExamScore = p_ExamScore,
            Grade = p_Grade,
            Remark = p_Remark,
            CreatedAt = NOW()
        WHERE StudentId = p_StudentId AND SubjectId = p_SubjectId AND SemesterId = p_SemesterId;
    ELSE
        INSERT INTO Results (StudentId, SubjectId, SemesterId, ClassScore, ExamScore, Grade, Remark)
        VALUES (p_StudentId, p_SubjectId, p_SemesterId, p_ClassScore, p_ExamScore, p_Grade, p_Remark);
    END IF;
END$$

CREATE PROCEDURE sp_GetStudentResults(
    IN p_StudentId INT,
    IN p_SemesterId INT
)
BEGIN
    SELECT r.ResultId, su.SubjectName, r.ClassScore, r.ExamScore, r.TotalScore, r.Grade, r.Remark, r.CreatedAt
    FROM Results r
    INNER JOIN Subjects su ON r.SubjectId = su.SubjectId
    WHERE r.StudentId = p_StudentId
      AND (p_SemesterId IS NULL OR r.SemesterId = p_SemesterId)
    ORDER BY su.SubjectName;
END$$

-- =========================================
-- MATERIAL DOWNLOADS
-- =========================================

CREATE PROCEDURE sp_LogMaterialDownload(
    IN p_MaterialId INT,
    IN p_UserId INT
)
BEGIN
    INSERT INTO MaterialDownloads (MaterialId, UserId, DownloadedAt)
    VALUES (p_MaterialId, p_UserId, NOW());
END$$

CREATE PROCEDURE sp_GetMaterialDownloads(
    IN p_MaterialId INT
)
BEGIN
    SELECT md.DownloadId, u.Username, md.DownloadedAt
    FROM MaterialDownloads md
    INNER JOIN Users u ON md.UserId = u.UserId
    WHERE md.MaterialId = p_MaterialId
    ORDER BY md.DownloadedAt DESC;
END$$

-- =========================================
-- STUDENTS, ENROLLMENTS, PROMOTIONS
-- =========================================

CREATE PROCEDURE sp_EnrollStudent(
    IN p_StudentId INT,
    IN p_AcademicYearId INT,
    IN p_LevelId INT,
    IN p_ClassId INT,
    IN p_EnrollmentStatus VARCHAR(20)
)
BEGIN
    INSERT INTO Enrollments (StudentId, AcademicYearId, LevelId, ClassId, EnrollmentStatus, PromotionStatus, CreatedAt)
    VALUES (p_StudentId, p_AcademicYearId, p_LevelId, p_ClassId, p_EnrollmentStatus, 'pending', NOW());
END$$

CREATE PROCEDURE sp_AddPromotionDecision(
    IN p_StudentId INT,
    IN p_AcademicYearId INT,
    IN p_CurrentLevelId INT,
    IN p_NextLevelId INT,
    IN p_Decision VARCHAR(20),
    IN p_ApprovedBy INT,
    IN p_Remarks TEXT
)
BEGIN
    INSERT INTO PromotionDecisions (StudentId, AcademicYearId, CurrentLevelId, NextLevelId, Decision, DecisionDate, ApprovedBy, Remarks)
    VALUES (p_StudentId, p_AcademicYearId, p_CurrentLevelId, p_NextLevelId, p_Decision, CURDATE(), p_ApprovedBy, p_Remarks);
END$$

-- =========================================
-- ATTENDANCE
-- =========================================

CREATE PROCEDURE sp_RecordAttendance(
    IN p_StudentId INT,
    IN p_ClassId INT,
    IN p_AttendanceDate DATE,
    IN p_Status VARCHAR(10)
)
BEGIN
    IF EXISTS(SELECT 1 FROM Attendance WHERE StudentId=p_StudentId AND ClassId=p_ClassId AND AttendanceDate=p_AttendanceDate) THEN
        UPDATE Attendance
        SET Status=p_Status
        WHERE StudentId=p_StudentId AND ClassId=p_ClassId AND AttendanceDate=p_AttendanceDate;
    ELSE
        INSERT INTO Attendance (StudentId, ClassId, AttendanceDate, Status)
        VALUES (p_StudentId, p_ClassId, p_AttendanceDate, p_Status);
    END IF;
END$$

CREATE PROCEDURE sp_GetStudentAttendance(
    IN p_StudentId INT,
    IN p_ClassId INT
)
BEGIN
    SELECT AttendanceId, StudentId, ClassId, AttendanceDate, Status
    FROM Attendance
    WHERE StudentId = p_StudentId
      AND (p_ClassId IS NULL OR ClassId=p_ClassId)
    ORDER BY AttendanceDate DESC;
END$$

-- =========================================
-- REPORTS
-- =========================================

CREATE PROCEDURE sp_GetStudentReportCard(
    IN p_StudentId INT,
    IN p_SemesterId INT
)
BEGIN
    SELECT
        s.StudentId,
        s.FirstName,
        s.LastName,
        c.ClassName,
        sub.SubjectName,
        r.ClassScore,
        r.ExamScore,
        r.TotalScore,
        r.Grade,
        r.Remark
    FROM Results r
    INNER JOIN Students s ON r.StudentId = s.StudentId
    INNER JOIN Subjects sub ON r.SubjectId = sub.SubjectId
    INNER JOIN Enrollments e ON s.StudentId = e.StudentId
    LEFT JOIN Classes c ON e.ClassId = c.ClassId
    WHERE r.StudentId = p_StudentId
      AND r.SemesterId = p_SemesterId
    ORDER BY sub.SubjectName;

    -- Total and Average Scores
    SELECT 
        fn_GetSemesterTotalScore(p_StudentId, p_SemesterId) AS TotalScore,
        fn_GetSemesterAverageScore(p_StudentId, p_SemesterId) AS AverageScore;
END$$

CREATE PROCEDURE sp_GetClassAttendanceReport(
    IN p_ClassId INT
)
BEGIN
    SELECT
        s.StudentId,
        s.FirstName,
        s.LastName,
        COUNT(a.AttendanceId) AS TotalDays,
        SUM(CASE WHEN a.Status='present' THEN 1 ELSE 0 END) AS PresentDays,
        SUM(CASE WHEN a.Status='absent' THEN 1 ELSE 0 END) AS AbsentDays,
        SUM(CASE WHEN a.Status='late' THEN 1 ELSE 0 END) AS LateDays,
        CAST(SUM(CASE WHEN a.Status='present' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.AttendanceId) AS DECIMAL(5,2)) AS AttendancePercentage
    FROM Attendance a
    INNER JOIN Students s ON a.StudentId = s.StudentId
    WHERE a.ClassId = p_ClassId
    GROUP BY s.StudentId, s.FirstName, s.LastName
    ORDER BY s.LastName, s.FirstName;
END$$

CREATE PROCEDURE sp_GetTopPerformers(
    IN p_ClassId INT,
    IN p_SemesterId INT,
    IN p_TopCount INT
)
BEGIN
    WITH Ranked AS (
        SELECT 
            s.StudentId,
            s.FirstName,
            s.LastName,
            SUM(r.TotalScore) AS TotalScore,
            RANK() OVER (ORDER BY SUM(r.TotalScore) DESC) AS RankNo
        FROM Results r
        INNER JOIN Students s ON r.StudentId = s.StudentId
        INNER JOIN Enrollments e ON s.StudentId = e.StudentId
        WHERE e.ClassId = p_ClassId
          AND r.SemesterId = p_SemesterId
        GROUP BY s.StudentId, s.FirstName, s.LastName
    )
    SELECT *
    FROM Ranked
    ORDER BY RankNo ASC, TotalScore DESC
    LIMIT p_TopCount;
END$$

CREATE PROCEDURE sp_GetTeacherSubjectPerformance(
    IN p_TeacherId INT,
    IN p_SemesterId INT
)
BEGIN
    SELECT
        t.TeacherId,
        t.FirstName AS TeacherFirstName,
        t.LastName AS TeacherLastName,
        sub.SubjectName,
        c.ClassName,
        s.StudentId,
        s.FirstName AS StudentFirstName,
        s.LastName AS StudentLastName,
        r.ClassScore,
        r.ExamScore,
        r.TotalScore,
        r.Grade,
        r.Remark
    FROM TeacherSubjects ts
    INNER JOIN Subjects sub ON ts.SubjectId = sub.SubjectId
    INNER JOIN Classes c ON ts.ClassId = c.ClassId
    INNER JOIN Enrollments e ON c.ClassId = e.ClassId
    INNER JOIN Students s ON e.StudentId = s.StudentId
    INNER JOIN Results r ON s.StudentId = r.StudentId AND r.SubjectId = ts.SubjectId
    INNER JOIN Teachers t ON ts.TeacherId = t.TeacherId
    WHERE ts.TeacherId = p_TeacherId
      AND r.SemesterId = p_SemesterId
    ORDER BY c.ClassName, sub.SubjectName, s.LastName, s.FirstName;
END$$

CREATE PROCEDURE sp_GetUserNotificationsSummary(
    IN p_UserId INT
)
BEGIN
    SELECT
        n.NotificationId,
        n.Title,
        n.Message,
        n.NotificationType,
        n.PriorityLevel,
        n.IsRead,
        n.CreatedAt,
        n.ExpiresAt
    FROM Notifications n
    WHERE n.UserId = p_UserId
      AND (n.ExpiresAt IS NULL OR n.ExpiresAt > NOW())
    ORDER BY n.IsRead ASC, n.CreatedAt DESC;

    SELECT fn_GetUnreadNotificationCount(p_UserId) AS UnreadCount;
END$$

-- =========================================
-- FUNCTIONS
-- =========================================

CREATE FUNCTION fn_GetSemesterTotalScore(
    p_StudentId INT,
    p_SemesterId INT
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_TotalScore DECIMAL(10,2);

    SELECT SUM(TotalScore) INTO v_TotalScore
    FROM Results
    WHERE StudentId = p_StudentId
      AND SemesterId = p_SemesterId;

    RETURN IFNULL(v_TotalScore, 0);
END$$

CREATE FUNCTION fn_GetSemesterAverageScore(
    p_StudentId INT,
    p_SemesterId INT
)
RETURNS DECIMAL(5,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_AvgScore DECIMAL(5,2);

    SELECT AVG(TotalScore) INTO v_AvgScore
    FROM Results
    WHERE StudentId = p_StudentId
      AND SemesterId = p_SemesterId;

    RETURN IFNULL(v_AvgScore, 0);
END$$

CREATE FUNCTION fn_GetAttendancePercentage(
    p_StudentId INT,
    p_ClassId INT
)
RETURNS DECIMAL(5,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_TotalDays INT;
    DECLARE v_PresentDays INT;
    
    SELECT COUNT(*) INTO v_TotalDays
    FROM Attendance
    WHERE StudentId = p_StudentId
      AND ClassId = p_ClassId;

    SELECT COUNT(*) INTO v_PresentDays
    FROM Attendance
    WHERE StudentId = p_StudentId
      AND ClassId = p_ClassId
      AND Status='present';

    IF v_TotalDays = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN CAST(v_PresentDays * 100.0 / v_TotalDays AS DECIMAL(5,2));
END$$

DELIMITER ;

-- =========================================
-- VIEWS
-- =========================================

CREATE VIEW vw_NotificationStats AS
SELECT
    UserId,
    COUNT(*) AS TotalNotifications,
    SUM(CASE WHEN IsRead = 0 THEN 1 ELSE 0 END) AS UnreadNotifications,
    SUM(CASE WHEN IsRead = 1 THEN 1 ELSE 0 END) AS ReadNotifications
FROM Notifications
GROUP BY UserId;

CREATE VIEW vw_StudentEnrollmentSummary AS
SELECT 
    e.EnrollmentId, 
    s.StudentId, 
    s.FirstName, 
    s.LastName, 
    l.LevelName, 
    c.ClassName, 
    ay.YearName, 
    e.EnrollmentStatus
FROM Enrollments e
INNER JOIN Students s ON e.StudentId = s.StudentId
INNER JOIN Levels l ON e.LevelId = l.LevelId
LEFT JOIN Classes c ON e.ClassId = c.ClassId
INNER JOIN AcademicYears ay ON e.AcademicYearId = ay.AcademicYearId;

CREATE VIEW vw_StudentGrades AS
SELECT
    s.StudentId,
    s.FirstName,
    s.LastName,
    c.ClassName,
    sub.SubjectName,
    sem.SemesterName,
    r.TotalScore,
    r.Grade,
    r.Remark
FROM Results r
INNER JOIN Students s ON r.StudentId = s.StudentId
INNER JOIN Subjects sub ON r.SubjectId = sub.SubjectId
INNER JOIN Semesters sem ON r.SemesterId = sem.SemesterId
INNER JOIN Enrollments e ON s.StudentId = e.StudentId
LEFT JOIN Classes c ON e.ClassId = c.ClassId;

CREATE VIEW vw_StudentAttendance AS
SELECT
    s.StudentId,
    s.FirstName,
    s.LastName,
    c.ClassName,
    COUNT(a.AttendanceId) AS TotalDays,
    SUM(CASE WHEN a.Status='present' THEN 1 ELSE 0 END) AS PresentDays,
    SUM(CASE WHEN a.Status='absent' THEN 1 ELSE 0 END) AS AbsentDays,
    SUM(CASE WHEN a.Status='late' THEN 1 ELSE 0 END) AS LateDays,
    CAST(SUM(CASE WHEN a.Status='present' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.AttendanceId) AS DECIMAL(5,2)) AS AttendancePercentage
FROM Attendance a
INNER JOIN Students s ON a.StudentId = s.StudentId
INNER JOIN Classes c ON a.ClassId = c.ClassId
GROUP BY s.StudentId, s.FirstName, s.LastName, c.ClassName;

CREATE VIEW vw_UnreadNotifications AS
SELECT UserId, COUNT(*) AS UnreadCount
FROM Notifications
WHERE IsRead=0 AND (ExpiresAt IS NULL OR ExpiresAt > NOW())
GROUP BY UserId;
