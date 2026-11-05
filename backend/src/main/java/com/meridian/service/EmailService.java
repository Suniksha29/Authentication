package com.meridian.service;

import com.meridian.domain.RegistrationRequest;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Properties;
import java.util.UUID;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final EmailOutboxService outboxService;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private int mailPort;

    @Value("${spring.mail.username:${MAIL_USERNAME:}}")
    private String mailUsername;

    @Value("${spring.mail.password:${MAIL_PASSWORD:}}")
    private String mailPassword;

    @Value("${meridian.bootstrap-admin-email:suniksha2329@gmail.com}")
    private String adminEmail;

    @Value("${meridian.base-url:http://localhost:8082}")
    private String baseUrl;

    public EmailService(EmailOutboxService outboxService) {
        this.outboxService = outboxService;
    }

    public boolean isSmtpConfigured() {
        return mailUsername != null && !mailUsername.isBlank()
                && mailPassword != null && !mailPassword.isBlank()
                && !mailUsername.contains("placeholder")
                && !mailPassword.contains("placeholder");
    }

    /**
     * Send email verification link to candidate/registrant.
     */
    public void sendVerificationEmail(RegistrationRequest reg) {
        String verificationUrl = baseUrl + "/api/auth/verify-email?token=" + reg.getVerificationToken();
        String subject = "Verify your email address - Meridian Portal";
        String htmlBody = buildVerificationEmailHtml(reg.getFullName(), reg.getEmail(), verificationUrl);

        dispatchEmail(
                reg.getEmail(),
                subject,
                "VERIFICATION",
                verificationUrl,
                "Verify your corporate email address to continue registration.",
                htmlBody
        );
    }

    /**
     * Send actionable 1-click approval email to the Admin (suniksha2329@gmail.com).
     */
    public void sendAdminApprovalRequest(RegistrationRequest reg) {
        String targetAdmin = (adminEmail != null && !adminEmail.isBlank()) ? adminEmail : "suniksha2329@gmail.com";
        String approveUrl = baseUrl + "/api/auth/approve-registration?token=" + reg.getApprovalToken();
        String rejectUrl = baseUrl + "/api/auth/reject-registration?token=" + reg.getApprovalToken();
        String subject = "ACTION REQUIRED: Approve new account registration - " + reg.getFullName();
        String htmlBody = buildAdminApprovalEmailHtml(reg.getFullName(), reg.getEmail(), approveUrl, rejectUrl);

        dispatchEmail(
                targetAdmin,
                subject,
                "ADMIN_APPROVAL_REQUEST",
                approveUrl,
                "New account registration pending your approval: " + reg.getFullName() + " (" + reg.getEmail() + ")",
                htmlBody
        );
    }

    /**
     * Send notification to user that their account was approved.
     */
    public void sendAccountApprovedEmail(String toEmail, String fullName) {
        String loginUrl = baseUrl + "/login";
        String subject = "Your Meridian Account Has Been Approved";
        String htmlBody = buildApprovedConfirmationEmailHtml(fullName, toEmail, loginUrl);

        dispatchEmail(
                toEmail,
                subject,
                "ACCOUNT_APPROVED",
                loginUrl,
                "Your account registration has been approved. You can now sign in.",
                htmlBody
        );
    }

    private void dispatchEmail(String to, String subject, String type, String actionUrl, String preview, String html) {
        String emailId = UUID.randomUUID().toString();
        String deliveryMethod = "Local Dispatch Outbox (Ready for review)";

        if (isSmtpConfigured()) {
            try {
                String cleanPassword = mailPassword != null ? mailPassword.replaceAll("\\s+", "").trim() : "";
                String cleanUsername = mailUsername != null ? mailUsername.trim() : "";

                JavaMailSenderImpl sender = new JavaMailSenderImpl();
                sender.setHost(mailHost != null ? mailHost.trim() : "smtp.gmail.com");
                sender.setPort(mailPort > 0 ? mailPort : 587);
                sender.setUsername(cleanUsername);
                sender.setPassword(cleanPassword);

                Properties props = sender.getJavaMailProperties();
                props.put("mail.transport.protocol", "smtp");
                props.put("mail.smtp.auth", "true");
                props.put("mail.smtp.starttls.enable", "true");
                props.put("mail.smtp.ssl.trust", "smtp.gmail.com");
                props.put("mail.smtp.connectiontimeout", "10000");
                props.put("mail.smtp.timeout", "10000");
                props.put("mail.smtp.writetimeout", "10000");

                MimeMessage message = sender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(cleanUsername, "Meridian Portal");
                helper.setReplyTo(cleanUsername);
                helper.setTo(to.trim());
                helper.setSubject(subject);
                helper.setText(html, true);

                sender.send(message);
                deliveryMethod = "Delivered via SMTP (" + mailHost + ")";
                log.info("[EMAIL SENT] Successfully dispatched real email via SMTP to '{}' [Subject: '{}']", to, subject);
            } catch (Exception e) {
                log.error("[EMAIL SMTP ERROR] Failed to send email via SMTP to '{}': {}. Recorded to Outbox.", to, e.getMessage(), e);
                deliveryMethod = "SMTP Failed (" + e.getMessage() + ") - Saved in Outbox";
            }
        } else {
            log.info("[EMAIL OUTBOX] SMTP not configured with live credentials. Email captured for '{}': ActionURL={}", to, actionUrl);
        }

        outboxService.record(emailId, to, subject, type, actionUrl, preview, deliveryMethod);
    }

    private String buildVerificationEmailHtml(String fullName, String email, String url) {
        return "<!DOCTYPE html>"
                + "<html><head><meta charset='utf-8'><title>Verify Your Email</title></head>"
                + "<body style='margin:0;padding:24px;background:#F5F7FA;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;color:#1E293B;'>"
                + "  <div style='max-width:540px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05);'>"
                + "    <div style='display:flex;align-items:center;gap:10px;margin-bottom:24px;border-bottom:1px solid #F1F5F9;padding-bottom:16px;'>"
                + "      <div style='width:32px;height:32px;background:#0B0D11;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#FFFFFF;font-weight:bold;font-size:16px;text-align:center;line-height:32px;'>M</div>"
                + "      <span style='font-size:18px;font-weight:700;letter-spacing:-0.02em;color:#0B0D11;'>Meridian <span style='font-size:12px;color:#C2410C;font-family:monospace;'>SECURITY</span></span>"
                + "    </div>"
                + "    <h2 style='font-size:20px;font-weight:700;color:#0B0D11;margin:0 0 12px 0;'>Verify your work email</h2>"
                + "    <p style='font-size:14px;color:#475569;line-height:1.6;margin:0 0 16px 0;'>Hello <strong>" + escape(fullName) + "</strong>,</p>"
                + "    <p style='font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px 0;'>Thank you for creating an account on the Meridian Enterprise Portal. Please confirm that <strong>" + escape(email) + "</strong> is your valid corporate email address by clicking below:</p>"
                + "    <div style='text-align:center;margin:32px 0;'>"
                + "      <a href='" + url + "' style='display:inline-block;background:#0B0D11;color:#FFFFFF;font-weight:600;font-size:14px;padding:12px 28px;text-decoration:none;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.1);'>Verify Work Email &rarr;</a>"
                + "    </div>"
                + "    <p style='font-size:12px;color:#64748B;line-height:1.5;background:#F8FAFC;padding:12px;border-radius:6px;border:1px solid #E2E8F0;'>"
                + "      Once verified, your account will be routed to your administrator (<strong>" + escape(adminEmail) + "</strong>) for final role approval before access is enabled."
                + "    </p>"
                + "    <p style='font-size:11px;color:#94A3B8;margin-top:24px;border-top:1px solid #F1F5F9;padding-top:16px;'>"
                + "      If you didn't request this registration, you can safely ignore this email.<br/>Direct verification link: <a href='" + url + "' style='color:#C2410C;'>" + url + "</a>"
                + "    </p>"
                + "  </div>"
                + "</body></html>";
    }

    private String buildAdminApprovalEmailHtml(String fullName, String email, String approveUrl, String rejectUrl) {
        return "<!DOCTYPE html>"
                + "<html><head><meta charset='utf-8'><title>Admin Approval Required</title></head>"
                + "<body style='margin:0;padding:24px;background:#F5F7FA;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;color:#1E293B;'>"
                + "  <div style='max-width:580px;margin:0 auto;background:#FFFFFF;border:1px solid #CBD5E1;border-radius:8px;padding:32px;box-shadow:0 2px 6px rgba(0,0,0,0.06);'>"
                + "    <div style='display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;border-bottom:1px solid #E2E8F0;padding-bottom:16px;'>"
                + "      <div style='display:flex;align-items:center;gap:10px;'>"
                + "        <div style='width:32px;height:32px;background:#0B0D11;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#FFFFFF;font-weight:bold;font-size:16px;text-align:center;line-height:32px;'>M</div>"
                + "        <span style='font-size:18px;font-weight:700;color:#0B0D11;'>Meridian</span>"
                + "      </div>"
                + "      <span style='background:#FEF3C7;color:#92400E;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;border:1px solid #FCD34D;'>ACTION REQUIRED</span>"
                + "    </div>"
                + "    <h2 style='font-size:20px;font-weight:700;color:#0B0D11;margin:0 0 8px 0;'>New User Registration Approval</h2>"
                + "    <p style='font-size:14px;color:#475569;line-height:1.5;margin:0 0 20px 0;'>Hello Administrator, a new employee has registered on Meridian and is awaiting your authorization:</p>"
                + "    <div style='background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:16px;margin-bottom:24px;'>"
                + "      <table style='width:100%;font-size:13px;border-collapse:collapse;'>"
                + "        <tr><td style='padding:6px 0;color:#64748B;width:130px;font-weight:500;'>Full Name:</td><td style='padding:6px 0;color:#0B0D11;font-weight:600;'>" + escape(fullName) + "</td></tr>"
                + "        <tr><td style='padding:6px 0;color:#64748B;font-weight:500;'>Work Email:</td><td style='padding:6px 0;color:#0B0D11;font-weight:600;font-family:monospace;'>" + escape(email) + "</td></tr>"
                + "        <tr><td style='padding:6px 0;color:#64748B;font-weight:500;'>Requested Role:</td><td style='padding:6px 0;color:#0B0D11;'>Standard Employee (Directory Access)</td></tr>"
                + "        <tr><td style='padding:6px 0;color:#64748B;font-weight:500;'>Current Status:</td><td style='padding:6px 0;'><span style='color:#C2410C;font-weight:600;'>INACTIVE (Blocked until approved)</span></td></tr>"
                + "      </table>"
                + "    </div>"
                + "    <div style='text-align:center;margin:28px 0;display:flex;gap:12px;justify-content:center;'>"
                + "      <a href='" + approveUrl + "' style='display:inline-block;background:#15803D;color:#FFFFFF;font-weight:600;font-size:14px;padding:12px 24px;text-decoration:none;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,0.1);'>&#10003; Approve & Activate Account</a>"
                + "      &nbsp;&nbsp;"
                + "      <a href='" + rejectUrl + "' style='display:inline-block;background:#F1F5F9;color:#475569;font-weight:600;font-size:14px;padding:12px 20px;text-decoration:none;border-radius:6px;border:1px solid #CBD5E1;'>Reject</a>"
                + "    </div>"
                + "    <p style='font-size:12px;color:#64748B;line-height:1.5;margin:0;border-top:1px solid #F1F5F9;padding-top:16px;'>"
                + "      As system administrator (" + escape(adminEmail) + "), clicking Approve will activate this employee in PostgreSQL / H2 and allow them to log in immediately via password or Google OIDC.<br/>"
                + "      Direct Approval Link: <a href='" + approveUrl + "' style='color:#15803D;word-break:break-all;'>" + approveUrl + "</a>"
                + "    </p>"
                + "  </div>"
                + "</body></html>";
    }

    private String buildApprovedConfirmationEmailHtml(String fullName, String email, String loginUrl) {
        return "<!DOCTYPE html>"
                + "<html><head><meta charset='utf-8'><title>Account Approved</title></head>"
                + "<body style='margin:0;padding:24px;background:#F5F7FA;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;color:#1E293B;'>"
                + "  <div style='max-width:540px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05);'>"
                + "    <div style='display:flex;align-items:center;gap:10px;margin-bottom:24px;border-bottom:1px solid #F1F5F9;padding-bottom:16px;'>"
                + "      <div style='width:32px;height:32px;background:#0B0D11;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#FFFFFF;font-weight:bold;font-size:16px;text-align:center;line-height:32px;'>M</div>"
                + "      <span style='font-size:18px;font-weight:700;color:#0B0D11;'>Meridian</span>"
                + "    </div>"
                + "    <h2 style='font-size:20px;font-weight:700;color:#15803D;margin:0 0 12px 0;'>Welcome! Your account is approved</h2>"
                + "    <p style='font-size:14px;color:#475569;line-height:1.6;margin:0 0 16px 0;'>Hello <strong>" + escape(fullName) + "</strong>,</p>"
                + "    <p style='font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px 0;'>The Meridian administration has approved your account for <strong>" + escape(email) + "</strong>. You now have full access to your company workspace.</p>"
                + "    <div style='text-align:center;margin:32px 0;'>"
                + "      <a href='" + loginUrl + "' style='display:inline-block;background:#0B0D11;color:#FFFFFF;font-weight:600;font-size:14px;padding:12px 28px;text-decoration:none;border-radius:6px;'>Sign in to Meridian &rarr;</a>"
                + "    </div>"
                + "  </div>"
                + "</body></html>";
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}

