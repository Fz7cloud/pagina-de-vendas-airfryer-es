/* Edit only this configuration block before launch. */
const OFFER = Object.freeze({
  promoEnd: "2026-09-06T23:59:59+02:00",
  essential: {
    launchPrice: 8.67,
    standardPrice: 15,
    checkoutUrl: "https://pay.hotmart.com/M107457113D?checkoutMode=10&bid=1788499033657",
    standardCheckoutUrl: "https://pay.hotmart.com/M107457113D?checkoutMode=10&bid=1788499033657",
    contentId: "airfryer-essential",
    contentName: "200 Recetas para Freidora de Aire"
  },
  premium: {
    launchPrice: 14.77,
    standardPrice: 25,
    checkoutUrl: "https://pay.hotmart.com/X107457358H?checkoutMode=10&bid=1788499107248",
    standardCheckoutUrl: "https://pay.hotmart.com/X107457358H?checkoutMode=10&bid=1788499107248",
    contentId: "airfryer-premium",
    contentName: "Pack Premium Freidora de Aire"
  },
  metaPixelId: "",
  legal: { privacy: "", cookies: "", terms: "", refund: "" }
});

const euro = value => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: Number.isInteger(value) ? 0 : 2 }).format(value);
const promoEnd = new Date(OFFER.promoEnd).getTime();
let promotionActive = Date.now() < promoEnd;
let marketingConsent = localStorage.getItem("airfryer-cookie-consent") === "marketing";

function selectedUrl(type) {
  const offer = OFFER[type];
  return promotionActive ? offer.checkoutUrl : offer.standardCheckoutUrl;
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

function openCheckout(type, event) {
  const url = selectedUrl(type);
  if (!url) {
    event.preventDefault();
    document.getElementById("checkoutNotice").showModal();
    document.body.classList.add("modal-open");
    return;
  }
  const offer = OFFER[type];
  const value = promotionActive ? offer.launchPrice : offer.standardPrice;
  if (marketingConsent && typeof window.fbq === "function") {
    window.fbq("track", "InitiateCheckout", { value, currency: "EUR", content_ids: [offer.contentId], content_name: offer.contentName, content_type: "product" });
  }
  event.currentTarget.href = appendTracking(url);
}

document.querySelectorAll(".checkout-link").forEach(link => link.addEventListener("click", event => openCheckout(link.dataset.offer, event)));

function expirePromotion() {
  if (!promotionActive) return;
  promotionActive = false;
  const bar = document.getElementById("launchBar");
  bar.classList.add("expired");
  bar.innerHTML = "<strong>PRECIO DE LANZAMIENTO FINALIZADO</strong>";
  ["essential", "premium"].forEach(type => {
    const offer = OFFER[type];
    document.querySelectorAll(`[data-current-price="${type}"]`).forEach(node => node.textContent = euro(offer.standardPrice));
    document.querySelectorAll(`.checkout-link[data-offer="${type}"] span`).forEach(node => node.textContent = euro(offer.standardPrice));
    document.querySelectorAll(`[data-standard-price="${type}"]`).forEach(node => node.closest("p").hidden = true);
    const card = document.querySelector(`[data-offer-card="${type}"]`);
    if (card) {
      const label = card.querySelector(".price-box > span");
      if (label) label.textContent = "PRECIO ACTUAL";
    }
  });
  document.querySelectorAll(".final-cta__deadline").forEach(node => node.textContent = "La promoción de lanzamiento ha finalizado.");
}

function updateCountdown() {
  const remaining = promoEnd - Date.now();
  if (remaining <= 0) {
    expirePromotion();
    return;
  }
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  document.getElementById("countdown").textContent = `${days}d ${String(hours).padStart(2,"0")}h ${String(minutes).padStart(2,"0")}m ${String(seconds).padStart(2,"0")}s`;
}
updateCountdown();
setInterval(updateCountdown, 1000);

const previewModal = document.getElementById("previewModal");
document.querySelectorAll("[data-preview]").forEach(button => button.addEventListener("click", () => {
  const image = previewModal.querySelector("img");
  image.src = button.dataset.preview;
  image.alt = button.querySelector("img").alt;
  previewModal.showModal();
  document.body.classList.add("modal-open");
}));
function closeDialog(dialog) { dialog.close(); document.body.classList.remove("modal-open"); }
previewModal.querySelector(".preview-modal__close").addEventListener("click", () => closeDialog(previewModal));
previewModal.addEventListener("click", event => { if (event.target === previewModal) closeDialog(previewModal); });
const checkoutNotice = document.getElementById("checkoutNotice");
checkoutNotice.querySelectorAll(".notice-modal__close,[data-close-notice]").forEach(button => button.addEventListener("click", () => closeDialog(checkoutNotice)));
checkoutNotice.addEventListener("click", event => { if (event.target === checkoutNotice) closeDialog(checkoutNotice); });

const reveals = document.querySelectorAll(".reveal");
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
  reveals.forEach(node => node.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealObserver.unobserve(entry.target); }
  }), { threshold: .12, rootMargin: "0px 0px -40px" });
  reveals.forEach(node => revealObserver.observe(node));
}

const mobileBuy = document.getElementById("mobileBuy");
const offers = document.getElementById("ofertas");
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => mobileBuy.classList.toggle("is-hidden", entry.isIntersecting), { threshold: .08 }).observe(offers);
}

function loadMetaPixel() {
  if (!OFFER.metaPixelId || window.fbq) return;
  (function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
  window.fbq("init", OFFER.metaPixelId);
  window.fbq("track", "PageView");
  window.fbq("track", "ViewContent", { content_ids: [OFFER.essential.contentId], content_name: OFFER.essential.contentName, content_type: "product", value: OFFER.essential.launchPrice, currency: "EUR" });
}

const cookieBanner = document.getElementById("cookieBanner");
const storedConsent = localStorage.getItem("airfryer-cookie-consent");
if (!storedConsent) cookieBanner.hidden = false;
if (marketingConsent) loadMetaPixel();
cookieBanner.querySelectorAll("[data-consent]").forEach(button => button.addEventListener("click", () => {
  const choice = button.dataset.consent;
  localStorage.setItem("airfryer-cookie-consent", choice);
  marketingConsent = choice === "marketing";
  cookieBanner.hidden = true;
  if (marketingConsent) loadMetaPixel();
}));

document.querySelectorAll("[data-legal]").forEach(link => {
  const url = OFFER.legal[link.dataset.legal];
  if (url) link.href = url;
  else link.addEventListener("click", event => event.preventDefault());
});

const schema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "200 Recetas para Freidora de Aire",
  description: "Recetario digital con 200 recetas organizadas en 20 categorías.",
  image: new URL("assets/cover.webp", window.location.href).href
};
const configuredOffers = ["essential", "premium"].filter(type => selectedUrl(type)).map(type => ({
  "@type": "Offer",
  priceCurrency: "EUR",
  price: promotionActive ? OFFER[type].launchPrice : OFFER[type].standardPrice,
  url: appendTracking(selectedUrl(type))
}));
if (configuredOffers.length) schema.offers = configuredOffers;
const schemaScript = document.createElement("script");
schemaScript.type = "application/ld+json";
schemaScript.textContent = JSON.stringify(schema);
document.head.appendChild(schemaScript);
