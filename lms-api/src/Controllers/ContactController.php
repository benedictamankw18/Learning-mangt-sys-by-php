<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Services\EmailService;

class ContactController
{
    public function send(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];

        $v = new Validator([
            'name' => $input['name'] ?? '',
            'email' => $input['email'] ?? '',
            'subject' => $input['subject'] ?? '',
            'message' => $input['message'] ?? '',
        ]);

        $v->required(['name', 'email', 'subject', 'message'])->email('email');

        if ($v->fails()) {
            Response::validationError($v->getErrors());
            return;
        }

        $emailService = new EmailService();
        if (!$emailService->isEnabled()) {
            Response::serverError('Email service is not configured on the server');
            return;
        }

        $to =  $_ENV['MAIL_USERNAME'] ?? $_ENV['MAIL_FROM_ADDRESS'] ?? null;
        $toName = $_ENV['MAIL_FROM_NAME'] ?? 'LMS System';
        if (!$to) {
            Response::serverError('Mail recipient not configured (MAIL_FROM_ADDRESS)');
            return;
        }

        $subject = "[Contact] " . trim($input['subject']);
        $body = "<p><strong>Name:</strong> " . htmlspecialchars($input['name']) . "</p>"
              . "<p><strong>Email:</strong> " . htmlspecialchars($input['email']) . "</p>"
              . "<p><strong>Phone:</strong> " . htmlspecialchars($input['phone'] ?? '') . "</p>"
              . "<hr/>"
              . "<p>" . nl2br(htmlspecialchars($input['message'])) . "</p>";
        $alt = "Name: {$input['name']}\nEmail: {$input['email']}\nPhone: {$input['phone']}\n\nMessage:\n{$input['message']}";

        $sent = $emailService->send($to, $subject, $body, $toName, $alt);

        if (!$sent) {
            Response::serverError('Failed to send message');
            return;
        }

        Response::success(['sent' => true], 200, 'Message sent');
    }
}
