/**
 * Email service for magic link authentication
 * Uses worker-mailer for Cloudflare Workers and nodemailer for local development
 */

// Email HTML template
// TODO : update the image url with correct url
const getEmailHtml = (url: string) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1c1917; padding: 40px; border-radius: 12px; color: #f5f5f4;">
        <div style="text-align: center; margin-bottom: 32px;">
             <img src="https://ui-avatars.com/api/?name=Tweet+Batch&background=b91c1c&color=faf7f5&size=128&rounded=true&bold=true" alt="TweetBatch Logo" style="width: 48px; height: 48px; border-radius: 8px;" />
        </div>
        <h2 style="color: #f5f5f4; text-align: center; font-size: 24px; font-weight: 600; margin-bottom: 24px;">Sign in to TweetBatch</h2>
        <p style="color: #d6d3d1; text-align: center; font-size: 16px; margin-bottom: 32px; line-height: 1.5;">Click the button below to sign in to your account. This link will expire in 10 minutes.</p>
        <div style="text-align: center;">
            <a href="${url}" style="display: inline-block; background-color: #b91c1c; color: #faf7f5; padding: 16px 32px; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 16px; transition: opacity 0.2s;">Sign In to TweetBatch</a>
        </div>
        <p style="color: #d6d3d1; text-align: center; font-size: 14px; margin-top: 32px;">If you didn't request this email, you can safely ignore it.</p>
        <div style="border-top: 1px solid #44403c; margin-top: 32px; padding-top: 32px; text-align: center;">
            <p style="color: #d6d3d1; font-size: 12px;">© ${new Date().getFullYear()} TweetBatch. All rights reserved.</p>
        </div>
    </div>
`;

// Detect if running in Cloudflare Workers PRODUCTION environment
// Wrangler dev simulates Workers but can't make SMTP connections
function isCloudflareWorkersProduction(gmailUser: string): boolean {
    const isWorkersRuntime = typeof navigator !== "undefined" &&
        typeof navigator.userAgent === "string" &&
        navigator.userAgent === "Cloudflare-Workers";

    // If gmailUser is undefined or we can detect localhost in any way, use nodemailer
    // In wrangler dev, SMTP connections fail, so we must use nodemailer
    if (!gmailUser) {
        console.log("[email] No GMAIL_USER configured, falling back to nodemailer");
        return false;
    }

    // For local wrangler dev, we need to use nodemailer
    // The simplest detection: if worker-mailer fails, we should have tried nodemailer
    // But we can't easily detect wrangler dev vs production
    // So we'll check if globalThis has the 'process' object (Node.js specific)
    const hasNodeProcess = typeof globalThis !== "undefined" &&
        typeof (globalThis as Record<string, unknown>).process !== "undefined";

    if (hasNodeProcess) {
        console.log("[email] Node.js process detected, using nodemailer");
        return false;
    }

    return isWorkersRuntime;
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
                from: { name: "TweetBatch", email: gmailUser },
                to: email,
                subject: "Sign in to TweetBatch",
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
            from: `"TweetBatch" <${gmailUser}>`,
            to: email,
            subject: "Sign in to TweetBatch",
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

    const isWorkers = isCloudflareWorkersProduction(gmailUser);
    console.log("[sendMagicLinkEmail] Runtime:", isWorkers ? "Cloudflare Workers (production)" : "Node.js/Wrangler dev");

    if (isWorkers) {
        await sendWithWorkerMailer(email, url, gmailUser, gmailPassword);
    } else {
        await sendWithNodemailer(email, url, gmailUser, gmailPassword);
    }

    console.log("[sendMagicLinkEmail] ✅ Magic link email processed");
}
