// /global.js
console.log("IT’S ALIVE!");

// Tiny helper: $$("nav a") returns a real Array of elements
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// STEP 2.1: Get an array of all nav links
const navLinks = $$("nav a");

// STEP 2.2: Find the link to the current page
// Match the link whose host and pathname equal the current page's.
const currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname
);

// STEP 2.3: Add the `current` class to that link (safely)
// Using optional chaining prevents an error if no match is found.
currentLink?.classList.add("current");
