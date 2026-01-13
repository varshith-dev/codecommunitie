import http.server
import socketserver
import json
import smtplib
import ssl
from email.message import EmailMessage
import urllib.request
import urllib.error
import random
import time
import os

# --- ENV LOADING HELPER ---
def load_env_file(filepath):
    if os.path.exists(filepath):
        print(f"Loading env from {filepath}")
        with open(filepath, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#') and '=' in line:
                    key, value = line.strip().split('=', 1)
                    # Remove quotes if present
                    value = value.strip().strip('"').strip("'")
                    os.environ[key] = value

# Load .env and .env.local
load_env_file('.env')
load_env_file('.env.local')

PORT = 8000

# --- CONFIGURATION ---
SMTP_SERVER = "smtp.zeptomail.in"
SMTP_PORT = 587
USERNAME = "emailapikey"
# Prefer Env Var, fallback to hardcoded (or placeholder)
PASSWORD = os.environ.get("SMTP_PASSWORD", "PHtE6r0KF7/s2TEt8BVStvG8EMGsZt59/75uK1FGt95AX/ADHk1Wq9F6wza2+U8jAaFFFvbPzIJuuemet7+BcGu4Nz1IDWqyqK3sx/VYSPOZsbq6x00UsFkTckHfXITqcdJq1SbXvNbZNA==")

# --- SUPABASE CONFIGURATION ---
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "https://your-project-url.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "PLACEHOLDER_SERVICE_ROLE_KEY")

# In-memory OTP Storage for Local Dev
otp_storage = {}

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
        elif self.path == '/otp':
            self.handle_otp()
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
            self.send_json({'status': 'success', 'message': f'Email sent to {recipient_email}'})

        except Exception as e:
            self.send_error_response(str(e))

    def handle_generate_link(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        try:
            data = json.loads(post_data.decode('utf-8'))
            email = data.get('email')
            password = data.get('password')
            data_meta = data.get('data', {})
            redirect_to = data.get('redirectTo')

            if not email:
                raise ValueError("Email is required")

            if "PLACEHOLDER" in SUPABASE_SERVICE_ROLE_KEY or "your-project" in SUPABASE_URL:
                print("❌ ERROR: Supabase Credentials not set in backend.py!")
                raise ValueError("Server Configuration Error: Missing Supabase Credentials in backend.py")

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
                "data": data_meta,
                "options": { "redirectTo": redirect_to }
            }

            req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers=headers)
            try:
                with urllib.request.urlopen(req) as response:
                    resp_json = json.loads(response.read().decode('utf-8'))
            except urllib.error.HTTPError as e:
                print(f"❌ Supabase API Error: {e.code} - {e.reason}")
                print(e.read().decode('utf-8'))
                raise e

            action_link = resp_json.get('properties', {}).get('action_link') or resp_json.get('action_link') or resp_json.get('url')
            
            self.send_json({'success': True, 'link': action_link})

        except Exception as e:
            print(f"Error generating link: {e}")
            self.send_error_response(str(e))

    def handle_otp(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            action = data.get('action')
            email = data.get('email')
            code_input = data.get('code')

            if not email:
                raise ValueError("Email is required")

            if action == 'send':
                otp = str(random.randint(100000, 999999))
                otp_storage[email] = {
                    'code': otp,
                    'expiry': time.time() + 600
                }
                
                html_content = f"""
                <div style="font-family: sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #333;">Verification Code</h2>
                    <p style="color: #555;">Use the code below to verify your account:</p>
                    <div style="background:#f4f4f5; padding: 15px; text-align:center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000;">{otp}</span>
                    </div>
                    <p style="font-size: 12px; color: #888;">Expires in 10 minutes.</p>
                </div>
                """
                self.send_smtp_email(email, "Your Verification Code", html_content)
                self.send_json({'success': True, 'message': 'OTP Sent'})

            elif action == 'verify':
                if not code_input:
                    raise ValueError("Code is required")
                
                stored = otp_storage.get(email)
                if not stored:
                     raise ValueError("No OTP found. Please request a new code.")
                
                if str(stored['code']) != str(code_input):
                    raise ValueError("Invalid Code")
                
                if time.time() > stored['expiry']:
                    raise ValueError("Code Expired")

                del otp_storage[email]
                self.send_json({'success': True, 'message': 'Verified (Dev Mode)'})

        except Exception as e:
            self.send_error_response(str(e))

    def send_smtp_email(self, recipient_email, subject, html_content):
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = "Truvgo Communities <varshith@truvgo.me>"
        msg['To'] = recipient_email
        msg.set_content("Please enable HTML to view this email.")
        msg.add_alternative(html_content, subtype='html')

        context = ssl.create_default_context()
        try:
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
        except Exception as e:
            print(f"❌ SMTP Error: {e}")
            raise e

    def send_error_response(self, message):
        print(f"❌ Error: {message}")
        self.send_response(500)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'status': 'error', 'message': message}).encode('utf-8'))

    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

print(f"🔥 Python Email Proxy Server Running on http://localhost:{PORT}")
print("Endpoints: /send-email, /generate-link, /otp")

with socketserver.TCPServer(("", PORT), EmailHandler) as httpd:
    httpd.serve_forever()
