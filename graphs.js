
/// <summary>Scatterplots/bubbleplots an object with any or all of the following properties: 
///    date: x-axis (yyyy-mm-dd)
///    number: y-axis
///    category: colour
///    radius: dot size 
///    comment: content of tooltip
/// </summary>
Array.prototype.dateBubble = function (xAxisName, yAxisName, width, height, maxRad, minRad) {

    var data = this;

    maxRad = ifNull(maxRad, 30);
    minRad = ifNull(minRad, 4);

    width = ifNull(width, 700) - margin.left - margin.right,
    height = ifNull(height, 400) - margin.top - margin.bottom;

                                    
    // get largest and smallest radius value so we can scale to that
    var rads = [];

    for (var i = 0; i < data.length; i++) rads.push(data[i]["radius"]);

    var max = Math.max.apply(Math, rads);
    var min = Math.min.apply(Math, rads);

    var scaleBetween = d3.scale.linear()
        .domain([min, max])
        .range([maxRad, minRad]);
            
    // Set the ranges
    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().range([height, 0]);

    // Define the axes
    var xAxis = d3.svg.axis().scale(x)
        .orient("bottom").ticks(5),
        yAxis = d3.svg.axis().scale(y)
            .orient("left").ticks(5);

    var xValue = function (d) {
        var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        var day = days[d["date"].getDay()].substr(0, 3);
        var month = months[d["date"].getMonth()];

        return day + " " + month + " " + d["date"].getDate() + ", " + d["date"].getFullYear();

    }, yValue = function (d) {
        return d["number"];
    }, rValue = function (d) {
        return d["radius"];
    }, cValue = function (d) {
        return d["category"];
    };


    var rValueScaled = function (d) {
        return scaleBetween(d["radius"]);
    } 


// add the tooltip area to the webpage
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
    
    // Adds the svg canvas
    var svg = d3.select("body")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    // x-axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(xAxisName);

    // y-axis
    svg.append("g")
        .attr("class", "y axis")
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(yAxisName);

    data.forEach(function (d) {
        d["date"] = parseDate(d["date"]);
        d["number"] = +d["number"];
    });

    // Scale the range of the data
    x.domain(d3.extent(data, function (d) {
        return d["date"];
    }));
    y.domain([0, d3.max(data, function (d) {
        return d["number"];
    })]);


    // Add the scatterplot
    svg.selectAll("dot")
        .data(data)
        .enter().append("circle")
        .attr("class", function (d, i) {
            return data[i]["category"];
        })
        .attr("r", function (d) {
            return rValueScaled(d);
        })
        .style("fill", function (d) {
            return color(cValue(d));
        })
        .attr("cx", function (d) {
            return x(d["date"]);
        })
        .attr("cy", function (d) {
            return y(d["number"]);
        }).on("mouseover", function (d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9)
            tooltip.html(d["comments"] +
                "<table class='bo'><tr><td>Date</td><td>" + xValue(d) + "</td></tr>" +
                "<tr><td>Number</td><td>" + yValue(d) + "</td></tr>" +
                "<tr><td>Category</td><td>" + cValue(d) + "</td></tr>" +
                "<tr><td>Radius</td><td>" + rValue(d) + "</td></tr></table>")
                .style("left", (d3.event.pageX + 5) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0);
        });


    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    // draw legend
    var legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) {
            return "translate(0," + i * 20 + ")";
        });

    // draw legend colored rectangles
    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .attr("class", function (d, i) {
            return data[i]["category"];
        })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .style("fill", color);

    // draw legend text
    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function (d) {
            return d;
        });
        
        // note! in order for mouseover to work, the data needs to be in a specific
// order to start.

// we assign classes using the following code in the legend
//     .attr("class", function(d, i){ return data[i]["category"];})
// so in order for the legend values to correspond to the 
// right class, your first data points need to be in the same order as the legend
function mouseover(d, i) {
    var n = this.getAttribute("class");

    d3.selectAll("circle")
        .style("opacity", 0.2);

    d3.selectAll("." + n)
        .style("opacity", 0.7);
}

function mouseout(d, i) {
    d3.selectAll("circle")
        .style("opacity", 0.7);
};

}


/// <summary>
/// </summary>
Array.prototype.lineGraph = function (xAxisName, yAxisName, width, height, maxRad, minRad) {

    var data = this;
    
    var width = 900 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;


var x = d3.time.scale()
    .range([0,width]);
    
var y = d3.scale.linear()
    .range([height,0]);

var color = d3.scale.category10();

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");
    
    
// add the tooltip area to the webpage
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

var line = d3.svg.line()
    .interpolate("basis")
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.number); });

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


   
   color.domain(d3.keys(data[0]).filter(function(key) { return key == "category"; }));
   
// first we need to corerce the data into the right formats

  data = data.map( function (d) { 
    return { 
      category: d.category,
      date: parseDate(d.date),
      number: +d.number }; 
});   
  
  
// then we need to nest the data on category since we want to only draw one
// line per category
  data = d3.nest().key(function(d) { return d.category; }).entries(data);


  x.domain([d3.min(data, function(d) { return d3.min(d.values, function (d) { return d.date; }); }),
             d3.max(data, function(d) { return d3.max(d.values, function (d) { return d.date; }); })]);
  y.domain([0, d3.max(data, function(d) { return d3.max(d.values, function (d) { return d.number; }); })]);

                                                                                   
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

  var cities = svg.selectAll(".category")
      .data(data, function(d) { return d.key; })
    .enter().append("g")
      .attr("class", "category");

  cities.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return color(d.key); })
      .on("mouseover", mouseover)
      .on("mouseout", mouseout)
      .attr("id", function(d){ return d.key;})



function mouseover(d, i) {
    console.log(d);
                tooltip.transition()
                .duration(200)
                .style("opacity", .9)
                tooltip.html(d.key)
                .style("left", (d3.event.pageX + 5) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
                
    var n = this.getAttribute("id");
   
    d3.selectAll(".line")
        .style("stroke-width", 1.5)
        .style("opacity", 0.2)

    d3.selectAll("#" + n)
        .style("stroke-width", 4)
        .style("opacity", 0.7)
}

function mouseout(d, i) {

    d3.selectAll(".line")
        .style("stroke-width", 1.5)
        .style("opacity", 0.7);
        
                    tooltip.transition()
                .duration(200)
                .style("opacity", 0);
};

      
}

// Parse the date / time
var parseDate = d3.time.format("%Y-%m-%d").parse;

var color = d3.scale.category10();

// Set the dimensions of the canvas / graph
var margin = {
    top: 30,
    right: 30,
    bottom: 30,
    left: 30
};


function ifNull(val, defaultVal) {
    return typeof (val) === 'undefined' ? defaultVal : val;
}
