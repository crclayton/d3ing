"use strict";
var defaultOptions = {
    xIsDate: false,
    bubble: false,
    legend: true,
    xColumn: null,
    yColumn: null,
    rColumn: null,
    cColumn: "category",
    nColumn: "note",
    height: 300,
    width: 600,
    xAxisName: null,
    yAxisName: null,
    maxRad: 4,
    minRad: 1,
    appendTo: "body",
    title: null,
    pointOpacity: 0.7,
    fadeOutOpacity: 0.1,
    dateFormat: "%d/%m/%Y"
};
var scatter = function (data, options) {
    for (var key in defaultOptions) {
        if (defaultOptions.hasOwnProperty(key)) {
            if (isNull(defaultOptions[key]) && isNull(options[key]))
                throw ("Option:" + key + " not supplied");
            if (isNull(options[key]))
                options[key] = defaultOptions[key];
        }
    }
    var x = d3.time.scale().range([0, options["width"]]);
    var y = d3.scale.linear().range([options["height"], 0]);
    data.forEach(function (d) {
        d[options["yColumn"]] = +d[options["yColumn"]];
    });
    y.domain([
        0, d3.max(data, function (d) { return d[options["yColumn"]]; })
    ]);
    var xValue, rValue, rValueScaled;
    if (options["bubble"]) {
        var rads = [];
        for (var i = 0; i < data.length; i++)
            rads.push(data[i][options["rColumn"]]);
        var max = Math.max.apply(Math, rads);
        var min = Math.min.apply(Math, rads);
        var scaleBetween = d3.scale.linear()
            .domain([min, max])
            .range([options["maxRad"], options["minRad"]]);
        rValue = function (d) { return d[options["rColumn"]]; };
        rValueScaled = function (d) { return scaleBetween(d[options["rColumn"]]); };
    }
    else {
        rValue = function () { return options["maxRad"]; };
        rValueScaled = function () { return options["maxRad"]; };
    }
    if (options["xIsDate"]) {
        var dateFormat = options["dateFormat"];
        var parseDate = d3.time.format(dateFormat).parse;
        xValue = function (d) {
            var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            var months = [
                'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
                'November', 'December'
            ];
            d = d[options["xColumn"]];
            var day = days[new Date(d).getDay()].substr(0, 3);
            var month = months[new Date(d).getMonth()];
            return day + " " + month + " " + new Date(d).getDate() + ", " + new Date(d).getFullYear();
        };
        data.forEach(function (d) {
            d[options["xColumn"]] = parseDate(d[options["xColumn"]]);
        });
        x.domain(d3.extent(data, function (d) { return d[options["xColumn"]]; }));
    }
    else {
        xValue = function (d) { return d[options["xColumn"]]; };
        data.forEach(function (d) {
            d[options["xColumn"]] = +(d[options["xColumn"]]);
        });
        x.domain([
            0, d3.max(data, function (d) { return d[options["xColumn"]]; })
        ]);
    }
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(5), yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(5);
    var yValue = function (d) { return d[options["yColumn"]]; }, cValue = function (d) { return d[options["cColumn"]]; };
    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    var svg = d3.select(options["appendTo"])
        .append("svg")
        .attr("width", options["width"] + margin.left + margin.right)
        .attr("height", options["height"] + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    svg.append("text")
        .attr("x", (options["width"] / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text(options["title"]);
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + options["height"] + ")")
        .append("text")
        .attr("class", "label")
        .attr("x", options["width"])
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(options["xAxisName"]);
    svg.append("g")
        .attr("class", "y axis")
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(options["yAxisName"]);
    svg.selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", function (d, i) { return data[i][options["cColumn"]]; })
        .attr("r", function (d) { return rValueScaled(d); })
        .style("fill", function (d) { return color(cValue(d)); })
        .attr("cx", function (d) { return x(d[options["xColumn"]]); })
        .attr("cy", function (d) { return y(d[options["yColumn"]]); })
        .on("mouseover", function (d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html(d[options["nColumn"]] +
            "<table class='bo'><tr><td>X</td><td>" +
            xValue(d) +
            "</td></tr>" +
            "<tr><td>Y</td><td>" +
            yValue(d) +
            "</td></tr>" +
            "<tr><td>Category</td><td>" +
            cValue(d) +
            "</td></tr>" +
            "<tr><td>Radius</td><td>" +
            rValue(d) +
            "</td></tr></table>")
            .style("left", (d3.event.pageX + 5) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
    })
        .on("mouseout", function () {
        tooltip.transition()
            .duration(200)
            .style("opacity", 0);
    });
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + options["height"] + ")")
        .call(xAxis);
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    var categories = data.map(function (obj) { return obj[options["cColumn"]]; }).slice().filter(distinct);
    if (options["legend"]) {
        var legend = svg.selectAll(".legend")
            .data(categories)
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", function (d, i) { return ("translate(0," + i * 20 + ")"); });
        legend.append("rect")
            .attr("x", options["width"] - 18)
            .attr("width", 18)
            .attr("height", 18)
            .attr("class", function (d) { return colorClass(d); })
            .on("mouseover", fadeOutOtherPoints)
            .on("mouseout", removeFadeout)
            .style("fill", color);
        legend.append("text")
            .attr("x", options["width"] - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function (d) { return d; })
            .on("mouseover", fadeOutOtherPoints)
            .on("mouseout", removeFadeout);
    }
    function colorClass(d) {
        return d.replace(/ /g, "");
    }
    function fadeOutOtherPoints() {
        var n = this.getAttribute("class");
        d3.selectAll("circle, rect").transition()
            .style("opacity", 0.1);
        d3.selectAll("circle." + n + ", rect." + n).transition()
            .style("opacity", 0.7);
    }
    function removeFadeout() {
        d3.selectAll("circle").transition()
            .style("opacity", 0.7);
        d3.selectAll("rect").transition()
            .style("opacity", 1);
    }
    ;
};
var color = d3.scale.category10();
var margin = {
    top: 30,
    right: 30,
    bottom: 30,
    left: 30
};
function isNull(val) {
    return typeof (val) === 'undefined';
}
function distinct(value, index, self) {
    return self.indexOf(value) === index;
}
//# sourceMappingURL=graphs.js.map