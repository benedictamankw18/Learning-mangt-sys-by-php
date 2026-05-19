<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Services\EmailService;
use App\Repositories\UserActivityRepository;

class SupportTicketController
{
    private $emailService;
    private $activityRepo;

    public function __construct()
    {
        $this->emailService = new EmailService();
        $this->activityRepo = new UserActivityRepository();
    }

    /**
     * Submit a support ticket
     * POST /api/support/send
     */
    public function send(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $user = $GLOBALS['auth_user'] ?? null;

        // Validate input
        $v = new Validator([
            'category' => $input['category'] ?? '',
            'subject' => $input['subject'] ?? '',
            'email' => $input['email'] ?? '',
            'message' => $input['message'] ?? '',
            'priority' => $input['priority'] ?? 'normal',
            'user_role' => $input['user_role'] ?? 'guest',
        ]);

        $v->required(['category', 'subject', 'email', 'message'])
          ->email('email')
          ->in('category', ['technical', 'account', 'feature', 'bug', 'data', 'other'])
          ->in('priority', ['normal', 'high', 'urgent']);

        if ($v->fails()) {
            Response::validationError($v->getErrors());
            return;
        }

        // Check if email service is enabled
        if (!$this->emailService->isEnabled()) {
            Response::serverError('Email service is not configured on the server');
            return;
        }

        // Get recipient email
        $to = $_ENV['MAIL_USERNAME'] ?? $_ENV['MAIL_FROM_ADDRESS'] ?? null;
        $toName = $_ENV['MAIL_FROM_NAME'] ?? 'LMS Support Team';
        if (!$to) {
            Response::serverError('Mail recipient not configured (MAIL_FROM_ADDRESS)');
            return;
        }

        // Format the support ticket email
        $category = $input['category'];
        $priority = strtoupper($input['priority'] ?? 'normal');
        $userRole = ucfirst($input['user_role'] ?? 'guest');
        
        $categoryLabels = [
            'technical' => 'Technical Issue',
            'account' => 'Account & Login',
            'feature' => 'Feature Request',
            'bug' => 'Report a Bug',
            'data' => 'Data & Privacy',
            'other' => 'Other',
        ];
        
        $categoryLabel = $categoryLabels[$category] ?? $category;
        $subject = "[Support Ticket - {$priority}] " . trim($input['subject']);
        
        $body = "<div style='font-family: Arial, sans-serif; color: #333; line-height: 1.6;'>"
              . "<h2 style='color: #006a3f;'>New Support Ticket</h2>"
              . "<hr style='border: none; border-top: 1px solid #ddd;'>"
              . "<table style='width: 100%; border-collapse: collapse;'>"
              . "<tr><td style='padding: 8px; font-weight: bold; width: 150px;'>Category:</td><td style='padding: 8px;'>" . htmlspecialchars($categoryLabel) . "</td></tr>"
              . "<tr><td style='padding: 8px; font-weight: bold;'>Priority:</td><td style='padding: 8px;'><strong style='color: " . ($priority === 'URGENT' ? '#dc2626' : ($priority === 'HIGH' ? '#ea8b00' : '#059669')) . ";'>" . htmlspecialchars($priority) . "</strong></td></tr>"
              . "<tr><td style='padding: 8px; font-weight: bold;'>User Role:</td><td style='padding: 8px;'>" . htmlspecialchars($userRole) . "</td></tr>"
              . "<tr><td style='padding: 8px; font-weight: bold;'>From:</td><td style='padding: 8px;'>" . htmlspecialchars($input['email']) . "</td></tr>"
              . "<tr><td style='padding: 8px; font-weight: bold;'>Submitted:</td><td style='padding: 8px;'>" . date('Y-m-d H:i:s') . "</td></tr>"
              . "</table>"
              . "<hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'>"
              . "<h3 style='color: #0f172a;'>Subject:</h3>"
              . "<p style='background: #f8fafc; padding: 10px; border-left: 4px solid #006a3f;'>" . htmlspecialchars($input['subject']) . "</p>"
              . "<h3 style='color: #0f172a;'>Message:</h3>"
              . "<p>" . nl2br(htmlspecialchars($input['message'])) . "</p>"
              . "<hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'>"
              . "<p style='font-size: 12px; color: #666;'>This is an automated message from the LMS Support System. Please do not reply to this email.</p>"
              . "</div>";

        $alt = "SUPPORT TICKET\n"
             . "================\n"
             . "Category: " . $categoryLabel . "\n"
             . "Priority: " . $priority . "\n"
             . "User Role: " . $userRole . "\n"
             . "From: " . $input['email'] . "\n"
             . "Submitted: " . date('Y-m-d H:i:s') . "\n\n"
             . "Subject:\n" . $input['subject'] . "\n\n"
             . "Message:\n" . $input['message'];

        // Send email to support team
        $sent = $this->emailService->send($to, $subject, $body, $toName, $alt);

        if (!$sent) {
            Response::serverError('Failed to send support ticket');
            return;
        }

        // Log activity if user is authenticated
        if ($user && isset($user['id'])) {
            try {
                $this->activityRepo->create([
                    'user_id' => $user['id'],
                    'activity_type' => 'support_ticket_submitted',
                    'description' => "Submitted support ticket: {$input['subject']} (Category: {$categoryLabel}, Priority: {$priority})",
                    'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '',
                    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                ]);
            } catch (\Exception $e) {
                // Log error but don't fail the request
                error_log('Failed to log support ticket activity: ' . $e->getMessage());
            }
        }

        Response::success(
            [
                'sent' => true,
                'ticket_id' => bin2hex(random_bytes(8)),
                'message' => 'Your support ticket has been received. Our team will respond within 24 hours.'
            ],
            200,
            'Support ticket submitted successfully'
        );
    }
}
