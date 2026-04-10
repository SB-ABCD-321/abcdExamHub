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
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; color: #fafafa; background-color: #09090b;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #18181b; border-radius: 24px; overflow: hidden; border: 1px solid #27272a;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #FFD700 0%, #B8860B 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #09090b; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase; font-style: italic;">ABCD EXAM HUB</h1>
                        <p style="color: rgba(0,0,0,0.7); font-size: 13px; font-weight: 800; margin-top: 8px; letter-spacing: 0.15em; text-transform: uppercase;">Official Payment Receipt</p>
                    </div>
                    
                    <div style="padding: 40px; border-top: 1px solid #FFD700;">
                        <div style="margin-bottom: 32px;">
                            <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 10px 0; color: #ffffff;">Hello ${data.name},</h2>
                            <p style="font-size: 15px; line-height: 1.6; color: #a1a1aa; margin: 0;">Thank you for your investment in premium digital assessments. This authenticated receipt confirms that your workspace has been successfully provisioned.</p>
                        </div>

                        <!-- Billing Card -->
                        <div style="background-color: #09090b; border-radius: 16px; padding: 28px; border: 1px solid #27272a; margin-bottom: 32px;">
                            <p style="font-size: 11px; font-weight: 800; color: #FFD700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 20px 0;">Billing Summary</p>
                            
                            <table width="100%" cellPadding="0" cellSpacing="0" border="0" style="margin-bottom: 16px;">
                                <tr>
                                    <td align="left" style="font-size: 14px; font-weight: 600; color: #a1a1aa; border-bottom: 1px dashed #3f3f46; padding-bottom: 16px;">Institution</td>
                                    <td align="right" style="font-size: 14px; font-weight: 700; color: #ffffff; border-bottom: 1px dashed #3f3f46; padding-bottom: 16px;">${data.workspaceName}</td>
                                </tr>
                            </table>
                            
                            <table width="100%" cellPadding="0" cellSpacing="0" border="0" style="margin-bottom: 16px;">
                                <tr>
                                    <td align="left" style="font-size: 14px; font-weight: 600; color: #a1a1aa; border-bottom: 1px dashed #3f3f46; padding-bottom: 16px;">Plan Variant</td>
                                    <td align="right" style="font-size: 14px; font-weight: 700; color: #ffffff; border-bottom: 1px dashed #3f3f46; padding-bottom: 16px;">${data.planName} <span style="color: #FFD700;">(${data.duration})</span></td>
                                </tr>
                            </table>
                            
                            <table width="100%" cellPadding="0" cellSpacing="0" border="0" style="margin-bottom: 24px;">
                                <tr>
                                    <td align="left" style="font-size: 14px; font-weight: 600; color: #a1a1aa;">Receipt ID</td>
                                    <td align="right" style="font-size: 14px; font-weight: 700; color: #ffffff;">${data.receiptNumber}</td>
                                </tr>
                            </table>

                            <div style="margin-top: 24px; padding-top: 24px; border-top: 2px solid #27272a;">
                                <table width="100%" cellPadding="0" cellSpacing="0" border="0" style="margin-bottom: 12px;">
                                    <tr>
                                        <td align="left" style="font-size: 14px; font-weight: 600; color: #71717a;">Net Amount</td>
                                        <td align="right" style="font-size: 14px; font-weight: 600; color: #e4e4e7;">₹${data.baseAmount.toLocaleString()}</td>
                                    </tr>
                                </table>
                                <table width="100%" cellPadding="0" cellSpacing="0" border="0" style="margin-bottom: 24px;">
                                    <tr>
                                        <td align="left" style="font-size: 14px; font-weight: 600; color: #71717a;">GST (18%)</td>
                                        <td align="right" style="font-size: 14px; font-weight: 600; color: #e4e4e7;">₹${data.gstAmount.toLocaleString()}</td>
                                    </tr>
                                </table>
                                
                                <table width="100%" cellPadding="0" cellSpacing="0" border="0" style="background-color: #FFD700; border-radius: 8px;">
                                    <tr>
                                        <td align="left" style="padding: 20px;"><span style="font-size: 15px; font-weight: 900; color: #09090b; text-transform: uppercase; letter-spacing: 0.1em;">Total Paid</span></td>
                                        <td align="right" style="padding: 20px;"><span style="font-size: 24px; font-weight: 900; color: #09090b;">₹${data.totalAmount.toLocaleString()}</span></td>
                                    </tr>
                                </table>
                            </div>
                        </div>

                        <!-- Info Blocks -->
                        <div style="text-align: center; background-color: #27272a; border: 1px solid #3f3f46; border-radius: 12px; padding: 20px;">
                            <p style="font-size: 11px; font-weight: 800; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">Subscription Expires On</p>
                            <p style="font-size: 20px; font-weight: 900; color: #FFD700; margin: 0; font-style: italic;">${data.expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>

                        <div style="margin-top: 40px; text-align: center; border-top: 1px solid #27272a; padding-top: 30px;">
                            <p style="font-size: 13px; color: #a1a1aa; margin-bottom: 24px; line-height: 1.5;">Need a detailed PDF breakdown or have questions about your billing? Access your full billing portal below.</p>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://abcdexamhub.com'}/admin/billing" style="display: inline-block; background-color: #ffffff; color: #09090b; padding: 16px 32px; text-decoration: none; font-weight: 800; border-radius: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Access Billing Hub</a>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 40px;">
                    <p style="font-size: 11px; color: #71717a; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">© 2026 ABCD Exam Hub • Secure Innovation Hub</p>
                </div>
            </div>
        `,
    });
}
