<#ftl output_format="plainText">
Welcome to the Golden Hills Privilege Club<#if firstName?has_content>, ${firstName}</#if>.

Your Gold Membership is now active.
Membership ID: ${membershipId}
<#if validUntil?has_content>Valid until: ${validUntil}
</#if>
Set your password once and you will go straight to your membership card:
${link}

This link works once and expires in ${linkExpirationHours} hours. If it has expired, ask the resort to send a new one.
Golden Hills Resort will never ask for your password by email or phone. If you did not join the Privilege Club, ignore this email.
