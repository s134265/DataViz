// Adds the svg canvas
var dataset;
var w = 700;
var h = 500;
var barPadding = 1;
var padding = 30;

var svg = d3.select("#graph1")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .append("g");

var parseTime = d3.timeParse("%b");
var formatTime = d3.timeFormat("%b");

//Function for converting CSV values from strings to Dates and numbers
var rowConverter = function (d) {
    return {
        Index: parseInt(d.Index),
        Month: parseTime(d.Month),
        Count: parseInt(d.Count)
    };
}

var names = ["Fresh fruit", "Stored fruit", "Stored vegetables", "Fresh vegetables"];
var colors = ["black", "red", "yellow", "blue"];
//Add legend
svg.selectAll("text")
    .data(names)
    .enter()
    .append("text")
    .text(function (d, i) {
        console.log(d[i]);

        return d;
    })
    .attr("text-anchor", "left")
    .attr("x", w - padding * 3)
    .attr("y", function (d, i) {
        return (padding + i * 10);
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", "11px")
    .attr("fill", "black");

//Add squares to legend
svg.selectAll("circle")
    .data(colors)
    .enter()
    .append("circle")
    .attr("cx", function (d) {
        return w - padding * 3.2;
    })
    .attr("cy", function (d, i) {
        return padding + i * 10 - 5.5 + 2;
    })
    .attr("r", function (d) {
        return 4;
    })
    .attr("fill", function (d) { return d });

var key = function (d) {
    return d.key;
};

var fruitsHarvest;
var fruitsStorage;
var vegetablesStorage;
var vegetablesHarvest;
var startDate;
var endDate;
var bandwidth;
// load data
d3.csv("farmer.csv", rowConverter, function (data) {
    console.log("loading csv");

    dataset = data;

    startDate = d3.min(dataset, function (d) { return d.Month; });
    endDate = d3.max(dataset, function (d) { return d.Month; });

    fruitsHarvest = dataset.filter(function (d) {
        return (d.Index == 0)
    })
    fruitsStorage = dataset.filter(function (d) {
        return (d.Index == 1)
    })
    vegetablesStorage = dataset.filter(function (d) {
        return (d.Index == 2)
    })
    vegetablesHarvest = dataset.filter(function (d) {
        return (d.Index == 3)
    })
    var barData = fruitsHarvest;
    //Create scale functions
    xScale = d3.scaleTime()
        .domain([
            d3.timeDay.offset(startDate, -1),  //startDate minus one day, for padding
            d3.timeDay.offset(endDate, 1)	  //endDate plus one day, for padding
        ])
        .range([padding, w - padding]);

    yScale = d3.scaleLinear()
        .domain([
            0,  //Because I want a zero baseline
            d3.max(barData, function (d) {
                return d.Count;
            })
        ])
        .range([h - padding, padding]);

    //Define rect bandwidth
    bandwidthScale = d3.scaleBand()
        .domain(d3.range(barData.length))
        .rangeRound([0, w])
        .paddingInner(0.05);

    //Define X axis
    xAxis = d3.axisBottom()
        .scale(xScale)
        .ticks(9)
        .tickFormat(formatTime);

    //Define Y axis
    yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(10);

    //Create X axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (h - padding) + ")")
        .call(xAxis);

    //Create Y axis
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + padding + ",0)")
        .call(yAxis);
    var heightRect = [];

    svg.selectAll("rect")
        .data(barData)
        .enter()
        .append("rect")
        .attr("x", function (d) {
            return xScale(d.Month);
        })
        .attr("y", function (d) {
            console.log(yScale(d.Count));

            return (yScale(d.Count));
        })
        .attr("height", function (d) {
            var height = yScale(0) - yScale(d.Count);
            heightRect.push(height);
            return (height);
        })
        .attr("width", 10)
        .attr("fill", "black");
});

d3.selectAll("p")
    .on("click", function () {
        //See which p was clicked
        var paragraphID = d3.select(this).attr("id");
        var updateData;
        var color;
        //Decide what to do next
        if (paragraphID == "freshFruits") {
            updateData = fruitsHarvest;
            color = colors[0];

        } else if (paragraphID == "storedFruits") {
            updateData = fruitsStorage;
            color = colors[1];
        }
        else if (paragraphID == "storedVegetables") {
            updateData = vegetablesStorage;
            color = colors[2];
        }
        else if (paragraphID == "freshVegetables") {
            updateData = vegetablesHarvest;
            color = colors[3];
        }
        console.log(updateData);
        console.log(fruitsStorage);
        xScale = d3.scaleTime()
            .domain([
                d3.timeDay.offset(startDate, -1),  //startDate minus one day, for padding
                d3.timeDay.offset(endDate, 1)	  //endDate plus one day, for padding
            ])
            .range([padding, w - padding]);

        yScale = d3.scaleLinear()
            .domain([
                0,  //Because I want a zero baseline
                d3.max(updateData, function (d) {
                    return d.Count;
                })
            ])
            .range([h - padding, padding]);

        var bars = svg.selectAll("rect")
            .data(updateData, key);
        //Define Y axis
        console.log(xScale(updateData[0].Month));
        bars.enter()
            .append("rect")
            .attr("x", function (d) {
                console.log(d);
                return xScale(d.Month);
            })
            .attr("y", function (d) {
                return (yScale(0));
            })
            .attr("height", 0)
            //Update
            .transition()
            .attr("y", function (d) {
                return (yScale(d.Count));
            })
            .attr("height", function (d) {
                var height = yScale(0) - yScale(d.Count);
                return (height);
            })
            .attr("width", 10)
            .attr("fill", color);

        bars.exit()
            .transition()
            .attr("y", function (d, i) {
                return (yScale(0));
            })
            .attr("height", 0)
            .remove();

        yAxis = d3.axisLeft()
            .scale(yScale)
            .ticks(10);
        //Create Y axis
        svg.selectAll("g .y.axis")
            .transition()
            .duration(500)
            .call(yAxis);
    })
