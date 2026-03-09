<?php

namespace App\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

class EmailService
{
    private PHPMailer $mailer;
    private bool $enabled;

    public function __construct()
    {
        $this->mailer = new PHPMailer(true);
        $this->enabled = !empty($_ENV['MAIL_USERNAME']) && !empty($_ENV['MAIL_PASSWORD']);

        if ($this->enabled) {
            $this->configure();
        }
    }

    /**
     * Configure PHPMailer with environment settings
     */
    private function configure(): void
    {
        try {
            // Server settings
            $this->mailer->isSMTP();
            $this->mailer->Host = $_ENV['MAIL_HOST'] ?? 'smtp.gmail.com';
            $this->mailer->SMTPAuth = true;
            $this->mailer->Username = $_ENV['MAIL_USERNAME'];
            $this->mailer->Password = $_ENV['MAIL_PASSWORD'];
            $this->mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $this->mailer->Port = (int) ($_ENV['MAIL_PORT'] ?? 587);

            // Default sender
            $this->mailer->setFrom(
                $_ENV['MAIL_FROM_ADDRESS'] ?? 'noreply@lms.com',
                $_ENV['MAIL_FROM_NAME'] ?? 'LMS System'
            );

            // Enable verbose debug output in development
            if ($_ENV['APP_DEBUG'] === 'true') {
                $this->mailer->SMTPDebug = SMTP::DEBUG_SERVER;
                $this->mailer->Debugoutput = function ($str, $level) {
                    error_log("SMTP Debug [$level]: $str");
                };
            }

            // Character set
            $this->mailer->CharSet = PHPMailer::CHARSET_UTF8;
        } catch (Exception $e) {
            error_log("Email configuration error: " . $e->getMessage());
            $this->enabled = false;
        }
    }

