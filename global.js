// /global.js
console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// STEP 2.1: Get an array of all nav links
// $$("nav a") = select all <a> elements inside any <nav>.
// $$ returns a real array (easier to use array methods on).
const navLinks = $$("nav a");

// STEP 2.2: Find the link to the current page
// location.host  -> the site host of the page you are on (e.g., "example.com")
// location.pathname -> the path of the page you are on (e.g., "/projects/")
// For each <a>, the browser resolves a.host and a.pathname too (absolute URL pieces).
// The "current" link is the one whose host and pathname match the page you’re on.
const currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname
);

// (Optional for sanity-checking only; safe to delete later)
// console.log("Current link is:", currentLink);
