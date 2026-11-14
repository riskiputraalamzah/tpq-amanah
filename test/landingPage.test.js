import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const homeViewSrc = fs.readFileSync(
  path.join(here, "../src/views/HomeView.vue"),
  "utf8"
);
const navbarSrc = fs.readFileSync(
  path.join(here, "../src/components/NavbarComponent.vue"),
  "utf8"
);

test("HomeView sends registration to the web form (/daftar), not the old Google Form", () => {
  assert.ok(!homeViewSrc.includes("docs.google.com/forms"), "the Google Form link is gone");
  assert.ok((homeViewSrc.match(/to="\/daftar"/g) || []).length >= 4, "hero, registration section, contact and floating buttons go to /daftar");
  assert.ok(
    homeViewSrc.includes("0895-3039-7058"),
    "Must include official contact for Ustadzah Ella (0895-3039-7058)"
  );
  assert.ok(
    homeViewSrc.includes("0822-3336-1877"),
    "Must include official contact for Ustadz Riski (0822-3336-1877)"
  );
  assert.ok(
    homeViewSrc.includes("id=\"pendaftaran\""),
    "Must include dedicated #pendaftaran section"
  );
});

test("HomeView uses WebP assets for lightweight image loading", () => {
  assert.ok(
    homeViewSrc.includes("/hero-blended-1.webp"),
    "Hero image must use .webp format"
  );
  assert.ok(
    !homeViewSrc.includes("/hero-blended-1.png"),
    "Hero image should no longer use heavy 1.6MB PNG"
  );
  assert.ok(
    !homeViewSrc.includes("/qr-pendaftaran.webp"),
    "QR code should no longer be referenced in HomeView"
  );
  assert.ok(
    homeViewSrc.includes(".webp"),
    "Teacher/Guru photos must use lightweight .webp format"
  );
  assert.ok(
    homeViewSrc.includes('fetchpriority="high"'),
    "Hero image includes fetchpriority high for optimal LCP"
  );
  assert.ok(
    homeViewSrc.includes('loading="lazy"'),
    "Below-the-fold assets and iframe have loading lazy"
  );
});

test("HomeView contains structured Islamic sections and copywriting", () => {
  assert.ok(
    homeViewSrc.includes("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"),
    "Hero contains Bismillah header"
  );
  assert.ok(
    homeViewSrc.includes("Mengapa Mempercayakan Buah Hati di TPQ AMANAH?") ||
      homeViewSrc.includes("Keunggulan Lembaga"),
    "Contains core pillars / Keunggulan section"
  );
  assert.ok(
    homeViewSrc.includes("Program Pembelajaran Unggulan") ||
      homeViewSrc.includes("Program Unggulan"),
    "Contains detailed Program Unggulan section"
  );
  assert.ok(
    homeViewSrc.includes("Dewan Pengajar"),
    "Contains teacher showcase section"
  );
  assert.ok(
    homeViewSrc.includes("Jadwal & Sesi Mengaji"),
    "Contains schedule comparison"
  );
  assert.ok(
    homeViewSrc.includes("Pertanyaan yang Sering Diajukan"),
    "Contains FAQ accordion"
  );
  assert.ok(
    homeViewSrc.includes("Daftar Santri Baru"),
    "Contains registration CTA"
  );
});

test("E-Kitab section links to authentic platform and loads cover assets", () => {
  assert.ok(
    homeViewSrc.includes("https://at-tartil.tpqamanahsawotratap.com/"),
    "E-Kitab must link directly to official platform https://at-tartil.tpqamanahsawotratap.com/"
  );
  assert.ok(
    !homeViewSrc.includes("anyflip.com"),
    "Should not link to external AnyFlip"
  );
  assert.ok(
    homeViewSrc.includes("/tartil/cover1.webp"),
    "Must reference authentic At-Tartil cover image"
  );
});

test("Navbar and sections prevent overlapping on scroll navigation", () => {
  assert.ok(navbarSrc.includes("#pendaftaran"), "Navbar includes #pendaftaran link");
  assert.ok(navbarSrc.includes("#keunggulan"), "Navbar includes #keunggulan link");
  assert.ok(navbarSrc.includes("#program"), "Navbar includes #program link");
  assert.ok(
    navbarSrc.includes("offset = 120") || navbarSrc.includes("offset = 110"),
    "Navbar scrollToSection uses generous offset"
  );
  assert.ok(
    homeViewSrc.includes("scroll-mt-32") || homeViewSrc.includes("scroll-mt-28"),
    "Sections use scroll-mt to prevent navbar covering section titles"
  );
});

