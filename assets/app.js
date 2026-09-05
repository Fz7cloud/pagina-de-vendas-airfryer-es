const CONFIG = window.SITE_CONFIG;

if (!CONFIG) throw new Error("Falta la configuración del sitio.");

const euro = value => new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: Number.isInteger(value) ? 0 : 2
}).format(value);

const promoEnd = new Date(CONFIG.promotion.end).getTime();
let promotionActive = Boolean(CONFIG.promotion.enabled && Number.isFinite(promoEnd) && Date.now() < promoEnd);
let marketingConsent = localStorage.getItem("airfryer-cookie-consent") === "marketing";

function currentPrice(type) {
  const offer = CONFIG.offers[type];
  return promotionActive ? offer.launchPrice : offer.standardPrice;
}

function appendTracking(url) {
  const destination = new URL(url, window.location.href);
  const incoming = new URLSearchParams(window.location.search);
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "sck", "src"].forEach(key => {
    const value = incoming.get(key);
    if (value && !destination.searchParams.has(key)) destination.searchParams.set(key, value.slice(0, 250));
  });
  return destination.toString();
}

function applyPriceState() {
  ["essential", "premium"].forEach(type => {
    const offer = CONFIG.offers[type];
    document.querySelectorAll(`[data-current-price="${type}"]`).forEach(node => { node.textContent = euro(currentPrice(type)); });
    document.querySelectorAll(`[data-standard-price="${type}"]`).forEach(node => {
      node.textContent = euro(offer.standardPrice);
      const wrapper = node.closest("p,small");
      if (wrapper) wrapper.hidden = !promotionActive;
    });
    document.querySelectorAll(`[data-cta-price="${type}"]`).forEach(node => { node.textContent = euro(currentPrice(type)); });
    document.querySelectorAll(`[data-saving="${type}"]`).forEach(node => { node.textContent = euro(offer.standardPrice - offer.launchPrice); });
    const card = document.querySelector(`[data-offer-card="${type}"]`);
    const label = card?.querySelector(".price-box > span");
    if (label) label.textContent = promotionActive ? "PRECIO DE LANZAMIENTO" : "PRECIO ACTUAL";
  });

  const difference = currentPrice("premium") - currentPrice("essential");
  document.querySelectorAll("[data-premium-difference]").forEach(node => { node.textContent = euro(difference); });
}

function formatDeadline() {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Madrid"
  }).format(new Date(CONFIG.promotion.end));
}

function expirePromotion() {
  if (!promotionActive) return;
  promotionActive = false;
  applyPriceState();
  const bar = document.getElementById("launchBar");
  bar.classList.add("expired");
  document.getElementById("promotionLabel").textContent = "PRECIOS REGULARES";
  document.getElementById("promotionTimer").hidden = true;
  document.getElementById("finalDeadline").textContent = "La oferta de vuelta a la rutina ha finalizado.";
}

