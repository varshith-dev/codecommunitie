# Email Templates

This folder contains HTML email templates for CodeKrafts.

## Available Templates

| Template | Description | Variables |
|----------|-------------|-----------|
| `welcome.html` | Sent when a new user signs up | `{{username}}`, `{{app_url}}`, `{{unsubscribe_url}}` |
| `verify-email.html` | Email verification with OTP | `{{username}}`, `{{otp_code}}`, `{{verification_url}}` |
| `reset-password.html` | Password reset request | `{{username}}`, `{{reset_url}}` |
| `notification.html` | Generic notification | `{{notification_title}}`, `{{notification_message}}`, `{{action_url}}`, `{{action_label}}` |

## Usage

These templates use placeholder variables in the format `{{variable_name}}`. Replace these with actual values when sending emails.

### Example (Node.js):

```javascript
const template = fs.readFileSync('./src/emails/welcome.html', 'utf8');
const html = template
    .replace(/{{username}}/g, user.username)
    .replace(/{{app_url}}/g, 'https://codekrafts.com');
```

## Design Guidelines

- **No gradients** - Use flat colors only
- **Primary color**: `#2563eb` (blue-600)
- **Font**: System font stack
- **Mobile-friendly**: All templates are responsive

## Supabase Configuration

To use these templates with Supabase Auth:
1. Go to Supabase Dashboard > Authentication > Email Templates
2. Copy the HTML content of the desired template
3. Paste into the appropriate template slot
