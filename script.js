/* ===== NOVERA GT — interactions ===== */

/* Image sources (Unsplash). Swap freely for real photos. */
const U = (id, w = 2000) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const IMAGES = {
  hero:     U("1552519507-da3b142c6e3d"),   // sleek sports car, side
  road:     U("1503376780353-7e6692767b70"), // car on open road
  charge:   U("1593941707882-a5bba14938c7", 1200), // EV charging
  silence:  U("1605559424843-9e4c228bf1c2", 1200), // dark cabin
  assist:   U("1549317661-bd32c8ce0db2", 1200),    // interior tech
  ota:      U("1617704548623-340376564e68", 1200), // dashboard screen
  interior: U("1503736334956-4c8f8e92946d", 1600),  // interior wide
  track:    U("1494976388531-d1058494cdd8"),        // car front dramatic
  reserve:  U("1580273916550-e323be2ae537"),        // car studio/dark
};

/* Apply images */
document.querySelectorAll("[data-img]").forEach((img) => {
  const key = img.getAttribute("data-img");
  if (IMAGES[key]) img.src = IMAGES[key];
});

/* Nav scroll state */
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

/* Mobile menu */
const burger = document.getElementById("burger");
const navLinks = document.getElementById("navLinks");
burger.addEventListener("click", () => {
  navLinks.classList.toggle("open");
  nav.classList.toggle("menu-open");
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    nav.classList.remove("menu-open");
  })
);

/* Reveal on scroll */
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.14 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

/* Count-up stats */
const countUp = (el) => {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || "0", 10);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  const dur = 1400;
  let start = null;
  const step = (t) => {
    if (!start) start = t;
    const p = Math.min((t - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = (target * eased).toFixed(decimals);
    el.textContent = prefix + Number(val).toLocaleString("pt-BR") + suffix;
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = prefix + target.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + suffix;
  };
  requestAnimationFrame(step);
};
const statsIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        countUp(e.target);
        statsIO.unobserve(e.target);
      }
    });
  },
  { threshold: 0.6 }
);
document.querySelectorAll("[data-count]").forEach((el) => statsIO.observe(el));

/* Subtle parallax (non-hero sections) */
const heroImg = document.querySelector(".hero__img");
const parallaxEls = [...document.querySelectorAll("[data-parallax] img")].filter(
  (img) => img !== heroImg
);
let ticking = false;
const applyParallax = () => {
  parallaxEls.forEach((img) => {
    const rect = img.parentElement.getBoundingClientRect();
    const vh = window.innerHeight;
    if (rect.bottom < 0 || rect.top > vh) return;
    const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
    img.style.transform = `scale(1.12) translateY(${progress * -34}px)`;
  });
  ticking = false;
};
window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      requestAnimationFrame(applyParallax);
      ticking = true;
    }
  },
  { passive: true }
);
applyParallax();

/* ===== Hero 3D parallax (mouse + scroll) ===== */
const heroContent = document.querySelector(".hero__content");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let tmx = 0, tmy = 0, mx = 0, my = 0; // targets + eased mouse
const heroUpdate = () => {
  const sc = window.scrollY;
  // ease toward target for buttery motion
  mx += (tmx - mx) * 0.08;
  my += (tmy - my) * 0.08;
  if (heroImg) {
    heroImg.style.transform =
      `scale(1.14) translate3d(${mx * 22}px, ${sc * 0.16 + my * 22}px, 0) rotateX(${my * -1.4}deg) rotateY(${mx * 1.8}deg)`;
  }
  if (heroContent) {
    heroContent.style.transform =
      `translate3d(${mx * -16}px, ${my * -10}px, 0) rotateY(${mx * 1.2}deg)`;
    heroContent.style.opacity = String(Math.max(0, 1 - sc / (window.innerHeight * 0.8)));
  }
  if (Math.abs(tmx - mx) > 0.001 || Math.abs(tmy - my) > 0.001) requestAnimationFrame(heroUpdate);
};
if (!reduceMotion) {
  window.addEventListener("mousemove", (e) => {
    tmx = (e.clientX / window.innerWidth - 0.5) * 2;
    tmy = (e.clientY / window.innerHeight - 0.5) * 2;
    requestAnimationFrame(heroUpdate);
  });
  window.addEventListener("scroll", () => requestAnimationFrame(heroUpdate), { passive: true });
  heroUpdate();
}

/* ===== Scroll-scrubbed driving video (signature) ===== */
const drive = document.querySelector(".drive");
const dvid = document.querySelector("[data-drive]");
const dbar = document.querySelector("[data-drive-bar]");
const caps = [...document.querySelectorAll(".drive__cap")];
if (drive && dvid) {
  let dDur = 0, targetT = 0, curT = 0, seeking = false, rafDrive = null;
  const setDur = () => { dDur = dvid.duration || 0; };
  dvid.addEventListener("loadedmetadata", setDur);
  if (dvid.readyState >= 1) setDur();

  // smoothly chase the target time for fluid scrubbing
  const chase = () => {
    curT += (targetT - curT) * 0.18;
    if (dDur && !seeking && Math.abs(dvid.currentTime - curT) > 0.02) {
      seeking = true;
      dvid.currentTime = curT;
    }
    if (Math.abs(targetT - curT) > 0.01) rafDrive = requestAnimationFrame(chase);
    else rafDrive = null;
  };
  dvid.addEventListener("seeked", () => { seeking = false; });

  const driveScroll = () => {
    const total = drive.offsetHeight - window.innerHeight;
    const passed = Math.min(Math.max(-drive.getBoundingClientRect().top, 0), total);
    const p = total > 0 ? passed / total : 0;
    if (dbar) dbar.style.width = (p * 100).toFixed(1) + "%";
    if (dDur) { targetT = p * (dDur - 0.05); if (!rafDrive) rafDrive = requestAnimationFrame(chase); }
    const idx = Math.min(caps.length - 1, Math.floor(p * caps.length + 0.0001));
    caps.forEach((c, i) => c.classList.toggle("on", i === idx));
  };
  window.addEventListener("scroll", () => requestAnimationFrame(driveScroll), { passive: true });
  window.addEventListener("resize", driveScroll);
  driveScroll();
}

/* Newsletter (demo) */
const form = document.getElementById("newsForm");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const btn = form.querySelector("button");
  btn.textContent = "Inscrito ✓";
  btn.disabled = true;
  form.querySelector("input").value = "";
});
