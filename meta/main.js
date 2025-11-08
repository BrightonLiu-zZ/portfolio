// meta/main.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Make scales accessible outside renderScatterPlot
let xScale, yScale;

function brushed(event) {
  const selection = event.selection;

  const selected = renderSelectionCount(selection);

  d3.select('#chart').selectAll('circle')
    .classed('selected', d => selection ? isCommitSelected(selection, d) : false);

  // NEW: show language breakdown for the selection
  renderLanguageBreakdown(selection);
}



function isCommitSelected(selection, commit) {
  if (!selection) return false;                   // when brush is cleared
  const [x0, x1] = selection.map(d => d[0]);     // pixel bounds of brush (x)
  const [y0, y1] = selection.map(d => d[1]);     // pixel bounds of brush (y)
  const x = xScale(commit.datetime);             // data → pixel using existing scales
  const y = yScale(commit.hourFrac);
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderLanguageBreakdown(selection) {
  // Find selected commits (or none)
  const selectedCommits = selection
    ? commits.filter(d => isCommitSelected(selection, d))
    : [];

  const container = document.getElementById('language-breakdown');

  // If nothing is selected, clear the panel and exit
  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }

  // Flatten all changed lines from selected commits
  const lines = selectedCommits.flatMap(d => d.lines);

  // Count lines per language/type
  const breakdown = d3.rollup(
    lines,
    v => v.length,      // count lines
    d => d.type         // group by file "type" from CSV
  );

  // Sort by count (desc) for nicer ordering
  const items = Array.from(breakdown, ([lang, count]) => ({ lang, count }))
                     .sort((a, b) => d3.descending(a.count, b.count));

  // Render as dt/dd pairs
  const fmtPct = d3.format('.1%');
  const fmtInt = d3.format(',d');

  container.innerHTML = '';
  for (const { lang, count } of items) {
    const proportion = count / lines.length;

    container.innerHTML += `
      <dt>${lang || 'Unknown'}</dt>
      <dd>${fmtInt(count)} lines (${fmtPct(proportion)})</dd>
    `;
  }
}

// 👉 Replace with your actual GitHub "owner/repo" so URLs open the commit page.
// Example: 'BrightonLiu-zZ/your-portfolio-repo'
const REPO_SLUG = 'BrightonLiu-zZ/portfolio';

// 1) Load CSV with proper type conversions (numbers/dates)
async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line:   Number(row.line),
    depth:  Number(row.depth),
    length: Number(row.length),

    // elocuent gives either date+timezone and/or datetime; keep both if present
    date:     row.date ? new Date(row.date + 'T00:00' + (row.timezone || '')) : undefined,
    datetime: row.datetime ? new Date(row.datetime) : undefined,
  }));
  return data;
}

// 2) Group by commit and build one object per commit with derived fields
function processCommits(data) {
  return d3.groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];                       // all lines share commit meta
      const { author, date, time, timezone, datetime } = first;

      const ret = {
        id: commit,
        url: `https://github.com/${REPO_SLUG}/commit/${commit}`,
        author,
        date,
        time,
        timezone,
        datetime,
        // e.g., 14.5 means 2:30 PM
        hourFrac: datetime ? (datetime.getHours() + datetime.getMinutes() / 60) : undefined,
        // how many lines were modified in this commit (one CSV row per changed line)
        totalLines: lines.length,
      };

      // Keep the original lines, but hide them from console/object enumeration
      Object.defineProperty(ret, 'lines', {
        value: lines,
        writable: false,
        enumerable: false,
        configurable: false,
      });

      return ret;
    });
}

