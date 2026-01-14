import http.server
import socketserver
import json
import smtplib
import ssl
from email.message import EmailMessage
import urllib.request
import urllib.error
import urllib.parse
import random
import time
import os
import threading

# --- ROBUST ENV LOADING ---
def load_env_file(filepath):
    """
    Parses .env files robustly, handling quotes and comments.
    """
    if not os.path.exists(filepath):
        return

    print(f"Loading env from {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            if '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()
                
                # Remove surrounding quotes (single or double)
                if (value.startswith('"') and value.endswith('"')) or \
                   (value.startswith("'") and value.endswith("'")):
                    value = value[1:-1]
                
                os.environ[key] = value

# Load .env and .env.local
load_env_file('.env')
load_env_file('.env.local')

PORT = 8000

# --- CONFIGURATION (SECURE) ---
SMTP_SERVER = "smtp.zeptomail.in"
SMTP_PORT = 587
USERNAME = "emailapikey"
PASSWORD = os.environ.get("SMTP_PASSWORD")

# Use Environment Variables or Defaults (Fail loudly if critical keys missing in Prod logic)
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# --- CONCURRENCY ---
class ThreadingTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True

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
        # logging only path to keep logs clean
        print(f"[{threading.current_thread().name}] POST: {self.path}")
        try:
            if self.path == '/send-email':
                self.handle_send_email()
            elif self.path == '/generate-link':
                self.handle_generate_link()
            elif self.path == '/otp':
                self.handle_otp()
            elif self.path == '/delete-users':
                self.handle_delete_users()
            else:
                self.send_error(404)
        except Exception as e:
            import traceback
            traceback.print_exc()
            self.send_error_response(f"Server Error: {str(e)}")

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
            # Secure: default to app URL if not provided, or validate it
            redirect_to = data.get('redirectTo', 'http://localhost:5173') 

            if not email:
                raise ValueError("Email is required")

            if not SUPABASE_SERVICE_ROLE_KEY or "PLACEHOLDER" in SUPABASE_SERVICE_ROLE_KEY:
                print("❌ ERROR: Supabase Credentials not loaded check .env.local!")
                raise ValueError("Server Configuration Error: Missing Supabase Credentials")

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

            # Extract the correct property based on Supabase version
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
            
            # --- HELPERS FOR SUPABASE REST ---
            def supabase_rest(method, endpoint, body=None, params=None):
                url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
                if params:
                    url += "?" + urllib.parse.urlencode(params)
                
                headers = {
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                }
                
                data_bytes = json.dumps(body).encode('utf-8') if body else None
                req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
                
                try:
                    with urllib.request.urlopen(req) as response:
                        if response.status == 204: return None
                        return json.loads(response.read().decode('utf-8'))
                except urllib.error.HTTPError as e:
                    print(f"Supabase REST Error ({endpoint}): {e.read().decode('utf-8')}")
                    raise e

            def supabase_admin_rpc(function_name, body=None):
                return supabase_rest('POST', f"rpc/{function_name}", body)

            # --- ACTIONS ---

            if action == 'send':
                otp = str(random.randint(100000, 999999))
                from datetime import datetime, timedelta
                expires_at = (datetime.utcnow() + timedelta(minutes=10)).isoformat() + "Z"

                # 1. Delete old codes
                supabase_rest('DELETE', 'verification_codes', params={'email': f'eq.{email}'})

                # 2. Insert new code
                supabase_rest('POST', 'verification_codes', body={
                    'email': email,
                    'code': otp,
                    'expires_at': expires_at
                })
                
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
                
                # 1. Verify Code from DB
                codes = supabase_rest('GET', 'verification_codes', params={'email': f'eq.{email}', 'code': f'eq.{code_input}', 'select': '*'})
                if not codes:
                    raise ValueError("Invalid or expired code")
                
                # 2. Fetch User ID from Auth API (Auto-Heal Logic)
                auth_url = f"{SUPABASE_URL}/auth/v1/admin/users"
                
                req = urllib.request.Request(auth_url, headers={
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
                })
                with urllib.request.urlopen(req) as response:
                    users_data = json.loads(response.read().decode('utf-8'))
                    user_list = users_data.get('users', []) if isinstance(users_data, dict) else users_data
                
                user = next((u for u in user_list if u.get('email', '').lower() == email.lower()), None)
                if not user:
                    raise ValueError("User account not found in Auth system")
                
                user_id = user['id']
                meta = user.get('user_metadata', {})
                
                # 3. Check/Create Profile
                profiles = supabase_rest('GET', 'profiles', params={'id': f'eq.{user_id}'})
                
                if not profiles:
                    print(f"Auto-healing profile for {user_id}")
                    username = meta.get('username') or email.split('@')[0]
                    display_name = meta.get('display_name') or meta.get('full_name') or username
                    
                    try:
                        supabase_rest('POST', 'profiles', body={
                            'id': user_id,
                            'username': username,
                            'display_name': display_name,
                            'email': email
                        })
                    except Exception as e:
                        print(f"Profile creation warning: {e}") 

                # 4. Handle Referral
                if meta.get('referral_code'):
                    try:
                        ref_code = meta['referral_code']
                        print(f"Registering referral {ref_code}")
                        supabase_admin_rpc('register_referral', {
                            'referral_code_input': ref_code,
                            'new_user_id': user_id
                        })
                    except Exception as e:
                        print(f"Referral error: {e}")

                # 5. Confirm Email
                update_url = f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}"
                update_body = { "email_confirm": True }
                req_update = urllib.request.Request(update_url, data=json.dumps(update_body).encode('utf-8'), headers={
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json"
                }, method='PUT')
                with urllib.request.urlopen(req_update) as resp:
                     print("User email confirmed via Admin API")

                # 6. Cleanup
                supabase_rest('DELETE', 'verification_codes', params={'email': f'eq.{email}'})

                self.send_json({'success': True, 'message': 'Verified & Profile Synced'})

        except Exception as e:
            import traceback
            traceback.print_exc()
            self.send_error_response(str(e))

    def handle_delete_users(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            user_ids = data.get('userIds')
            
            if not user_ids or not isinstance(user_ids, list):
                raise ValueError("userIds list is required")

            deleted_count = 0
            errors = []

            for user_id in user_ids:
                try:
                    # DELETE /auth/v1/admin/users/{id}
                    url = f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}"
                    req = urllib.request.Request(url, headers={
                        "apikey": SUPABASE_SERVICE_ROLE_KEY,
                        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
                    }, method='DELETE')
                    
                    with urllib.request.urlopen(req) as response:
                        deleted_count += 1
                        print(f"✅ Deleted User {user_id} from Auth")
                        
                except Exception as e:
                     print(f"❌ Failed to delete {user_id}: {e}")
                     errors.append(str(e))

            if deleted_count == 0 and errors:
                 self.send_error_response(f"Failed to delete users: {', '.join(errors)}")
            else:
                 self.send_json({'success': True, 'deleted': deleted_count, 'errors': errors})

        except Exception as e:
            self.send_error_response(str(e))

    def send_smtp_email(self, recipient_email, subject, html_content):
        # Allow disabling email sending via env var (for debugging)
        if os.environ.get("DISABLE_EMAIL_SENDING") == "true":
             print(f"📧 [MOCK] Sending email to {recipient_email}")
             return

        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = "Truvgo Communities <varshith@truvgo.me>"
        msg['To'] = recipient_email
        msg.set_content("Please enable HTML to view this email.")
        msg.add_alternative(html_content, subtype='html')

        context = ssl.create_default_context()
        
        # --- RETRY LOGIC ---
        max_retries = 3
        for attempt in range(max_retries):
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
                
                # --- LOG TO DB ---
                try:
                    log_entry = {
                        "recipient_email": recipient_email,
                        "subject": subject,
                        "status": "sent",
                        "triggered_by": "backend_proxy"
                    }
                    # We need to construct a lightweight REST call here since we are outside the handle_otp scope
                    # Re-using a simplified version of supabase_rest logic or just `requests` if available (std lib urllib)
                    log_url = f"{SUPABASE_URL}/rest/v1/email_logs"
                    log_headers = {
                        "apikey": SUPABASE_SERVICE_ROLE_KEY,
                        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                        "Content-Type": "application/json",
                        "Prefer": "return=representation"
                    }
                    req = urllib.request.Request(log_url, data=json.dumps(log_entry).encode('utf-8'), headers=log_headers, method='POST')
                    with urllib.request.urlopen(req) as resp:
                        print("📝 Logged email to DB")
                except Exception as log_error:
                    print(f"⚠️ Failed to log email: {log_error}")

                return # Success, exit retry loop

            except Exception as e:
                print(f"❌ SMTP Error (Attempt {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    # Final attempt failed
                    # Log failure if possible
                    try:
                        log_entry = {
                            "recipient_email": recipient_email,
                            "subject": subject,
                            "status": "failed",
                            "error_message": str(e),
                            "triggered_by": "backend_proxy"
                        }
                        log_url = f"{SUPABASE_URL}/rest/v1/email_logs"
                        log_headers = {
                            "apikey": SUPABASE_SERVICE_ROLE_KEY,
                            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                            "Content-Type": "application/json"
                        }
                        req = urllib.request.Request(log_url, data=json.dumps(log_entry).encode('utf-8'), headers=log_headers, method='POST')
                        with urllib.request.urlopen(req) as resp:
                            print("📝 Logged email failure to DB")
                    except:
                        pass
                    raise e
                time.sleep(2) # Wait before retry

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
print("Config: Threaded Server, Robust Env Loading")

# ThreadingTCPServer uses threads for each request
with ThreadingTCPServer(("", PORT), EmailHandler) as httpd:
    httpd.serve_forever()
