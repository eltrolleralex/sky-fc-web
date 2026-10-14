export default function handler(req, res) {
  res.setHeader("Cache-Control","no-store");
  if (req.method !== "GET") return res.status(405).json({error:"method_not_allowed"});
  const pos = v => Number.isInteger(Number(v)) && Number(v)>0;
  const email = !!(process.env.BREVO_API_KEY && pos(process.env.BREVO_LIST_ID) &&
    pos(process.env.BREVO_DOI_TEMPLATE_ID) && process.env.CLUB_PRIVACY_CONTACT_EMAIL);
  const channel = String(process.env.WHATSAPP_CHANNEL_URL || "").trim();
  const whatsappUrl = /^https:\/\/(www\.)?whatsapp\.com\/channel\/[a-z0-9]+\/?$/i.test(channel) ? channel : null;
  return res.status(200).json({email, whatsappUrl, pushAppId:null});
}
