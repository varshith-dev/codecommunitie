export const EmailTemplates = {
    WELCOME: {
        subject: (name) => `Welcome to CodCommunitie! 🚀`,
        body: (name) => `
            <p>Hi ${name},</p>
            <p>Welcome to the family! We're excited to have you join <strong>CodCommunitie</strong>.</p>
            <p>You are now part of a global community of developers dedicated to building the future of software. Let us know if you have any questions!</p>
            <div class="button-wrapper">
                <a href="https://codecommunitie.vercel.app/" class="button">Access Dashboard</a>
            </div>
        `,
        title: "Welcome to the Community"
    },
    SIGNUP_CONFIRMATION: {
        subject: () => `Please Verify Your Email - Action Required ✉️`,
        body: (name, verificationLink = 'https://codecommunitie.vercel.app/verify-email') => `
            <p>Hi ${name},</p>
            <p>Thanks for creating an account with <strong>CodCommunitie</strong>.</p>
            <p>To complete your registration and unlock full access, please verify your email address by clicking the button below.</p>
            <div class="button-wrapper">
                <a href="${verificationLink}" class="button">Verify My Account</a>
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">If you didn't create an account, you can safely ignore this email.</p>
        `,
        title: "Verify Your Email"
    },
    OTP: {
        subject: () => `Your Verification Code 🔐`,
        body: (name, otp = '123456') => `
            <p>Hi ${name},</p>
            <p>Here is your verification code to access your account:</p>
            <div class="code-box">${otp}</div>
            <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        `,
        title: "Verification Required"
    },
    RESET_PASSWORD: {
        subject: () => `Reset Your Password 🔑`,
        body: (name, link = 'https://codecommunitie.vercel.app/reset-password') => `
            <p>Hi ${name},</p>
            <p>We received a request to reset your password for your CodCommunitie account.</p>
            <div class="button-wrapper">
                <a href="${link}" class="button">Reset Password</a>
            </div>
            <p>If you didn't ask to reset your password, you can safely ignore this email.</p>
        `,
        title: "Password Reset"
    },
    VERIFIED_BADGE: {
        subject: () => `You're Verified! 🔷`,
        body: (name) => `
            <p>Hi ${name},</p>
            <p>Great news! Your identity has been verified.</p>
            <p>You now have the prestigious <strong>Blue Checkmark</strong> on your profile.</p>
            <div style="text-align:center; margin: 30px;">
                <img src="https://cdn-icons-png.flaticon.com/512/7595/7595571.png" width="60" alt="Verified" />
            </div>
            <div class="button-wrapper">
                <a href="https://codecommunitie.vercel.app/profile" class="button">View Profile</a>
            </div>
        `,
        title: "Verification Complete"
    },
    BETA_ACCESS: {
        subject: () => `You're In! Beta Access Granted 🧪`,
        body: (name) => `
            <p>Hi ${name},</p>
            <p>You've been selected for <strong>Beta Access</strong> to our upcoming features.</p>
            <p>We're rolling out experimental tools that only a handful of users get to see.</p>
            <div class="button-wrapper">
                <a href="https://codecommunitie.vercel.app/" class="button">Explore Beta</a>
            </div>
        `,
        title: "Beta Access Unlocked"
    },
    PRODUCT_UPDATE: {
        subject: () => `New Updates: Read what's new 🚀`,
        body: (name) => `
            <p>Hi ${name},</p>
            <p>We've just released some exciting new features to help you build better and faster.</p>
            <p>Check out the latest improvements on your dashboard. We'd love to hear your thoughts.</p>
            <div class="button-wrapper">
                <a href="https://codecommunitie.vercel.app/" class="button">See What's New</a>
            </div>
        `,
        title: "Product Update"
    }
}

export const wrapInTemplate = (contentBody, title = "New Message") => `
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Base Reset */
        body, html { margin: 0; padding: 0; height: 100%; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f0f8ff; }
        
        /* Main Wrapper - The Blue Background */
        .wrapper {
            background-color: #f0f8ff; /* Light Blue Background */
            padding: 60px 20px;
            min-height: 100%;
            display: flex;
            justify-content: center;
        }

        /* The Card */
        .card {
            background-color: #ffffff;
            width: 100%;
            max-width: 600px;
            border: 2px solid #1a1a1a;
            border-radius: 16px;
            box-shadow: 8px 8px 0px #3ea6ff; /* The Pop-out Shadow Effect */
            overflow: hidden;
            margin: auto;
        }

        /* Header Strip */
        .header {
            background-color: #dbeafe; /* Light Blue Strip */
            border-bottom: 2px solid #1a1a1a;
            padding: 20px 30px;
            font-size: 16px;
            font-weight: bold;
            color: #1a1a1a;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        /* Content Area */
        .content {
            padding: 40px 30px;
            line-height: 1.6;
            color: #1a1a1a;
            font-size: 16px;
        }

        /* Typography */
        h1 { margin: 0 0 20px 0; font-size: 24px; }
        p { margin: 0 0 20px 0; }
        strong { font-weight: 700; color: #0284c7; }

        /* Buttons */
        .button-wrapper { margin-top: 30px; }
        .button {
            display: inline-block;
            background-color: #1a1a1a;
            color: #ffffff !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 14px;
            transition: transform 0.1s;
        }
        .button:hover {
            opacity: 0.9;
        }

        /* Special Elements */
        .code-box {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 5px;
            color: #1a1a1a;
            background: #f0f9ff;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            border: 2px dashed #3ea6ff;
            text-align: center;
        }

        /* Footer */
        .footer {
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #f1f5f9;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <!-- Simulated 'Subject' Header inside Card -->
            <div class="header">
                Subject: ${title}
            </div>
            
            <div class="content">
                ${contentBody}
            </div>

            <div class="footer">
                &copy; 2026 CodCommunitie • codecommunitie.vercel.app
            </div>
        </div>
    </div>
</body>
</html>
`
