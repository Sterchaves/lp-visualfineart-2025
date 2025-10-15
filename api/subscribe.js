// /api/subscribe.js FORM
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    const {
      EMAIL,
      FNAME,
      PHONE,
      COMPANY,
      PROJECT,
      CITY,
      BUDGET,
      TIMELINE,
      NOTES,
      TAGS = ["Interior Design"],
    } = req.body || {};

    if (!EMAIL) {
      return res.status(400).json({ ok: false, message: "Email is required." });
    }

    // Mailchimp envs (configure na Vercel → Settings → Environment Variables)
    const API_KEY = process.env.MAILCHIMP_API_KEY;        // ex: xxxxxxxx-us13
    const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID; // ex: 6d38acfe0c
    const DC = process.env.MAILCHIMP_SERVER_PREFIX;        // ex: us13

    if (!API_KEY || !AUDIENCE_ID || !DC) {
      return res.status(500).json({ ok: false, message: "Server not configured." });
    }

    // status: "pending" (double opt-in) ou "subscribed" (single opt-in)
    const status = process.env.MAILCHIMP_DOUBLE_OPT_IN === "true" ? "pending" : "subscribed";

    const payload = {
      email_address: EMAIL,
      status,
      merge_fields: {
        FNAME: FNAME || "",
        PHONE: PHONE || "",
        COMPANY: COMPANY || "",
        PROJECT: PROJECT || "",
        CITY: CITY || "",
        BUDGET: BUDGET || "",
        TIMELINE: TIMELINE || "",
        NOTES: NOTES || "",
      },
      tags: Array.isArray(TAGS) ? TAGS : [TAGS],
    };

    const resp = await fetch(`https://${DC}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Basic auth: qualquer user + API key
        Authorization: `Basic ${Buffer.from(`any:${API_KEY}`).toString("base64")}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    // Tratativas comuns do Mailchimp
    if (resp.status === 200 || resp.status === 201) {
      return res.status(200).json({
        ok: true,
        message: status === "pending"
          ? "Check your inbox to confirm your subscription."
          : "Request received! We’ll contact you shortly.",
      });
    }

    // Já inscrito
    if (data?.title === "Member Exists") {
      return res.status(200).json({
        ok: true,
        message: "You’re already on our list. We’ll reach out soon!",
      });
    }

    // Erro genérico vindo do Mailchimp
    return res.status(400).json({
      ok: false,
      message: data?.detail || "Unable to subscribe right now.",
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: "Unexpected server error." });
  }
}
