// /global.js
console.log("IT'S ALIVE!");

/**
 * $$ — tiny helper to select many elements as a real Array
 *   $$('a')                      → [<a>, <a>, ...]
 *   $$('.projects article', el)  → within a specific container
 */
export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}
