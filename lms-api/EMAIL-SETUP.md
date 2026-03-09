# Email Configuration Guide

The LMS system is now configured with full email support using PHPMailer.

## ✅ What's Already Done

1. **EmailService.php** - Complete email service with:
   - Password reset emails with professional HTML templates
   - Welcome emails for new users
   - SMTP connection testing
   - Debug logging

2. **AuthController.php** - Integrated with:
   - Forgot password endpoint (`POST /api/auth/forgot-password`)
   - Reset password endpoint (`POST /api/auth/reset-password`)

3. **.env** - Email configuration template ready

---

## 🔧 Setup SMTP Credentials

### Option 1: Gmail (Recommended for Testing)

**Step 1: Enable 2-Step Verification**

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**

**Step 2: Generate App Password**

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select app: **Mail**
3. Select device: **Windows Computer** (or Other)
4. Click **Generate**
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

**Step 3: Update `.env` file**

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=abcdefghijklmnop  # Remove spaces from app password
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="LMS System"
```

---

### Option 2: Outlook/Hotmail

```env
MAIL_HOST=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_USERNAME=your-email@outlook.com
MAIL_PASSWORD=your-password
MAIL_FROM_ADDRESS=your-email@outlook.com
MAIL_FROM_NAME="LMS System"
```

---

### Option 3: Yahoo Mail

```env
MAIL_HOST=smtp.mail.yahoo.com
MAIL_PORT=587
MAIL_USERNAME=your-email@yahoo.com
MAIL_PASSWORD=your-app-password  # Generate at account.yahoo.com/security
MAIL_FROM_ADDRESS=your-email@yahoo.com
MAIL_FROM_NAME="LMS System"
```

---

### Option 4: SendGrid (Production Recommended)

**Sign up**: [SendGrid.com](https://sendgrid.com)  
**Free tier**: 100 emails/day

```env
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey  # Literally "apikey"
MAIL_PASSWORD=SG.your_api_key_here
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="LMS System"
```

---

### Option 5: Mailgun (Production Alternative)

**Sign up**: [Mailgun.com](https://www.mailgun.com)  
**Free tier**: 5,000 emails/month

```env
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=postmaster@your-domain.mailgun.org
MAIL_PASSWORD=your-smtp-password
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="LMS System"
```

---

## 🧪 Testing Email Configuration

### Test 1: Check SMTP Connection (Optional - create test endpoint)

```php
// Add to src/Routes/api.php
'GET /test/email' => ['controller' => 'TestController', 'method' => 'testEmail', 'auth' => false],

// Create src/Controllers/TestController.php
public function testEmail(): void
{
    $emailService = new \App\Services\EmailService();
    $result = $emailService->testConnection();
    Response::success($result);
}
```

### Test 2: Forgot Password Flow

1. **Start API server**:

   ```powershell
   cd d:\db\lms-api
   php -S 127.0.0.1:8000 -t public public/index.php
   ```

2. **Test forgot password endpoint**:

   ```powershell
   $body = @{email='admin@example.com'} | ConvertTo-Json
   Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/forgot-password" -Method POST -Body $body -ContentType "application/json"
   ```

3. **Check your email** for the password reset link

---

## 📧 Email Templates

The system includes two professional HTML email templates:

### 1. Password Reset Email

- 🔐 Branded header with gradient
- ✅ Large "Reset Password" button
- ⏱️ Expiry warning (1 hour)
- 📱 Mobile-responsive design

### 2. Welcome Email (for new users)

- 🎓 Welcome message
- 📝 Login credentials display
- 🔒 Security reminder
- 🔗 Direct login link

---

## 🐛 Troubleshooting

### Email not sending?

**Check 1: Verify .env configuration**

```powershell
# Check if credentials are set
php -r "require 'vendor/autoload.php'; \$dotenv = Dotenv\Dotenv::createImmutable(__DIR__); \$dotenv->load(); echo 'Mail User: ' . \$_ENV['MAIL_USERNAME'] . PHP_EOL;"
```

**Check 2: Enable debug mode**
The EmailService automatically logs SMTP debug info when `APP_DEBUG=true`

Check PHP error log:

```powershell
# Windows
Get-Content "C:\xampp\php\logs\php_error_log" -Tail 50

# Or check your PHP error log location
```

**Check 3: Firewall/Antivirus**

- Ensure port 587 (or 465 for SSL) is not blocked
- Temporarily disable firewall to test

**Check 4: Gmail specific**

- Make sure you're using **App Password**, not regular password
- Check [Less Secure Apps](https://myaccount.google.com/lesssecure apps) (might need to enable)

---

## 🔒 Security Best Practices

1. **Never commit .env to git**
   - Already in `.gitignore`

2. **Use App Passwords**
   - Never use your main email password

3. **Production emails**
   - Use dedicated service (SendGrid, Mailgun)
   - Set up SPF, DKIM, DMARC records

4. **Rate limiting**
   - Already implemented in API (100 requests/60 seconds)

---

## 📝 Current Status

✅ EmailService created  
✅ AuthController integrated  
✅ Professional HTML templates  
✅ SMTP configuration ready  
⏳ **YOU NEED TO**: Add your SMTP credentials to `.env`

---

## 🚀 Quick Start (Gmail Example)

1. **Get App Password** from Google (16 characters)

2. **Edit** `d:\db\lms-api\.env`:

   ```env
   MAIL_USERNAME=myemail@gmail.com
   MAIL_PASSWORD=abcdefghijklmnop
   ```

3. **Restart API server**:

   ```powershell
   # Kill old server
   Get-Process php | Where-Object {$_.ProcessName -eq "php"} | Stop-Process

   # Start new server
   cd d:\db\lms-api
   php -S 127.0.0.1:8000 -t public public/index.php
   ```

4. **Test forgot password**:
   - Go to `http://localhost:8080/auth/forgot-password.html`
   - Enter: `admin@example.com`
   - Check your email inbox!

---

## 📚 Resources

- [PHPMailer GitHub](https://github.com/PHPMailer/PHPMailer)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SendGrid Documentation](https://docs.sendgrid.com)
- [Mailgun Documentation](https://documentation.mailgun.com)
