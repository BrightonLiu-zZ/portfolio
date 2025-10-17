// /global.js
console.log("IT’S ALIVE!");

// Helper: $$("selector") => real Array
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/* Step 2 code stays removed/commented; Step 3 handles nav + current highlighting */

// ===========================
// Step 3.1/3.2: Build the nav
// ===========================

// 1) Your pages (relative URLs; no leading slash)
const pages = [
  { url: "",          title: "Home"     },
  { url: "projects/", title: "Projects" },
  { url: "profile/",  title: "Profile"  },
  { url: "contact/",  title: "Contact"  },
];

// 2) Create <nav> and put it at the top of <body>
const nav = document.createElement("nav");
document.body.prepend(nav);

// 3) Base path so links work locally and on GitHub Pages
const BASE_PATH =
  (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "/"
    : "/BrightonLiu-zZ/"; // <-- replace with your repo name, e.g. "/dsc106-portfolio/"

// 4) Create each link as an element, set attributes, add to <nav>
for (const p of pages) {
  // Compute href (prefix relative URLs with BASE_PATH)
  let url = !p.url.startsWith("http") ? BASE_PATH + p.url : p.url;

  // Build the <a> element (Step 3.2 requires using element creation, not HTML strings)
  const a = document.createElement("a");
  a.href = url;
  a.textContent = p.title;

  // Highlight current page (same check as Step 2.2), using classList.toggle
  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links in a new tab (host differs from the current site)
  if (a.host !== location.host) {
    a.target = "_blank";
  }

  nav.append(a);
}
