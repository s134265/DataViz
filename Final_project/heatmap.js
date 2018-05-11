//Margin conventions


var margin = { top: 60, right: 50, bottom: 35, left: 227 };
var colors = { stops: "#973490", stopsKnown: "#E96A8D", stopsHover: "#B8428C", stopsKnownHover: "#EE8B97" };
zipToBeLoaded = 78702;
var widther = window.outerWidth;
var width = widther - margin.left - margin.right,
  height = 250 - margin.top - margin.bottom;


var heatMapDims = { w: 700, h: 500 };

// Define the div for the tooltip
var div = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);


var svg = d3.select(".heatmap").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height",  margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");




var heatProjection = d3.geoMercator()
  .translate([300, 250])
  .center(austinCenter)
  .scale([40000]);

var heatPath = d3.geoPath()
  .projection(heatProjection)



var heatMap = d3.select('#heat')
  .append('svg')
  .attr('width', heatMapDims.w)
  .attr('height', heatMapDims.h)

var formatComma = d3.format(".1f");

d3.json(zipCodeAreasPath, (err, areasFeatureCollection) => {
  if (err) {
    throw err;
  }

  var arrestsRowConverter = function (d) {
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

      // DEvarE BELOW
      // Filter out areas in which no arrests occurred
      const arrestZipCodes = arrests.map(arrest => arrest.zipCode);


      function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      }


     
      var classRowConverter = function (d) {
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

        const zipCodeSet2 = new Set(arrestZipCodes);

        const classZipCodes = classes.map(classes => classes.zipsCode);
        const classCodeSet = new Set(classZipCodes);
        const classValues = classes.map(classes => classes.classValue);

        var areas2 = areasFeatureCollection.features.filter((area1) => {
          return zipCodeSet2.has(area1.properties.zipcode);
          });
        
        var areasclass = areasFeatureCollection.features.filter((area2) => {
          return classCodeSet.has(area2.properties.zipcode);
         });


        // Assign colors to areas
        // var boroughColors = ['#BA7D34', '#23CE6B', '#4286f4', '#A846A0', '#50514F'];
        const maxClassValue = d3.max(classValues)
        
       function findvaluenow(array,searchvalue) {
        for (let j = 0; j < array.length; j++) {
          if (array[j].zipsCode == searchvalue) {
            
           return array[j].classValue;
          }
          
        };
       }


        for (let i = 0; i < areas2.length; i++) {
          areas2[i].color = rgbToHex(0,0,0);
          areas2[i].label = 'No Data Available'
        }

        for (let i = 0; i < areasclass.length; i++) {

          classValueNow = findvaluenow(classes,areasclass[i].properties.zipcode)

          if (classValueNow < 1) {
            areasclass[i].color = rgbToHex(100,255,100);
          } else {
              r = Math.round(classValueNow/maxClassValue*(255-100))+100
              g = 255-Math.round(classValueNow/maxClassValue*(255-100))
              b = 100
              areasclass[i].color = rgbToHex(r,g,b)
          };
          areasclass[i].label = 'The racial index for this zip code is ' + classValues[i] 
        }
        


        var areaPaths = heatMap.selectAll('path')
          .data(areas2)
          .enter()
          .append('path')
          .attr('d', heatPath)
          .style('fill', d => d.color)
     



        var areaPath2 = heatMap.selectAll('path')
          .data(areasclass)
          .enter()
          .append('path')
          .attr('d', heatPath)
          .style('fill', d => d.color)



      });
    });
  });


});
      