function updateCountdown() {
  if (!promotionActive) return;
  const remaining = promoEnd - Date.now();
  if (remaining <= 0) {
    expirePromotion();
    return;
  }
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  document.getElementById("countdown").textContent = `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function initializePromotion() {
  const label = document.getElementById("promotionLabel");
  if (promotionActive) {
    label.textContent = `${CONFIG.promotion.label} · HASTA ${formatDeadline().toLocaleUpperCase("es-ES")}`;
    document.getElementById("finalDeadline").textContent = `Precio de lanzamiento disponible hasta el ${formatDeadline()}, 23:59 (hora peninsular española).`;
    updateCountdown();
    window.setInterval(updateCountdown, 1000);
  } else {
    document.getElementById("launchBar").classList.add("expired");
    label.textContent = "PRECIOS REGULARES";
    document.getElementById("promotionTimer").hidden = true;
    document.getElementById("finalDeadline").textContent = "La oferta de vuelta a la rutina ha finalizado.";
  }
  applyPriceState();
}

function trackCheckout(type) {
  const offer = CONFIG.offers[type];
  if (!marketingConsent || typeof window.fbq !== "function") return;
  window.fbq("track", "InitiateCheckout", {
    value: currentPrice(type),
    currency: "EUR",
    content_ids: [offer.contentId],
    content_name: offer.contentName,
    content_type: "product"
  });
}

document.querySelectorAll(".checkout-link").forEach(link => {
  const type = link.dataset.offer;
  const offer = CONFIG.offers[type];
  if (!offer || link.dataset.checkoutBound === "true") return;
  link.href = offer.checkoutUrl;
  link.dataset.checkoutBound = "true";
  link.addEventListener("click", event => {
    event.currentTarget.href = appendTracking(offer.checkoutUrl);
    trackCheckout(type);
  });
});

function loadScriptOnce(id, src, attributes = {}) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.src = src;
  script.async = true;
  script.defer = true;
  Object.entries(attributes).forEach(([name, value]) => script.setAttribute(name, value));
  document.head.appendChild(script);
}

function loadMetaPixel() {
  const pixelId = CONFIG.tracking.metaPixelId;
  if (!pixelId || window.fbq) return;
  (function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
  window.fbq("track", "ViewContent", {
    content_ids: [CONFIG.offers.essential.contentId],
    content_name: CONFIG.offers.essential.contentName,
    content_type: "product",
    value: currentPrice("essential"),
    currency: "EUR"
  });
}

function loadUtmify() {
  window.pixelId = CONFIG.tracking.utmifyPixelId;
  loadScriptOnce("utmify-utms", CONFIG.tracking.utmifyUtmScript, {
    "data-utmify-prevent-xcod-sck": "",
    "data-utmify-prevent-subids": ""
  });
  loadScriptOnce("utmify-pixel", CONFIG.tracking.utmifyPixelScript);
}

function loadMarketing() {
  loadMetaPixel();
  loadUtmify();
}

const cookieBanner = document.getElementById("cookieBanner");
const cookieDetails = document.getElementById("cookieDetails");
const storedConsent = localStorage.getItem("airfryer-cookie-consent");
if (!storedConsent) cookieBanner.hidden = false;
if (marketingConsent) loadMarketing();

cookieBanner.querySelectorAll("[data-consent]").forEach(button => button.addEventListener("click", () => {
  const choice = button.dataset.consent;
  localStorage.setItem("airfryer-cookie-consent", choice);
  marketingConsent = choice === "marketing";
  cookieBanner.hidden = true;
  if (marketingConsent) loadMarketing();
}));

cookieBanner.querySelector("[data-configure]").addEventListener("click", event => {
  const expanded = event.currentTarget.getAttribute("aria-expanded") === "true";
  event.currentTarget.setAttribute("aria-expanded", String(!expanded));
  cookieDetails.hidden = expanded;
});

const previewModal = document.getElementById("previewModal");
document.querySelectorAll("[data-preview]").forEach(button => button.addEventListener("click", () => {
  const image = previewModal.querySelector("img");
  image.src = button.dataset.preview;
  image.alt = button.querySelector("img").alt;
  previewModal.showModal();
  document.body.classList.add("modal-open");
}));

function closePreview() {
  previewModal.close();
  document.body.classList.remove("modal-open");
}

previewModal.querySelector(".preview-modal__close").addEventListener("click", closePreview);
previewModal.addEventListener("click", event => { if (event.target === previewModal) closePreview(); });
previewModal.addEventListener("close", () => document.body.classList.remove("modal-open"));

const reveals = document.querySelectorAll(".reveal");
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
  reveals.forEach(node => node.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  }), { threshold: 0.08, rootMargin: "0px 0px -20px" });
  reveals.forEach(node => revealObserver.observe(node));
}

const mobileBuy = document.getElementById("mobileBuy");
const offers = document.getElementById("ofertas");
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => mobileBuy.classList.toggle("is-hidden", entry.isIntersecting), { threshold: 0.08 }).observe(offers);
}

const behind = document.getElementById("responsable");
if (CONFIG.brand.name && CONFIG.brand.description && CONFIG.brand.supportEmail) {
  behind.querySelector("[data-brand-name]").textContent = CONFIG.brand.name;
  behind.querySelector("[data-brand-description]").textContent = CONFIG.brand.description;
  const email = behind.querySelector("[data-support-email]");
  email.textContent = CONFIG.brand.supportEmail;
  email.href = `mailto:${CONFIG.brand.supportEmail}`;
  behind.hidden = false;
}

const schema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: CONFIG.offers.essential.contentName,
  description: "Recetario digital con 200 recetas organizadas en 20 categorías.",
  image: new URL("assets/cover.webp", CONFIG.siteUrl).href,
  brand: { "@type": "Brand", name: CONFIG.brand.name },
  offers: ["essential", "premium"].map(type => ({
    "@type": "Offer",
    name: CONFIG.offers[type].contentName,
    priceCurrency: "EUR",
    price: currentPrice(type),
    availability: "https://schema.org/InStock",
    url: CONFIG.offers[type].checkoutUrl,
    ...(promotionActive ? { priceValidUntil: CONFIG.promotion.end.slice(0, 10) } : {})
  }))
};

const schemaScript = document.createElement("script");
schemaScript.type = "application/ld+json";
schemaScript.textContent = JSON.stringify(schema);
document.head.appendChild(schemaScript);

initializePromotion();
