Admin manages everything in the system, including users, roles, and permissions. They have full access to all features and settings. Admins can create and manage user accounts, assign roles and permissions, and oversee the overall functioning of the system. They are responsible for ensuring the security and integrity of the system, as well as maintaining user data and system configurations.

teacher is responsible for managing their own classes and students. They can create and manage class schedules, assign homework and projects, and communicate with students and parents. Teachers have access to student information, including grades and attendance records, but do not have access to other teachers' classes or student information.

Students have limited access to the system. They can view their own class schedules, assignments, and grades. They can also communicate with their teachers and classmates through the system. However, they do not have access to other students' information or the ability to manage classes or assignments.

subjects are the different courses or subjects that are offered in the system. Each subject can have multiple classes associated with it, and each class can have multiple students enrolled. Subjects can be managed by teachers, who can create and update class schedules, assignments, and other relevant information for their subjects.

subjects can be categorized into two types: core subjects and elective subjects. Core subjects are mandatory for all students and typically include subjects like Math, Science, and English. Elective subjects are optional and allow students to choose based on their interests, such as Art, Music, or Physical Education.
Core subjects are offered by all courses/classes, from SHS 1 to SHS 3, every class is assigned to a teacher to teach the subject.
Example: Ama teaches general art 1 SHS 1 (1 Art 1) CLASS English, while kofi teaches general art 2 SHS 2 (1 Art 2) CLASS English.
Sometimes in other schools kofi teaches both general art 1 SHS 1 (1 Art 1) CLASS and general art 2 SHS 1 (1 Art 2) CLASS English.
But two teachers cannot teach the same subject in the same class. For example, Ama cannot teach general art 1 SHS 1 (1 Art 1) CLASS English if Kofi is already teaching it.

Thats: Kofi and Ama are teachers,general art 1 SHS 1 (1 Art 1) and general art 2 SHS 1 (1 Art 2) are CLASSes, English is subject, and SHS 1 is the level.

The elective subjects are offered by some classes and sometimes dropped by some classes on the way from SHS 1 to SHS 3.

for example, general science 1 SHS 1 (1 science 1) CLASS is offers eletive biology, e-physics, and e-chemistry, e-maths and ict but when the students move to SHS 2 or 3, they drop ict.

Student is assigned to only one sections or class.
for example: John is in (1 science 2) and cant also be (in 1 Art 1)

And can only access the course elective subject materail and everything under the course elective subject.

Eg: John is in 1 science 2 and the elective assign to that Class or Section are (e-maths, e-biology, e-physic, e-chemsty) so he can access everything about those elective course but cant access music, food mangt.
In addition he can access all the core subject,

note: there may be 5 e-boilogy teachers on campus but only one is assign to 1 science 2, so the teacher assign to 1 science 2, has his/her own materials to his/her students
and students can access thier teacher resource only

Note Teacher can give assignments on the platform through text or file with the assignment in it assigned with total mark and pass mark with sometime rubics and students access it, and submit it through text or file according to the teaching request.

the teacher later veiw it and assign marks to each submission

The teacher organise quizzes on the platform and marked the quiz score show instantly and sometimes shows after quizzes ends

quizz have a starting date and time and ending date and time also with durations no. of attempt, title, Description, etc.
student can veiw thier answered quiz and assignments

course material can be posted on the platform for students to access them

break course page into sections or weekly based for easy navigation in the course for both teacher and student

