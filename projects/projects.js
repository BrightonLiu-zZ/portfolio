// /projects/projects.js
// Step 1.3 — Set up the Projects page script

// 1) Import the helpers (you added fetchJSON in Step 1.2; you'll add renderProjects in Step 1.4)
import { fetchJSON, renderProjects } from '../global.js';

(async () => {
  // 2) Fetch the projects data from your JSON file
  const projects = await fetchJSON('../lib/projects.json');

  // 3) Select the container where projects should be rendered
  const projectsContainer = document.querySelector('.projects');

  // 4) Render the projects with an <h2> heading level
  renderProjects(projects, projectsContainer, 'h2');

    // NEW (Step 1.6): update the page title with the live count
  const titleEl = document.querySelector('.projects-title');
  if (titleEl) {
    titleEl.textContent = `Projects`;
  }
})();

