// /index.js  — Step 2.1: render the latest 3 projects on the Home page
import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

(async () => {
  // 1) Load all projects from your JSON
  const projects = await fetchJSON('./lib/projects.json');

  // 2) Keep only the first three
  const latestProjects = projects.slice(0, 3);

  // 3) Find the Home page container
  const projectsContainer = document.querySelector('.projects');

  // 4) Render them (use <h2> for each project title, per the guide)
  renderProjects(latestProjects, projectsContainer, 'h2');

  const githubData = await fetchGitHubData('BrightonLiu-zZ'); 
  const profileStats = document.querySelector('#profile-stats');

  // Step 5 — Fill the stats box with the GitHub numbers
  if (profileStats) {
    profileStats.innerHTML = `
      <dl>
        <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
        <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
        <dt>Followers:</dt><dd>${githubData.followers}</dd>
        <dt>Following:</dt><dd>${githubData.following}</dd>
      </dl>
    `;
  }
  console.log(githubData);
})();
