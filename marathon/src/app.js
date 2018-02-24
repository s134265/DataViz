// SVG dimensions
var w = 750;
var h = 570;
var padding = 40;
var margin = { x: 80, y: 50 };

var transitionOrder = {
  first: 0,
  second: 1500,
  third: 3000,
  fourth: 4500,
};

// Define SVG
var svg = d3.select('#marathon-viz')
  .append('svg')
  .attr('id', 'marathon-svg')
  .attr('width', w + margin.x)
  .attr('height', h + margin.y)
  // .attr('height', h)
  .append('g')
  .attr('transform', `translate(${margin.x / 2}, 0)`);

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

  return `${h}h ${m}m ${s}s`;
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

  svg.append('text')
    .attr('class', 'axis-label')
    .attr('x', w / 2)
    .attr('y', h + 5)
    .text('Year');

  var yAxis = d3.axisLeft()
    .scale(yScale);

  var yAxisGroup = svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(${padding}, 0)`)
    .call(yAxis);

  svg.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    // swap directions because element was rotated
    .attr('y', -10)
    .attr('x', -h / 2)
    .text('Time in minutes');

  var maleGroup = svg.append('g')
    .attr('id', 'male-runners');
  var femaleGroup = svg.append('g')
    .attr('id', 'female-runners');

  // Define line generator
  var line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.time));

  var malePath = maleGroup.append('path')
    .attr('class', 'male')
    .datum(maleRunners)
    .attr('d', line);

  var femalePath = femaleGroup.append('path')
    .attr('class', 'female')
    .datum(femaleRunners)
    .attr('d', line);

  var showPath = function (path) {
    var totalLength = path.node().getTotalLength();

    path.attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .delay(transitionOrder.second)
      .attr('stroke-dashoffset', 0);
  };

  var hidePath = function (path) {
    var totalLength = path.node().getTotalLength();

    path.attr('stroke-dashoffset', 0)
      .transition()
      .duration(1500)
      .delay(transitionOrder.second)
      .attr('stroke-dashoffset', -totalLength)
  }

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

    // apply offset to center tooltip horizontically on plotpoint
    var ttXOffset = -parseInt(tooltip.style('width')) / 2;

    // Style tooltip
    tooltip.style('left', xPosition + ttXOffset - 10 + 'px')
      .style('top', 10 + yPosition + 'px')
      .select('#name')
      .text(d.athlete);

    tooltip.select('#year')
      .text(d.year.getFullYear());

    tooltip.select('#country')
      .text(d.country);

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
    .attr('opacity', 0)
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
    .attr('opacity', 0)
    .attr('cx', d => xScale(d.year))
    .attr('cy', d => yScale(d.time))
    .attr('r', femaleProps.dim.r)
    .on('mouseover', mouseOverHandler)
    .on('mouseout', mouseOutHandler);

  var showPoints = function (points) {
    points.transition()
      .delay((d, i) => 10 * i)
      .ease(d3.easeCircleOut)
      .attr('opacity', 1);
  };

  var hidePoints = function (points) {
    points.transition()
      .duration(transitionOrder.third)
      .delay((d, i) => 10 * i)
      .ease(d3.easeCircleIn)
      .attr('opacity', 0);
  };

  // REGRESSION //

  // Initialize linear functions using data from Python and currying in JS
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

  // Define start and end points for regression lines 
  // for both groups of plot points
  var regressionPoints = {
    male: {
      start: { x: xScale(oldestMale), y: yScale(regressMale(oldestMale)) },
      end: { x: xScale(newestMale), y: yScale(regressMale(newestMale)) },
    },
    female: {
      start: { x: xScale(oldestFemale), y: yScale(regressFemale(oldestFemale)) },
      end: { x: xScale(newestFemale), y: yScale(regressFemale(newestFemale)) },
    },
  };

  // Initialize lines. These aren't shown until showRegressionLine is called
  var maleRegressionLine = maleGroup.append('line')
    .attr('id', 'male-regression-line')
    .attr('class', 'male regression');

  var femaleRegressionLine = femaleGroup.append('line')
    .attr('id', 'female-regression-line')
    .attr('class', 'female regression');

  var showRegressionLine = function (rl, startPoint, endPoint) {
    rl.attr('x1', startPoint.x)
      .attr('y1', startPoint.y)
      .attr('x2', startPoint.x)
      .attr('y2', startPoint.y)
      .transition()
      .duration(1500)
      .delay(transitionOrder.third)
      .attr('x2', endPoint.x)
      .attr('y2', endPoint.y);
  };

  var hideRegressionLine = function (rl, startPoint, endPoint) {
    rl.transition()
      .duration(1500)
      // .delay(transitionOrder.third)
      .attr('x1', endPoint.x)
      .attr('y1', endPoint.y)
      .attr('x2', endPoint.x)
      .attr('y2', endPoint.y);
  };

  // Labeling
  var maleGroupLabel = maleGroup.append('text')
    .text('Men')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 11)
    .attr('x', 200)
    .attr('y', h - 120)
    .attr('opacity', 0);

  var femaleGroupLabel = femaleGroup.append('text')
    .text('Women')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 11)
    .attr('x', 500)
    .attr('y', h - 400)
    .attr('opacity', 0);

  var showGroupLabel = function (gl) {
    gl.transition()
      .duration(1000)
      .attr('opacity', 1);
  };

  var hideGroupLabel = function (gl) {
    gl.transition()
      .duration(1000)
      .delay(transitionOrder.fourth)
      .attr('opacity', 0);
  }

  var maleHidden = false;
  var femaleHidden = false;

  var showMaleGroup = function () {
    showPoints(malePoints);
    showRegressionLine(maleRegressionLine, regressionPoints.male.start, regressionPoints.male.end);
    showPath(malePath);
    showGroupLabel(maleGroupLabel);
  };

  var hideMaleGroup = function () {
    hidePoints(malePoints);
    hideRegressionLine(maleRegressionLine, regressionPoints.male.start, regressionPoints.male.end);
    hidePath(malePath);
    hideGroupLabel(maleGroupLabel);
  };

  var showFemaleGroup = function () {
    showPoints(femalePoints);
    showRegressionLine(femaleRegressionLine, regressionPoints.female.start, regressionPoints.female.end);
    showPath(femalePath);
    showGroupLabel(femaleGroupLabel);
  };

  var hideFemaleGroup = function () {
    hidePoints(femalePoints);
    hideRegressionLine(femaleRegressionLine, regressionPoints.female.start, regressionPoints.female.end);
    hidePath(femalePath);
    hideGroupLabel(femaleGroupLabel);
  };

  // Position legend table
  d3.select('body').select('#legend')
    .style('right', 0)
    .style('top', parseInt((h + margin.y) / 2) + 'px')
    .classed('hidden', false);

  d3.select('body').select('#legend-male')
    .on('click', (d, i, nodes) => {
      maleHidden = !maleHidden;
      // Show grey font if runners are hidden, black if not
      d3.select(nodes[i]).style('color', maleHidden ? 'gray' : 'black')

      if (maleHidden) {
        hideMaleGroup();
      } else {
        showMaleGroup();
      }
    });

  d3.select('body').select('#legend-female')
    .on('click', (d, i, nodes) => {
      femaleHidden = !femaleHidden;
      // Show grey font if runners are hidden, black if not
      d3.select(nodes[i]).style('color', femaleHidden ? 'gray' : 'black');

      if (femaleHidden) {
        hideFemaleGroup();
      } else {
        showFemaleGroup();
      }
    });

  showMaleGroup();
  showFemaleGroup();

});