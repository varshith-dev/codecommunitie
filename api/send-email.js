import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    const { recipientEmail, subject, htmlContent, attachments } = req.body;

    if (!recipientEmail || !htmlContent) {
        res.status(400).json({ message: 'Recipient Email and HTML Content are required' });
        return;
    }

    try {
        console.log('API: Sending email to:', recipientEmail, 'Subject:', subject)
        console.log('API: Attachments count:', attachments?.length || 0)

        const transporter = nodemailer.createTransport({
            host: "smtp.zeptomail.in",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: "emailapikey",
                pass: process.env.SMTP_PASSWORD || "PHtE6r0KF7/s2TEt8BVStvG8EMGsZt59/75uK1FGt95AX/ADHk1Wq9F6wza2+U8jAaFFFvbPzIJuuemet7+BcGu4Nz1IDWqyqK3sx/VYSPOZsbq6x00UsFkTckHfXITqcdJq1SbXvNbZNA=="
            },
        });

        const info = await transporter.sendMail({
            from: '"Truvgo Communities" <varshith@truvgo.me>',
            to: recipientEmail,
            subject: subject || "Notification from Truvgo",
            html: htmlContent,
            attachments: attachments // Add attachments support
        });

        console.log("Message sent: %s", info.messageId);
        res.status(200).json({ status: 'success', message: `Email sent to ${recipientEmail}` });

    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}
