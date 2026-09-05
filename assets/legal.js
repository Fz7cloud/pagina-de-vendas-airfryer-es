const CONFIG = window.SITE_CONFIG;
const page = document.body.dataset.legalPage;
const title = document.querySelector("[data-legal-title]");
const content = document.querySelector("[data-legal-content]");

const pageTitles = {
  privacy: "Política de privacidad",
  cookies: "Política de cookies",
  terms: "Términos de compra y uso",
  refund: "Política de reembolso"
};

const missing = [];
if (!CONFIG.brand.responsibleName) missing.push("nombre legal del responsable");
if (!CONFIG.brand.supportEmail) missing.push("correo electrónico de soporte y privacidad");
if (!CONFIG.legal.fiscalIdentity) missing.push("identificación fiscal");
if (!CONFIG.legal.address) missing.push("domicilio o dirección legal");
if (!CONFIG.legal.retentionPeriods) missing.push("plazos de conservación de datos");
if (!CONFIG.legal.internationalTransfers) missing.push("información sobre transferencias internacionales");

title.textContent = pageTitles[page] || "Información legal";
document.title = `${title.textContent} | ${CONFIG.brand.name}`;

if (missing.length) {
  content.innerHTML = `
    <div class="legal-warning">
      <strong>Documento pendiente de completar</strong>
      <p>Esta página no debe publicarse como política definitiva hasta incorporar datos reales del responsable.</p>
    </div>
    <h2>Datos necesarios</h2>
    <ul>${missing.map(item => `<li>${item}</li>`).join("")}</ul>
  `;
} else {
  const identity = `${CONFIG.brand.responsibleName}, ${CONFIG.legal.fiscalIdentity}, ${CONFIG.legal.address}`;
  const contact = `<a href="mailto:${CONFIG.brand.supportEmail}">${CONFIG.brand.supportEmail}</a>`;
  const pages = {
    privacy: `
      <h2>Responsable del tratamiento</h2><p>${identity}. Contacto: ${contact}.</p>
      <h2>Finalidades y base jurídica</h2><p>Gestionamos consultas, la relación derivada de la compra y, solo con consentimiento, la medición de campañas. La base jurídica aplicable es la ejecución de la compra, el cumplimiento de obligaciones legales y el consentimiento cuando corresponda.</p>
      <h2>Herramientas y destinatarios</h2><p>Hotmart gestiona el pago y el acceso. Meta y UTMify pueden recibir datos de medición únicamente cuando se acepta esa finalidad.</p>
      <h2>Conservación y transferencias</h2><p>${CONFIG.legal.retentionPeriods}</p><p>${CONFIG.legal.internationalTransfers}</p>
      <h2>Derechos</h2><p>Puedes solicitar acceso, rectificación, supresión, oposición, limitación o portabilidad a través de ${contact}, cuando resulte aplicable.</p>
    `,
    cookies: `
      <h2>Qué utilizamos</h2><p>El sitio guarda una preferencia esencial para recordar la elección de cookies. Las tecnologías de medición de Meta y UTMify no se cargan antes de aceptar la medición.</p>
      <h2>Cómo cambiar tu elección</h2><p>Puedes borrar el almacenamiento del sitio desde la configuración de tu navegador para volver a elegir. Contacto: ${contact}.</p>
      <h2>Conservación y transferencias</h2><p>${CONFIG.legal.retentionPeriods}</p><p>${CONFIG.legal.internationalTransfers}</p>
    `,
    terms: `
      <h2>Responsable</h2><p>${identity}. Contacto: ${contact}.</p>
      <h2>Producto digital</h2><p>La compra da acceso a un recetario digital. No se envía un artículo físico ni se contrata una suscripción mensual.</p>
      <h2>Pago y acceso</h2><p>Hotmart procesa el pago y envía las instrucciones de acceso al correo utilizado durante la compra. Las condiciones finales son las mostradas en el checkout.</p>
      <h2>Uso responsable</h2><p>El contenido es culinario e informativo. Los tiempos pueden variar según la freidora y los alimentos; comprueba siempre la cocción y los alérgenos.</p>
    `,
    refund: `
      <h2>Periodo aplicable</h2><p>La solicitud de reembolso debe realizarse dentro del periodo de garantía indicado en el checkout de Hotmart.</p>
      <h2>Cómo solicitarlo</h2><p>Utiliza los canales facilitados por Hotmart o escribe a ${contact}. La tramitación está sujeta a las condiciones mostradas durante la compra.</p>
    `
  };
  content.innerHTML = pages[page] || "";
  document.querySelector('meta[name="robots"]').setAttribute("content", "index,follow");
}
