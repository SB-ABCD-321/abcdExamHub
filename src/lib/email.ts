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
            </div>
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

export async function sendPaymentReceiptEmail(data: {
    email: string;
    name: string;
    workspaceName: string;
    planName: string;
    duration: string;
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
    receiptNumber: string;
    expiryDate: Date;
}) {
    return sendEmail({
        to: data.email,
        subject: `Payment Receipt - ${data.receiptNumber} - ABCD Exam Hub`,
        text: `Hello ${data.name},\n\nThank you for your payment. Your workspace "${data.workspaceName}" has been updated to the "${data.planName}" plan.\n\nReceipt Number: ${data.receiptNumber}\nTotal Amount: ₹${data.totalAmount.toLocaleString()}\nExpiry Date: ${data.expiryDate.toLocaleDateString()}\n\nThank you for choosing ABCD Exam Hub.`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; background-color: #f4f7f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e1e8e5;">
                    <div style="background-color: #0f172a; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase;">Payment Receipt</h1>
                        <p style="color: #94a3b8; font-size: 12px; font-weight: 700; margin-top: 8px; letter-spacing: 0.1em; text-transform: uppercase;">ABCD EXAM HUB • INNOVATION HUB</p>
                    </div>
                    
                    <div style="padding: 40px;">
                        <div style="margin-bottom: 32px;">
                            <h2 style="font-size: 18px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;">Hello ${data.name},</h2>
                            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0;">Thank you for your investment. This receipt confirms that your account has been successfully provisioned for the following period.</p>
                        </div>

                        <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 32px;">
                            <p style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 16px 0;">Billing Summary</p>
                            
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 12px;">
                                <span style="font-size: 13px; font-weight: 600; color: #475569;">Institution</span>
                                <span style="font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${data.workspaceName}</span>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                <span style="font-size: 13px; font-weight: 600; color: #475569;">Plan Variant</span>
                                <span style="font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${data.planName} (${data.duration})</span>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                <span style="font-size: 13px; font-weight: 600; color: #475569;">Receipt ID</span>
                                <span style="font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${data.receiptNumber}</span>
                            </div>

                            <div style="margin-top: 24px; padding-top: 16px; border-top: 2px solid #e2e8f0;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="font-size: 13px; font-weight: 600; color: #64748b;">Net Amount</span>
                                    <span style="font-size: 13px; font-weight: 600; color: #1e293b; text-align: right;">₹${data.baseAmount.toLocaleString()}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                    <span style="font-size: 13px; font-weight: 600; color: #64748b;">GST (18%)</span>
                                    <span style="font-size: 13px; font-weight: 600; color: #1e293b; text-align: right;">₹${data.gstAmount.toLocaleString()}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; background-color: #0f172a; margin: 24px -24px -24px -24px; padding: 24px; border-radius: 0 0 12px 12px;">
                                    <span style="font-size: 14px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 0.1em;">Total Paid</span>
                                    <span style="font-size: 20px; font-weight: 900; color: #fbbf24; text-align: right;">₹${data.totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div style="text-align: center; border: 2px solid #f1f5f9; border-radius: 12px; padding: 16px;">
                            <p style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Subscription Expires On</p>
                            <p style="font-size: 18px; font-weight: 800; color: #ef4444; margin: 0;">${data.expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>

                        <div style="margin-top: 40px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 30px;">
                            <p style="font-size: 13px; color: #94a3b8; margin-bottom: 20px;">Need a detailed PDF breakdown or have questions about your billing? Reply to this email or visit your billing portal.</p>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://abcdexamhub.com'}/admin/billing" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 700; border-radius: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Access Billing Hub</a>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p style="font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">© 2026 ABCD Exam Hub • Secure Assessment Ecosystem</p>
                </div>
            </div>
        `,
    });
}
