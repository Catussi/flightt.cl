type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/** Sends mail through Resend when configured; logs to console otherwise. */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "onboarding@resend.dev";

  if (!apiKey) {
    console.info("[email:dev]", {
      to: input.to,
      subject: input.subject,
      text: input.text ?? input.html.replace(/<[^>]+>/g, " "),
    });
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    console.error("[email] Resend error:", res.status, err);
    return false;
  }

  return true;
}

export function sellerEmail(): string | undefined {
  return process.env.SELLER_EMAIL?.trim() || undefined;
}
