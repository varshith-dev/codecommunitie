import smtplib, ssl
from email.message import EmailMessage

# --- CONFIGURATION ---
SMTP_SERVER = "smtp.zeptomail.in"
PORT = 587
USERNAME = "emailapikey"
# Note: In production, use environment variables for passwords
PASSWORD = "PHtE6r0KF7/s2TEt8BVStvG8EMGsZt59/75uK1FGt95AX/ADHk1Wq9F6wza2+U8jAaFFFvbPzIJuuemet7+BcGu4Nz1IDWqyqK3sx/VYSPOZsbq6x00UsFkTckHfXITqcdJq1SbXvNbZNA=="

RECIPIENT_EMAIL = "varshith.code@gmail.com"
MEMBER_NAME = "Developer" # You can dynamically pull this from your database

# --- PREMIUM HTML TEMPLATE ---
html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        .wrapper {{ background-color: #f6f9fc; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 30px; text-align: center; color: #ffffff; }}
        .content {{ padding: 40px; line-height: 1.6; color: #334155; }}
        .button-wrapper {{ text-align: center; margin-top: 30px; }}
        .button {{ background-color: #6366f1; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }}
        .footer {{ background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }}
        h1 {{ margin: 0; font-size: 24px; }}
        .highlight {{ color: #6366f1; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Truvgo Code Communities</h1>
            </div>
            <div class="content">
                <p>Hello <span class="highlight">{MEMBER_NAME}</span>,</p>
                <p>Welcome to the family! We're excited to have you join <strong>Truvgo</strong>. You are now part of a global community of developers dedicated to building the future of software.</p>
                <p>Whether you're here to contribute to open-source projects, network with elite engineers, or sharpen your stack, you've come to the right place.</p>
                
                <div class="button-wrapper">
                    <a href="https://truvgo-vtx.web.app" class="button">Access Your Dashboard</a>
                </div>
                
                <p style="margin-top:40px;">See you in the code,<br><strong>The Truvgo Core Team</strong></p>
            </div>
            <div class="footer">
                &copy; 2026 Truvgo Code Communities. All rights reserved.<br>
                You are receiving this because you registered at truvgo.me
            </div>
        </div>
    </div>
</body>
</html>
"""

# --- EMAIL CONSTRUCTION ---
msg = EmailMessage()
msg['Subject'] = f"Welcome to the Future of Coding, {MEMBER_NAME}! 🚀"
msg['From'] = "Truvgo Communities <varshith@truvgo.me>"
msg['To'] = RECIPIENT_EMAIL

# Fallback plain-text version
msg.set_content(f"Hi {MEMBER_NAME}, Welcome to Truvgo Code Communities! Access your dashboard at truvgo.me")

# Add the premium HTML version
msg.add_alternative(html_content, subtype='html')

# --- SENDING LOGIC ---
try:
    context = ssl.create_default_context()
    if PORT == 465:
        with smtplib.SMTP_SSL(SMTP_SERVER, PORT, context=context) as server:
            server.login(USERNAME, PASSWORD)
            server.send_message(msg)
    else: # Defaulting to 587 STARTTLS
        with smtplib.SMTP(SMTP_SERVER, PORT) as server:
            server.starttls(context=context)
            server.login(USERNAME, PASSWORD)
            server.send_message(msg)
    print(f"✨ Premium welcome email successfully sent to {RECIPIENT_EMAIL}!")
except Exception as e:
    print(f"❌ Failed to send email: {e}")
