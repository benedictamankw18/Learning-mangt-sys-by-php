<?php

/**
 * Authorization Middleware Test Suite
 * Tests all authorization methods and scenarios
 */

require_once __DIR__ . '/../src/Utils/Response.php';
require_once __DIR__ . '/../src/Middleware/AuthorizationMiddleware.php';

use App\Middleware\AuthorizationMiddleware;

class AuthorizationMiddlewareTest
{
    private int $testsPassed = 0;
    private int $testsFailed = 0;
    private array $failures = [];

    public function runAllTests(): void
    {
        echo "=== Authorization Middleware Test Suite ===\n\n";

        $this->testRequireInstitutionAccess();
        $this->testRequireOwnership();
        $this->testRequireOwnershipOrAdmin();
        $this->testRequireInstitutionAdmin();
        $this->testRequireStudentOwnership();
        $this->testRequireTeacherOwnership();
        $this->testRequireMessageAccess();
        $this->testRequireNotificationAccess();
        $this->testRequireAssignmentCreationAccess();
        $this->testRoleChecks();
        $this->testHelperMethods();

        $this->printSummary();
    }

    private function testRequireInstitutionAccess(): void
    {
        echo "Testing requireInstitutionAccess()...\n";

        // Test 1: Same institution - should pass
        $user = ['user_id' => 1, 'institution_id' => 10, 'role' => 'admin', 'roles' => ['admin']];
        $resource = ['institution_id' => 10];
        $auth = new AuthorizationMiddleware($user);

        ob_start();
        $result = $auth->requireInstitutionAccess($resource);
        ob_end_clean();

        $this->assert($result === true, 'Same institution should grant access');

        // Test 2: Different institution - should fail
        $resource = ['institution_id' => 20];
        ob_start();
        $result = $auth->requireInstitutionAccess($resource);
        ob_end_clean();

        $this->assert($result === false, 'Different institution should deny access');

        // Test 3: Super admin - should pass regardless of institution
        $superAdmin = ['user_id' => 1, 'institution_id' => 10, 'is_super_admin' => true, 'role' => 'super_admin', 'roles' => ['super_admin']];
        $auth = new AuthorizationMiddleware($superAdmin);

        ob_start();
        $result = $auth->requireInstitutionAccess($resource);
        ob_end_clean();

        $this->assert($result === true, 'Super admin should bypass institution check');

        // Test 4: Resource without institution_id - should fail with error
        $resource = ['id' => 1];
        $user = ['user_id' => 1, 'institution_id' => 10, 'role' => 'admin'];
        $auth = new AuthorizationMiddleware($user);

        ob_start();
        $result = $auth->requireInstitutionAccess($resource);
        ob_end_clean();

        $this->assert($result === false, 'Resource without institution_id should fail');

        echo "\n";
    }

    private function testRequireOwnership(): void
    {
        echo "Testing requireOwnership()...\n";

        // Test 1: User owns resource - should pass
        $user = ['user_id' => 5, 'institution_id' => 10];
        $resource = ['user_id' => 5];
        $auth = new AuthorizationMiddleware($user);

        ob_start();
        $result = $auth->requireOwnership($resource);
        ob_end_clean();

        $this->assert($result === true, 'User should have access to their own resource');

        // Test 2: User does not own resource - should fail
        $resource = ['user_id' => 10];
        ob_start();
        $result = $auth->requireOwnership($resource);
        ob_end_clean();

        $this->assert($result === false, 'User should not have access to others resource');

        // Test 3: Custom owner field (teacher_id)
        $resource = ['teacher_id' => 5];
        ob_start();
        $result = $auth->requireOwnership($resource, 'teacher_id');
        ob_end_clean();

        $this->assert($result === true, 'Custom owner field should work');

        // Test 4: Resource without owner field - should fail
        $resource = ['id' => 1];
        ob_start();
        $result = $auth->requireOwnership($resource);
        ob_end_clean();

        $this->assert($result === false, 'Resource without owner field should fail');

        echo "\n";
    }

