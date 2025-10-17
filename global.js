// /global.js
console.log("IT’S ALIVE!");

// Helper: $$("selector") => real Array
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/* ===========================
   STEP 3.1/3.2: Build the nav
   =========================== */

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
    : "/YOUR-REPO-NAME/"; // <-- replace with your repo name, e.g. "/dsc106-portfolio/"

// 4) Create each link as an element, set attributes, add to <nav>
for (const p of pages) {
  // Compute href (prefix relative URLs with BASE_PATH)
  let url = !p.url.startsWith("http") ? BASE_PATH + p.url : p.url;

  // Build the <a> element
  const a = document.createElement("a");
  a.href = url;
  a.textContent = p.title;

  // Highlight current page
  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links in a new tab
  if (a.host !== location.host) {
    a.target = "_blank";
  }

  nav.append(a);
}

/* ===========================
   STEP 4.2: Add the switch UI
   ===========================

   We insert a <label class="color-scheme"> with a <select> inside it.
   The <option> values are exactly what we will set on html{ color-scheme: ... }:
   - "light dark" (Automatic: follow OS)
   - "light"
   - "dark"

   We add this block at the *start* of <body>, so it shows up on every page.
*/
document.body.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

/* NOTE:
   This control doesn't do anything yet—that’s expected.
   In the next step we’ll add the JS to listen for changes and set html{ color-scheme: ... }.
*/
