// /global.js
console.log("IT’S ALIVE!");

// Helper: $$("selector") → real Array (not a NodeList)
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/* ============================================================
   STEP 3.1/3.2: Build nav, mark current link, open externals in new tab
   ============================================================ */

// 1) List your pages (internal and, if you want, any external links)
const pages = [
  { url: "",          title: "Home"     },
  { url: "projects/", title: "Projects" },
  { url: "profile/",  title: "Profile"  },
  { url: "contact/",  title: "Contact"  },
  // Example external (optional): { url: "https://github.com/yourname", title: "GitHub" },
];

// 2) Base path: localhost vs GitHub Pages
const BASE_PATH =
  (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "/"
    : "/your-repo-name/"; // ← change to your actual GH Pages repo path, e.g. "/portfolio/"

// 3) Create <nav> and put it at the top of <body>
const nav = document.createElement("nav");
document.body.prepend(nav);

// 4) Create each <a> as an element (Step 3.2) and append it
for (let p of pages) {
  // Build the URL: prefix relative paths with BASE_PATH
  let url = p.url;
  url = !url.startsWith("http") ? BASE_PATH + url : url;

  // Create the link element (instead of inserting HTML strings)
  const a = document.createElement("a");
  a.href = url;
  a.textContent = p.title;

  // Highlight current page (use classList.toggle with a condition)
  a.classList.toggle("current", a.host === location.host && a.pathname === location.pathname);

  // Open external links in a new tab (hosts that differ from the current site)
  if (a.host !== location.host) {
    a.target = "_blank";
    // (Optional, good practice) a.rel = "noopener";
  }

  nav.append(a);
}
