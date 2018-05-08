//Margin conventions
let zipDataPath = '/data/zip_specific_stats.csv';
var margin = { top: 20, right: 50, bottom: 20, left: 227 };
var colors = { stops: "red", stopsKnown: "black", stopsHover: "orange", stopsKnownHover: "gray" };
zipToBeLoaded = 78702;
var widther = window.outerWidth;
var width = widther - margin.left - margin.right,
    height = 230 - margin.top - margin.bottom;

var barHeight = height / 10;

// Define the div for the tooltip
var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

//Appends the svg to the chart-container div
var svg = d3.select(".g-chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//Title
percentageBarChartTitle = svg.append("text")
    .attr("x", (width / 2))
    .attr("y", -margin.top / 3)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Percentage of stops by race for selected zip-code");
names = ["Race unknown", "Race unknown", "Race known"];

legend = svg.selectAll("text")
    .data(names)
    .enter()
    .append('text')
    .text(function (d, i) {
        return d;
    })
    .attr("x", (width / 2))
    .attr("y", function (d, i) {
        return (margin.top + i * 14);
    })
    .attr("text-anchor", "left")
    .style("font-size", "16px");



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
//Chart headline (question)
var headline = "Nevada Republican Caucuses"

//Chart state description
var stateDescription = "Most Important Quality"

//Timestamp text
var timestampText = "EXIT POLL LATEST AS OF "

//Timestamp time
var timestampTime = "9:05 PM ET"
//Appends chart headline
d3.select(".g-hed").text(headline);

//Appends chart intro text
d3.select(".g-intro").text(stateDescription);

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
    var options = zipList;
    for (var i = 0; i < options.length; i++) {
        var opt = options[i];
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        select.appendChild(el);
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

let filterObjectByOccurences = function (dataWithOccurences, dataToBeFiltered){
    filteredData = [];
    for (let i = 0; i < dataWithOccurences.length; i++) {
        if (dataWithOccurences[i].num>1){
            filteredData.push(dataToBeFiltered[i])
        }
    }
    return(filteredData);
}

var formatComma = d3.format(".1f");

d3.csv(zipDataPath, rowConverter, (err, zips) => {
    if (err) {
        throw err;
    }
    console.log(zips);
    var rowIndex = rowExtractor(zipToBeLoaded, zips);
    row = zips[rowIndex];
    var dataStops = convertRowToObject(row, 1, 9);
    var dataRacePreviouslyKnown = convertRowToObject(row, 9, 17);
    dataStops = filterObjectByOccurences(dataStops, dataStops);
    dataRacePreviouslyKnown = filterObjectByOccurences(dataStops, dataRacePreviouslyKnown);
    
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
        .attr("fill", "red")
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
        .attr("fill", "black");

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
        .style("fill", function (d) {
            if (minX > 32) {
                return "white";
            }
            else {
                return "#696969";
            }
        })
        .attr("y", y0.bandwidth() / 1)

        .attr("transform", function (d) {

            return "translate(0," + y0(d.race) + ")";
        })
        .attr('class', 'label');

    //Appends timestamp text  
    d3.select(".g-source-reg")
        .text(timestampText)
        .attr("class", "g-source-reg");

    //Appends timestamp time
    d3.select(".g-source-bold")
        .text(timestampTime)
        .attr("class", "g-source-bold");


      resized();

    //On updated zip values
    d3.select('#selectNumber')
        .on("change", function (d) {
            console.log("updated!");
            var sect = document.getElementById("selectNumber");
            var section = sect.options[sect.selectedIndex].value;
            var rowIndex = rowExtractor(section, zips);
            row = zips[rowIndex];
            dataStops = convertRowToObject(row, 1, 9);
            dataRacePreviouslyKnown = convertRowToObject(row, 9, 17);

            //FORMAT data
            dataStops.forEach(function (d) {
                d.num = +d.num;
                d.num2 = +d.num2;
            });

            dataRacePreviouslyKnown.forEach(function (d) {
                d.num = +d.num;
                d.num2 = +d.num2;
            });

            updatePercentageBarChart();

        })
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
            .attr("fill", "red")

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
            .attr("fill", "red")

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
    }

    function resized() {
        //new margin
        var newMargin = { top: 10, right: 10, bottom: 20, left: 227 };
        //Get the width of the window
        var w = d3.select(".g-chart").node().clientWidth;

        //Change the width of the svg
        d3.select("svg")
            .attr("width", w);
        percentageBarChartTitle
            .attr('x', (w - newMargin.right - newMargin.left) / 2)
            .attr("text-anchor", "middle");
        legend
            .attr('x', (w - newMargin.right - newMargin.left)/1.2)
        
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
    function handleMouseOver(d, i) {
        var hoverColor;
        var hoverText;

        if (d.race.includes("Known")) {
            hoverColor = "gray";
            hoverText = row['' + d.race];
        }
        else {
            hoverColor = "orange";
            hoverText = row['' + d.race + ''] - row['' + d.race + 'isRaceKnown'];
        }
        d3.select(this)
            .attr("fill", hoverColor);
        div.transition()
            .duration(200)
            .style("opacity", .9);
        div.html(hoverText + " stops")
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
    }

    function handleMouseOut(d, i) {
        var hoverColor;
        var hoverText;
        if (d.race.includes("Known")) {
            unHoverColor = "black";
        }
        else {
            unHoverColor = "red";
        }
        div.transition()
            .duration(500)
            .style("opacity", 0);
        d3.select(this)
            .attr("fill", unHoverColor);
    }
});



