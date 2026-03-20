<?php

namespace App\Controllers;

use App\Utils\Response;

class FileUploadController
{
    private $uploadPath = __DIR__ . '/../../uploads/';
    private $maxFileSize = 104857600; // 100MB in bytes
    private $allowedTypes = [
        'image' => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        'document' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
        'video' => ['mp4', 'avi', 'mov', 'wmv'],
        'audio' => ['mp3', 'wav', 'ogg'],
        'archive' => ['zip', 'rar', '7z']
    ];

    public function __construct()
    {
        // Create upload directory if it doesn't exist
        if (!file_exists($this->uploadPath)) {
            mkdir($this->uploadPath, 0777, true);
        }
    }

    /**
     * Upload single file
     * POST /upload
     */
    public function upload(array $user): void
    {
        try {
            if (!isset($_FILES['file'])) {
                Response::error('No file uploaded', 400);
                return;
            }

            $file = $_FILES['file'];
            $category = $_POST['category'] ?? 'general';
            $institutionId = $_POST['institution_id'] ?? null;
            $userId = $user['user_id'] ?? null;

            // Validate file
            $validation = $this->validateFile($file);
            if (!$validation['valid']) {
                Response::error($validation['message'], 400);
                return;
            }

            // Generate unique filename
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $filename = uniqid() . '_' . time() . '.' . $ext;

            // Determine upload path
            $categoryPath = $this->uploadPath . $category . '/';
            if (!file_exists($categoryPath)) {
                mkdir($categoryPath, 0777, true);
            }

            $filePath = $categoryPath . $filename;

            // Move uploaded file
            if (!move_uploaded_file($file['tmp_name'], $filePath)) {
                Response::error('Failed to save file', 500);
                return;
            }

            // File metadata
            $fileData = [
                'original_name' => $file['name'],
                'filename' => $filename,
                'path' => str_replace($this->uploadPath, '', $filePath),
                'size' => $file['size'],
                'type' => $file['type'],
                'extension' => $ext,
                'category' => $category,
                'institution_id' => $institutionId,
                'uploaded_by' => $userId,
                'url' => '/uploads/' . $category . '/' . $filename
            ];

            Response::success($fileData, 'File uploaded successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to upload file: ' . $e->getMessage());
        }
    }

    /**
     * Upload multiple files
     * POST /upload/multiple
     */
    public function uploadMultiple(array $user): void
    {
        try {
            if (!isset($_FILES['files'])) {
                Response::error('No files uploaded', 400);
                return;
            }

            $files = $_FILES['files'];
            $category = $_POST['category'] ?? 'general';
            $institutionId = $_POST['institution_id'] ?? null;
            $userId = $user['user_id'] ?? null;

            $uploadedFiles = [];
            $errors = [];

            // Handle multiple files
            for ($i = 0; $i < count($files['name']); $i++) {
                $file = [
                    'name' => $files['name'][$i],
                    'type' => $files['type'][$i],
                    'tmp_name' => $files['tmp_name'][$i],
                    'error' => $files['error'][$i],
                    'size' => $files['size'][$i]
                ];

                // Validate file
                $validation = $this->validateFile($file);
                if (!$validation['valid']) {
                    $errors[] = [
                        'file' => $file['name'],
                        'message' => $validation['message']
                    ];
                    continue;
                }

                // Generate unique filename
                $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
                $filename = uniqid() . '_' . time() . '_' . $i . '.' . $ext;

                // Determine upload path
                $categoryPath = $this->uploadPath . $category . '/';
                if (!file_exists($categoryPath)) {
                    mkdir($categoryPath, 0777, true);
                }

                $filePath = $categoryPath . $filename;

                // Move uploaded file
                if (move_uploaded_file($file['tmp_name'], $filePath)) {
                    $uploadedFiles[] = [
                        'original_name' => $file['name'],
                        'filename' => $filename,
                        'path' => str_replace($this->uploadPath, '', $filePath),
                        'size' => $file['size'],
                        'type' => $file['type'],
                        'extension' => $ext,
                        'category' => $category,
                        'url' => '/uploads/' . $category . '/' . $filename
                    ];
                } else {
                    $errors[] = [
                        'file' => $file['name'],
                        'message' => 'Failed to save file'
                    ];
                }
            }

            Response::success([
                'uploaded' => $uploadedFiles,
                'errors' => $errors
            ], count($uploadedFiles) . ' file(s) uploaded successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to upload files: ' . $e->getMessage());
        }
    }

    /**
     * Delete file
     * DELETE /upload/{category}/{filename}
     */
    public function delete(array $user, string $category, string $filename): void
    {
        try {
            $filePath = $this->uploadPath . $category . '/' . $filename;

            if (!file_exists($filePath)) {
                Response::notFound('File not found');
                return;
            }

            if (unlink($filePath)) {
                Response::success(null, 'File deleted successfully');
            } else {
                Response::error('Failed to delete file', 500);
            }
        } catch (\Exception $e) {
            Response::serverError('Failed to delete file: ' . $e->getMessage());
        }
    }

    /**
     * Validate file upload
     */
    private function validateFile($file)
    {
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return [
                'valid' => false,
                'message' => 'File upload error: ' . $this->getUploadErrorMessage($file['error'])
            ];
        }

        // Check file size
        if ($file['size'] > $this->maxFileSize) {
            return [
                'valid' => false,
                'message' => 'File size exceeds maximum allowed size of ' . ($this->maxFileSize / 1048576) . 'MB'
            ];
        }

        // Check file extension
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allAllowed = array_merge(...array_values($this->allowedTypes));

        if (!in_array($ext, $allAllowed)) {
            return [
                'valid' => false,
                'message' => 'File type not allowed. Allowed types: ' . implode(', ', $allAllowed)
            ];
        }

        return ['valid' => true];
    }

    /**
     * Get upload error message
     */
    private function getUploadErrorMessage($code)
    {
        switch ($code) {
            case UPLOAD_ERR_INI_SIZE:
                return 'The uploaded file exceeds the upload_max_filesize directive in php.ini';
            case UPLOAD_ERR_FORM_SIZE:
                return 'The uploaded file exceeds the MAX_FILE_SIZE directive';
            case UPLOAD_ERR_PARTIAL:
                return 'The uploaded file was only partially uploaded';
            case UPLOAD_ERR_NO_FILE:
                return 'No file was uploaded';
            case UPLOAD_ERR_NO_TMP_DIR:
                return 'Missing a temporary folder';
            case UPLOAD_ERR_CANT_WRITE:
                return 'Failed to write file to disk';
            case UPLOAD_ERR_EXTENSION:
                return 'A PHP extension stopped the file upload';
            default:
                return 'Unknown upload error';
        }
    }

    /**
     * Get file info
     * GET /upload/{category}/{filename}/info
     */
    public function getFileInfo(array $user, string $category, string $filename): void
    {
        try {
            $filePath = $this->uploadPath . $category . '/' . $filename;

            if (!file_exists($filePath)) {
                Response::notFound('File not found');
                return;
            }

            $info = [
                'filename' => $filename,
                'path' => $category . '/' . $filename,
                'size' => filesize($filePath),
                'type' => mime_content_type($filePath),
                'extension' => pathinfo($filename, PATHINFO_EXTENSION),
                'category' => $category,
                'url' => '/uploads/' . $category . '/' . $filename,
                'created_at' => date('Y-m-d H:i:s', filectime($filePath)),
                'modified_at' => date('Y-m-d H:i:s', filemtime($filePath))
            ];

            Response::success($info);
        } catch (\Exception $e) {
            Response::serverError('Failed to get file info: ' . $e->getMessage());
        }
    }
}
