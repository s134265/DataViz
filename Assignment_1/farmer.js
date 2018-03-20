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

var names = ["Fresh fruit", "Storage Fruit", "Storage vegetable", "Fresh vegetable"];
var colors = ["#98abc5", "#7b6888", "#a05d56", "#ff8c00"];


var key = function (d) {
    console.log(d.key);

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
        return (d.Index == 3)
    })
    vegetablesHarvest = dataset.filter(function (d) {
        return (d.Index == 2)
    })
    var barData = fruitsHarvest;
    //Create scale functions
    xScale = d3.scaleTime()
        .domain([
            d3.timeMonth.offset(startDate, -1),  //startDate minus one day, for padding
            d3.timeMonth.offset(endDate, 1)	  //endDate plus one day, for padding
        ])
        .range([padding, w - padding]);

    yScale = d3.scaleLinear()
        .domain([
            0,  //Because I want a zero baseline
            d3.max(barData, function (d) {
                return d.Count;
            }) * 1.2
        ])
        .range([h - padding, padding]);

    //Define rect bandwidth
    bandwidthScale = d3.scaleBand()
        .domain(d3.range(barData.length + 1))
        .rangeRound([padding, w - padding])
        .paddingInner(0.4)
    //Define X axis
    xAxis = d3.axisBottom()
        .scale(xScale)
        .ticks(12)
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
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", padding/4)
        .attr("x", -w/3)
        .attr("fill", "black")
        .attr("font-size", "12px")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("# of Unique Kinds of Produce")
        .attr("font-family", "sans-serif");
    svg.selectAll("rect")
        .data(barData)
        .enter()
        .append("rect")
        .attr("x", function (d) {
            return (xScale(d.Month) - bandwidthScale.bandwidth() / 2);
        })
        .attr("y", function (d) {

            return (yScale(d.Count));
        })
        .attr("height", function (d) {
            var height = yScale(0) - yScale(d.Count);
            return (height);
        })
        .attr("width", bandwidthScale.bandwidth)
        .attr("fill", colors[0]);

});

var showStacked = function (updateData) {
    xScale = d3.scaleTime()
        .domain([
            d3.timeMonth.offset(startDate, -1),  //startDate minus one day, for padding
            d3.timeMonth.offset(endDate, 1)	  //endDate plus one day, for padding
        ])
        .range([padding, w - padding]);

    yScale = d3.scaleLinear()
        .domain([
            0,  //Because I want a zero baseline
            50
        ])
        .range([h - padding, padding]);

    bandwidthScale = d3.scaleBand()
        .domain(d3.range(12 + 1))
        .rangeRound([padding, w - padding])
        .paddingInner(0.4);


    var bars = svg.selectAll("rect")
        .remove()
        .exit()
        .data(updateData, function (d) { d.Month });
    var heightRect = new Array(updateData.length).fill(0);
    var y = 0;
    //Define Y axis
    bars.enter()
        .append("rect")
        .attr("x", function (d, i) {
            return xScale(d.Month) - bandwidthScale.bandwidth() / 2;
        })
        .attr("y", function (d) {
            return (yScale(0));
        })
        .attr("height", 0)
        //Update
        .transition()
        .attr("height", function (d, i) {
            height = yScale(0) - yScale(d.Count);
            heightRect[i] += height;
            return (height);
        })
        .attr("y", function (d, i) {
            y = (yScale(d.Count));
            if (i > 11) {
                heightRect[i] += heightRect[i - 12];
                y -= heightRect[i - 12];
            }
            return (y);
        })

        .attr("width", bandwidthScale.bandwidth)
        .attr("fill", function (d) {
            var color;
            if (d.Index == 0) {
                color = colors[0];
            }
            if (d.Index == 1) {
                color = colors[1];
            }
            if (d.Index == 2) {
                color = colors[2];
            }
            if (d.Index == 3) {
                color = colors[3];
            }
            return color;
        });

    yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(10);
    //Create Y axis
    svg.selectAll("g .y.axis")
        .transition()
        .duration(500)
        .call(yAxis);
}

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
        else if (paragraphID == "showAll") {
            showStacked(dataset);
            return;
        }
        xScale = d3.scaleTime()
            .domain([
                d3.timeMonth.offset(startDate, -1),  //startDate minus one day, for padding
                d3.timeMonth.offset(endDate, 1)	  //endDate plus one day, for padding
            ])
            .range([padding, w - padding]);

        yScale = d3.scaleLinear()
            .domain([
                0,  //Because I want a zero baseline
                d3.max(updateData, function (d) {
                    return d.Count;
                }) * 1.2
            ])
            .range([h - padding, padding]);
        bandwidthScale = d3.scaleBand()
            .domain(d3.range(updateData.length + 1))
            .rangeRound([padding, w - padding])
            .paddingInner(0.4);

        console.log(bandwidthScale.bandwidth());
        var bars = svg.selectAll("rect")
            .remove()
            .exit()
            .data(updateData, function (d) { d.Month });

        //Define Y axis
        bars.enter()
            .append("rect")
            .attr("x", function (d, i) {
                return xScale(d.Month) - bandwidthScale.bandwidth() / 2;
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
            .attr("width", bandwidthScale.bandwidth)
            .attr("fill", color);

        yAxis = d3.axisLeft()
            .scale(yScale)
            .ticks(10);
        //Create Y axis
        svg.selectAll("g .y.axis")
            .transition()
            .duration(500)
            .call(yAxis);
    })

//Add legend
svg.selectAll("text")
    .data(names)
    .enter()
    .append("text")
    .text(function (d, i) {
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
