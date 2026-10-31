import "./style.css";
import { eras } from "./history.js";

const arrow =
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const arch =
  '<svg class="brand-mark" viewBox="0 0 48 56" fill="none" aria-hidden="true"><path d="M7 48V23a17 17 0 0 1 34 0v25M14 48V24a10 10 0 0 1 20 0v24M21 48V25a3 3 0 0 1 6 0v23M2 49h44" stroke="currentColor" stroke-width="1.6"/><path d="M24 1v5M2 18l5 2M46 18l-5 2" stroke="currentColor"/></svg>';
const brand = `<a class="brand" href="#home" aria-label="الأفق الزمني، الرئيسية">${arch}<span><strong>الأفق الزمني</strong><small>TEMPORAL HORIZON</small></span></a>`;

document.querySelector("#app").innerHTML = `
  <header class="site-header" id="home">
    ${brand}
    <nav class="desktop-nav" aria-label="التنقل الرئيسي">
      <a class="current" href="#home" aria-current="page">الرئيسية</a>
      <a href="#eras">عبر العصور</a>
      <a href="#story">حكاية تستحق أن تُروى</a>
      <a href="#about">عن الأفق</a>
    </nav>
    <a class="header-cta" href="#timeline">اكتشف التاريخ ${arrow}</a>
    <button class="menu-toggle" aria-label="فتح القائمة" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span></button>
    <nav class="mobile-nav" id="mobile-nav" aria-label="التنقل على الهاتف" hidden>
      <a href="#home">الرئيسية</a><a href="#eras">عبر العصور</a><a href="#story">حكاية تستحق أن تُروى</a><a href="#about">عن الأفق</a>
    </nav>
  </header>
  <main>
    <section class="hero" aria-labelledby="hero-title">
      <img class="hero-image" src="https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=2400&q=90" alt="أهرامات مصر، أثر باقٍ يروي آلاف السنين من التاريخ" fetchpriority="high" />
      <div class="hero-shade"></div>
      <div class="hero-content">
        <p class="eyebrow light"><span></span> الماضي ليس بعيداً كما تظن</p>
        <h1 id="hero-title">للماضي حكاية.<br>ولك أن <em>تكتشفها.</em></h1>
        <p class="hero-description">آلاف السنين من الحكايات، في رحلة واحدة.<br>اعبر العصور، تعرّف على الحضارات، واكتشف ما صنع عالمنا.</p>
        <div class="hero-actions"><a class="button button-gold" href="#beginnings">ابدأ الرحلة ${arrow}</a><a class="quiet-link" href="#eras">استعرض العصور <span>↙</span></a></div>
        <div class="hero-facts"><span><b>١٢ ألف</b>عام من التحولات</span><i></i><span><b>٦ عصور</b>ونوافذ لاكتشافها</span><i></i><span><b>حكاية واحدة</b>تجمعنا… الإنسان</span></div>
      </div>
      <div class="hero-caption"><span class="coordinate">29°58′45″N 31°08′03″E</span><span>الجيزة، مصر <i>—</i> حيث يتحدى الأثرُ الزمن</span></div>
      <a class="hero-scroll" href="#timeline"><span>مرّر لتستكشف</span><span class="scroll-line"></span></a>
      <span class="hero-edition">رحلة عبر ذاكرة العالم <span> / </span> ٠١</span>
    </section>
    <section class="timeline" id="timeline" aria-label="التصفح السريع عبر العصور">
      <div class="timeline-heading"><span class="eyebrow">اختر نقطة البداية</span><h2>إلى أي عصر نأخذك؟</h2></div>
      <nav class="timeline-track" aria-label="الخط الزمني">${eras.map((era) => `<a href="#${era.id}" data-era-link="${era.id}"><span class="timeline-date">${era.shortDate}</span><span class="timeline-dot"></span><span class="timeline-name">${era.name}</span></a>`).join("")}</nav>
      <span class="timeline-hint">اسحب لاستكشاف العصور ←</span>
    </section>
    <section class="eras-section section-shell" id="eras" aria-labelledby="eras-title">
      <div class="section-heading"><div><p class="eyebrow"><span></span> فصول من حكايتنا</p><h2 id="eras-title">عصور مضت.<br><span>وأثرٌ لا يغيب.</span></h2></div><div class="section-intro"><p>التاريخ ليس تواريخ نحفظها، بل حكايات نفهم بها أنفسنا.<br>اكتشف أهم المحطات التي رسمت ملامح عالمنا.</p><span class="small-note">من البدايات الأولى، إلى اللحظة التي نعيشها</span></div></div>
      <div class="era-grid">${eras
        .map(
          (
            era,
          ) => `<article class="era-card" id="${era.id}" aria-labelledby="title-${era.id}">
        <button class="era-image-button" data-story="${era.id}" aria-label="اقرأ قصة ${era.name}"><img src="${era.image}" alt="${era.alt}" loading="lazy" style="object-position:${era.position}" /><span class="image-shade"></span><span class="era-period">${era.period}</span><span class="era-number">${era.number}</span><span class="image-explore">استكشف الحكاية ${arrow}</span></button>
        <div class="era-card-body"><p class="card-kicker">${era.name}<span> / </span>${era.tag}</p><h3 id="title-${era.id}">${era.title}</h3><p class="card-description">${era.summary}</p><button class="story-link" data-story="${era.id}">اقرأ القصة كاملة ${arrow}</button></div>
      </article>`,
        )
        .join("")}</div>
      <p class="historical-note"><span>ملاحظة على هامش الزمن</span> الحدود بين العصور تقريبية، وتختلف باختلاف المناطق والحضارات؛ فالتاريخ أوسع من تقسيم واحد.</p>
    </section>
    <section class="featured-story" id="story" aria-labelledby="story-title">
      <div class="feature-image"><img src="https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1400&q=85" alt="ضوء المساء يلامس أقواس الكولوسيوم في روما" loading="lazy" /><span class="image-footnote">روما، إيطاليا <span> / </span> ذاكرة من حجر</span></div>
      <div class="feature-content"><p class="eyebrow light"><span></span> تحت عدسة التاريخ</p><h2 id="story-title">الحجارة تصمت.<br><em>والحكايات لا.</em></h2><p>خلف كل قوسٍ يدٌ بنته، وخلف كل مدينةٍ أناسٌ حلموا بها. نقترب من العالم الكلاسيكي لنرى ما وراء الآثار: الأفكار، والحياة اليومية، والأثر الذي وصل إلينا.</p><button class="button button-outline" data-story="classical">اكتشف ما وراء الأثر ${arrow}</button><span class="feature-index">حكاية من العالم الكلاسيكي <span>٠٣ / ٠٦</span></span></div>
    </section>
    <section class="about-section section-shell" id="about" aria-labelledby="about-title">
      <div class="about-symbol">${arch}<span>ذاكرة الأمس، أفق الغد</span></div><div class="about-copy"><p class="eyebrow">لماذا الأفق الزمني؟</p><h2 id="about-title">نفهم الماضي،<br>لنرى الحاضر بوضوح أكبر.</h2><p>مساحة عربية لاكتشاف تاريخ الإنسان، بعيداً عن ازدحام التفاصيل. نقدّم ملخصات تمهيدية تصل بين العصور والحضارات، وتفتح أبواب الفضول والقراءة؛ لأن كل رحلة معرفة تبدأ بسؤال.</p><a class="text-link" href="#timeline">اختر عصراً، واتبع فضولك ${arrow}</a></div>
    </section>
  </main>
  <footer class="site-footer"><div class="footer-main"><div class="footer-brand">${brand}<p>نافذتك إلى الماضي.<br>ورحلتك لفهم ما نحن عليه اليوم.</p></div><div class="footer-links"><h3>اعبر العصور</h3><div>${eras
    .slice(0, 3)
    .map((era) => `<a href="#${era.id}">${era.name}</a>`)
    .join(
      "",
    )}</div></div><div class="footer-links"><h3>واصل الرحلة</h3><div>${eras
    .slice(3)
    .map((era) => `<a href="#${era.id}">${era.name}</a>`)
    .join(
      "",
    )}</div></div><div class="footer-links"><h3>اكتشف الأفق</h3><div><a href="#story">حكاية تستحق أن تُروى</a><a href="#about">عن الأفق الزمني</a><a href="#home">العودة إلى البداية ↑</a></div></div></div><div class="footer-bottom"><p>© ${new Date().getFullYear().toLocaleString("ar", { useGrouping: false })} الأفق الزمني</p><span>التاريخ حكاية مستمرة. كن جزءاً من اكتشافها.</span><span class="footer-english">THE PAST, REIMAGINED.</span></div></footer>
  <button class="rail-toggle" aria-expanded="false" aria-controls="era-rail" hidden>العصور <span aria-hidden="true">↟</span></button>
  <nav class="era-rail" id="era-rail" aria-label="موقعك في رحلة التاريخ" hidden>${eras.map((era) => `<a href="#${era.id}" data-era-link="${era.id}" aria-label="${era.name}"><span class="rail-label">${era.name}</span><span class="rail-dot"></span></a>`).join("")}</nav>
  <dialog class="story-dialog" aria-labelledby="dialog-title"><button class="dialog-close" aria-label="إغلاق القصة">×</button><div class="dialog-content"></div></dialog>
`;

