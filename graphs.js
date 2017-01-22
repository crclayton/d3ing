"use strict";
var globalTooltip;
d3.format(".0%")(0.123);
var defaultOptions = {
    xIsDate: false,
    isBubble: false,
    legend: true,
    autoDomain: true,
    xColumn: null,
    yColumn: null,
    rColumn: null,
    cColumn: "category",
    nColumn: "note",
    height: 300,
    width: 600,
    xAxisName: "",
    yAxisName: "",
    xTickFormat: "d",
    yTickFormat: "d",
    yTicks: null,
    xTicks: null,
    radRange: [2, 6],
    xRange: [0, 100],
    yRange: [0, 100],
    appendTo: "body",
    title: "",
    pointOpacity: 0.7,
    fadeOutOpacity: 0.1,
    dateFormat: "%d/%m/%Y"
};
var setupXValue = function (data, options) {
    if (options.xIsDate) {
        var parseDate = d3.time.format(options.dateFormat).parse;
        return {
            tooltip: function (d) { return formatDate(d[options.xColumn]); },
            numeric: function (d) { return +parseDate(d[options.xColumn]); }
        };
    }
    else {
        return {
            tooltip: function (d) { return d[options.xColumn]; },
            numeric: function (d) { return +d[options.xColumn]; }
        };
    }
};
var setupRadiusValue = function (data, options) {
    if (options.isBubble) {
        var rads = [];
        data.forEach(function (d) { rads.push(d[options.rColumn]); });
        var max = Math.max.apply(Math, rads);
        var min = Math.min.apply(Math, rads);
        var scaleBetween = d3.scale.linear()
            .domain([min, max])
            .range([options.radRange[0], options.radRange[1]]);
        return {
            tooltip: function (d) { return d[options.rColumn]; },
            numeric: function (d) { return scaleBetween(d[options.rColumn]); }
        };
    }
    else {
        return {
            tooltip: function () { return options.radRange[1]; },
            numeric: function () { return options.radRange[1]; }
        };
    }
};
var createCanvas = function (xAxis, yAxis, options) {
    globalTooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .attr("class", "tooltip")
        .style("opacity", 0);
    var svg = d3.select(options.appendTo)
        .append("svg")
        .attr("width", options.width + margin.left + margin.right)
        .attr("height", options.height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    svg.append("text")
        .attr("x", (options.width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text(options.title);
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + options.height + ")")
        .call(xAxis);
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + options.height + ")")
        .append("text")
        .attr("class", "label")
        .attr("x", options.width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(options.xAxisName);
    svg.append("g")
        .attr("class", "y axis")
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(options.yAxisName);
    return svg;
};
var line = function (data, options) {
    throw ("Not implemented");
};
var bar = function (data, options) {
    throw ("Not implemented");
};
var cleveland = function (data, options) {
    var radius = setupRadiusValue(data, options);
    var xVal = function (d) { return d[options.xColumn]; };
    var yVal = function (d) { return d[options.yColumn]; };
    var category = function (d) { return d[options.cColumn]; };
    var note = function (d) { return d[options.nColumn]; };
    var x = d3.scale.linear().range([0, options.width]);
    x.domain(d3.extent(data, function (d) { return d[options.xColumn]; }));
    var yVals = [], flags = [];
    for (var i = 0; i < data.length; i++) {
        if (flags[yVal(data[i])])
            continue;
        flags[yVal(data[i])] = true;
        yVals.push(yVal(data[i]));
    }
    yVals.sort();
    options.yTickFormat = "text";
    var y = d3.scale.ordinal()
        .domain(yVals)
        .rangePoints([0, options.height]);
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(d3.format(options.xTickFormat))
        .ticks(options.xTicks);
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(options.yTicks);
    var svg = createCanvas(xAxis, yAxis, options);
    svg.selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", function (d) { return wtf(category(d)); })
        .attr("cy", function (d) { return y(yVal(d)); })
        .attr("cx", function (d) { return x(xVal(d)); })
        .attr("r", function (d) { return radius.numeric(d); })
        .style("fill", function (d) { return color(category(d)); })
        .on("mouseover", function (d) { return showTooltip(note(d), x(d), y(d), category(d), category(d)); })
        .on("mouseout", hideTooltip);
};
var scatter = function (data, options) {
    options = fillInDefaultOptions(options);
    var radius = setupRadiusValue(data, options);
    var x = setupXValue(data, options);
    var y = function (d) { return +d[options.yColumn]; };
    var category = function (d) { return d[options.cColumn]; };
    var note = function (d) { return d[options.nColumn]; };
    var xDomain = d3.time.scale().range([0, options.width]);
    var yDomain = d3.scale.linear().range([options.height, 0]);
    data.forEach(function (d) { d[options.xColumn] = x.numeric(d); });
    if (options.autoDomain) {
        yDomain.domain(d3.extent(data, function (d) { return d[options.yColumn]; }));
        xDomain.domain(d3.extent(data, function (d) { return d[options.xColumn]; }));
    }
    else {
        yDomain.domain([
            options.yRange[0],
            d3.max(data, function () { return options.yRange[1]; })
        ]);
        xDomain.domain([
            options.xRange[0],
            d3.max(data, function () { return options.xRange[1]; })
        ]);
    }
    var xAxis = d3.svg.axis()
        .scale(yDomain)
        .orient("bottom")
        .tickFormat(d3.format(options.xTickFormat))
        .ticks(options.xTicks);
    var yAxis = d3.svg.axis()
        .scale(xDomain)
        .orient("left")
        .tickFormat(d3.format(options.yTickFormat))
        .ticks(options.yTicks);
    var svg = createCanvas(xAxis, yAxis, options);
    svg.selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", function (d) { return wtf(category(d)); })
        .attr("r", function (d) { return radius.numeric(d); })
        .style("fill", function (d) { return color(category(d)); })
        .attr("cx", function (d) { return +xDomain(d[options.xColumn]); })
        .attr("cy", function (d) { return yDomain(y(d)); })
        .on("mouseover", function (d) { return showTooltip(note(d), x.tooltip(d), y(d), category(d), category(d)); })
        .on("mouseout", hideTooltip);
    var categories = [], flags = [];
    for (var i = 0; i < data.length; i++) {
        if (flags[category(data[i])])
            continue;
        flags[category(data[i])] = true;
        categories.push(category(data[i]));
    }
    categories.sort();
    if (options.legend) {
        var legend = svg.selectAll(".legend")
            .data(categories)
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", function (d, i) { return ("translate(0," + i * 20 + ")"); });
        legend.append("rect")
            .attr("x", options.width - 18)
            .attr("width", 18)
            .attr("height", 18)
            .attr("class", function (d) { return wtf(d); })
            .on("mouseover", fadeOutOtherPoints)
            .on("mouseout", removeFadeout)
            .style("fill", color);
        legend.append("text")
            .attr("x", options.width - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function (d) { return d; })
            .on("mouseover", fadeOutOtherPoints)
            .on("mouseout", removeFadeout);
    }
};
var color = d3.scale.category10();
function fillInDefaultOptions(options) {
    Object.keys(defaultOptions).forEach(function (key) {
        if (isNull(defaultOptions[key]) && isNull(options[key]))
            throw ("Option:" + key + " not supplied");
        if (isNull(options[key]))
            options[key] = defaultOptions[key];
    });
    return options;
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
var margin = {
    top: 80,
    right: 80,
    bottom: 80,
    left: 80
};
function showTooltip(note, x, y, c, r) {
    globalTooltip.transition()
        .duration(200)
        .style("opacity", .9);
    globalTooltip.html(("" + note) +
        ("<table><tr><td>X</td><td> " + x + " </td></tr>") +
        ("<tr><td>Y</td><td>        " + y + " </td></tr>") +
        ("<tr><td>Category</td><td> " + c + " </td></tr>") +
        ("<tr><td>Radius</td><td>   " + r + " </td></tr></table>"))
        .style("left", (d3.event.pageX + 5) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
}
function hideTooltip() {
    globalTooltip.transition()
        .duration(200)
        .style("opacity", 0);
}
function wtf(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    var num = +hash;
    var letters = "";
    while (num > 0) {
        num--;
        letters = String.fromCharCode(97 + (num % 26)) + letters;
        num = Math.floor(num / 26);
    }
    return letters.replace(/\s/g, "");
}
function isNull(val) {
    return typeof (val) === "undefined";
}
function distinct(value, index, self) {
    return self.indexOf(value) === index;
}
function formatDate(d) {
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var months = ["January", "February", "March", "April", "May",
        "June", "July", "August", "September", "October", "November", "December"
    ];
    var day = days[new Date(d).getDay()].substr(0, 3);
    var month = months[new Date(d).getMonth()];
    return day + " " + month + " " + new Date(d).getDate() + ", " + new Date(d).getFullYear();
}
;
//# sourceMappingURL=graphs.js.map