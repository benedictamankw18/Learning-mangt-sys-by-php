document.addEventListener('DOMContentLoaded', function () {
            const submit = document.getElementById('SendEmail');
            if (!submit) return;

            submit.addEventListener('click', async (e) => {
                e.preventDefault();

                const name = document.getElementById('contactName')?.value || '';
                const email = document.getElementById('contactEmail')?.value || '';
                const phone = document.getElementById('contactPhone')?.value || '';
                const subject = document.getElementById('contactSubject')?.value || '';
                const message = document.getElementById('contactMessage')?.value || '';
                const alertBox = document.getElementById('contactFormMessage');

                if (!alertBox) return;

                if (!name || !email || !subject || !message) {
                    alertBox.textContent = 'Please fill in all required fields.';
                    alertBox.style.display = 'block';
                    alertBox.style.color = 'red';
                    return;
                }

                try {
                    const res = await fetch('/api/contact', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, email, phone, subject, message })
                    });

                    const json = await res.json().catch(() => ({}));

                    if (res.ok && json.success) {
                        alertBox.textContent = 'Your message has been sent successfully!';
                        alertBox.style.display = 'block';
                        alertBox.style.color = 'green';
                        document.getElementById('contactForm')?.reset();
                    } else {
                        alertBox.textContent = json.message || 'An error occurred while sending your message.';
                        alertBox.style.display = 'block';
                        alertBox.style.color = 'red';
                    }
                } catch (err) {
                    alertBox.textContent = 'Network error. Please try again later.';
                    alertBox.style.display = 'block';
                    alertBox.style.color = 'red';
                }
            });
        });