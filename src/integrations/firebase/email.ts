import emailjs from "@emailjs/browser";

// EmailJS configuration
// You need to set up a free EmailJS account at https://www.emailjs.com/
// 1. Create an account and add an email service (Gmail, Outlook, etc.)
// 2. Create an email template with the following variables:
//    - {{to_email}} — recipient email
//    - {{verification_code}} — the 6-character code
//    - {{to_name}} — the recipient's username (optional)
// 3. Copy your Service ID, Template ID, and Public Key below

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "";
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "";
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "";

/** Send a verification code email to the user */
export async function sendVerificationEmail(
    toEmail: string,
    code: string,
    username?: string,
): Promise<boolean> {
    // If EmailJS is not configured, fall back to showing code directly
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        console.warn(
            "EmailJS is not configured. Set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY in .env",
        );
        return false;
    }

    try {
        await emailjs.send(
            SERVICE_ID,
            TEMPLATE_ID,
            {
                to_email: toEmail,
                to_name: username || toEmail.split("@")[0],
                verification_code: code,
            },
            PUBLIC_KEY,
        );
        return true;
    } catch (error) {
        console.error("Failed to send verification email:", error);
        return false;
    }
}