    /**
     * Send an email
     *
     * @param string $to Recipient email address
     * @param string $subject Email subject
     * @param string $body Email body (HTML)
     * @param string|null $toName Recipient name (optional)
     * @param string|null $altBody Plain text alternative (optional)
     * @param array $attachments Attachments [['path' => '', 'name' => '']]
     * @return bool True if sent successfully
     */
    public function send(
        string $to,
        string $subject,
        string $body,
        ?string $toName = null,
        ?string $altBody = null,
        array $attachments = []
    ): bool {
        if (!$this->enabled) {
            error_log("Email service is disabled. Configure MAIL_USERNAME and MAIL_PASSWORD in .env");
            return false;
        }

        try {
            // Clear previous recipients
            $this->mailer->clearAddresses();
            $this->mailer->clearAttachments();

            // Add recipient
            $this->mailer->addAddress($to, $toName ?? $to);

            // Content
            $this->mailer->isHTML(true);
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $body;

            if ($altBody) {
                $this->mailer->AltBody = $altBody;
            }

            // Add attachments
            foreach ($attachments as $attachment) {
                if (isset($attachment['path']) && file_exists($attachment['path'])) {
                    $this->mailer->addAttachment(
                        $attachment['path'],
                        $attachment['name'] ?? basename($attachment['path'])
                    );
                }
            }

            $result = $this->mailer->send();

            if ($result) {
                error_log("Email sent successfully to: $to");
            }

            return $result;
        } catch (Exception $e) {
            error_log("Email send error: " . $this->mailer->ErrorInfo);
            error_log("Exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail(string $to, string $name, string $resetToken): bool
    {
        $resetLink = ($_ENV['FRONTEND_URL'] ?? 'http://localhost:8080') . "/auth/reset-password.html?token=" . urlencode($resetToken);

        $subject = "Password Reset Request - LMS";

        $body = $this->getPasswordResetTemplate($name, $resetLink);

        $altBody = "Hi $name,\n\n"
            . "You requested to reset your password.\n\n"
            . "Click the link below to reset your password:\n"
            . "$resetLink\n\n"
            . "This link will expire in 1 hour.\n\n"
            . "If you didn't request this, please ignore this email.\n\n"
            . "Best regards,\nLMS Team";

        return $this->send($to, $subject, $body, $name, $altBody);
    }

    /**
     * Send welcome email to new user
     */
    public function sendWelcomeEmail(string $to, string $name, string $username, string $tempPassword): bool
    {
        $loginLink = ($_ENV['FRONTEND_URL'] ?? 'http://localhost:8080') . "/auth/login.html";

        $subject = "Welcome to LMS - Your Account Details";

        $body = $this->getWelcomeTemplate($name, $username, $tempPassword, $loginLink);

        $altBody = "Hi $name,\n\n"
            . "Welcome to LMS!\n\n"
            . "Your account has been created:\n"
            . "Username: $username\n"
            . "Temporary Password: $tempPassword\n\n"
            . "Please login and change your password:\n"
            . "$loginLink\n\n"
            . "Best regards,\nLMS Team";

        return $this->send($to, $subject, $body, $name, $altBody);
    }

    /**
     * HTML template for password reset email
     */
    private function getPasswordResetTemplate(string $name, string $resetLink): string
    {
        $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:8080';
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .banner { width: 100%; display: block; }
        .header { background: linear-gradient(135deg, #3090cf 0%, #008c54 100%); color: white; padding: 20px; text-align: center; }
        .header-logo { width: 80px; height: 80px; margin: 0 auto 15px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
        .content { background: #fff; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background: #3090cf; color: #ffffff; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .button:hover { background: #2080bf; }
        .ii a[href] { color: #ffffff; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; background: #f8f9fa; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .ges-footer { text-align: center; padding: 15px; background: #fff; border-top: 3px solid #d4af37; }
        .ges-footer img { width: 60px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <img src="{$frontendUrl}/assets/img/Ghana-Education-Service-GES-Recr-1.png" alt="Ghana Education Service" class="banner">
        <div class="header">
            <img src="{$frontendUrl}/assets/img/ghana-education-service.png" alt="GES Logo" class="header-logo">
            <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{$name}</strong>,</p>
            
            <p>You requested to reset your password for your LMS account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <a href="{$resetLink}" class="button">Reset Password</a>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3090cf;">{$resetLink}</p>
            
            <div class="warning">
                <strong>⏱️ This link will expire in 1 hour.</strong>
            </div>
            
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            
            <p>Best regards,<br><strong>Ghana Education Service - LMS Team</strong></p>
        </div>
        <div class="ges-footer">
            <img src="{$frontendUrl}/assets/img/ghana-education-service.png" alt="GES Logo">
            <p style="margin: 5px 0; font-weight: bold; color: #333;">Ghana Education Service</p>
            <p style="margin: 5px 0; font-size: 11px; color: #666;">Learning Management System</p>
        </div>
        <div class="footer">
            <p>© 2026 Ghana Education Service. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * HTML template for welcome email
     */
    private function getWelcomeTemplate(string $name, string $username, string $tempPassword, string $loginLink): string
    {
        $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:8080';
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .banner { width: 100%; display: block; }
        .header { background: linear-gradient(135deg, #3090cf 0%, #008c54 100%); color: white; padding: 20px; text-align: center; }
        .header-logo { width: 80px; height: 80px; margin: 0 auto 15px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
        .content { background: #fff; padding: 30px; }
        .credentials { background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #3090cf; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .button:hover { background: #2080bf; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; background: #f8f9fa; }
        .important { background: #e7f3ff; border-left: 4px solid #3090cf; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .ges-footer { text-align: center; padding: 15px; background: #fff; border-top: 3px solid #d4af37; }
        .ges-footer img { width: 60px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <img src="{$frontendUrl}/assets/img/Ghana-Education-Service-GES-Recr-1.png" alt="Ghana Education Service" class="banner">
        <div class="header">
            <img src="{$frontendUrl}/assets/img/ghana-education-service.png" alt="GES Logo" class="header-logo">
            <h1>🎓 Welcome to LMS!</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{$name}</strong>,</p>
            
            <p>Your account has been successfully created. You can now access the Learning Management System.</p>
            
            <div class="credentials">
                <h3>📝 Your Login Credentials:</h3>
                <p><strong>Username:</strong> {$username}</p>
                <p><strong>Temporary Password:</strong> {$tempPassword}</p>
            </div>
            
            <div class="important">
                <strong>🔒 Important Security Notice:</strong><br>
                Please change your password after your first login for security reasons.
            </div>
            
            <a href="{$loginLink}" class="button">Login Now</a>
            
            <p style="margin-top: 30px;">If you have any questions or need assistance, please contact the system administrator.</p>
            
            <p>Best regards,<br><strong>Ghana Education Service - LMS Team</strong></p>
        </div>
        <div class="ges-footer">
            <img src="{$frontendUrl}/assets/img/ghana-education-service.png" alt="GES Logo">
            <p style="margin: 5px 0; font-weight: bold; color: #333;">Ghana Education Service</p>
            <p style="margin: 5px 0; font-size: 11px; color: #666;">Learning Management System</p>
        </div>
        <div class="footer">
            <p>© 2026 Ghana Education Service. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Check if email service is enabled
     */
    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    /**
     * Test SMTP connection
     */
    public function testConnection(): array
    {
        if (!$this->enabled) {
            return [
                'success' => false,
                'message' => 'Email service is disabled. Configure MAIL_USERNAME and MAIL_PASSWORD in .env'
            ];
        }

        try {
            $this->mailer->smtpConnect();
            $this->mailer->smtpClose();

            return [
                'success' => true,
                'message' => 'SMTP connection successful',
                'host' => $_ENV['MAIL_HOST'],
                'port' => $_ENV['MAIL_PORT']
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'SMTP connection failed: ' . $e->getMessage()
            ];
        }
    }
}
