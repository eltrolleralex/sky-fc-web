(function () {
  "use strict";
  const byId = (id) => document.getElementById(id);
  const label = (id, value) => { const e = byId(id); if (e) e.textContent = value; };
  const emailForm = byId("fan-email-form");
  const pushBtn = byId("fan-push-button");
  const waLink = byId("fan-wa-link");
  let emailReady = false, pushAppId = null, pushSDK = null, pushLoading = false;
  const show = (id, message, cls) => {
    const e = byId(id); if (!e) return;
    e.textContent = message;
    e.className = "fan-feedback" + (cls ? " " + cls : "");
  };
  fetch("/api/club-config", {credentials:"same-origin", cache:"no-store"})
    .then((r) => { if (!r.ok) throw Error("Sin configuración"); return r.json(); })
    .then((cfg) => {
      if (cfg.email) {
        emailReady = true;
        byId("fan-email").disabled = false;
        byId("fan-email-consent").disabled = false;
        const send = byId("fan-email-send");
        send.disabled = false; send.textContent = "Suscribirme por correo";
        label("fan-email-state","Disponible · requiere confirmación");
        show("fan-email-msg","Te enviaremos un correo para confirmar la suscripción.");
      }
      if (cfg.whatsappUrl && /^https:\/\/(www\.)?whatsapp\.com\/channel\/[a-z0-9]+/i.test(cfg.whatsappUrl)) {
        waLink.href = cfg.whatsappUrl;
        waLink.target = "_blank";
        waLink.removeAttribute("aria-disabled");
        waLink.removeAttribute("tabindex");
        waLink.textContent = "Seguir canal de WhatsApp ↗";
        label("fan-wa-state","Canal disponible");
        show("fan-wa-msg","Abre WhatsApp y pulsa «Seguir». Activa sus avisos desde la aplicación.");
      }
      if (cfg.pushAppId && /^[a-f0-9-]{32,36}$/i.test(cfg.pushAppId)) {
        pushAppId = cfg.pushAppId;
        label("fan-push-state","Disponible");
        pushBtn.disabled = false;
        pushBtn.textContent = "Activar avisos";
        show("fan-push-msg","Solo solicitaremos permisos cuando pulses el botón.");
      }
    })
    .catch(() => {
      show("fan-email-msg","Las suscripciones aún no están disponibles.");
      show("fan-wa-msg","El canal de WhatsApp todavía no está configurado.");
      show("fan-push-msg","Las notificaciones push todavía no están configuradas.");
    });
  emailForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!emailReady || !emailForm.reportValidity() || !byId("fan-email-consent").checked) return;
    const send = byId("fan-email-send");
    send.disabled = true; send.textContent = "Enviando confirmación…";
    try {
      const res = await fetch("/api/club-subscribe", {
        method:"POST", credentials:"same-origin", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          email:byId("fan-email").value.trim(),
          consent:byId("fan-email-consent").checked,
          website:emailForm.elements.namedItem("website").value
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw Error(body.message || "No se pudo iniciar la suscripción.");
      show("fan-email-msg","Revisa tu correo y confirma desde el enlace recibido. Hasta entonces no estás suscrito.","success");
      emailForm.reset();
    } catch (err) {
      show("fan-email-msg",err.message || "Ha ocurrido un error. Prueba más tarde.","error");
    } finally {
      send.disabled = !emailReady; send.textContent = "Suscribirme por correo";
    }
  });
  function loadOneSignal() {
    if (pushSDK) return Promise.resolve(pushSDK);
    if (pushLoading) return Promise.reject(Error("La activación está en curso."));
    pushLoading = true;
    return new Promise((resolve,reject) => {
      const script=document.createElement("script");
      script.src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.async=true;
      script.onerror=()=>reject(Error("No se puede cargar el servicio de avisos."));
      window.OneSignalDeferred=window.OneSignalDeferred||[];
      window.OneSignalDeferred.push(async (OneSignal)=>{
        try {
          await OneSignal.init({
            appId:pushAppId,
            serviceWorkerPath:"/OneSignalSDKWorker.js",
            serviceWorkerParam:{scope:"/"}
          });
          pushSDK=OneSignal;
          resolve(OneSignal);
        }catch(e){reject(e)}
      });
      document.head.appendChild(script);
    }).finally(()=>{pushLoading=false});
  }
  pushBtn?.addEventListener("click",async ()=>{
    if(!pushAppId) return;
    pushBtn.disabled=true;
    try {
      const OneSignal=await loadOneSignal();
      if(!OneSignal.Notifications.isPushSupported()){
        show("fan-push-msg","Este navegador o dispositivo no admite las notificaciones web.","error");return;
      }
      if(OneSignal.User.PushSubscription.optedIn){
        await OneSignal.User.PushSubscription.optOut();
        pushBtn.textContent="Activar avisos";
        label("fan-push-state","Avisos desactivados");
        show("fan-push-msg","Has dejado de recibir notificaciones en este navegador.","success");
      }else{
        await OneSignal.User.PushSubscription.optIn();
        const active=Boolean(OneSignal.User.PushSubscription.optedIn);
        pushBtn.textContent=active?"Desactivar avisos":"Activar avisos";
        label("fan-push-state",active?"Avisos activados":"Permiso pendiente");
        show("fan-push-msg",active?"Avisos activados para este navegador.":"Debes permitir las notificaciones en tu navegador.",active?"success":"error");
      }
    } catch(e) {
      show("fan-push-msg","No se pudieron configurar las notificaciones. Comprueba los permisos del navegador.","error");
    } finally {pushBtn.disabled=false;}
  });
})();