const menuButton = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");
function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "فتح القائمة");
  mobileNav.hidden = true;
}
menuButton.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(expanded));
  menuButton.setAttribute(
    "aria-label",
    expanded ? "إغلاق القائمة" : "فتح القائمة",
  );
  mobileNav.hidden = !expanded;
});
mobileNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

const dialog = document.querySelector(".story-dialog");
let storyTrigger;
document.querySelectorAll("[data-story]").forEach((button) =>
  button.addEventListener("click", () => {
    const era = eras.find((item) => item.id === button.dataset.story);
    storyTrigger = button;
    document.querySelector(".dialog-content").innerHTML =
      `<p class="eyebrow">${era.name} · ${era.period}</p><h2 id="dialog-title">${era.title}</h2><img src="${era.image}" alt="${era.alt}" />${era.imageCredit ? `<div class="image-credit">${era.imageCredit}</div>` : ""}${era.story.map((paragraph) => `<p>${paragraph}</p>`).join("")}<div class="dialog-source"><span>للتوسع في القراءة</span><a href="${era.source}" target="_blank" rel="noopener noreferrer">الموسوعة البريطانية (بالإنجليزية) ↗</a></div>`;
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add("dialog-open");
  }),
);
function closeStory() {
  dialog.close();
}
document.querySelector(".dialog-close").addEventListener("click", closeStory);
dialog.addEventListener("click", (event) => {
  const rect = dialog.getBoundingClientRect();
  if (
    event.target === dialog &&
    (event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom)
  )
    closeStory();
});
dialog.addEventListener("close", () => {
  document.body.classList.remove("dialog-open");
  storyTrigger?.focus({ preventScroll: true });
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const heroImage = document.querySelector(".hero-image");
const rail = document.querySelector(".era-rail");
const railToggle = document.querySelector(".rail-toggle");
const erasSection = document.querySelector("#eras");
let selectedEra = eras[0].id;
let scrollQueued = false;
function closeRail() {
  rail.classList.remove("is-expanded");
  railToggle.setAttribute("aria-expanded", "false");
}
railToggle.addEventListener("click", () => {
  const expanded = railToggle.getAttribute("aria-expanded") !== "true";
  rail.classList.toggle("is-expanded", expanded);
  railToggle.setAttribute("aria-expanded", String(expanded));
});
document.querySelectorAll('a[href^="#"]').forEach((link) =>
  link.addEventListener("click", () => {
    const id = link.getAttribute("href").slice(1);
    if (eras.some((era) => era.id === id)) {
      selectedEra = id;
      closeRail();
      requestAnimationFrame(updateScroll);
    }
  }),
);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && rail.classList.contains("is-expanded")) {
    closeRail();
    railToggle.focus({ preventScroll: true });
  }
});
function updateScroll() {
  const bounds = erasSection.getBoundingClientRect();
  const outsideEras =
    bounds.top > window.innerHeight * 0.5 || bounds.bottom < 150;
  rail.hidden = outsideEras;
  railToggle.hidden = outsideEras;
  if (outsideEras) closeRail();
  let active = eras[0].id;
  let closestTop = -Infinity;
  eras.forEach((era) => {
    const top = document.getElementById(era.id).getBoundingClientRect().top;
    if (
      top <= window.innerHeight * 0.55 &&
      (top > closestTop || (top === closestTop && era.id === selectedEra))
    ) {
      active = era.id;
      closestTop = top;
    }
  });
  document.querySelectorAll("[data-era-link]").forEach((link) => {
    if (link.dataset.eraLink === active)
      link.setAttribute("aria-current", "step");
    else link.removeAttribute("aria-current");
  });
  heroImage.style.transform =
    !reducedMotion.matches && window.scrollY < 900
      ? `translateY(${Math.min(window.scrollY * 0.16, 110)}px) scale(1.04)`
      : "";
  scrollQueued = false;
}
window.addEventListener(
  "scroll",
  () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateScroll);
    }
  },
  { passive: true },
);
window.addEventListener("resize", updateScroll);
reducedMotion.addEventListener("change", updateScroll);
updateScroll();