// 3) Execute
const data = await loadData();
const commits = processCommits(data);
// Renders a small stats block inside <div id="stats">
function renderCommitInfo(data, commits) {
    // Create the <dl class="stats"> container
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');

    // Total LOC (rows in the CSV)
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);

    // Total commits (groups we formed in Step 1.2)
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);

    // (Optional) Title like the screenshot
    d3.select('#stats').insert('h2', ':first-child').text('Summary');

    // === Additional aggregates ===

    // 1) Number of distinct files
    const filesCount = d3.group(data, d => d.file).size;

    // 2) Maximum depth (max indent level across all lines)
    const maxDepth = d3.max(data, d => d.depth ?? 0) ?? 0;

    // 3) Longest line (in characters)
    const longestLine = d3.max(data, d => d.length ?? 0) ?? 0;

    // 4) Max lines per file (largest file length in lines)
    //    - one CSV row = one line of code; group by file, count lines, take max
    const linesPerFile = d3.rollup(data, v => v.length, d => d.file);
    const maxLinesPerFile = d3.max(linesPerFile.values()) ?? 0;

    // === Append to the <dl class="stats"> in label/value pairs ===
    dl.append('dt').text('Files');
    dl.append('dd').text(filesCount);

    dl.append('dt').text('Max depth');
    dl.append('dd').text(maxDepth);

    dl.append('dt').text('Longest line');
    dl.append('dd').text(longestLine);

    dl.append('dt').text('Max lines');
    dl.append('dd').text(maxLinesPerFile);

}

// Call it after loading + processing
renderCommitInfo(data, commits);

// Update the static tooltip with the hovered commit's info
function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  if (!commit || Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;

  date.textContent = commit.datetime
    ? commit.datetime.toLocaleString('en', { dateStyle: 'full' })
    : '';
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top  = `${event.clientY}px`;
}

// Step 5 — simple brush setup + fix tooltip-overlap ordering
function createBrushSelector(svg) {
  svg.call(d3.brush().on('start brush end', brushed));

  // Keep hovers working (overlay goes under dots)
  svg.selectAll('.dots, .overlay ~ *').raise();
}

function renderSelectionCount(selection) {
  // If there is a brush box, keep only commits inside it; else empty.
  const selectedCommits = selection
    ? commits.filter(d => isCommitSelected(selection, d))
    : [];

  const countEl = document.getElementById('selection-count');
  countEl.textContent = `${selectedCommits.length || 'No'} commits selected`;

  return selectedCommits;
}


// Step 2.1 — draw the dots in a scatterplot
function renderScatterPlot(data, commits) {
    // Dimensions
    const width = 1000;
    const height = 600;

    // SVG
    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    xScale = d3.scaleTime().domain(d3.extent(commits, d => d.datetime));
    yScale = d3.scaleLinear().domain([0, 24]).nice();


    // --- Margins (create space for axes)
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };

    // Define a "usable" plotting area in absolute SVG coords
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    // --- Scales (domains already set above in your code; now set ranges with margins)
    xScale.range([usableArea.left, usableArea.right]).nice();
    yScale.range([usableArea.bottom, usableArea.top]);

    // --- Radius scale: lines edited -> dot size
    const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
    const rScale = d3.scaleSqrt()
        .domain([minLines, maxLines])
        .range([2, 30]);

    // --- Gridlines (ADD BEFORE the axes so axes render on top)
    const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);

    // Make a left axis with no labels and full-width ticks for lines
    gridlines.call(
        d3.axisLeft(yScale)
            .tickFormat('')                      // hide tick labels
            .tickSize(-usableArea.width)         // long ticks across the plotting area
    );

    // --- Axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale)
    .tickFormat(d => String(d % 24).padStart(2, '0') + ':00'); // format like time

    // Add X axis at the bottom of the usable area
    svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

    // Add Y axis at the left of the usable area
    svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

    // --- Dots (draw AFTER margins + axes so positions match the new ranges)
    const dots = svg.append('g').attr('class', 'dots');

    // ✅ NEW — compute sorted list first: large → small (so small are drawn last, on top)
    const sortedCommits = d3.sort(
      commits.filter(d => d.datetime && Number.isFinite(d.hourFrac)),
      d => -d.totalLines // descending by size
    );

    // ✅ NEW — bind the sorted data
    dots.selectAll('circle')
      .data(sortedCommits)
      .join('circle')
      .attr('cx', d => xScale(d.datetime))
      .attr('cy', d => yScale(d.hourFrac))
      .attr('r',  d => rScale(d.totalLines))
      .attr('fill', 'steelblue')
      .style('fill-opacity', 0.7)
      .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1);
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      })
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
      });
    createBrushSelector(svg);
}

// Call after data is ready (keep this near your other calls)
renderScatterPlot(data, commits);