test("HomeView has mobile-friendly responsive layout and floating CTA", () => {
  assert.ok(
    homeViewSrc.includes("sm:") && homeViewSrc.includes("md:") && homeViewSrc.includes("lg:"),
    "Includes responsive Tailwind breakpoints"
  );
  assert.ok(
    homeViewSrc.includes("overflow-hidden") || homeViewSrc.includes("overflow-x-hidden"),
    "Prevents horizontal overflow"
  );
  const floatingCta = homeViewSrc.match(/aria-label="Aksi Cepat Pendaftaran"[\s\S]*?class="([^"]+)"/);
  assert.ok(floatingCta, "Includes floating mobile CTA buttons");
  for (const cls of ["fixed", "bottom-5", "right-5", "lg:hidden"]) {
    assert.ok(floatingCta[1].split(/\s+/).includes(cls), `Floating CTA keeps ${cls}`);
  }
});

test("HomeView has no duplicate static element ids", () => {
  const ids = [...homeViewSrc.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual(duplicates, [], `Duplicate ids break anchor links: ${duplicates.join(", ")}`);
});

test("Floating CTA hides where the same actions are already on screen", () => {
  assert.ok(homeViewSrc.includes("showFloatingCta"), "Floating CTA visibility is controlled");
  for (const target of ["heroRef", "registrationRef", "contactRef", "footerRef"]) {
    assert.ok(homeViewSrc.includes(`ref="${target}"`), `${target} is observed`);
  }
});

test("Contact numbers are tappable and FAQ exposes its state to assistive tech", () => {
  assert.ok(homeViewSrc.includes("'tel:' + contactElla.tel"), "Ustadzah Ella number is a tel: link");
  assert.ok(homeViewSrc.includes("'tel:' + contactRiski.tel"), "Ustadz Riski number is a tel: link");
  assert.ok(homeViewSrc.includes(':aria-expanded="activeFaq === index"'), "FAQ buttons expose aria-expanded");
});

test("Official registration number matches the Tanda Daftar LPQ, in hero and footer", () => {
  const footerSrc = fs.readFileSync(path.join(here, "../src/components/FooterComponent.vue"), "utf8");
  const legalSrc = fs.readFileSync(path.join(here, "../src/data/legalDocuments.js"), "utf8");
  // Label may be NSQ (as on the certificate) or NSPQ; the number must match everywhere.
  const registration = /NS(P)?Q\s+411235151939/;
  assert.match(homeViewSrc, registration, "Hero shows the registration number");
  assert.match(footerSrc, registration, "Footer shows the registration number");
  assert.match(legalSrc, registration, "Document data carries the same number");
});

test("WebP files exist in public folder and have small footprint (< 200KB each)", () => {
  const publicDir = path.join(here, "../public");
  const heroWebp = path.join(publicDir, "hero-blended-1.webp");
  assert.ok(fs.existsSync(heroWebp), "hero-blended-1.webp exists");
  const heroStat = fs.statSync(heroWebp);
  assert.ok(
    heroStat.size < 200 * 1024,
    `Hero webp size must be < 200KB, got ${Math.round(heroStat.size / 1024)}KB`
  );

  const qrWebp = path.join(publicDir, "qr-pendaftaran.webp");
  assert.ok(fs.existsSync(qrWebp), "qr-pendaftaran.webp exists");
  assert.ok(fs.statSync(qrWebp).size < 30 * 1024, "QR webp must be < 30KB");

  const guruDir = path.join(publicDir, "guru");
  const teachers = ["aini", "annifa", "ella", "febi", "nurul", "riski"];
  for (const t of teachers) {
    const p = path.join(guruDir, `${t}.webp`);
    assert.ok(fs.existsSync(p), `${t}.webp exists`);
    const s = fs.statSync(p);
    assert.ok(
      s.size < 30 * 1024,
      `${t}.webp size must be < 30KB, got ${Math.round(s.size / 1024)}KB`
    );
  }
});
