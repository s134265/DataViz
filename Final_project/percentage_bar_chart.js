//Margin conventions
var margin = {top: 10, right: 50, bottom: 20, left: 227};

var widther = window.outerWidth;

var width = widther - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;

var barHeight = 35;      

//Appends the svg to the chart-container div
var svg = d3.select(".g-chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//Creates the xScale 
var xScale = d3.scaleLinear()
  .range([0,width]);

//Creates the yScale
var y0 = d3.scaleBand()
  .range([height, 0], 0)
  .domain(["Honest and Trustworthy", "Experienced", "Cares About People Like Me", "Electable"]);

//Defines the y axis styles
var yAxis = d3.axisLeft()
  .scale(y0);

//Defines the y axis styles
var xAxis = d3.axisBottom()
  .scale(xScale)
  .tickFormat(function(d) {return d + "%"; })
  .tickSize(height); 

//Local data
var data=[{"category":"Honest and Trustworthy","num":33, "num2": 100},
          {"category":"Experienced","num":27, "num2": 100},
          {"category":"Cares About People Like Me","num":26, "num2": 100},
          {"category":"Electable","num":12, "num2": 100}];   

//Chart headline (question)
var headline = "Nevada Republican Caucuses"

//Chart state description
var stateDescription = "Most Important Quality"

//Timestamp text
var timestampText = "EXIT POLL LATEST AS OF "   

//Timestamp time
var timestampTime = "9:05 PM ET"          

//Draw the chart
ready(data);

function ready(data) {

  //FORMAT data
  data.forEach(function(d) {
    d.num = +d.num;
    d.num2 = +d.num2;
  });

  //Appends chart headline
  d3.select(".g-hed").text(headline);

  //Appends chart intro text
  d3.select(".g-intro").text(stateDescription);

  //Sets the max for the xScale
  var maxX = d3.max(data, function(d) { return d.num2; });

  //Gets the min for bar labeling
  var minX = d3.min(data, function(d) { return d.num; });

  //Defines the xScale max
  xScale.domain([0, maxX ]);

  //Appends the y axis
  var yAxisGroup = svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

  //Appends the x axis    
  var xAxisGroup = svg.append("g")
    .attr("class", "x axis")
    .call(xAxis); 

  //Binds the data to the bars      
  var categoryGroup = svg.selectAll(".g-category-group")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "g-category-group")
    .attr("transform", function(d) {
      return "translate(0," + y0(d.category) + ")";
    });

  //Appends background bar   
  var bars2 = categoryGroup.append("rect")
    .attr("width", function(d) { return xScale(d.num2); })
    .attr("height", barHeight - 1 )
    .attr("class", "g-num2")
    .attr("transform", "translate(0,4)");   

  //Appends main bar   
  var bars = categoryGroup.append("rect")
    .attr("width", function(d) { return xScale(d.num); })
    .attr("height", barHeight - 1 )
    .attr("class", "g-num")
    .attr("transform", "translate(0,4)"); 
  
  //Binds data to labels
  var labelGroup = svg.selectAll("g-num")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "g-label-group")
    .attr("transform", function(d) {
      return "translate(0," + y0(d.category) + ")";
    });

  //Appends main bar labels   
  var barLabels = labelGroup.append("text") 
    .text(function(d) {return  d.num + "%";})
    .attr("x", function(d) { 
      if (minX > 32) {
        return xScale(d.num) - 37;}
      else {
        return xScale(d.num) + 6;}})
    .style("fill", function(d){
      if (minX > 32) {
        return "white";}
      else {
        return "#696969";}}) 
    .attr("y", y0.bandwidth()/1.6 )
    .attr("class", "g-labels");       

  //Appends timestamp text  
  d3.select(".g-source-reg")
    .text(timestampText)
    .attr("class", "g-source-reg"); 

  //Appends timestamp time
  d3.select(".g-source-bold")
    .text(timestampTime)
    .attr("class", "g-source-bold");   

      
  //RESPONSIVENESS
  d3.select(window).on("resize", resized);

  function resized() {

    //new margin
    var newMargin = {top: 10, right: 10, bottom: 20, left: 227};


    //Get the width of the window
    var w = d3.select(".g-chart").node().clientWidth;
    console.log("resized", w);

    //Change the width of the svg
    d3.select("svg")
      .attr("width", w);

    //Change the xScale
    xScale
      .range([0, w - newMargin.right - newMargin.left]);

    //Update the bars
    bars
      .attr("width", function(d) { return xScale(d.num); });

    //Update the second bars
    bars2
      .attr("width", function(d) { return xScale(d.num2); });  

    //Updates bar labels
    barLabels
      .attr("x", function(d) { 
        if (minX > 32) {
          return xScale(d.num) - 37;}
        else {
          return xScale(d.num) + 6;}})
      .attr("y", y0.bandwidth()/1.6 )

    //Updates xAxis
    xAxisGroup
      .call(xAxis);   

    //Updates ticks
    xAxis
      .scale(xScale)

  };

}
