// SVG dimensions
var w = 750;
var h = 570;
var padding = 40;

// Define SVG
var svg = d3.select('#marathon-viz')
  .append('svg')
  .attr('id', 'marathon-svg')
  .attr('width', w)
  .attr('height', h);

// Read data
var parseYear = d3.timeParse('%Y');
var formatTime = d3.timeFormat('%Y');

// Calculate finishing time in minutes from string representation
var parseFinishingTime = function (str) {
  var timestamp = d3.timeParse('%H.%M.%S')(str);
  var timestampMinutes = timestamp.getHours() * 60 + timestamp.getMinutes() + 1 / 60 * timestamp.getSeconds();
  return timestampMinutes;
};

// Render finishing time as string
var formatFinishingTime = function (time) {
  var h = Math.floor(time / 60);
  time %= 60;
  var m = Math.floor(time);
  time -= m;
  var s = Math.floor(time * 60);

  return `${h}h${m}m${s}s`;
};

var rowConverter = function (r) {
  return {
    year: parseYear(r.Year),
    athlete: r.Athlete,
    country: r.Country,
    time: parseFinishingTime(r.Time),
    sex: r.Sex,
  };
};

d3.csv('./data/olympic_merged.csv', rowConverter, (dataset) => {
  // Split dataset by gender
  maleRunners = dataset.filter(runner => runner.sex === 'm');
  femaleRunners = dataset.filter(runner => runner.sex === 'f');

  var startDate = d3.min(dataset, d => d.year);
  var endDate = d3.max(dataset, d => d.year);

  // Scales
  var xScale = d3.scaleTime()
    .domain([
      d3.timeYear.offset(startDate, -10),
      d3.timeYear.offset(endDate, 10),
    ])
    .range([padding, w - padding]);

  var yScale = d3.scaleLinear()
    .domain([
      d3.min(dataset, d => d.time) - 10,
      d3.max(dataset, d => d.time) + 10,
    ])
    .range([h - padding, padding]);

  // Axes
  var xAxis = d3.axisBottom()
    .scale(xScale)
    .ticks(d3.timeYear.every(20));

  var xAxisGroup = svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0, ${h - padding})`)
    .call(xAxis);

  // svg.append('text')
  //   .attr('class', 'axis-label')
  //   .attr('x', w / 2)
  //   .attr('y', h - 10)
  //   .text('Year');

  var yAxis = d3.axisLeft()
    .scale(yScale);

  var yAxisGroup = svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(${padding}, 0)`)
    .call(yAxis);

  // svg.append('text')
  //   .attr('class', 'axis-label')
  //   .attr('transform', 'rotate(-90)')
  //   .attr('y', 20)
  //   .attr('x', -h / 2)
  //   .text('Time in minutes');

  var maleGroup = svg.append('g')
    .attr('id', 'male-runners');
  var femaleGroup = svg.append('g')
    .attr('id', 'female-runners');

  // Define line generator
  var line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.time));

  // Draw paths to connect the datapoints. Create these before datapoints
  // to draw datapoints on top.
  var malePath = maleGroup.append('path')
    .attr('class', 'male')
    .datum(maleRunners)
    .attr('d', line);
  var femalePath = femaleGroup.append('path')
    .attr('class', 'female')
    .datum(femaleRunners)
    .attr('d', line);

  // Plot point properties
  var maleProps = {
    dim: {
      w: 5,
      h: 5,
    },
  };

  var femaleProps = {
    dim: {
      r: 2.5,
    },
  };

  var mouseOverHandler = function handleMouseOverOnPlotPoint(d, i, nodes) {
    // Get absolute (DOM) positions of elements in SVG element
    var boundingRect = nodes[i].getBoundingClientRect();

    var xPosition = boundingRect.left;
    var yPosition = boundingRect.top;

    var tooltip = d3.select('#tooltip');
    var ttXOffset = -parseInt(tooltip.style('width')) / 2;

    console.log(xPosition, ttXOffset);

    // Style tooltip
    tooltip.style('left', xPosition + ttXOffset - 10 + 'px')
      .style('top', 10 + yPosition + 'px')
      .select('#name')
      .text(d.athlete);

    tooltip.select('#year')
      .text(d.year.getFullYear());

    tooltip.select('#country')
      .text(d.country);

    // debugging

    tooltip.select('#time')
      .text(formatFinishingTime(d.time));

    tooltip.select('#sex')
      .text(d.sex === 'm' ? 'male' : 'female');

    // Show tooltip
    tooltip.classed('hidden', false);
  };

  var mouseOutHandler = function handleMouseOutOnPlotPoint(d, i, nodes) {
    d3.select('#tooltip').classed('hidden', true);
  };

  var malePoints = maleGroup.selectAll('rect')
    .data(maleRunners)
    .enter()
    .append('rect')
    .attr('class', 'male plot-point')
    // x and y positions are adjusted so that rectangle is centered on data value
    .attr('x', (d) => {
      return xScale(d.year) - .5 * maleProps.dim.w;
    })
    .attr('y', (d) => {
      return yScale(d.time) - .5 * maleProps.dim.h;
    })
    .attr('width', maleProps.dim.w)
    .attr('height', maleProps.dim.h)
    .on('mouseover', mouseOverHandler)
    .on('mouseout', mouseOutHandler);

  var femalePoints = femaleGroup.selectAll('circle')
    .data(femaleRunners)
    .enter()
    .append('circle')
    .attr('class', 'female plot-point')
    .attr('cx', d => xScale(d.year))
    .attr('cy', d => yScale(d.time))
    .attr('r', femaleProps.dim.r)
    .on('mouseover', mouseOverHandler)
    .on('mouseout', mouseOutHandler);

  // Add regression lines

  // Initialize regressor functions using data from Python
  var regression = function regressionClosure(coeff, intersect) {
    return function performRegression(x) {
      return coeff * x.getFullYear() + intersect;
    };
  };

  var regressMale = regression(-0.32156093953638193, 770.5288655566775);
  var regressFemale = regression(-1.9131856378915035, 3954.058174178729);

  // Declare domains for regression lines
  var m = maleRunners.filter(runner => runner.year.getFullYear() < 2000);
  var f = femaleRunners.filter(runner => runner.year.getFullYear() < 2000);

  var oldestMale = d3.min(m, d => d.year);
  var newestMale = d3.max(m, d => d.year);

  var oldestFemale = d3.min(f, d => d.year);
  var newestFemale = d3.max(f, d => d.year);

  var maleRegressionLine = maleGroup.append('line')
    .attr('id', 'male-regression-line')
    .attr('class', 'male regression')
    .attr('x1', xScale(oldestMale))
    .attr('x2', xScale(newestMale))
    .attr('y1', yScale(regressMale(oldestMale)))
    .attr('y2', yScale(regressMale(newestMale)));

  var femaleRegressionLine = femaleGroup.append('line')
    .attr('id', 'female-regression-line')
    .attr('class', 'female regression')
    .attr('x1', xScale(oldestFemale))
    .attr('x2', xScale(newestFemale))
    .attr('y1', yScale(regressFemale(oldestFemale)))
    .attr('y2', yScale(regressFemale(newestFemale)));

  var maleHidden = false;
  var femaleHidden = false;

  d3.select('body').select('#legend-male')
    .on('click', () => {
      maleHidden = !maleHidden;
      maleGroup.classed('hidden', maleHidden);
    });

  d3.select('body').select('#legend-female')
    .on('click', () => {
      femaleHidden = !femaleHidden;
      femaleGroup.classed('hidden', femaleHidden);
    });

  // Labeling
  maleGroup.append('text')
    .text('Men')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 13)
    .attr('x', 200)
    .attr('y', h - 120);

  femaleGroup.append('text')
    .text('Women')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 13)
    .attr('x', 500)
    .attr('y', h - 400);
});