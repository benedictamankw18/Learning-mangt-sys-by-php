<?php

namespace App\Repositories;

use PDO;
use App\Config\Database;

class CourseReviewRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all reviews for a course
     */
    public function getCourseReviews(int $courseId, int $page = 1, int $limit = 20): array
    {
        $offset = ($page - 1) * $limit;

        $stmt = $this->db->prepare("
            SELECT 
                cr.*,
                s.student_id,
                u.first_name,
                u.last_name,
                u.email
            FROM course_reviews cr
            INNER JOIN students s ON cr.student_id = s.student_id
            INNER JOIN users u ON s.user_id = u.user_id
            WHERE cr.course_id = :course_id
            ORDER BY cr.created_at DESC
            LIMIT :limit OFFSET :offset
        ");

        $stmt->bindValue(':course_id', $courseId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Count reviews for a course
     */
    public function countCourseReviews(int $courseId): int
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as total
            FROM course_reviews
            WHERE course_id = :course_id
        ");

        $stmt->execute(['course_id' => $courseId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int) $result['total'];
    }

    /**
     * Get review statistics for a course
     */
    public function getCourseReviewStats(int $courseId): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
            FROM course_reviews
            WHERE course_id = :course_id
        ");

        $stmt->execute(['course_id' => $courseId]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * Find review by ID
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT 
                cr.*,
                s.student_id,
                u.first_name,
                u.last_name
            FROM course_reviews cr
            INNER JOIN students s ON cr.student_id = s.student_id
            INNER JOIN users u ON s.user_id = u.user_id
            WHERE cr.review_id = :id
        ");

        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Find student's review for a course
     */
    public function findByStudentAndCourse(int $studentId, int $courseId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM course_reviews
            WHERE student_id = :student_id AND course_id = :course_id
        ");

        $stmt->execute([
            'student_id' => $studentId,
            'course_id' => $courseId
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Create a new review
     */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO course_reviews (
                course_id,
                student_id,
                rating,
                review_text
            ) VALUES (
                :course_id,
                :student_id,
                :rating,
                :review_text
            )
        ");

        $stmt->execute([
            'course_id' => $data['course_id'],
            'student_id' => $data['student_id'],
            'rating' => $data['rating'],
            'review_text' => $data['review_text'] ?? null
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Update a review
     */
    public function update(int $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];

        if (isset($data['rating'])) {
            $fields[] = 'rating = :rating';
            $params['rating'] = $data['rating'];
        }

        if (isset($data['review_text'])) {
            $fields[] = 'review_text = :review_text';
            $params['review_text'] = $data['review_text'];
        }

        if (empty($fields)) {
            return false;
        }

        $sql = "UPDATE course_reviews SET " . implode(', ', $fields) . " WHERE review_id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    /**
     * Delete a review
     */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM course_reviews WHERE review_id = :id");
        return $stmt->execute(['id' => $id]);
    }
}