    private function testRequireOwnershipOrAdmin(): void
    {
        echo "Testing requireOwnershipOrAdmin()...\n";

        // Test 1: Regular user owns resource - should pass
        $user = ['user_id' => 5, 'institution_id' => 10, 'role' => 'student', 'roles' => ['student']];
        $resource = ['user_id' => 5];
        $auth = new AuthorizationMiddleware($user);

        ob_start();
        $result = $auth->requireOwnershipOrAdmin($resource);
        ob_end_clean();

        $this->assert($result === true, 'User should have access to their own resource');

        // Test 2: Regular user does not own - should fail
        $resource = ['user_id' => 10];
        ob_start();
        $result = $auth->requireOwnershipOrAdmin($resource);
        ob_end_clean();

        $this->assert($result === false, 'Regular user should not access others resource');

        // Test 3: Admin does not own - should pass
        $admin = ['user_id' => 1, 'institution_id' => 10, 'role' => 'admin', 'roles' => ['admin']];
        $auth = new AuthorizationMiddleware($admin);

        ob_start();
        $result = $auth->requireOwnershipOrAdmin($resource);
        ob_end_clean();

        $this->assert($result === true, 'Admin should have access to any resource');

        // Test 4: Super admin - should pass
        $superAdmin = ['user_id' => 1, 'is_super_admin' => true, 'role' => 'super_admin', 'roles' => ['super_admin']];
        $auth = new AuthorizationMiddleware($superAdmin);

        ob_start();
        $result = $auth->requireOwnershipOrAdmin($resource);
        ob_end_clean();

        $this->assert($result === true, 'Super admin should have access to any resource');

        echo "\n";
    }

    private function testRequireInstitutionAdmin(): void
    {
        echo "Testing requireInstitutionAdmin()...\n";

        // Test 1: Admin with same institution - should pass
        $user = ['user_id' => 1, 'institution_id' => 10, 'role' => 'admin', 'roles' => ['admin']];
        $resource = ['institution_id' => 10];
        $auth = new AuthorizationMiddleware($user);

        ob_start();
        $result = $auth->requireInstitutionAdmin($resource);
        ob_end_clean();

        $this->assert($result === true, 'Admin with same institution should have access');

        // Test 2: Admin with different institution - should fail
        $resource = ['institution_id' => 20];
        ob_start();
        $result = $auth->requireInstitutionAdmin($resource);
        ob_end_clean();

        $this->assert($result === false, 'Admin with different institution should be denied');

        // Test 3: Regular user - should fail
        $student = ['user_id' => 5, 'institution_id' => 10, 'role' => 'student', 'roles' => ['student']];
        $resource = ['institution_id' => 10];
        $auth = new AuthorizationMiddleware($student);

        ob_start();
        $result = $auth->requireInstitutionAdmin($resource);
        ob_end_clean();

        $this->assert($result === false, 'Non-admin should be denied');

        // Test 4: Super admin with different institution - should pass
        $superAdmin = ['user_id' => 1, 'institution_id' => 10, 'is_super_admin' => true, 'role' => 'super_admin', 'roles' => ['super_admin']];
        $resource = ['institution_id' => 20];
        $auth = new AuthorizationMiddleware($superAdmin);

        ob_start();
        $result = $auth->requireInstitutionAdmin($resource);
        ob_end_clean();

        $this->assert($result === true, 'Super admin should bypass institution check');

        echo "\n";
    }

    private function testRequireStudentOwnership(): void
    {
        echo "Testing requireStudentOwnership()...\n";

        // Test 1: Student views own profile - should pass
        $user = ['user_id' => 5, 'institution_id' => 10, 'role' => 'student', 'roles' => ['student']];
        $student = ['user_id' => 5, 'institution_id' => 10];
        $auth = new AuthorizationMiddleware($user);

        ob_start();
        $result = $auth->requireStudentOwnership($student);
        ob_end_clean();

        $this->assert($result === true, 'Student should view own profile');

        // Test 2: Student views other's profile - should fail
        $student = ['user_id' => 10, 'institution_id' => 10];
        ob_start();
        $result = $auth->requireStudentOwnership($student);
        ob_end_clean();

        $this->assert($result === false, 'Student should not view others profile');

        // Test 3: Admin views student in same institution - should pass
        $admin = ['user_id' => 1, 'institution_id' => 10, 'role' => 'admin', 'roles' => ['admin']];
        $auth = new AuthorizationMiddleware($admin);

        ob_start();
        $result = $auth->requireStudentOwnership($student);
        ob_end_clean();

        $this->assert($result === true, 'Admin should view student in same institution');

        // Test 4: Teacher views student in same institution - should pass
        $teacher = ['user_id' => 2, 'institution_id' => 10, 'role' => 'teacher', 'roles' => ['teacher']];
        $auth = new AuthorizationMiddleware($teacher);

        ob_start();
        $result = $auth->requireStudentOwnership($student);
        ob_end_clean();

        $this->assert($result === true, 'Teacher should view student in same institution');

        echo "\n";
    }

