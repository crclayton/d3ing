"use strict";
var defaultOptions = {
    xIsDate: false,
    isBubble: false,
    legend: true,
    xColumn: null,
    yColumn: null,
    rColumn: null,
    cColumn: "category",
    nColumn: "note",
    height: 300,
    width: 600,
    xAxisName: "",
    yAxisName: "",
    maxRad: 4,
    minRad: 1,
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
            .range([options.maxRad, options.minRad]);
        return {
            tooltip: function (d) { return d[options.rColumn]; },
            numeric: function (d) { return scaleBetween(d[options.rColumn]); }
        };
    }
    else {
        return {
            tooltip: function () { return options.maxRad; },
            numeric: function () { return options.maxRad; }
        };
    }
};
var scatter = function (data, options) {
    Object.keys(defaultOptions)
        .forEach(function (key) {
        if (isNull(defaultOptions[key]) && isNull(options[key]))
            throw ("Option:" + key + " not supplied");
        if (isNull(options[key]))
            options[key] = defaultOptions[key];
    });
    var radius = setupRadiusValue(data, options);
    var x = setupXValue(data, options);
    var y = function (d) { return +d[options.yColumn]; };
    var category = function (d) { return d[options.cColumn]; };
    var note = function (d) { return d[options.nColumn]; };
    var xDomain = d3.time.scale().range([0, options.width]);
    var yDomain = d3.scale.linear().range([options.height, 0]);
    data.forEach(function (d) { d[options.xColumn] = x.numeric(d); });
    yDomain.domain([0, d3.max(data, function (d) { return y(d); })]);
    xDomain.domain(d3.extent(data, function (d) { return d[options.xColumn]; }));
    var xAxis = d3.svg.axis()
        .scale(xDomain)
        .orient("bottom")
        .ticks(5), yAxis = d3.svg.axis()
        .scale(yDomain)
        .orient("left")
        .ticks(5);
    var tooltip = d3.select("body")
        .append("div")
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
    svg.selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", function (d) { return removeSpaces(category(d)); })
        .attr("r", function (d) { return radius.numeric(d); })
        .style("fill", function (d) { return color(category(d)); })
        .attr("cx", function (d) { return +xDomain(d[options.xColumn]); })
        .attr("cy", function (d) { return yDomain(y(d)); })
        .on("mouseover", function (d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html(note(d) +
            "<table class='bo'><tr><td>X</td><td>" +
            x.tooltip(d) +
            "</td></tr>" +
            "<tr><td>Y</td><td>" +
            y(d) +
            "</td></tr>" +
            "<tr><td>Category</td><td>" +
            category(d) +
            "</td></tr>" +
            "<tr><td>Radius</td><td>" +
            radius.tooltip(d) +
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
        .attr("transform", "translate(0," + options.height + ")")
        .call(xAxis);
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    var categories = data.map(function (d) { return category(d); }).slice().filter(distinct);
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
            .attr("class", function (d) { return removeSpaces(d); })
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
function removeSpaces(s) {
    return s.replace(/\s/g, "");
}
function isNull(val) {
    return typeof (val) === "undefined";
}
function distinct(value, index, self) {
    return self.indexOf(value) === index;
}
function formatDate(d) {
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var months = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
        'November', 'December'
    ];
    var day = days[new Date(d).getDay()].substr(0, 3);
    var month = months[new Date(d).getMonth()];
    return day + " " + month + " " + new Date(d).getDate() + ", " + new Date(d).getFullYear();
}
;
//# sourceMappingURL=graphs.js.map