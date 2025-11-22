// meta/main.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

// Make scales accessible outside renderScatterPlot
let xScale, yScale;

const colors = d3.scaleOrdinal(d3.schemeTableau10);

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
  const commits = d3.groups(data, (d) => d.commit)
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

  // Lab 8 Step 3.3: ensure commits are in chronological order
  return commits.sort((a, b) => d3.ascending(a.datetime, b.datetime));
}


// 3) Execute
const data = await loadData();
const commits = processCommits(data);

// Lab 8 – Step 1.1: variables for time-based filtering
// 0–100% of the overall time range
let commitProgress = 100;

// Map 0–100 → actual datetime
const timeScale = d3
  .scaleTime()
  .domain(d3.extent(commits, d => d.datetime))
  .range([0, 100]);

// Latest datetime we want to show given commitProgress
let commitMaxTime = timeScale.invert(commitProgress);

// This will hold just the commits we want to show (<= commitMaxTime)
let filteredCommits = commits;

// Lab 8 – Step 3.2: generate one narrative "step" per commit
d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html((d, i) => {
    // How many distinct files were touched in this commit?
    const filesTouched = d3.rollups(
      d.lines,
      D => D.length,
      line => line.file,
    ).length;

    const dateText = d.datetime
      ? d.datetime.toLocaleString('en', {
          dateStyle: 'full',
          timeStyle: 'short',
        })
      : 'an unknown time';

    const headline =
      i > 0
        ? 'another glorious commit'
        : 'my first commit, and it was glorious';

    return `
      <p>
        On ${dateText},
        I made <a href="${d.url}" target="_blank" rel="noopener">${headline}</a>.
      </p>
      <p>
        I edited ${d.totalLines} lines across ${filesTouched} files.
      </p>
    `;
  });


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
      .attr('class', 'x-axis') // Lab 8: mark so we can update it later
      .call(xAxis);

    // Add Y axis at the left of the usable area
    svg.append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .attr('class', 'y-axis')
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
      .data(sortedCommits, d => d.id) // use commit SHA as the unique key
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

function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // Grab the existing SVG and x-axis group
  const svg = d3.select('#chart').select('svg');

  // 1) Update x-scale to the new time range
  xScale = xScale.domain(d3.extent(commits, d => d.datetime));
  xScale.range([usableArea.left, usableArea.right]).nice();

  // 2) Recompute radius scale based on *visible* commits
  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  // 3) Redraw the x-axis in place
  const xAxis = d3.axisBottom(xScale);
  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  // 4) Update the dots (reuse the existing <g class="dots">)
  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(
    commits.filter(d => d.datetime && Number.isFinite(d.hourFrac)),
    d => -d.totalLines
  );

  dots
    .selectAll('circle')
    .data(sortedCommits, d => d.id) // SAME key as in renderScatterPlot
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
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
}



function updateFileDisplay(filteredCommits) {
  // Step 2.1: group all lines from the filtered commits by file
  const lines = filteredCommits.flatMap(d => d.lines);

  const files = d3
    .groups(lines, d => d.file)
    .map(([name, lines]) => {
      // Pick a representative technology for this file.
      // (Assumes most lines in a file share the same "type".)
      const representativeType = lines[0]?.type ?? 'unknown';

      return { name, lines, type: representativeType };
    })
    // Step 2.3: sort files by number of lines, biggest first
    .sort((a, b) => b.lines.length - a.lines.length);

  // Step 2.1: bind files to <dl id="files"> and create the dt/dd skeleton
  const filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, d => d.name)
    .join(
      // This code only runs when the div is initially rendered
      enter =>
        enter.append('div').call(div => {
          div.append('dt').append('code');
          div.append('dd');
        }),
    )
    // Step 2.4: set a CSS variable per file for its color
    .attr('style', d => `--color: ${colors(d.type)}`);

  // Update filename text inside <dt><code>…</code></dt>
  filesContainer
    .select('dt code')
    .text(d => d.name);

  // Step 2.2: make each <dd> a unit visualization (one .loc per line)
  filesContainer
    .select('dd')
    .selectAll('div')
    .data(d => d.lines)
    .join('div')
    .attr('class', 'loc');
}



// Lab 8 – Step 1.1: hook up the time slider to our variables + plot
const timeSlider = document.getElementById('commit-progress');
const timeDisplay = document.getElementById('commit-time');

function onTimeSliderChange() {
  if (!timeSlider || !timeDisplay) return; // safety check

  // 1) Read the slider value (0–100)
  commitProgress = Number(timeSlider.value);

  // 2) Convert 0–100 → actual Date object
  commitMaxTime = timeScale.invert(commitProgress);

  // 3) Show that date/time in the <time> element
  timeDisplay.textContent = commitMaxTime.toLocaleString('en', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  // 4) Keep only commits up to commitMaxTime
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);

  // 5) Update the scatter plot to show just those commits
  updateScatterPlot(data, filteredCommits);

  // 6) Update the file unit visualization below the slider
  updateFileDisplay(filteredCommits);
}


// Attach the event listener (runs whenever the slider moves)
if (timeSlider) {
  timeSlider.addEventListener('input', onTimeSliderChange);
}

// Draw the initial scatter plot once
renderScatterPlot(data, commits);

// Initialize the slider display & filtered view once the plot exists
if (timeSlider && timeDisplay) {
  timeSlider.value = commitProgress; // start at 100%
  onTimeSliderChange();
}

// Lab 8 – Step 3.3: use Scrollama so scrolling updates the plot
function onStepEnter(response) {
  // Each .step <div> has its commit stored as __data__
  const commit = response.element?.__data__;
  const datetime = commit?.datetime;
  if (!datetime) return;

  // 1) Convert this commit's time into a 0–100 "progress" value
  commitProgress = timeScale(datetime);

  // 2) Move the slider thumb to match (keeps UI in sync)
  if (timeSlider) {
    timeSlider.value = commitProgress;
  }

  // 3) Reuse the same logic as the slider:
  //    updates commitMaxTime, filteredCommits, scatter plot, file dots, etc.
  onTimeSliderChange();
}

const scroller = scrollama();

scroller
  .setup({
    container: '#scrolly-1',      // the overall scrolly section
    step: '#scrolly-1 .step',     // each commit text block
  })
  .onStepEnter(onStepEnter);
