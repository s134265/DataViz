let arrestsViz = function createArrestsVisualization() {
  let arrestsDataPath = './data/austin_arrests_2016.csv';
  let zipCodeDataPath = './data/austin_area_zip_codes.geojson';

  let lineDims = { w: 600, h: 150, padding: 30 };
  let barDims = { w: 700, h: 500, padding: 70 };
  let mapDims = { w: 700, h: 500 };

  let detailMapDims = { w: 700, h: 500 };

  // HELPERS //
  let formatDateAsISO = d3.timeFormat('%Y-%m-%d');
  let formatDateRange = function (lo, hi, sep = ' to ') {
    return `${formatDateAsISO(lo)}${sep}${formatDateAsISO(hi)}`;
  };
  let formatDateAsANSI = d3.timeFormat('%m/%d/%Y');

  // Set center of projection to NYC
  let austinCenter = [-97.7431, 30.2672];

  // Define projection
  let projection = d3.geoMercator()
    .translate([300, 250])
    .center(austinCenter)
    .scale([40000]);

  let detailProjection = d3.geoMercator()
    .translate([300, 250])
    .center(austinCenter)
    .scale([40000]);

  // Define path
  let path = d3.geoPath()
    .projection(projection);

  let detailPath = d3.geoPath()
    .projection(detailProjection);

  let map = d3.select('#left-viz')
    .append('svg')
    .attr('width', mapDims.w)
    .attr('height', mapDims.h)
    .append('g');

  let detailMap = d3.select('#right-viz')
    .append('svg')
    .attr('width', detailMapDims.w)
    .attr('height', detailMapDims.h)
    .attr('style', 'border: 1px solid black;');

  d3.json(zipCodeDataPath, (err, areasFeatureCollection) => {
    if (err) {
      throw err;
    }

    let rowConverter = function (d) {
      // Ignore observations with missing or otherwise falsey values
      for (const v of Object.values(d)) {
        if (!v) {
          return;
        }
      }

      return {
        date: d.REP_DATE,
        time: d.REP_TIME,
        arrestee: {
          sex: d.SEX,
          age: d.AGE_AT_OFFENSE,
          race: d.APD_RACE_DESC,
        },
        location: d.LOCATION,
        searched: d.PERSON_SEARCHED_DESC[d.PERSON_SEARCHED_DESC.length - 1] == '1', // true if yes
        reasonForStop: d.REASON_FOR_STOP_DESC,
        reasonForSearch: d.SEARCH_BASED_ON_DESC,
        foundInSearch: d.SEARCH_DISC_DESC,
        raceKnownBeforeStop: d.RACE_KNOWN,
        lat: parseFloat(d.X_COORDINATE),
        lon: parseFloat(d.Y_COORDINATE),
        sector: d.SECTOR,
        zipCode: '' + parseInt(d.ZIP_CODE),
      };
    };

    d3.csv(arrestsDataPath, rowConverter, (err, arrests) => {
      if (err) {
        throw err;
      }

      // Filter out areas in which no arrests occurred
      const arrestZipCodes = arrests.map(arrest => arrest.zipCode);
      const zipCodeSet = new Set(arrestZipCodes);

      let areas = areasFeatureCollection.features.filter((area) => {
        return zipCodeSet.has(area.properties.zipcode);
      });

      function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      }

      let randomHexColor = function () {
        let rgbColor = [0, 0, 0].map(() => Math.floor(Math.random() * 255));
        return rgbToHex(...rgbColor);
      };

      // Assign colors to areas
      // let boroughColors = ['#BA7D34', '#23CE6B', '#4286f4', '#A846A0', '#50514F'];
      for (let i = 0; i < areas.length; i++) {
        areas[i].color = randomHexColor();
      }

      let areaPaths = map.selectAll('path')
        .data(areas)
        .enter()
        .append('path')
        .attr('d', path)
        .style('fill', d => d.color)
        .on('click', (d) => {
          console.log(`Zip code is ${d.properties.zipcode}`);
          redrawDetailView(d);
        });

      const redrawDetailView = function (feature) {
        const zipCode = feature.properties.zipcode;
        console.log(`Redrawing detail view for zip code ${zipCode}`);

        let centroid = detailPath.centroid(feature);
        let geographicCenter = detailProjection.invert(centroid);

        let bounds = path.bounds(feature);
        let dx = bounds[1][0] - bounds[0][0];
        let dy = bounds[1][1] - bounds[0][1];
        let x = (bounds[0][0] + bounds[1][0]) / 2;
        let y = (bounds[0][1] + bounds[1][1]) / 2;
        let scale = 30000 * Math.max(1, Math.min(8, 0.9 / Math.max(dx / detailMapDims.w, dy / detailMapDims.h)));

        detailProjection.center(geographicCenter)
          .scale([scale]);

        detailPath.projection(detailProjection);

        // Redraw zip codes
        detailMap.selectAll('path').remove();
        detailMap.selectAll('path')
          .data([feature])
          .enter()
          .append('path')
          .attr('d', detailPath)
          .style('fill', d => d.color);

        // Redraw data points
        let datapoints = redrawDetailDataPoints(feature);
      };

      const redrawDetailDataPoints = function (feature) {
        let curArrests = arrests.filter((a) => {
          return a.zipCode === feature.properties.zipcode;
        });

        detailMap.selectAll('circle').remove();

        return detailMap.selectAll('circle')
          .data(curArrests)
          .enter()
          .append('circle')
          .attr('class', 'datapoint')
          .attr('r', '3px')
          .attr('cx', d => detailProjection([d.lon, d.lat])[0])
          .attr('cy', d => detailProjection([d.lon, d.lat])[1]);
      };

      const resetDetailDataPoints = function () {
        detailMap.selectAll('circle').remove();

        return detailMap.selectAll('circle')
          .data(arrests)
          .enter()
          .append('circle')
          .attr('class', 'datapoint')
          .attr('r', '3px')
          .attr('cx', d => detailProjection([d.lon, d.lat])[0])
          .attr('cy', d => detailProjection([d.lon, d.lat])[1]);
      };

      let detailMapAreaPaths = detailMap.selectAll('path')
        .data(areas)
        .enter()
        .append('path')
        .attr('d', detailPath)
        .style('fill', d => d.color);

      const updateDetailMap = function (centroid) {
        let geographicCenter = projection.invert(centroid);

        // Update projection and path
        detailProjection.center(geographicCenter);
        detailPath.projection(detailProjection);

        // Redraw map
        detailMapAreaPaths.attr('d', detailPath);
      };

      resetDetailDataPoints();
    });
  });
};

arrestsViz();