//Margin conventions
let zipDataPath = '/data/zip_specific_stats.csv';
var margin = { top: 10, right: 50, bottom: 20, left: 227 };
zipToBeLoaded = 78702;
var widther = window.outerWidth;
var data = [];
var width = widther - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;

var barHeight = height / 10;

//Appends the svg to the chart-container div
var svg = d3.select(".g-chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//Creates the xScale 
var xScale = d3.scaleLinear()
    .range([0, width]);

//Creates the yScale
var y0 = d3.scaleBand()
    .range([height, 0], 0)
    .domain(["white", "hispanic", "black", "asian", "middle_eastern", "unknown", "hawaiian_pacific_islander", "american_indian_alaskan_native"]);

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
        hispanic: parseInt(d.HISPANIC_OR_LATINO),
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
let convertRowToObject = function (row) {
    data = []
    var totalStops = row.white + row.black + row.hispanic + row.asian + row.middle_eastern + row.unknown + row.hawaiian_pacific_islander + row.american_indian_alaskan_native;
    var keys = Object.keys(row)
    var categories = keys.slice(1, 9);
    for (let i = 0; i < categories.length; i++) {
        normalizedNum = row[categories[i]] / totalStops * 100;
        data.push({ "race": categories[i], "num": normalizedNum, "num2": 100 });
    }
    return (data)
}

d3.csv(zipDataPath, rowConverter, (err, zips) => {
    if (err) {
        throw err;
    }
    console.log(zips);
    var rowIndex = rowExtractor(zipToBeLoaded, zips);
    row = zips[rowIndex];
    data = convertRowToObject(row);
    //FORMAT data
    data.forEach(function (d) {
        d.num = +d.num;
        d.num2 = +d.num2;
    });

    //Sets the max for the xScale
    var maxX = d3.max(data, function (d) { return d.num2; });

    //Gets the min for bar labeling
    var minX = d3.min(data, function (d) { return d.num; });

    //Defines the xScale max
    xScale.domain([0, maxX]);


    //Appends main bar   
    var bars = svg.selectAll(".bar")
        .data(data)
        .enter()
        .append('rect')
        .attr("width", function (d) { return xScale(d.num); })
        .attr("height", barHeight - 1)
        .attr("class", "bar")
        .attr("transform", "translate(0,4)")
        .attr("fill", "red")
        .attr("transform", function (d) {
            return "translate(0," + y0(d.race) + ")";
        });
    console.log(bars);

    var formatComma = d3.format(".1f");
    //Appends main bar labels
    var barLabels = svg.selectAll('.label')
        .data(data)
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
            zipToBeLoaded = section;
            var rowIndex = rowExtractor(zipToBeLoaded, zips);
            row = zips[rowIndex];
            data = convertRowToObject(row);

            //FORMAT data
            data.forEach(function (d) {
                d.num = +d.num;
                d.num2 = +d.num2;
            });
            //Sets the max for the xScale
            var maxX = d3.max(data, function (d) { return d.num2; });

            //Gets the min for bar labeling
            var minX = d3.min(data, function (d) { return d.num; });

            //Defines the xScale max
            xScale.domain([0, maxX]);
            //Binds the data to the bars      

            /*var categoryGroup = svg.selectAll(".g-category-group")
                .remove()
                .exit()
                .data(data)
                .enter()
                .append("g")
                .attr("class", "g-category-group")
                .attr("transform", function (d) {
                    return "translate(0," + y0(d.race) + ")";
                });*/
            //Join data
            var bars = svg.selectAll(".bar")
                .data(data);

            bars
                .attr("fill", "red")

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
            //Binds data to labels

            //Appends main bar labels 
            //Join new data with old elements

            var barLabels = svg.selectAll('.label')
                .data(data)
                console.log(barLabels);
                
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
        })
    d3.select(window).on("resize", resized);
    function resized() {
        //new margin
        var newMargin = { top: 10, right: 10, bottom: 20, left: 227 };
        //Get the width of the window
        var w = d3.select(".g-chart").node().clientWidth;

        //Change the width of the svg
        d3.select("svg")
            .attr("width", w);
        //Change the xScale
        xScale
            .range([0, w - newMargin.right - newMargin.left]);
        //Update the bars
        bars
            .attr("width", function (d) { return xScale(d.num); });
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
});



