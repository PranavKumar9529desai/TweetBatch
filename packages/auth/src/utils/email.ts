/**
 * Email service for magic link authentication
 * Uses worker-mailer for Cloudflare Workers and nodemailer for local development
 */

// Email HTML template
const getEmailHtml = (url: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Sign in to Twitter Scheduler</h2>
        <p style="color: #666;">Click the button below to sign in to your account. This link will expire in 10 minutes.</p>
        <a href="${url}" style="display: inline-block; background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Sign In</a>
        <p style="color: #999; font-size: 12px;">If you didn't request this email, you can safely ignore it.</p>
    </div>
`;

// Detect if running in Cloudflare Workers environment
function isCloudflareWorkers(): boolean {
    return typeof navigator !== "undefined" &&
        typeof navigator.userAgent === "string" &&
        navigator.userAgent === "Cloudflare-Workers";
}

// Send email using worker-mailer (Cloudflare Workers production)
async function sendWithWorkerMailer(
    email: string,
    url: string,
    gmailUser: string,
    gmailPassword: string
): Promise<void> {
    console.log("[worker-mailer] Starting email send...");
    console.log("[worker-mailer] To:", email);
    console.log("[worker-mailer] From:", gmailUser);
    console.log("[worker-mailer] SMTP Host: smtp.gmail.com:587");

    const { WorkerMailer } = await import("worker-mailer");

    try {
        console.log("[worker-mailer] Connecting to SMTP server...");

        await WorkerMailer.send(
            {
                host: "smtp.gmail.com",
                port: 587,
                secure: true,
                credentials: {
                    username: gmailUser,
                    password: gmailPassword,
                },
                authType: "plain",
            },
            {
                from: { name: "Twitter Scheduler", email: gmailUser },
                to: email,
                subject: "Sign in to Twitter Scheduler",
                text: `Click this link to sign in: ${url}`,
                html: getEmailHtml(url),
            }
        );

        console.log("[worker-mailer] ✅ Email sent successfully!");
    } catch (error) {
        console.error("[worker-mailer] ❌ Failed to send email:", error);
        throw error;
    }
}

// Send email using nodemailer (local development)
async function sendWithNodemailer(
    email: string,
    url: string,
    gmailUser: string,
    gmailPassword: string
): Promise<void> {
    console.log("[nodemailer] Starting email send (local dev mode)...");
    console.log("[nodemailer] To:", email);
    console.log("[nodemailer] From:", gmailUser);

    const nodemailer = await import("nodemailer");

    try {
        const transporter = nodemailer.default.createTransport({
            service: "gmail",
            auth: {
                user: gmailUser,
                pass: gmailPassword,
            },
        });

        await transporter.sendMail({
            from: `"Twitter Scheduler" <${gmailUser}>`,
            to: email,
            subject: "Sign in to Twitter Scheduler",
            text: `Click this link to sign in: ${url}`,
            html: getEmailHtml(url),
        });

        console.log("[nodemailer] ✅ Email sent successfully!");
    } catch (error) {
        console.error("[nodemailer] ❌ Failed to send email:", error);
        throw error;
    }
}

/**
 * Send magic link email
 * Automatically selects the appropriate email provider based on runtime
 */
export async function sendMagicLinkEmail(
    email: string,
    url: string,
    gmailUser: string,
    gmailPassword: string
): Promise<void> {
    console.log("[sendMagicLinkEmail] Magic link requested for:", email);
    console.log("[sendMagicLinkEmail] URL:", url);

    const isWorkers = isCloudflareWorkers();
    console.log("[sendMagicLinkEmail] Runtime:", isWorkers ? "Cloudflare Workers" : "Node.js (local dev)");

    if (isWorkers) {
        await sendWithWorkerMailer(email, url, gmailUser, gmailPassword);
    } else {
        await sendWithNodemailer(email, url, gmailUser, gmailPassword);
    }

    console.log("[sendMagicLinkEmail] ✅ Magic link email processed");
}
