var murderViz = function createVisualizationOfMurders() {
  var murderDataPath = './data/all_murders.csv';
  var boroughDataPath = './data/boroughs.geojson';

  var w = 800;
  var h = 500;
  var padding = 50;

  // Set center of projection to NYC
  var nyc = [-74.0060, 40.7128];

  // Define projection
  var projection = d3.geoMercator()
    .center(nyc)
    .scale([50000]);

  var map = d3.select('body')
    .append('svg')
    .attr('width', w)
    .attr('height', h);
  var lineChart = d3.select('body')
    .append('svg')
    .attr('width', w)
    .attr('height', h);
  var barChart = d3.select('body')
    .append('svg')
    .attr('width', w)
    .attr('height', h);

  d3.json(boroughDataPath, (err, boroughs) => {
    if (err) {
      throw err;
    }

    // Define path
    var path = d3.geoPath()
      .projection(projection);

    // Assign colors to boroughs
    let boroughColors = ['#673c4f', '#7f557d', '#726e97', '#7693b3', '#83b5d1'];
    for (let i = 0; i < boroughs.features.length; i++) {
      boroughs.features[i].color = boroughColors[i];
    }

    map.selectAll('path')
      .data(boroughs.features)
      .enter()
      .append('path')
      .attr('d', path)
      .style('fill', d => d.color);

    // Parse hour from timestamp on the format hh:mm:ss
    const hourPattern = /^[^\:]*/;

    let rowConverter = function (d) {
      // Ignore observations with missing or falsey values except 0
      for (const v of Object.values(d)) {
        if (v !== 0 && !v) {
          return;
        }
      }

      return {
        idx: parseInt(d.INDEX),
        date: d.RPT_DT,
        time: parseInt(d.CMPLNT_FR_TM),
        borough: d.BORO_NM,
        lon: parseFloat(d.Longitude),
        lat: parseFloat(d.Latitude),
      };
    };

    d3.csv(murderDataPath, rowConverter, (err, murders) => {
      if (err) {
        throw err;
      }

      // Plot murder locations
      var datapoints = map.selectAll('circle')
        .data(murders)
        .enter()
        .append('circle')
        .attr('class', 'datapoint')
        .attr('cx', d => projection([d.lon, d.lat])[0])
        .attr('cy', d => projection([d.lon, d.lat])[1])
        .attr('r', 3)
        .style('stroke', 'gray')
        .style('stroke-width', 0.25)
        .style('opacity', 0.75);

      // BAR CHART //
      // Count no. of murders for each hour
      var murdersByHour = new Array(24).fill(0);
      for (const m of murders) {
        murdersByHour[m.hour]++;
      }

      // Scales
      let barScales = {
        x: d3.scaleBand()
          .domain(d3.range(24))
          .rangeRound([padding, w - padding])
          .paddingInner(0.05),
        y: d3.scaleLinear()
          .domain([0, d3.max(murdersByHour)])
          .range([h - padding, padding])
      };
      var lineScales = {
        x: d3.scaleTime()
          .domain([startDate, endDate])
          .range([padding, w - padding]),
        y: d3.scaleLinear()
          .domain([
            d3.min(murdersByDay, d => d.value),
            d3.max(murdersByDay, d => d.value),
          ])
          .range([h - padding, padding]),
      };
      var xScale = d3.scaleBand()
        .domain(d3.range(24))
        .rangeRound([padding, w - padding])
        .paddingInner(0.05);

      var yScale = d3.scaleLinear()
        .domain([0, d3.max(murdersByHour)])
        .range([h - padding, padding]);

      var xAxis = d3.axisBottom()
        .scale(xScale)
        .ticks(24)
        .tickFormat(d => d);
      barChart.append('g')
        .attr('class', 'x-axis group')
        .attr('transform', `translate(0, ${h - padding})`)
        .call(xAxis);

      var yAxis = d3.axisLeft()
        .scale(yScale);
      barChart.append('g')
        .attr('class', 'y-axis group')
        .attr('transform', `translate(${padding}, 0)`)
        .call(yAxis);

      // Define quantize scale to sort data values into buckets of color
      let barColors = ['#d3d5d4', '#a2c5ac', '#9db5b2', '#878e99', '#7f6a93'];
      let barColorScale = d3.scaleQuantize()
        .range(barColors);

      barColorScale.domain([d3.min(murdersByHour), d3.max(murdersByHour)]);

      // Define bars and labels
      var bars = barChart.selectAll('rect')
        .data(murdersByHour)
        .enter()
        .append('rect')
        .attr('x', (d, i) => xScale(i))
        .attr('y', d => yScale(d))
        .attr('width', xScale.bandwidth())
        .attr('height', d => h - yScale(d) - padding)
        .attr('fill', d => barColorScale(d));

      var labels = barChart.selectAll('.bar-label')
        .data(murdersByHour)
        .enter()
        .append('text')
        .text(d => d)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'sans-serif')
        .attr('font-size', '11px')
        .attr('x', (d, i) => {
          return xScale(i) + xScale.bandwidth() / 2;
        })
        .attr('y', (d) => {
          // threshold for moving label above bar
          let threshold = yScale.domain()[1] / 5;
          let position = yScale(d);

          let offset = (d < threshold) ? -4 : 14;

          return position + offset;
        })
        .attr('fill', (d) => {
          let threshold = yScale.domain()[1] / 5;
          return (d < threshold) ? 'black' : 'white';
        });


      // LINE PLOT //
      // Rollup murders by day. Returns array on the form:
      //   [{key: <date>, value: <count>}, {key: <date>, value: <count>}, ...]
      let murdersByDay = d3.nest()
        .key(d => d.date)
        .rollup(v => v.length)
        .entries(murders);

      // Parse date object
      const parseTime = d3.timeParse('%m/%d/%Y');

      let startDate = d3.min(murdersByDay, m => parseTime(m.key));
      let endDate = d3.max(murdersByDay, m => parseTime(m.key));

      let xScale = d3.scaleTime()
        .domain([startDate, endDate])
        .range([padding, w - padding]);
      let yScale = d3.scaleLinear()
        .domain([
          d3.min(murdersByDay, d => d.value),
          d3.max(murdersByDay, d => d.value),
        ])
        .range([h - padding, padding]);

      let xAxis = d3.axisBottom()
        .scale(xScale)
        .ticks(d3.timeYear.every(1));
      let xAxisGroup = lineChart.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${h - padding})`)
        .call(xAxis);

      let yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(5);
      let yAxisGroup = lineChart.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(${padding}, 0)`)
        .call(yAxis);

      // Sort ascending
      murdersByDay = murdersByDay.sort(function (x, y) {
        return d3.ascending(parseTime(x.key), parseTime(y.key));
      });

      // Sort with respect to date
      let sortedByDate = murdersByDay.sort((x, y) => {
        return d3.ascending(parseTime(x.key), parseTime(y.key));
      });

      let line = d3.line()
        .x(d => xScale(parseTime(d.key)))
        .y(d => yScale(d.value));

      let path = lineChart.append('path')
        .datum(sortedByDate)
        .attr('class', 'line')
        .attr('d', line);


      // BRUSH //

      let reset = function resetDatapoints(d, i, nodes) {
        // If selection is still active, e.g. selection was clicked by user, pass.
        if (d3.event.selection) {
          return;
        }

        console.log('Selection removed; resetting brush');

        // Revert circles to initial style
        datapoints.classed('brushed', false);
        datapoints.classed('non-brushed', false);
      };

      let isBrushed = function (brushCoords, x) {
        let x0 = brushCoords[0];
        let x1 = brushCoords[1];

        return x0 <= x && x <= x1;
      };

      let onBrush = function brushHandler() {
        if (!d3.event.selection) {
          return;
        }

        console.log('brushing');

        // Revert circles to initial style
        datapoints.classed('brushed', false);
        datapoints.classed('non-brushed', false);

        let brushCoords = d3.brushSelection(this);

        // Style brushed circles
        let brushed = [];
        let nonBrushed = [];
        for (const n of datapoints.nodes()) {
          let date = d3.select(n).datum().date;
          let x = xScale(parseTime(date));

          if (isBrushed(brushCoords, x)) {
            brushed.push(n);
          } else {
            nonBrushed.push(n);
          }
        }

        d3.selectAll(brushed).classed('brushed', true);
        d3.selectAll(nonBrushed).classed('non-brushed', true);
      };

      let brush = d3.brushX()
        .extent([[padding, padding], [w - padding, h - padding]])
        .on('brush', onBrush)
        .on('end', reset);

      let brushGroup = lineChart.append('g')
        .attr('class', 'brush')
        .call(brush);

      // Animation button
      d3.select('#animate-button')
        .on('click', () => {
          // Set coordinates of brush window
          console.log('moving brush');

          const selectionWidth = 100;
          const bounds = {
            start: [padding, padding + selectionWidth],
            end: [w - padding - selectionWidth, w - padding],
          };

          brushGroup.call(brush.move, bounds.start)
            .transition()
            .ease(d3.easeLinear)
            .duration(2000)
            .call(brush.move, bounds.end);
        });

      // 
    });
  });
};

murderViz();