    private function testRequireTeacherOwnership(): void
    {
        echo "Testing requireTeacherOwnership()...\n";

        // Test 1: Teacher views own profile - should pass
        $user = ['user_id' => 5, 'institution_id' => 10, 'role' => 'teacher', 'roles' => ['teacher']];
        $teacher = ['user_id' => 5, 'institution_id' => 10];
        $auth = new AuthorizationMiddleware($user);

        ob_start();
        $result = $auth->requireTeacherOwnership($teacher);
        ob_end_clean();

        $this->assert($result === true, 'Teacher should view own profile');

        // Test 2: Teacher views other's profile - should fail
        $teacher = ['user_id' => 10, 'institution_id' => 10];
        ob_start();
        $result = $auth->requireTeacherOwnership($teacher);
        ob_end_clean();

        $this->assert($result === false, 'Teacher should not view others profile');

        // Test 3: Admin views teacher in same institution - should pass
        $admin = ['user_id' => 1, 'institution_id' => 10, 'role' => 'admin', 'roles' => ['admin']];
        $auth = new AuthorizationMiddleware($admin);

        ob_start();
        $result = $auth->requireTeacherOwnership($teacher);
        ob_end_clean();

        $this->assert($result === true, 'Admin should view teacher in same institution');

        echo "\n";
    }

    private function testRequireMessageAccess(): void
    {
        echo "Testing requireMessageAccess()...\n";

        // Test 1: User is sender - should pass
        $user = ['user_id' => 5];
        $message = ['sender_id' => 5, 'receiver_id' => 10];
        $auth = new AuthorizationMiddleware($user);

        ob_start();
        $result = $auth->requireMessageAccess($message);
        ob_end_clean();

        $this->assert($result === true, 'Sender should access message');

        // Test 2: User is receiver - should pass
        $message = ['sender_id' => 10, 'receiver_id' => 5];
        ob_start();
        $result = $auth->requireMessageAccess($message);
        ob_end_clean();

        $this->assert($result === true, 'Receiver should access message');

        // Test 3: User is neither sender nor receiver - should fail
        $message = ['sender_id' => 10, 'receiver_id' => 20];
        ob_start();
        $result = $auth->requireMessageAccess($message);
        ob_end_clean();

        $this->assert($result === false, 'Non-participant should not access message');

        echo "\n";
    }

    private function testRequireNotificationAccess(): void
    {
        echo "Testing requireNotificationAccess()...\n";

        // Test 1: User owns notification - should pass
        $user = ['user_id' => 5];
        $notification = ['user_id' => 5];
        $auth = new AuthorizationMiddleware($user);

        ob_start();
        $result = $auth->requireNotificationAccess($notification);
        ob_end_clean();

        $this->assert($result === true, 'User should access own notification');

        // Test 2: User does not own notification - should fail
        $notification = ['user_id' => 10];
        ob_start();
        $result = $auth->requireNotificationAccess($notification);
        ob_end_clean();

        $this->assert($result === false, 'User should not access others notification');

        echo "\n";
    }

    private function testRequireAssignmentCreationAccess(): void
    {
        echo "Testing requireAssignmentCreationAccess()...\n";

        // Test 1: Admin creates assignment - should pass
        $user = ['user_id' => 1, 'institution_id' => 10, 'role' => 'admin', 'roles' => ['admin']];
        $course = ['institution_id' => 10, 'teacher_id' => 5];
        $auth = new AuthorizationMiddleware($user);

        ob_start();
        $result = $auth->requireAssignmentCreationAccess($course);
        ob_end_clean();

        $this->assert($result === true, 'Admin should create assignment for any course');

        // Test 2: Teacher creates for own course - should pass
        $teacher = ['user_id' => 5, 'institution_id' => 10, 'role' => 'teacher', 'roles' => ['teacher']];
        $auth = new AuthorizationMiddleware($teacher);

        ob_start();
        $result = $auth->requireAssignmentCreationAccess($course, 5);
        ob_end_clean();

        $this->assert($result === true, 'Teacher should create assignment for own course');

        // Test 3: Teacher creates for another's course - should fail
        ob_start();
        $result = $auth->requireAssignmentCreationAccess($course, 10);
        ob_end_clean();

        $this->assert($result === false, 'Teacher should not create assignment for others course');

        // Test 4: Student tries to create - should fail
        $student = ['user_id' => 20, 'institution_id' => 10, 'role' => 'student', 'roles' => ['student']];
        $auth = new AuthorizationMiddleware($student);

        ob_start();
        $result = $auth->requireAssignmentCreationAccess($course);
        ob_end_clean();

        $this->assert($result === false, 'Student should not create assignments');

        echo "\n";
    }

