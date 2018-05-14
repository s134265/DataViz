//Margin conventions
let zipDataPath = '/data/zip_specific_stats.csv';
let arrestsDataPath = './data/austin_arrests_2016.csv';
let zipCodeAreasPath = './data/austin_area_zip_codes.geojson';
let classDataPath = './data/2014_Housing_Market_Analysis_Data_by_Zip_Code_with_Classes.csv'

var margin = { top: 60, right: 50, bottom: 35, left: 227 };
var colors = { stops: "#973490", stopsKnown: "#E96A8D", stopsHover: "#B8428C", stopsKnownHover: "#EE8B97" };
zipToBeLoaded = 78702;
var widther = window.outerWidth;
var width = widther - margin.left - margin.right,
  height = 250 - margin.top - margin.bottom;

let mapDims = { w: 700, h: 500 };
let detailMapDims = { w: 700, h: 500 };
let heatMapDims = { w: 700, h: 500 };

var barHeight = height / 10;

// Define the div for the tooltip
var div = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

var div2 = d3.select("body").append("div")
  .attr("class", "tooltips")
  .style("opacity", 0);

//Appends the svg to the chart-container div
var svg = d3.select(".g-chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var svgHeat = d3.select(".heatmap").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// Map definitions
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

let heatProjection = d3.geoMercator()
  .translate([300, 250])
  .center(austinCenter)
  .scale([40000]);

// Define path
let path = d3.geoPath()
  .projection(projection);

let detailPath = d3.geoPath()
  .projection(detailProjection);

let heatPath = d3.geoPath()
  .projection(heatProjection)

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

let heatMap = d3.select('#heat')
  .append('svg')
  .attr('width', heatMapDims.w)
  .attr('height', heatMapDims.h)

//Title
percentageBarChartTitle = svg.append('text')
  .attr("x", (width / 2))
  .attr("y", -margin.top / 1.3)
  .attr("text-anchor", "middle")
  .text("Percentage of stops by race for selected zip-code: " + zipToBeLoaded)
  .attr('class', 'title');


names = ["Race unknown", "Race known"];

legend = svg.selectAll(".legend")
  .data(names)
  .enter()
  .append('text')
  .text(function (d, i) {
    return d;
  })
  .attr('x', function (d, i) { return (150 * i) })
  .attr("y", function (d, i) {
    return (-margin.top / 3);
  })
  .attr("text-anchor", "left")
  .style("font-size", "16px")
  .attr('class', 'legend');

legendCircles = svg.selectAll('.legendCircles')
  .data(names)
  .enter()
  .append('circle')
  .attr("cx", function (d, i) {
    return (150 * i - 10);
  })
  .attr("cy", function (d, i) {
    return (-margin.top / 2.3);
  })
  .attr('r', 4)
  .attr('fill', function (d, i) {
    var color;
    if (i == 0) {
      color = colors.stops;
    }
    else {
      color = colors.stopsKnown;
    }

    return (color);
  })


//Creates the xScale 
var xScale = d3.scaleLinear()
  .range([0, width]);

//Creates the yScale
var y0 = d3.scaleBand()
  .range([height, 0], 0)
  .domain(["white", "hispanic_or_latino", "black", "asian", "middle_eastern", "unknown", "hawaiian_pacific_islander", "american_indian_alaskan_native"]);

//Defines the y axis styles
var yAxis = d3.axisLeft()
  .scale(y0);

//Defines the y axis styles
var xAxis = d3.axisBottom()
  .scale(xScale)
  .tickFormat(function (d) { return d + "%"; })
  .tickSize(height);

let rowConverter = function (d) {
  // Ignore observations with missing or otherwise falsey values
  for (const v of Object.values(d)) {
    if (!v) {
      return;
    }
  }
  return {
    zip: parseInt(d.zip),
    white: parseInt(d.WHITE),
    hispanic_or_latino: parseInt(d.HISPANIC_OR_LATINO),
    black: parseInt(d.BLACK),
    asian: parseInt(d.ASIAN),
    middle_eastern: parseInt(d.MIDDLE_EASTERN),
    unknown: parseInt(d.UNKNOWN),
    hawaiian_pacific_islander: parseInt(d.HAWAIIAN_PACIFIC_ISLANDER),
    american_indian_alaskan_native: parseInt(d.AMERICAN_INDIAN_ALASKAN_NATIVE),
    whiteisRaceKnown: parseInt(d.WHITEisRaceKnown),
    hispanic_or_latinoisRaceKnown: parseInt(d.HISPANIC_OR_LATINOisRaceKnown),
    blackisRaceKnown: parseInt(d.BLACKisRaceKnown),
    asianisRaceKnown: parseInt(d.ASIANisRaceKnown),
    middle_easternisRaceKnown: parseInt(d.MIDDLE_EASTERNisRaceKnown),
    unknownisRaceKnown: parseInt(d.UNKNOWNisRaceKnown),
    hawaiian_pacific_islanderisRaceKnown: parseInt(d.HAWAIIAN_PACIFIC_ISLANDERisRaceKnown),
    american_indian_alaskan_nativeisRaceKnown: parseInt(d.AMERICAN_INDIAN_ALASKAN_NATIVEisRaceKnown)
  };
};

//Appends the y axis
var yAxisGroup = svg.append("g")
  .attr("class", "y axis")
  .call(yAxis);

//Appends the x axis    
var xAxisGroup = svg.append("g")
  .attr("class", "x axis")
  .call(xAxis);

let rowExtractor = function (zipToFind, zips) {
  var select = document.getElementById("selectNumber");
  var options = ["1", "2", "3", "4", "5"];
  zipList = [];
  for (let i = 0; i < zips.length; i++) {
    zipList.push(zips[i].zip)
    if (zips[i].zip == zipToFind) {
      rowIndex = i
    }
  }
  return rowIndex;
}
let convertRowToObject = function (row, keyStartIndex, keyEndIndex) {
  var data = []
  var totalStops = row.white + row.black + row.hispanic_or_latino + row.asian + row.middle_eastern + row.unknown + row.hawaiian_pacific_islander + row.american_indian_alaskan_native;
  var keys = Object.keys(row)
  var categories = keys.slice(keyStartIndex, keyEndIndex);
  for (let i = 0; i < categories.length; i++) {
    normalizedNum = row[categories[i]] / totalStops * 100;
    data.push({ "race": categories[i], "num": normalizedNum, "num2": 100 });
  }
  return (data)
}

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

      // Filter out areas in which no arrests occurred
      const arrestZipCodes = arrests.map(arrest => arrest.zipCode);
      const zipCodeSet = new Set(arrestZipCodes);

      let areas = areasFeatureCollection.features.filter((area) => {
        return zipCodeSet.has(area.properties.zipcode);
      });

      function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      }
      let classRowConverter = function (d) {
        // Ignore observations with missing or otherwise falsey values
        for (const v of Object.values(d)) {
          if (!v) {
            return;
          }


          return {
            classValue: d.Class,
            zipsCode: '' + parseInt(d.Zip_Code),
          }
        };
      };
      d3.csv(classDataPath, classRowConverter, (err, classes) => {
        if (err) {
          throw err;
        }
        //Filter for zip codes
        const zipCodeSet2 = new Set(arrestZipCodes);
        const classZipCodes = classes.map(classes => classes.zipsCode);
        const classCodeSet = new Set(classZipCodes);
        const classValues = classes.map(classes => classes.classValue);
        //Copy array to not conflict with other maps
        let areasFeatureCollectionCopy = { "type": "FeatureCollection", features: [] }
        for (let i = 0; i < areasFeatureCollection.features.length; ++i) {
          areasFeatureCollectionCopy.features[i] = { "type": "Feature", geometry: areasFeatureCollection.features[i].geometry, properties: areasFeatureCollection.features[i].properties };
        }
        //2 selections for data available and not available
        let areas2 = areasFeatureCollectionCopy.features.filter((area1) => {
          return zipCodeSet2.has(area1.properties.zipcode);
        });

        let areasclass = areasFeatureCollectionCopy.features.filter((area2) => {
          return classCodeSet.has(area2.properties.zipcode);
        });



        const maxClassValue = d3.max(classValues)
        //Function for finding correct class value corresponding to zip code
        function findvaluenow(array, searchvalue) {
          for (let j = 0; j < array.length; j++) {
            if (array[j].zipsCode == searchvalue) {

              return array[j].classValue;
            }

          };
        }

        //No data available is black
        for (i = 0; i < areas2.length; i++) {
          areas2[i].color = rgbToHex(0, 0, 0);
          areas2[i].label = 'No racial profling index available for this zip code'
        }
        // Data available is scaled from green to red
        for (i = 0; i < areasclass.length; i++) {

          classValueNow = findvaluenow(classes, areasclass[i].properties.zipcode)

          if (classValueNow < 1) {
            areasclass[i].color = rgbToHex(100, 255, 100);
          } else {
            r = Math.round(classValueNow / maxClassValue * (255 - 100)) + 100
            g = 255 - Math.round(classValueNow / maxClassValue * (255 - 100))
            b = 100
            areasclass[i].color = rgbToHex(r, g, b)
          };
          areasclass[i].label = 'The racial profiling index for this zip code is ' + parseFloat(classValueNow).toFixed(3)
        }


        //Generate map with mouseover effect
        var areaPathss = heatMap.selectAll('path')
          .data(areas2)
          .enter()
          .append('path')
          .attr('d', heatPath)
          .style('fill', d => d.color)
          .on("mouseover", function (d) {
            div2.transition()
              .duration(200)
              .style("opacity", .9);
            div2.html(d.label)
              .style("left", (d3.event.pageX) + "px")
              .style("top", (d3.event.pageY - 28) + "px");
          })
          .on("mouseout", function (d) {
            div2.transition()
              .duration(500)
              .style("opacity", 0);
          });
      });

      var rowIndex = rowExtractor(zipToBeLoaded, zips);
      row = zips[rowIndex];
      var totalStops = row.white + row.black + row.hispanic_or_latino + row.asian + row.middle_eastern + row.unknown + row.hawaiian_pacific_islander + row.american_indian_alaskan_native;
      var dataStops = convertRowToObject(row, 1, 9);
      var dataRacePreviouslyKnown = convertRowToObject(row, 9, 17);

      //FORMAT data
      dataStops.forEach(function (d) {
        d.num = +d.num;
        d.num2 = +d.num2;
      });

      dataRacePreviouslyKnown.forEach(function (d) {
        d.num = +d.num;
        d.num2 = +d.num2;
      });

      //Sets the max for the xScale
      var maxX = d3.max(dataStops, function (d) { return d.num2; });

      //Gets the min for bar labeling
      var minX = d3.min(dataStops, function (d) { return d.num; });

      //Defines the xScale max
      xScale.domain([0, maxX]);


      //Appends main bar   
      var bars = svg.selectAll(".bar")
        .data(dataStops)
        .enter()
        .append('rect')
        .attr("width", function (d, i) {
          width = xScale(d.num - dataRacePreviouslyKnown[i].num);
          return width;
        })
        .attr("height", barHeight - 1)
        .attr("class", "bar")
        .attr("transform", "translate(0,4)")
        .attr("fill", colors.stops)
        .attr("transform", function (d) {
          return "translate(0," + y0(d.race) + ")";
        })
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);

      var barRaceKnown = svg.selectAll(".barRaceKnown")
        .data(dataRacePreviouslyKnown)
        .enter()
        .append('rect')
        .attr("width", function (d) { return xScale(d.num); })
        .attr("height", barHeight - 1)
        .attr("class", "barRaceKnown")
        .attr("transform", "translate(0,4)")

        .attr("transform", function (d, i) {
          translateX = xScale(dataStops[i].num - d.num);
          translateY = y0(dataStops[i].race)
          return "translate(" + translateX + "," + translateY + ")";
        })
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut)
        .attr("fill", colors.stopsKnown);

      //Appends main bar labels
      var barLabels = svg.selectAll('.label')
        .data(dataStops)
        .enter()
        .append('text')
        .text(function (d) {
          return formatComma(d.num) + "%";
        })

        .attr("x", function (d) {
          if (minX > 32) {
            return xScale(d.num) - 37;
          }
          else {
            return xScale(d.num) + 6;
          }
        })
        .attr("y", y0.bandwidth() / 1)

        .attr("transform", function (d) {

          return "translate(0," + y0(d.race) + ")";
        })
        .attr('class', 'label');
      var totalStopsLabel = svg.append('text')
        .text('Total number of stops: ' + totalStops)
        .attr('x', 0)
        .attr('y', height + margin.bottom / 1.1)
        .attr('class', 'totalStopsLabel');

      resized();

      //On updated zip values
      // d3.select('#selectNumber')
      //   .on("change", function (d) {
      //     console.log("updated!");
      //     var sect = document.getElementById("selectNumber");
      //     var section = sect.options[sect.selectedIndex].value;
      //     var rowIndex = rowExtractor(section, zips);
      //     row = zips[rowIndex];
      //     dataStops = convertRowToObject(row, 1, 9);
      //     dataRacePreviouslyKnown = convertRowToObject(row, 9, 17);
      //     totalStops = row.white + row.black + row.hispanic_or_latino + row.asian + row.middle_eastern + row.unknown + row.hawaiian_pacific_islander + row.american_indian_alaskan_native;
      //     //FORMAT data
      //     dataStops.forEach(function (d) {
      //       d.num = +d.num;
      //       d.num2 = +d.num2;
      //     });

      //     dataRacePreviouslyKnown.forEach(function (d) {
      //       d.num = +d.num;
      //       d.num2 = +d.num2;
      //     });

      //     updatePercentageBarChart();

      //   })
      d3.select(window).on("resize", resized);

      function updatePercentageBarChart() {
        //Sets the max for the xScale
        var maxX = d3.max(dataStops, function (d) { return d.num2; });

        //Gets the min for bar labeling
        var minX = d3.min(dataStops, function (d) { return d.num; });

        //Defines the xScale max
        xScale.domain([0, maxX]);


        //Join data
        var bars = svg.selectAll(".bar")
          .data(dataStops);
        //enter
        bars.enter()
          .append("rect")
          .attr("class", "bar")
          .attr("fill", colors.stopsKnown)

        //exit 
        bars.exit()
          .transition()
          .duration(300)
          .attr("width", 0)
          .remove()
        bars
          .transition()
          .duration(300)
          .attr("width", function (d) {
            return xScale(d.num);
          })
          .attr("height", barHeight - 1)
          .attr("transform", "translate(0,4)")
          .attr("transform", function (d) {
            return "translate(0," + y0(d.race) + ")";
          });

        //TRANSITION BARS WHERE RACE WAS PREVIOUSLY KNOWN
        var barRaceKnown = svg.selectAll(".barRaceKnown")
          .data(dataRacePreviouslyKnown);
        //enter
        barRaceKnown.enter()
          .append("rect")
          .attr("class", "barRaceKnown")
          .attr("fill", colors.stopsKnown)

        //exit 
        barRaceKnown.exit()
          .transition()
          .duration(300)
          .attr("width", 0)
          .remove()
        barRaceKnown
          .transition()
          .duration(300)
          .attr("width", function (d) {
            return xScale(d.num);
          })
          .attr("height", barHeight - 1)
          .attr("transform", "translate(0,4)")
          .attr("transform", function (d, i) {
            translateX = xScale(dataStops[i].num - d.num);
            translateY = y0(dataStops[i].race)
            return "translate(" + translateX + "," + translateY + ")";
          });


        //Binds data to labels
        var barLabels = svg.selectAll('.label')
          .data(dataStops)

        barLabels
          .attr('fill', 'yellow')

        barLabels.enter()
          .append('text')
          .attr('class', 'label')
          .attr('fill', 'yellow')

        barLabels.exit()
          .transition()
          .duration(300)
          .attr('fill', 'yellow')
          .remove()

        barLabels
          .transition()
          .duration(300)
          .text(function (d, i) {
            return formatComma(d.num) + "%";
          })

          .attr("x", function (d) {
            if (minX > 32) {
              return xScale(d.num) - 37;
            }
            else {
              return xScale(d.num) + 6;
            }
          })
          .style("fill", function (d) {
            if (minX > 32) {
              return "white";
            }
            else {
              return "#696969";
            }
          })
          .attr("y", y0.bandwidth() - 8)
          .attr("transform", function (d) {
            return "translate(0," + y0(d.race) + ")";
          });
        var totalStopsLabel = svg.selectAll('.totalStopsLabel')
          .text('Total number of stops: ' + totalStops)
          .attr('x', 0)
          .attr('y', height + margin.bottom / 1.1)
          .attr('class', 'totalStopsLabel');
      }

      const updateBarChart = function (zipCode) {
        console.log(`updated!${zipCode}`);
        // var sect = document.getElementById("selectNumber");
        // var section = sect.options[sect.selectedIndex].value;
        var rowIndex = rowExtractor(parseInt(zipCode), zips);
        row = zips[rowIndex];
        dataStops = convertRowToObject(row, 1, 9);
        dataRacePreviouslyKnown = convertRowToObject(row, 9, 17);
        totalStops = row.white + row.black + row.hispanic_or_latino + row.asian + row.middle_eastern + row.unknown + row.hawaiian_pacific_islander + row.american_indian_alaskan_native;
        //FORMAT data
        dataStops.forEach(function (d) {
          d.num = +d.num;
          d.num2 = +d.num2;
        });

        dataRacePreviouslyKnown.forEach(function (d) {
          d.num = +d.num;
          d.num2 = +d.num2;
        });
        //Update title
        percentageBarChartTitle = svg.selectAll('.title')
          .text("Percentage of stops by race for selected zip-code: " + zipCode)
          .attr('class', 'title');
        updatePercentageBarChart();
      };

      // let randomHexColor = function () {
      //   let rgbColor = [0, 0, 0].map(() => Math.floor(Math.random() * 255));
      //   return rgbToHex(...rgbColor);
      // };

      // // Assign colors to areas
      // // let boroughColors = ['#BA7D34', '#23CE6B', '#4286f4', '#A846A0', '#50514F'];
      // for (let i = 0; i < areas.length; i++) {
      //   areas[i].color = randomHexColor();
      // }

      // for (let i = 0; i < areas.length; i++) {

      // }
      // // DELETE ABOVE
      let areaPaths = map.selectAll('path')
        .data(areas)
        .enter()
        .append('path')
        .attr('d', path)
        .style('fill', d => d.color)
        .on('click', (d) => {
          console.log(`Zip code is ${d.properties.zipcode}`);
          redrawDetailView(d);
          updateBarChart(d.properties.zipcode);
        });

      // let center = [mapDims.w / 2, mapDims.h / 2];
      // let hypotenuse = Math.sqrt(Math.pow(mapDims.w, 2) + Math.pow(mapDims.h, 2));
      // map.selectAll('path')
      //   .style('fill', (d) => {
      //     // Calculate distance to center
      //     let centroid = path.centroid(d);
      //     console.log(centroid);
      //     let invertedDistance = 1 / Math.sqrt(Math.pow(centroid[0] - center[0], 2) + Math.pow(centroid[1] - center[1], 2));
      //     invertedDistance *= 100000;
      //     let normalizedDistance = invertedDistance / hypotenuse;
      //     console.log(normalizedDistance);

      //     return `rgb(0, 60, ${255 * normalizedDistance}`;
      //   });

      let centerArea;
      areaPaths.each((ap) => {
        if (ap.properties.zipcode == "78722") {
          centerArea = ap;
          return
        }
      });
      if (!centerArea) {
        console.log("not found");
      }

      let noArrests = arrests.length;
      var colorScale = d3.scaleLinear()
        .domain([1, noArrests/10])
        .range(["rgb(50, 100, 200)", "rgb(100, 200, 255)"]);

      map.selectAll('path')
        .style('fill', (d) => {
          let curArrests = arrests.filter((a) => {
            return a.zipCode === d.properties.zipcode;
          });

          let scale = curArrests.length / noArrests;

          const color = colorScale(curArrests.length);
          console.log(color);
          
          return color;

          // console.log(scale);

          // const color = `rgb(${10 * scale * 10}, ${50 * scale * 100}, ${255 * scale * 100})`;
          // console.log(color);
          // return color;

          // return `rgb(0, 100, ${255 * scale * 10})`;
        });

      // let center = path.centroid(centerArea);
      // let hypotenuse = Math.sqrt(Math.pow(mapDims.w, 2) + Math.pow(mapDims.h, 2));
      // console.log(hypotenuse);
      // arrests
      // map.selectAll('path')
      //   .style('fill', (d) => {
      //     // Calculate distance to center
      //     let centroid = path.centroid(d);
      //     // console.log(centroid);
      //     let distance = Math.sqrt(Math.pow(centroid[0] - center[0], 2) + Math.pow(centroid[1] - center[1], 2));
      //     console.log(distance);

      //     const color = `rgb(0, 30, ${255 / (255 * 0.1 * (distance / hypotenuse))})`;
      //     // const color = `rgb(0, 30, ${255 * (distance / 400)})`;
      //     console.log(color);

      //     return color;
      //   });

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
          .style('fill', (d) => {
            let curArrests = arrests.filter((a) => {
              return a.zipCode === feature.properties.zipcode;
            });

            return colorScale(curArrests.length);
          });

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
      var result = areas.filter(function (obj) {

        return obj.properties.zipcode == zipToBeLoaded;
      });


      redrawDetailView(result[0]);

      function resized() {
        //new margin
        var newMargin = { top: 10, right: 10, bottom: 20, left: 227 };
        //Get the width of the window
        var w = d3.select(".g-chart").node().clientWidth;

        //Change the width of the svg
        d3.select("svg")
          .attr("width", w);
        percentageBarChartTitle
          .attr('x', newMargin.left / 2)
          .attr("text-anchor", "middle");
        legend
          .attr('x', function (d, i) { return (150 * i) });

        //Change the xScale
        xScale
          .range([0, w - newMargin.right - newMargin.left]);
        //Update the bars
        bars
          .attr("width", function (d, i) {
            width = xScale(d.num - dataRacePreviouslyKnown[i].num);
            return width;
          });
        barRaceKnown
          .attr("width", function (d) { return xScale(d.num) })
          .attr("transform", function (d, i) {
            translateX = xScale(dataStops[i].num - d.num);
            translateY = y0(dataStops[i].race)
            return "translate(" + translateX + "," + translateY + ")";
          });
        //Update the second bars
        barLabels
          .attr("x", function (d) {
            if (minX > 32) {
              return xScale(d.num) - 37;
            }
            else {
              return xScale(d.num) + 6;
            }
          })
          .attr("y", y0.bandwidth() / 1.6)
        //Updates xAxis
        xAxisGroup
          .call(xAxis);

        //Updates ticks
        xAxis
          .scale(xScale)
      };

      d3.selectAll(".updateZip").on("click", function () {
        zipToUpdate = this.value;
        var result = areas.filter(function (obj) {

          return obj.properties.zipcode == zipToUpdate;
        });


        redrawDetailView(result[0]);
        updateBarChart(this.value);

      });
      function handleMouseOver(d, i) {
        var hoverColor;
        var hoverText;

        if (d.race.includes("Known")) {
          hoverColor = colors.stopsKnownHover;
          hoverText = row['' + d.race];
        }
        else {
          hoverColor = colors.stopsHover;
          hoverText = row['' + d.race + ''] - row['' + d.race + 'isRaceKnown'];
        }
        d3.select(this)
          .transition()
          .duration(100)
          .attr("fill", hoverColor);
        div.transition()
          .duration(200)
          .style("opacity", .9);
        div.html(hoverText + " stops")
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");

        /*detailMap.selectAll('circle')
          .attr('fill', function(d){
            console.log(d.arrestee.race);
            return 'black';})*/
      }

      function handleMouseOut(d, i) {
        var hoverColor;
        var hoverText;
        if (d.race.includes("Known")) {
          unHoverColor = colors.stopsKnown;
        }
        else {
          unHoverColor = colors.stops;
        }
        div.transition()
          .duration(500)
          .style("opacity", 0);
        d3.select(this)
          .transition()
          .duration(100)
          .attr("fill", unHoverColor);
      }

    });
  });


});