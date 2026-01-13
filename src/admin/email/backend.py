import http.server
import socketserver
import json
import smtplib
import ssl
from email.message import EmailMessage
import os
import urllib.request
import urllib.parse

PORT = 8000

# --- CONFIGURATION ---
SMTP_SERVER = "smtp.zeptomail.in"
SMTP_PORT = 587
USERNAME = "emailapikey"
PASSWORD = "PHtE6r0KF7/s2TEt8BVStvG8EMGsZt59/75uK1FGt95AX/ADHk1Wq9F6wza2+U8jAaFFFvbPzIJuuemet7+BcGu4Nz1IDWqyqK3sx/VYSPOZsbq6x00UsFkTckHfXITqcdJq1SbXvNbZNA=="

# --- SUPABASE CONFIGURATION ---
SUPABASE_URL = "https://your-project-url.supabase.co" # Update this
# IMPORTANT: This key is required to generate magic links. It bypasses RLS.
# Do NOT check this key into public repos.
SUPABASE_SERVICE_ROLE_KEY = "PLACEHOLDER_SERVICE_ROLE_KEY" 

class EmailHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/send-email':
            self.handle_send_email()
        elif self.path == '/generate-link':
            self.handle_generate_link()
        else:
            self.send_error(404)

    def handle_send_email(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            recipient_email = data.get('recipientEmail')
            subject = data.get('subject', "Notification")
            html_content_payload = data.get('htmlContent')

            if not recipient_email or not html_content_payload:
                 raise ValueError("Recipient Email and HTML Content are required.")
            
            self.send_smtp_email(recipient_email, subject, html_content_payload)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'success', 'message': f'Email sent to {recipient_email}'}).encode('utf-8'))

        except Exception as e:
            self.send_error_response(str(e))

    def handle_generate_link(self):
        # Generate Magic Link using Supabase Admin API
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        try:
            data = json.loads(post_data.decode('utf-8'))
            email = data.get('email')
            password = data.get('password') # Optional, if we want to confirmsignup
            data_meta = data.get('data', {})

            if not email:
                raise ValueError("Email is required")

            # 1. Call Supabase Admin API to Generate Link
            # Endpoint: /auth/v1/admin/generate_link
            url = f"{SUPABASE_URL}/auth/v1/admin/generate_link"
            headers = {
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json"
            }
            body = {
                "type": "signup",
                "email": email,
                "password": password,
                "data": data_meta
            }

            req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers=headers)
            with urllib.request.urlopen(req) as response:
                resp_json = json.loads(response.read().decode('utf-8'))
            
            # 2. Extract Link
            # Response: { "url": "...", "properties": { "action_link": "...", "email_otp": "..." } }
            # The 'action_link' is the one we want. Or 'url' if it redirects properly.
            # Usually 'action_link' is the verify link.
            action_link = resp_json.get('properties', {}).get('action_link') or resp_json.get('action_link')
            
            if not action_link:
                 # Fallback
                 action_link = resp_json.get('url')

            # 3. Return Link to Frontend (or send email directly from here?)
            # Sending directly is safer so link doesn't expose to frontend if unnecessary, 
            # BUT our goal is to let Frontend decide template.
            # Let's return the link so Frontend can inject it into the template.
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True, 'link': action_link}).encode('utf-8'))

        except Exception as e:
            print(f"Error generating link: {e}")
            self.send_error_response(str(e))

    def send_smtp_email(self, recipient_email, subject, html_content):
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = "Truvgo Communities <varshith@truvgo.me>"
        msg['To'] = recipient_email
        msg.set_content("Please enable HTML to view this email.")
        msg.add_alternative(html_content, subtype='html')

        context = ssl.create_default_context()
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=context) as server:
                server.login(USERNAME, PASSWORD)
                server.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls(context=context)
                server.login(USERNAME, PASSWORD)
                server.send_message(msg)
        print(f"✨ Email successfully sent to {recipient_email}!")

    def send_error_response(self, message):
        print(f"❌ Error: {message}")
        self.send_response(500)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'status': 'error', 'message': message}).encode('utf-8'))

print(f"🔥 Python Email Proxy Server Running on http://localhost:{PORT}")
print("Endpoints: /send-email, /generate-link")

with socketserver.TCPServer(("", PORT), EmailHandler) as httpd:
    httpd.serve_forever()
