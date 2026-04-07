import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
    try {
        const info = await transporter.sendMail({
            from: `"ABCD Exam Hub" <${process.env.SMTP_FROM}>`,
            to,
            subject,
            text,
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
}

// Specific Templates
export async function sendWorkspaceRequestConfirmation(email: string, name: string) {
    return sendEmail({
        to: email,
        subject: "ABCD Exam Hub - Workspace Request Received",
        text: `Hello ${name},\n\nWe have received your request to create a workspace on ABCD Exam Hub. Our administrative team will review your request and get back to you within 24 hours.\n\nThank you for choosing ABCD Exam Hub.`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #FFD700;">Hello ${name},</h2>
                <p>We have received your request to create a workspace on <strong>ABCD Exam Hub</strong>.</p>
                <p>Our administrative team will review your request and verify the details. You can expect a response within <strong>24 hours</strong>.</p>
                <p>If you have any urgent questions, feel free to reply to this email.</p>
                <br />
                <p>Best Regards,</p>
                <p><strong>ABCD Exam Hub Team</strong></p>
            </div>
        `,
    });
}

export async function sendWorkspaceApprovalNotification(email: string, name: string, workspaceName: string) {
    return sendEmail({
        to: email,
        subject: "ABCD Exam Hub - Workspace Approved!",
        text: `Congratulations ${name}!\n\nYour workspace "${workspaceName}" has been approved and is now active. You can log in and start setting up your exams.\n\nWelcome to the ABCD Exam Hub family!`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #4CAF50;">Congratulations ${name}!</h2>
                <p>Your workspace <strong>"${workspaceName}"</strong> has been <strong>approved</strong> and is now active.</p>
                <p>You can now log in to your dashboard to start setting up exams, adding students, and managing your academic sessions.</p>
                <div style="margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 10px; text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://abcdexamhub.com'}/teacher" style="background-color: #FFD700; color: #000; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 5px;">Go to Dashboard</a>
                </div>
                <br />
                <p>Welcome to the <strong>ABCD Exam Hub</strong> family!</p>
                <p>Best Regards,</p>
                <p><strong>ABCD Exam Hub Team</strong></p>
        `,
    });
}

export async function sendWorkspaceRejectionNotification(email: string, name: string, reason: string) {
    return sendEmail({
        to: email,
        subject: "ABCD Exam Hub - Workspace Request Status Update",
        text: `Hello ${name},\n\nThank you for your interest in ABCD Exam Hub. After reviewing your request, we are unable to approve your workspace at this time for the following reason:\n\n${reason}\n\nIf you have any questions, please contact our support team.`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #f44336;">Hello ${name},</h2>
                <p>Thank you for your interest in <strong>ABCD Exam Hub</strong>.</p>
                <p>After a thorough review of your workspace request, our administration team is unable to approve your application at this time.</p>
                <div style="margin: 20px 0; padding: 20px; background-color: #fff8f8; border-left: 4px solid #f44336; border-radius: 4px;">
                    <p style="margin: 0; font-weight: bold; color: #d32f2f;">Reason for Decision:</p>
                    <p style="margin: 5px 0 0 0; font-style: italic;">${reason}</p>
                </div>
                <p>If you believe this was in error or you have updated information, please feel free to submit a new request or contact our support department.</p>
                <br />
                <p>Best Regards,</p>
                <p><strong>ABCD Exam Hub Team</strong></p>
            </div>
        `,
    });
}
