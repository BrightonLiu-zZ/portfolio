import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Step 4.1: search query state (will be used in Step 4.2+)
let query = '';

// Step 5.2: index of the selected wedge (–1 means “none”)
let selectedIndex = -1;

// 1) Import the helpers (you added fetchJSON in Step 1.2; you'll add renderProjects in Step 1.4)
import { fetchJSON, renderProjects } from '../global.js';

(async () => {
  // 2) Fetch the projects data from your JSON file
  const projects = await fetchJSON('../lib/projects.json');

  // 3) Select the container where projects should be rendered
  const projectsContainer = document.querySelector('.projects');

  // 4) Render the projects with an <h2> heading level
  renderProjects(projects, projectsContainer, 'h2');
  renderPieChart(projects);

  // Step 4.2 — basic search (titles only, case-sensitive)
  const searchInput = document.querySelector('.searchBar');
  if (searchInput) {
    searchInput.addEventListener('change', (event) => {
      // 1) update the query string
      query = event.target.value ?? '';

      // 2) Search across all project fields, case-insensitive
      const filteredProjects = projects.filter((project) => {
        const values = Object.values(project).join('\n').toLowerCase();
        return values.includes((query ?? '').toLowerCase());
      });

      // 3) re-render the cards
      renderProjects(filteredProjects, projectsContainer, 'h2');
      renderPieChart(filteredProjects);
    });
  }
    // NEW (Step 1.6): update the page title with the live count
  const titleEl = document.querySelector('.projects-title');
  if (titleEl) {
    titleEl.textContent = `Projects`;
  }

  // Step 4.4 — refactor: render the pie/legend for a given subset of projects
  function renderPieChart(projectsGiven) {
    const svg = d3.select('#projects-pie-plot');
    if (!svg.node()) return;

    // (a) group by year → counts
    const rolled = d3.rollups(
      projectsGiven,
      v => v.length,
      d => d.year
    );

    // (b) shape data for d3.pie
    const data = rolled.map(([year, count]) => ({
      value: count,
      label: String(year),
    }));

    // (c) generators
    const arcGen = d3.arc().innerRadius(0).outerRadius(50);
    const pie = d3.pie().value(d => d.value);
    const arcs = pie(data);
    const color = d3.scaleOrdinal(d3.schemeTableau10);

  function filterByYearAndRerender(labelOrNull) {
    const subset = labelOrNull == null
      ? projectsGiven
      : projectsGiven.filter(p => String(p.year) === String(labelOrNull));

    renderProjects(subset, projectsContainer, 'h2');
    // do NOT replot the pie from the subset — just refresh the highlight
    applySelectionClasses();
  }


    // (d) clear previous draw (fixes duplicate slices)
    svg.selectAll('path').remove();

    // (e) draw slices — add click to filter by that slice's label
    arcs.forEach((a, i) => {
      svg.append('path')
        .attr('d', arcGen(a))
        .attr('style', `--color:${color(i)}`)
        .attr('fill', 'var(--color)')
        .on('click', () => {
          // Toggle selection index (kept for Step 5.2 compatibility)
          selectedIndex = (selectedIndex === i) ? -1 : i;

          // If de-selected ⇒ show all in projectsGiven; else filter by this slice's label
          const label = (selectedIndex === -1) ? null : a.data.label;
          filterByYearAndRerender(label);
        });
    });

  
    // (f) rebuild legend to match — and make each item clickable
    const legend = d3.select('.legend');
    legend.selectAll('*').remove();

    data.forEach((d, i) => {
      legend.append('li')
        .attr('class', 'legend__item')
        .attr('style', `--color:${color(i)}`)
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
        .on('click', () => {
          // Clicking a legend row filters by that year; clicking again clears it
          selectedIndex = (selectedIndex === i) ? -1 : i;
          const label = (selectedIndex === -1) ? null : d.label;
          filterByYearAndRerender(label);
        });
    });


    // (g) helper to apply .selected to the right wedge + legend item
    function applySelectionClasses() {
      svg.selectAll('path')
        .attr('class', (_, i) => (i === selectedIndex ? 'selected' : null));

      legend.selectAll('li')
        .attr('class', (_, i) => `legend__item ${i === selectedIndex ? 'selected' : ''}`);
    }

    // initial sync (if selectedIndex != -1, keep highlight across re-renders)
    applySelectionClasses();
  }
})();