    private function testRoleChecks(): void
    {
        echo "Testing role check methods...\n";

        // Test 1: hasRole()
        $user = ['user_id' => 1, 'role' => 'teacher', 'roles' => ['teacher', 'admin']];
        $auth = new AuthorizationMiddleware($user);

        $this->assert($auth->hasRole('teacher') === true, 'hasRole should return true for teacher');
        $this->assert($auth->hasRole('admin') === true, 'hasRole should return true for admin');
        $this->assert($auth->hasRole('student') === false, 'hasRole should return false for student');
        $this->assert($auth->hasRole(['teacher', 'student']) === true, 'hasRole should work with array');

        // Test 2: isAdmin()
        $this->assert($auth->isAdmin() === true, 'isAdmin should return true');

        $student = ['user_id' => 2, 'role' => 'student', 'roles' => ['student']];
        $auth = new AuthorizationMiddleware($student);
        $this->assert($auth->isAdmin() === false, 'isAdmin should return false for student');

        // Test 3: isSuperAdmin()
        $superAdmin = ['user_id' => 1, 'is_super_admin' => true];
        $auth = new AuthorizationMiddleware($superAdmin);
        $this->assert($auth->isSuperAdmin() === true, 'isSuperAdmin should return true');

        $admin = ['user_id' => 2, 'role' => 'admin', 'roles' => ['admin']];
        $auth = new AuthorizationMiddleware($admin);
        $this->assert($auth->isSuperAdmin() === false, 'isSuperAdmin should return false for regular admin');

        // Test 4: isTeacher()
        $teacher = ['user_id' => 3, 'role' => 'teacher', 'roles' => ['teacher']];
        $auth = new AuthorizationMiddleware($teacher);
        $this->assert($auth->isTeacher() === true, 'isTeacher should return true');

        // Test 5: isStudent()
        $student = ['user_id' => 4, 'role' => 'student', 'roles' => ['student']];
        $auth = new AuthorizationMiddleware($student);
        $this->assert($auth->isStudent() === true, 'isStudent should return true');

        echo "\n";
    }

    private function testHelperMethods(): void
    {
        echo "Testing helper methods...\n";

        $user = ['user_id' => 5, 'institution_id' => 10, 'role' => 'teacher'];
        $auth = new AuthorizationMiddleware($user);

        // Test getUser()
        $this->assert($auth->getUser() === $user, 'getUser should return user array');

        // Test getInstitutionId()
        $this->assert($auth->getInstitutionId() === 10, 'getInstitutionId should return 10');

        // Test getUserId()
        $this->assert($auth->getUserId() === 5, 'getUserId should return 5');

        // Test with missing fields
        $userNoInstitution = ['user_id' => 5];
        $auth = new AuthorizationMiddleware($userNoInstitution);
        $this->assert($auth->getInstitutionId() === null, 'getInstitutionId should return null when missing');

        echo "\n";
    }

    private function assert(bool $condition, string $message): void
    {
        if ($condition) {
            $this->testsPassed++;
            echo "  ✓ {$message}\n";
        } else {
            $this->testsFailed++;
            $this->failures[] = $message;
            echo "  ✗ {$message}\n";
        }
    }

    private function printSummary(): void
    {
        echo "\n=== Test Summary ===\n";
        echo "Passed: {$this->testsPassed}\n";
        echo "Failed: {$this->testsFailed}\n";
        echo "Total:  " . ($this->testsPassed + $this->testsFailed) . "\n";

        if ($this->testsFailed > 0) {
            echo "\nFailed tests:\n";
            foreach ($this->failures as $failure) {
                echo "  - {$failure}\n";
            }
            exit(1);
        } else {
            echo "\n✓ All tests passed!\n";
        }
    }
}

// Run tests
$tester = new AuthorizationMiddlewareTest();
$tester->runAllTests();
