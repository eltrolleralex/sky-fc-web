export default async function handler(req,res) {
  res.setHeader("Cache-Control","no-store");
  if (req.method!=="POST") return res.status(405).json({message:"Método no permitido."});
  const key=process.env.BREVO_API_KEY;
  const listId=Number(process.env.BREVO_LIST_ID);
  const templateId=Number(process.env.BREVO_DOI_TEMPLATE_ID);
  const valid=n=>Number.isInteger(n) && n>0;
  if (!key || !valid(listId) || !valid(templateId) || !process.env.CLUB_PRIVACY_CONTACT_EMAIL)
    return res.status(503).json({message:"La suscripción por correo no está disponible."});

  let data=req.body || {};
  try { if (typeof data==="string") data=JSON.parse(data); }
  catch { return res.status(400).json({message:"Datos no válidos."}); }
  if (!data || typeof data!=="object" || Array.isArray(data))
    return res.status(400).json({message:"Datos no válidos."});
  // Campo invisible: descartar bots sin registrar el correo en ningún servicio.
  if (data.website) return res.status(200).json({message:"Revisa tu correo para confirmar la suscripción."});
  const email=String(data.email || "").trim().toLowerCase();
  if (data.consent!==true || email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({message:"Introduce un correo válido y acepta la política de privacidad."});

  try {
    const response=await fetch("https://api.brevo.com/v3/contacts/doubleOptinConfirmation",{
      method:"POST",
      headers:{"accept":"application/json","content-type":"application/json","api-key":key},
      body:JSON.stringify({
        email, includeListIds:[listId], templateId,
        redirectionUrl:"https://sky-fc-web.vercel.app/confirmada.html"
      }),
      signal:AbortSignal.timeout(12000)
    });
    if (!response.ok) return res.status(502).json({message:"No se pudo iniciar la suscripción. Inténtalo de nuevo."});
    return res.status(200).json({message:"Te hemos enviado un correo para confirmar tu suscripción."});
  } catch {
    return res.status(502).json({message:"El servicio de correo no está disponible ahora."});
  }
}
