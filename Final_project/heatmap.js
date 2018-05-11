//Margin conventions

var margin = { top: 60, right: 50, bottom: 35, left: 227 };
var colors = { stops: "#973490", stopsKnown: "#E96A8D", stopsHover: "#B8428C", stopsKnownHover: "#EE8B97" };
zipToBeLoaded = 78702;
var widther = window.outerWidth;
var width = widther - margin.left - margin.right,
  height = 250 - margin.top - margin.bottom;


var barHeight = height / 10;

// Define the div for the tooltip
var div = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

//Appends the svg to the chart-container div
var svg = d3.select(".heatmap").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// Define projection
let projection = d3.geoMercator()
  .translate([300, 250])
  .center(austinCenter)
  .scale([40000]);



// Define path
let path = d3.geoPath()
  .projection(projection);



let map = d3.select('#left-viz')
  .append('svg')
  .attr('width', mapDims.w)
  .attr('height', mapDims.h)
  .append('g');


var formatComma = d3.format(".1f");

d3.json(zipCodeAreasPath, (err, areasFeatureCollection) => {
  if (err) {
    throw err;
  }

  let arrestsRowConverter = function (d) {
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
      searched: d.PERSON_SEARCHED_DESC[d.PERSON_SEARCHED_DESC - 1] == '1', // true if yes
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


  d3.csv(arrestsDataPath, arrestsRowConverter, (err, arrests) => {
    if (err) {
      throw err;
    }

    d3.csv(zipDataPath, rowConverter, (err, zips) => {
      if (err) {
        throw err;
      }

      // DELETE BELOW
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
      // DELETE ABOVE

      


      let areaPaths = map.selectAll('path')
        .data(areas)
        .enter()
        .append('path')
        .attr('d', path)
        .style('fill', d => d.color)
        .on('click', (d) => {
          console.log(`Zip code is ${d.properties.zipcode}`);
          updateBarChart(d.properties.zipcode);
        });




    });
  });
});