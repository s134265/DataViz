let murderViz = function createVisualizationOfMurders() {
  let murderDataPath = './data/all_murders.csv';
  let boroughDataPath = './data/boroughs.geojson';

  let w = 800;
  let h = 500;
  let padding = 50;

  let selectionDomainLabel = d3.select('#selection-domain');

  // Set center of projection to NYC
  let nyc = [-74.0060, 40.7128];

  // Define projection
  let projection = d3.geoMercator()
    .center(nyc)
    .scale([50000]);

  let boroughLabelPositions = {
    'manhattan': {
      x: '45%',
      y: '35%',
    },
    'staten island': {
      x: '45%',
      y: '50%',
    },
    'brooklyn': {
      x: '65%',
      y: '92%',
    },
    'queens': {
      x: '95%',
      y: '50%',
    },
    'bronx': {
      x: '95%',
      y: '20%',
    },
  };

  let map = d3.select('body')
    .append('svg')
    .attr('width', w)
    .attr('height', h)
    .on('click', () => {
      // This is used for assigning positions to labels
      let coords = d3.mouse(map.node());
      console.log({
        x: `${coords[0] / w * 100}%`,
        y: `${coords[1] / h * 100}%`,
      });
    });

  let lineChart = d3.select('body')
    .append('svg')
    .attr('width', w)
    .attr('height', h);
  let barChart = d3.select('body')
    .append('svg')
    .attr('width', w)
    .attr('height', h);

  let selectionDomainLabel = d3.select('#selection-domain')
    .text('all');

  d3.json(boroughDataPath, (err, boroughs) => {
    if (err) {
      throw err;
    }

    // Define path
    let path = d3.geoPath()
      .projection(projection);

    // Assign colors to boroughs
    let boroughColors = ['#BA7D34', '#23CE6B', '#4286f4', '#A846A0', '#50514F'];
    for (let i = 0; i < boroughs.features.length; i++) {
      boroughs.features[i].color = boroughColors[i];
    }

    let boroughPaths = map.selectAll('path')
      .data(boroughs.features)
      .enter()
      .append('path')
      .attr('d', path)
      .style('fill', d => d.color);

    for (const f of boroughs.features) {
      let boroughName = f.properties.BoroName;
      let centroid = path.centroid(f);

      let boroughLabel = map.append('text')
        .attr('class', 'borough-label')
        .text(boroughName)
        .attr('x', centroid[0])
        .attr('y', centroid[1]);
    }

    // Parse hour from timestamp on the format hh:mm:ss
    const hourPattern = /^[^\:]*/;

    let counter = 0;
    let rowConverter = function (d) {
      // Ignore observations with missing or otherwise falsey values
      for (const v of Object.values(d)) {
        if (!v) {
          return;
        }
      }

      return {
        idx: parseInt(d.INDEX),
        date: d.RPT_DT,
        hour: parseInt(d.CMPLNT_FR_TM),
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
      let datapoints = map.selectAll('circle')
        .data(murders)
        .enter()
        .append('circle')
        .attr('class', 'datapoint')
        .attr('cx', d => projection([d.lon, d.lat])[0])
        .attr('cy', d => projection([d.lon, d.lat])[1])
        .attr('r', 3)
        .style('stroke', 'black')
        .style('stroke-width', 0.25)
        .style('opacity', 0.75);

      // Count no. of murders for each hour
      let murdersByHour = new Array(24).fill(0);
      for (const m of murders) {
        murdersByHour[m.hour]++;
      }

      let maxMurdersByHour = d3.max(murdersByHour);
      // Scales and axes
      let barScales = {
        x: d3.scaleBand()
          .domain(d3.range(24))
          .rangeRound([padding, w - padding])
          .paddingInner(0.05),
        y: d3.scaleLinear()
          .domain([0, maxMurdersByHour])
          .range([h - padding, padding]),
      };
      let barAxes = {
        x: d3.axisBottom()
          .scale(barScales.x)
          .ticks(24)
          .tickFormat(d => d),
        y: d3.axisLeft()
          .scale(barScales.y),
      };

      // Parse date object
      const parseTime = d3.timeParse('%m/%d/%Y');

      // Sum murders by day. Returns array on the form:
      //   [{key: <date>, value: <count>}, {key: <date>, value: <count>}, ...]
      let murdersByDay = d3.nest()
        .key(d => d.date)
        .rollup(v => v.length)
        .entries(murders);

      let startDate = d3.min(murdersByDay, m => parseTime(m.key));
      let endDate = d3.max(murdersByDay, m => parseTime(m.key));

      let lineScales = {
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
      let lineAxes = {
        x: d3.axisBottom()
          .scale(lineScales.x)
          .ticks(d3.timeYear.every(1)),
        y: d3.axisLeft()
          .scale(lineScales.y)
          .ticks(5),
      };

      // Add axes to viz
      barChart.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${h - padding})`)
        .call(barAxes.x);
      barChart.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(${padding}, 0)`)
        .call(barAxes.y);

      lineChart.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${h - padding})`)
        .call(lineAxes.x);
      lineChart.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(${padding}, 0)`)
        .call(lineAxes.y);

      // BAR CHART //
      // Define quantize scale to sort data values into buckets of color
      let barColors = ['#d3d5d4', '#a2c5ac', '#9db5b2', '#878e99', '#7f6a93'];
      let barColorScale = d3.scaleQuantize()
        .range(barColors);

      barColorScale.domain([d3.min(murdersByHour), maxMurdersByHour]);

      // Define bars and labels
      let bars = barChart.selectAll('rect')
        .data(murdersByHour)
        .enter()
        .append('rect')
        .attr('x', (d, i) => barScales.x(i))
        .attr('y', d => barScales.y(d))
        .attr('width', barScales.x.bandwidth())
        .attr('height', d => h - barScales.y(d) - padding)
        .attr('fill', d => barColorScale(d));

      let labels = barChart.selectAll('.bar-label')
        .data(murdersByHour)
        .enter()
        .append('text')
        .text(d => d)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'sans-serif')
        .attr('font-size', '11px')
        .attr('x', (d, i) => {
          return barScales.x(i) + barScales.x.bandwidth() / 2;
        })
        .attr('y', (d) => {
          // threshold for moving label above bar
          let threshold = barScales.y.domain()[1] / 5;
          let position = barScales.y(d);

          let offset = (d < threshold) ? -4 : 14;

          return position + offset;
        })
        .attr('fill', (d) => {
          let threshold = barScales.y.domain()[1] / 5;
          return (d < threshold) ? 'black' : 'white';
        });

      // LINE CHART //
      // Sort with respect to date
      let sortedByDate = murdersByDay.sort((x, y) => {
        return d3.ascending(parseTime(x.key), parseTime(y.key));
      });

      let line = d3.line()
        .x(d => lineScales.x(parseTime(d.key)))
        .y(d => lineScales.y(d.value));

      let path = lineChart.append('path')
        .datum(sortedByDate)
        .attr('class', 'line')
        .attr('d', line);

      // LINE CHART BRUSH //
      let reset = function resetDatapoints(d, i, nodes) {
        // If selection is still active, e.g. selection was clicked by user, pass.
        if (d3.event.selection) {
          return;
        }

        // Revert circles to initial style
        datapoints.classed('brushed', false);
        datapoints.classed('non-brushed', false);

        // Update y scale domain
        barScales.y.domain([0, maxMurdersByHour]);

        barColorScale.domain([
          d3.min(murdersByHour),
          maxMurdersByHour,
        ]);

        // Apply new y axis with transition
        barChart.selectAll('.y-axis')
          .call(barAxes.y);

        // Update bars
        bars.data(murdersByHour)
          .attr('x', (d, i) => barScales.x(i))
          .attr('y', d => barScales.y(d))
          .attr('height', d => h - barScales.y(d) - padding)
          .attr('fill', d => barColorScale(d));

        // Update labels
        labels.data(murdersByHour)
          .text(d => d)
          .attr('text-anchor', 'middle')
          .attr('x', (d, i) => {
            return barScales.x(i) + barScales.x.bandwidth() / 2;
          })
          .attr('y', (d) => {
            // threshold for moving label above bar
            let threshold = barScales.y.domain()[1] / 5;
            let position = barScales.y(d);

            let offset = (d < threshold) ? -4 : 14;

            return position + offset;
          })
          .attr('fill', (d) => {
            let threshold = barScales.y.domain()[1] / 5;
            return (d < threshold) ? 'black' : 'white';
          });
      };

      let isBrushed = function (brushCoords, x) {
        let x0 = brushCoords[0];
        let x1 = brushCoords[1];

        return x0 <= x && x <= x1;
      };

      let clamp = function (n, lo, hi) {
        if (n < lo) {
          return lo;
        } else if (n > hi) {
          return hi;
        }

        return n;
      };

      let lastSelectionWidth = 0;

      let selectionWidth = function getWidthOfCurrentSelection() {
        let s = d3.event.selection;
        return Math.abs(s[0] - s[1]);
      };

      let onBrush = function brushHandler() {
        // If selection is not active, return.
        if (!d3.event.selection) {
          return;
        }

        let brushCoords = d3.brushSelection(this);

        // Style brushed circles
        let brushed = [];
        let nonBrushed = [];
        for (const n of datapoints.nodes()) {
          let date = d3.select(n).datum().date;
          let x = lineScales.x(parseTime(date));

          if (isBrushed(brushCoords, x)) {
            brushed.push(n);
          } else {
            nonBrushed.push(n);
          }
        }

        // Map viz update
        let selectBrushed = d3.selectAll(brushed);
        let selectNonBrushed = d3.selectAll(nonBrushed);
        selectBrushed.classed('non-brushed', false)
          .classed('brushed', true);

        selectNonBrushed.classed('non-brushed', true)
          .classed('brushed', false);

        // Bar chart update
        // Count selected datapoints by hour
        let selectedData = selectBrushed.data();
        let murdersByHourSelection;
        if (selectedData.length !== 0) {
          murdersByHourSelection = new Array(24).fill(0);
          for (const m of selectedData) {
            murdersByHourSelection[m.hour]++;
          }
        } else {
          // If no data was selected => plot all murders
          murdersByHourSelection = murdersByHour;
        }

        // Update y scale domain **only** if the width of the selection changed.
        // Keep the scale the same if the user is merely moving the brush window.
        let sw = selectionWidth();
        if (lastSelectionWidth !== sw) {
          lastSelectionWidth = sw;
          let scalingFactor = sw / w;
          let upperBound = 2 * maxMurdersByHour * scalingFactor;

          // Don't go beneath 20 or above global max
          barScales.y.domain([
            0,
            clamp(upperBound, 30, maxMurdersByHour),
          ]);

          barColorScale.domain([
            d3.min(murdersByHourSelection),
            d3.max(murdersByHourSelection),
          ]);

          // Apply new y axis with transition
          barChart.selectAll('.y-axis')
            .transition()
            .duration(50)
            .call(barAxes.y);
        }

        // Update bars
        bars.data(murdersByHourSelection)
          .transition()
          .duration(50)
          .attr('x', (d, i) => barScales.x(i))
          .attr('y', d => barScales.y(d))
          .attr('height', d => h - barScales.y(d) - padding)
          .attr('fill', d => barColorScale(d));

        // Update labels
        labels.data(murdersByHourSelection)
          .transition()
          .duration(50)
          .text(d => d)
          .attr('text-anchor', 'middle')
          .attr('x', (d, i) => {
            return barScales.x(i) + barScales.x.bandwidth() / 2;
          })
          .attr('y', (d) => {
            // threshold for moving label above bar
            let threshold = barScales.y.domain()[1] / 5;
            let position = barScales.y(d);

            let offset = (d < threshold) ? -4 : 14;

            return position + offset;
          })
          .attr('fill', (d) => {
            let threshold = barScales.y.domain()[1] / 5;
            return (d < threshold) ? 'black' : 'white';
          });
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