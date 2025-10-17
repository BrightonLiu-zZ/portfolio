// /global.js
console.log("IT’S ALIVE!");

// Small helper: $$("selector") → real Array of elements
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/* ============================================================
   STEP 3.1: Automatic navigation menu
   ------------------------------------------------------------
   1) Define our pages as an ARRAY OF OBJECTS: { url, title }.
   2) Create a <nav>, prepend it to <body>.
   3) For each page, build the URL (respecting BASE_PATH), add <a>.
   4) As we add each <a>, if it matches the current page, add 'current'.
   ============================================================ */

// 1) Pages list (edit titles/urls to match your site)
const pages = [
  { url: "",          title: "Home"     },
  { url: "projects/", title: "Projects" },
  { url: "profile/",  title: "Profile"  },
  { url: "contact/",  title: "Contact"  },
];

// 2) Figure out our BASE_PATH depending on where we’re running
//    On localhost we use "/".
//    On GitHub Pages, replace '/your-repo-name/' with YOUR repo name (with slashes).
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"
  : "/your-repo-name/";   // ← CHANGE THIS to your GH Pages repo path, e.g. "/portfolio/"

// 3) Create <nav> and put it at the very top of <body>
const nav = document.createElement("nav");
document.body.prepend(nav);

// 4) Loop over pages, build link, insert it, and mark current
for (let p of pages) {
  let url = p.url;

  // If URL is relative (doesn’t start with http), prefix with BASE_PATH
  url = !url.startsWith("http") ? BASE_PATH + url : url;

  // Insert the link into <nav>
  nav.insertAdjacentHTML("beforeend", `<a href="${url}">${p.title}</a>`);

  // Grab the just-added <a> (it’s the last element we inserted)
  const a = nav.lastElementChild;

  // If this link points to the page we’re on, add the 'current' class
  if (a && a.host === location.host && a.pathname === location.pathname) {
    a.classList.add("current");
  }
}

/* ============================================================
   NOTE:
   We removed the Step 2 code that queried existing nav links and
   added 'current' afterwards, because we’re now creating links
   AND marking the current one during creation (as the guideline says).
   ============================================================ */
