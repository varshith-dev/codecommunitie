export const EmailTemplates = {
    WELCOME: {
        subject: (name) => `Welcome to CodCommunitie! 🚀`,
        body: (name) => `
            <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://cdn-icons-png.flaticon.com/512/8805/8805064.png" width="80" alt="Welcome" />
            </div>
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
            <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://cdn-icons-png.flaticon.com/512/2058/2058765.png" width="80" alt="Verify" />
            </div>
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
            <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://cdn-icons-png.flaticon.com/512/10695/10695882.png" width="80" alt="Security Code" />
            </div>
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
            <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://cdn-icons-png.flaticon.com/512/6357/6357048.png" width="80" alt="Reset Password" />
            </div>
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
            <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://cdn-icons-png.flaticon.com/512/7595/7595571.png" width="80" alt="Verified" />
            </div>
            <p>Hi ${name},</p>
            <p>Great news! Your identity has been verified.</p>
            <p>You now have the prestigious <strong>Blue Checkmark</strong> on your profile.</p>
            <div class="button-wrapper">
                <a href="https://codecommunitie.vercel.app/profile" class="button">View Profile</a>
            </div>
        `,
        title: "Verification Complete"
    },
    BETA_ACCESS: {
        subject: (name) => `You're in! Welcome to CodeKrafts Beta 🚀`,
        body: (name) => `
            <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://cdn-icons-png.flaticon.com/512/1356/1356479.png" width="80" alt="Rocket" />
            </div>
            <p>Hi ${name},</p>
            <p>Great news! You've been selected for exclusive Early Access.</p>
            <p>Click below to start exploring:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${window.location.origin}/login" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Access Beta</a>
            </div>
        `,
        title: "Beta Access Unlocked"
    },
    ACCOUNT_DELETED: {
        subject: () => `Important: Account Policy Update ⚠️`,
        body: (name, reason) => `
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://cdn-icons-png.flaticon.com/512/6897/6897039.png" width="80" alt="Account Deleted" />
            </div>
            <p>Hi ${name},</p>
            <p>Your CodeKrafts account has been permanently removed by our administrative team.</p>
            <div style="background: #fef2f2; border: 1px solid #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; color: #991b1b;">
                <strong>Reason:</strong> ${reason || 'Violation of Terms of Service'}
            </div>
            <p>If you believe this was a mistake, you may contact support, but please note that all data associated with this account has been erased.</p>
        `,
        title: "Account Deleted"
    },
    PRODUCT_UPDATE: {
        subject: () => `New Updates: Read what's new 🚀`,
        body: (name) => `
            <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://cdn-icons-png.flaticon.com/512/1163/1163774.png" width="80" alt="Update" />
            </div>
            <p>Hi ${name},</p>
            <p>We've just released some exciting new features to help you build better and faster.</p>
            <p>Check out the latest improvements on your dashboard. We'd love to hear your thoughts.</p>
            <div class="button-wrapper">
                <a href="https://codecommunitie.vercel.app/" class="button">See What's New</a>
            </div>
        `,
        title: "Product Update"
    },
    AD_APPROVED: {
        subject: () => `Your Ad is Live! 🎉`,
        body: (name, adTitle) => `
            <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://cdn-icons-png.flaticon.com/512/3176/3176294.png" width="80" alt="Ad Approved" />
            </div>
            <p>Hi ${name},</p>
            <p>Great news! Your ad "<strong>${adTitle}</strong>" has been approved and is now live.</p>
            <p>You can track its performance in real-time from your dashboard.</p>
            <div class="button-wrapper">
                <a href="https://codecommunitie.vercel.app/advertiser/dashboard" class="button">View Performance</a>
            </div>
        `,
        title: "Ad Approved"
    },
    CREDITS_APPROVED: {
        subject: () => `Funds Added to Your Wallet 💰`,
        body: (name, amount) => `
            <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://cdn-icons-png.flaticon.com/512/2454/2454282.png" width="80" alt="Credits Added" />
            </div>
            <p>Hi ${name},</p>
            <p>Your wallet has been credited with <strong>₹${amount}</strong>.</p>
            <p>Your campaigns will continue to run as long as you have a sufficient balance.</p>
            <div class="button-wrapper">
                <a href="https://codecommunitie.vercel.app/advertiser/dashboard" class="button">Check Balance</a>
            </div>
        `,
        title: "Credits Added"
    },
    CAMPAIGN_CREATED: {
        subject: () => `Campaign Launched Successfully 🚀`,
        body: (name, campaignName) => `
            <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://cdn-icons-png.flaticon.com/512/3094/3094918.png" width="80" alt="Campaign Created" />
            </div>
            <p>Hi ${name},</p>
            <p>Your new campaign "<strong>${campaignName}</strong>" has been successfully created.</p>
            <p>To start showing ads, make sure to add advertisements to this campaign.</p>
            <div class="button-wrapper">
                <a href="https://codecommunitie.vercel.app/advertiser/dashboard" class="button">Manage Campaign</a>
            </div>
        `,
        title: "Campaign Launched"
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
