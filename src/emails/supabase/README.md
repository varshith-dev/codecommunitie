# Supabase Email Templates

Ready-to-paste email templates for Supabase Authentication.

## How to Use

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Email Templates**
3. Select the template type (e.g., "Confirm signup")
4. Copy the HTML content from the corresponding file below
5. Paste into the "Body" section
6. Save changes

## Template Files

| Supabase Template | File | Description |
|-------------------|------|-------------|
| **Confirm signup** | `confirm-signup.html` | Email verification for new accounts |
| **Reset password** | `reset-password.html` | Password reset requests |
| **Magic link** | `magic-link.html` | Passwordless sign-in (OTP) |
| **Change email address** | `change-email.html` | Email change confirmation |
| **Invite user** | `invite-user.html` | Admin user invitations |

## Supabase Variables Used

All templates use Supabase's built-in variables:

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | The full URL the user should click |
| `{{ .Token }}` | Raw token (if needed) |
| `{{ .TokenHash }}` | Hashed token |
| `{{ .SiteURL }}` | Your site's base URL |
| `{{ .Email }}` | User's email address |

## Subject Lines (Suggestions)

Configure these in the "Subject" field in Supabase:

| Template | Suggested Subject |
|----------|-------------------|
| Confirm signup | `Confirm your CodeKrafts account` |
| Reset password | `Reset your CodeKrafts password` |
| Magic link | `Your CodeKrafts sign-in link` |
| Change email | `Confirm your new email address` |
| Invite user | `You're invited to join CodeKrafts!` |

## Design Notes

- **Primary Color**: `#2563eb` (blue-600)
- **No gradients** - flat, solid colors only
- **Mobile responsive** - all templates work on mobile
- **Clean design** - matches the app's aesthetic

## Testing

After updating templates in Supabase:
1. Test signup flow with a new email
2. Test password reset
3. Test OTP/Magic link login
4. Verify emails render correctly on mobile
