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

test("HomeView integrates official Google Form registration link & contacts", () => {
  const formUrlSnippet = "docs.google.com/forms";
  assert.ok(
    homeViewSrc.includes(formUrlSnippet),
    "HomeView must include Google Form registration link"
  );
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
    homeViewSrc.includes("/qr-pendaftaran.webp"),
    "Must reference QR code webp asset"
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
    homeViewSrc.includes("https://at-tartil.riskiputraalamzah.my.id/"),
    "E-Kitab must link directly to official platform https://at-tartil.riskiputraalamzah.my.id/"
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
  assert.ok(
    homeViewSrc.includes("fixed bottom-5 right-5"),
    "Includes floating mobile CTA buttons"
  );
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