CREATE TABLE [dbo].[Quizzes](
[QuizId] [int] IDENTITY(1,1) NOT NULL,
[CourseId] [int] NOT NULL,
[SectionId] [int] NULL,
[Title] [nvarchar](200) NOT NULL,
[Description] [nvarchar](1000) NULL,
[Duration] [int] NOT NULL,
[MaxAttempts] [int] NOT NULL,
[Status] [nvarchar](20) NOT NULL,
[Type] [nvarchar](20) NOT NULL,
[IsActivated] [bit] NOT NULL,
[StartDate] [datetime] NULL,
[EndDate] [datetime] NULL,
[CreatedDate] [datetime] NULL,
CONSTRAINT [PK_Quizzes] PRIMARY KEY CLUSTERED
(
[QuizId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[CourseMaterials](
[CourseMaterialId] [int] IDENTITY(1,1) NOT NULL,
[CourseId] [int] NOT NULL,
[SectionId] [int] NULL,
[MaterialType] [nvarchar](20) NULL,
[Title] [nvarchar](200) NOT NULL,
[Description] [ntext] NULL,
[FileName] [nvarchar](255) NULL,
[FilePath] [nvarchar](500) NULL,
[FileSize] [bigint] NULL,
[ExternalLink] [nvarchar](500) NULL,
[OrderIndex] [int] NULL,
[IsRequired] [bit] NULL,
[IsActive] [bit] NULL,
[UploadedDate] [datetime] NULL,
[UploadedBy] [int] NULL,
[Status] [nvarchar](50) NULL,
[Tags] [nvarchar](50) NULL,
CONSTRAINT [PK_CourseMaterials] PRIMARY KEY CLUSTERED

CREATE TABLE [dbo].[Assignments](
[AssignmentID] [int] IDENTITY(1,1) NOT NULL,
[Title] [nvarchar](200) NOT NULL,
[CourseID] [int] NOT NULL,
[DueDate] [date] NOT NULL,
[Status] [nvarchar](20) NOT NULL,
[Description] [nvarchar](max) NULL,
[FilePath] [nvarchar](300) NULL,
[CreatedDate] [datetime] NOT NULL,
[ModifiedDate] [datetime] NULL,
CONSTRAINT [PK_Assignments] PRIMARY KEY CLUSTERED

CREATE TABLE [dbo].[AssignmentSubmissions](
[SubmissionID] [int] IDENTITY(1,1) NOT NULL,
[AssignmentID] [int] NOT NULL,
[StudentID] [int] NOT NULL,
[CourseID] [int] NOT NULL,
[SubmissionFile] [nvarchar](255) NOT NULL,
[SubmittedAt] [datetime] NOT NULL,
[Score] [decimal](5, 2) NOT NULL,
[Feedback] [nvarchar](500) NULL,
[GradedBy] [int] NULL,
[GradedAt] [datetime] NULL,
[Status] [nvarchar](20) NOT NULL,
CONSTRAINT [PK_AssignmentSubmissions] PRIMARY KEY CLUSTERED

CREATE TABLE [dbo].[CourseSections](
[CourseSectionsId] [int] IDENTITY(1,1) NOT NULL,
[CourseId] [int] NOT NULL,
[SectionName] [nvarchar](100) NOT NULL,
[Description] [ntext] NULL,
[OrderIndex] [int] NULL,
[IsActive] [bit] NULL,
[CreatedDate] [datetime] NULL,
[CreatedBy] [int] NULL,
CONSTRAINT [PK_CourseSections] PRIMARY KEY CLUSTERED

CREATE TABLE [dbo].[QuizQuestionOptions](
[OptionId] [int] IDENTITY(1,1) NOT NULL,
[QuestionId] [int] NOT NULL,
[OptionLabel] [nvarchar](5) NOT NULL,
[OptionText] [nvarchar](500) NOT NULL,
[IsCorrect] [bit] NOT NULL,
CONSTRAINT [PK_QuizQuestionOptions] PRIMARY KEY CLUSTERED

CREATE TABLE [dbo].[QuizQuestions](
[QuestionId] [int] IDENTITY(1,1) NOT NULL,
[QuizId] [int] NOT NULL,
[QuestionText] [nvarchar](1000) NOT NULL,
[QuestionType] [nvarchar](50) NOT NULL,
[Points] [int] NOT NULL,
[Difficulty] [nvarchar](20) NULL,
[Explanation] [nvarchar](1000) NULL,
[CreatedDate] [datetime] NULL,
[Options] [nvarchar](max) NULL,
[CorrectAnswer] [nvarchar](255) NULL,
CONSTRAINT [PK_QuizQuestions] PRIMARY KEY CLUSTERED
(

CREATE TABLE [dbo].[QuizSubmissionAnswers](
[SubmissionAnswerId] [int] IDENTITY(1,1) NOT NULL,
[SubmissionId] [int] NOT NULL,
[QuestionId] [int] NOT NULL,
[Answer] [nvarchar](max) NULL,
CONSTRAINT [PK_QuizSubmissionAnswers] PRIMARY KEY CLUSTERED

CREATE TABLE [dbo].[QuizSubmissions](
[SubmissionId] [int] IDENTITY(1,1) NOT NULL,
[UserId] [int] NOT NULL,
[QuizId] [int] NOT NULL,
[Score] [int] NULL,
[Status] [nvarchar](50) NULL,
[SubmittedAt] [datetime] NULL,
[Duration] [nvarchar](50) NULL,
[Attempt] [int] NULL,
[Comments] [nvarchar](1000) NULL,
[GradedAt] [datetime] NULL,
[GradedBy] [nvarchar](100) NULL,
CONSTRAINT [PK_QuizSubmissions] PRIMARY KEY CLUSTERED

Course_course entity: should have text and description content about a topic or objects.

Course_content_order entity: must have order to arrange the course content and course material in the course section

format: on the frontend the user click the plus button, the pop-up will show displaying the course content and course material button

Course_content_order:
Course_content_order_id,
Course_id ,
course_section_id ,
course_content_id,
course_material_id,
etc

let add messages between the teacher and his/her students
and notification from admin to all users, admin to teachers, admin to students, admin to parents, and teachers to students

note: teachers to thier students only

Events & Calendar
Grade Reports & Transcripts
add institution entity (because not only one school will be on the platform but many school, just that different activities will be going on same time)
add institution_setting entity, where the institution can customized it like School_name, Motto, description, location, theme, and more

in ghana shs the course are the subject, course is the program you are offering and the subject are the core and elective subjects

to allow users to reset password
CREATE TABLE [dbo].[PasswordResetTokens](
[TokenID] [int] IDENTITY(1,1) NOT NULL,
[UserID] [int] NOT NULL,
[Token] [nvarchar](100) NOT NULL,
[ExpiryDate] [datetime] NOT NULL,
[IsActive] [bit] NOT NULL,
[CreatedDate] [datetime] NOT NULL,
CONSTRAINT [PK_PasswordResetTokens] PRIMARY KEY CLUSTERED
(
[TokenID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

before creating course_material or course_content first create course_content_order before creating course_material or course_content because the frontend will use it to arrange them on the pages, and the sectionid must be required to know reach section it belongs to.
