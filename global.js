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
  { url: "meta/",     title: "Meta"     },
];

// 2) Create <nav> and put it at the top of <body>
const nav = document.createElement("nav");
document.body.prepend(nav);

// 3) Base path so links work locally and on GitHub Pages
const BASE_PATH =
  (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "/"
    : "/portfolio/"; // <-- replace with your repo name, e.g. "/dsc106-portfolio/"

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
   =========================== */
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

/* ===========================
   STEP 4.4 + 4.5: Make it work and persist
   ===========================
   - setColorScheme(s) applies the scheme, updates the <select>,
     and saves it in localStorage.
   - On load, if a saved value exists, we apply it.
   - On change, we save & apply the new value.
*/
const select = document.querySelector(".color-scheme select");

function setColorScheme(scheme) {
  // Apply to <html>
  document.documentElement.style.setProperty("color-scheme", scheme);
  // Keep the UI in sync
  select.value = scheme;
  // Persist for future visits
  localStorage.colorScheme = scheme;
}

// 1) On load: read from localStorage (if present) and apply it
if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
} else {
  // No saved preference; keep the default "Automatic"
  select.value = "light dark";
}

// 2) On change: save & apply
select.addEventListener("input", (event) => {
  const value = event.target.value; // "light dark", "light", or "dark"
  console.log("color scheme changed to", value);
  setColorScheme(value);
});

// Lab 4 · Step 1.2 — JSON loader helper
export async function fetchJSON(url) {
  try {
    // 1) Fetch the JSON file from the given URL
    const response = await fetch(url);

    // 2) Inspect the response in DevTools (should show a Response object)
    console.log(response);

    // 3) Validate the response; if not OK, throw so we can handle it
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    // 4) Parse and return the JSON body
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
    // Re-throw so callers (later steps) can handle it if needed
    throw error;
  }
}

// Lab 4 · Step 1.4 — Reusable renderer for project cards
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // 1) Clear existing content to avoid duplicates
  containerElement.innerHTML = '';

  // 2) Render one <article> per project
  for (const project of projects) {
    const article = document.createElement('article');

    // 3) Build the inner HTML for the article (title, optional image, description)

    article.innerHTML = `
      <${headingLevel}>${project.title ?? ''}</${headingLevel}>
      ${project.image ? `<img src="${project.image}" alt="${project.title ?? ''}">` : ''}

      <!-- Wrap description + year in the SAME block so they stack cleanly -->
      <div class="project-summary">
        <p>${project.description ?? ''}</p>
        ${project.year ? `<p class="project-year"><em>c. ${project.year}</em></p>` : ''}
      </div>
    `;

    // 4) Append the article to the container
    containerElement.appendChild(article);
  }
}

// Lab 4 · Step 3.2 — GitHub API helper
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/BrightonLiu-zZ`);
}