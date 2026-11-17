<#ftl output_format="HTML">
<#-- Golden Hills member welcome email (D-121). Values are escaped automatically. No password is ever in this email. -->
<html>
<body style="margin:0;padding:0;background:#f8f6f0;font-family:Georgia,'Times New Roman',serif;color:#16201a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6f0;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e6e1d6;border-radius:14px;overflow:hidden;">
      <tr><td style="background:#16201a;padding:22px 28px;color:#e9d29a;font-size:13px;letter-spacing:3px;text-transform:uppercase;">Golden Hills Resort &middot; Privilege Club</td></tr>
      <tr><td style="padding:28px;">
        <p style="font-size:22px;margin:0 0 12px;">Welcome<#if firstName?has_content>, ${firstName}</#if></p>
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;margin:0 0 20px;color:#32433b;">
          Your Gold Membership is now active. Set your password once and you will go straight to your membership card and privileges.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#e9d29a,#c9a45c);background-color:#d8b86e;border-radius:10px;margin:0 0 22px;">
          <tr><td style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;color:#3a2a10;">
            <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;">Membership ID</div>
            <div style="font-family:'Courier New',monospace;font-size:20px;font-weight:bold;letter-spacing:1px;">${membershipId}</div>
            <#if validUntil?has_content><div style="font-size:12px;margin-top:4px;">Gold &middot; valid until ${validUntil}</div></#if>
          </td></tr>
        </table>
        <p style="margin:0 0 22px;">
          <a href="${link}" style="display:inline-block;background:#85642d;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;padding:13px 24px;border-radius:9px;">Set your password</a>
        </p>
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#5b6962;margin:0 0 8px;">
          This link works once and expires in ${linkExpirationHours} hours. If it has expired, ask the resort to send a new one.
        </p>
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#5b6962;margin:0;">
          Golden Hills Resort will never ask for your password by email or phone. If you did not join the Privilege Club, ignore this email.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
