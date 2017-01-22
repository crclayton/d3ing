"use strict";

declare var d3 : any; // defined in d3.js


interface IGraphOptions {
    xIsDate:        boolean;
    isBubble:       boolean;
    legend:         boolean;
    xColumn:        string;
    yColumn:        string;
    rColumn:        string;
    cColumn:        string;
    nColumn:        string;
    height:         number;
    width:          number;
    xAxisName:      string;
    yAxisName:      string;
    maxRad:         number;
    minRad:         number;
    appendTo:       string;
    title:          string;
    pointOpacity:   number;
    fadeOutOpacity: number
    dateFormat:     string;
    [key: string]:  any;
}

var defaultOptions : IGraphOptions = {
    xIsDate:    false,    
    isBubble:   false,
    legend:     true,
    xColumn:    null,
    yColumn:    null,
    rColumn:    null, 
    cColumn:    "category",
    nColumn:    "note",
    height:     300,
    width:      600,
    xAxisName:  "",
    yAxisName:  "",
    maxRad:     4,
    minRad:     1,
    appendTo:   "body",
    title:      "",
    pointOpacity:   0.7,
    fadeOutOpacity: 0.1,
    dateFormat:     "%d/%m/%Y"
}


interface IValue {
    tooltip: Function;
    numeric: Function;
    [key:string] : any;
}

var setupXValue = (data: any, options: IGraphOptions) : IValue => {

    if (options.xIsDate) {
        var parseDate = d3.time.format(options.dateFormat).parse;
        return {
            tooltip: (d: any) => formatDate(d[options.xColumn]),
            numeric: (d: any) => +parseDate(d[options.xColumn])
        };

    } else {
        return {
            tooltip: (d: any) => d[options.xColumn],
            numeric: (d: any) => +d[options.xColumn]
        };
    }
}


var setupRadiusValue = (data: any, options:IGraphOptions) : IValue => {

    if (options.isBubble) {

        // get largest and smallest value so we can scale our bubbles' radius to that
        var rads: Array<number> = [];
        data.forEach((d: any) => { rads.push(d[options.rColumn]); });

        var max = Math.max.apply(Math, rads);
        var min = Math.min.apply(Math, rads);

        var scaleBetween: Function = d3.scale.linear()
            .domain([min, max])
            .range([options.maxRad, options.minRad]);

        return {
            tooltip: (d:any) => d[options.rColumn],              // for showing the real value in the tooltip
            numeric: (d:any) => scaleBetween(d[options.rColumn]) // for creating the scaled radius
        };
    } else {
        return {
            tooltip: () => options.maxRad,
            numeric: () => options.maxRad
        };
    }
}

var scatter = (data: Array<Object>, options: IGraphOptions) => {


    Object.keys(defaultOptions)
        .forEach((key: any) => {
            // if the default option is null and it also hasn't been provided, stop
            if (isNull(defaultOptions[key]) && isNull(options[key]))
                throw (`Option:${key} not supplied`);

            // if the supplied option is null, assign the default option
            if (isNull(options[key])) options[key] = defaultOptions[key];
        });


    var radius = setupRadiusValue(data, options);
    var x = setupXValue(data, options);
    var y: Function         = (d: any) => +d[options.yColumn];
    var category: Function  = (d: any) => d[options.cColumn];
    var note: Function      = (d: any) => d[options.nColumn];
   
    // Set the ranges
    var xDomain = d3.time.scale().range([0, options.width]);
    var yDomain = d3.scale.linear().range([options.height, 0]);

    // convert X and Y axis strings to numbers
    data.forEach((d: any) => {  d[options.xColumn] = x.numeric(d); });

    yDomain.domain([0, d3.max(data, (d: any) => y(d))]);
    xDomain.domain(d3.extent(data, (d: any) => d[options.xColumn]));

    // todo: use this if you want to force the X axis to start at zero
    //x.domain([0, d3.max(data, (d: any) => d[options.xColumn])]);

    // Define the axes
    var xAxis = d3.svg.axis()
            .scale(xDomain)
            .orient("bottom")
            .ticks(5),
        yAxis = d3.svg.axis()
            .scale(yDomain)
            .orient("left")
            .ticks(5);

    // add the tooltip area to the webpage
    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Adds the svg canvas
    var svg = d3.select(options.appendTo)
        .append("svg")
        .attr("width", options.width + margin.left + margin.right)
        .attr("height", options.height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // title
    svg.append("text")
        .attr("x", (options.width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text(options.title);

    // x-axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + options.height + ")")
        .append("text")
        .attr("class", "label")
        .attr("x", options.width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(options.xAxisName);

    // y-axis
    svg.append("g")
        .attr("class", "y axis")
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(options.yAxisName);


    // Add the scatterplot
    svg.selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", (d: any) => removeSpaces(category(d)))
        .attr("r",      (d:any) =>  radius.numeric(d))
        .style("fill",  (d:any) =>  color(category(d)))
        .attr("cx", (d: any) =>     +xDomain(d[options.xColumn]))
        .attr("cy",     (d:any) =>  yDomain(y(d)))
        .on("mouseover",
            (d:any) =>  {
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
        .on("mouseout",
            (): void =>  {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0);
            });


    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + options.height + ")")
        .call(xAxis);

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    
    // get unique cColumn categories for the legend
    const categories = [... data.map((d: any) => category(d))].filter(distinct);

    // draw legend
    if (options.legend) {
        var legend = svg.selectAll(".legend")
            .data(categories)
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", (d:any, i:number) => (`translate(0,${i * 20})`));


        // draw legend colored rectangles
        legend.append("rect")
            .attr("x", options.width - 18)
            .attr("width", 18)
            .attr("height", 18)
            .attr("class", (d:any) => removeSpaces(d)) // the subject name is the class
            .on("mouseover", fadeOutOtherPoints)
            .on("mouseout", removeFadeout)
            .style("fill", color);

        // draw legend text
        legend.append("text")
            .attr("x", options.width - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text((d:any) => d)
            .on("mouseover", fadeOutOtherPoints)
            .on("mouseout", removeFadeout);
    }

    // circle and rect elements not of the hovered class are faded
    function fadeOutOtherPoints() {
        const n = this.getAttribute("class");

        d3.selectAll("circle, rect").transition()
            .style("opacity", 0.1);

        d3.selectAll(`circle.${n}, rect.${n}`).transition()
            .style("opacity", 0.7);
    }

    function removeFadeout() {
        d3.selectAll("circle").transition()
            .style("opacity", 0.7);

        d3.selectAll("rect").transition()
            .style("opacity", 1);

    };

}


/// <summary>
/// </summary>
/*
Array.prototype.lineGraph = function (xAxisName, yAxisName, width, height, maxRad, minRad) {

    var data = this;

    var width = 900 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;


    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

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
        .x(function (d) { return x(d.date); })
        .y(function (d) { return y(d.number); });

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



    color.domain(d3.keys(data[0]).filter(function (key) { return key == cColumn; }));

    // first we need to corerce the data into the right formats

    data = data.map(function (d) {
        return {
            category: d.category,
            date: parseDate(d.date),
            number: +d.number
        };
    });


    // then we need to nest the data on category since we want to only draw one
    // line per category
    data = d3.nest().key(function (d) { return d.category; }).entries(data);


    x.domain([d3.min(data, function (d) { return d3.min(d.values, function (d) { return d.date; }); }),
        d3.max(data, function (d) { return d3.max(d.values, function (d) { return d.date; }); })]);
    y.domain([0, d3.max(data, function (d) { return d3.max(d.values, function (d) { return d.number; }); })]);


    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    var cities = svg.selectAll(".category")
        .data(data, function (d) { return d.key; })
        .enter().append("g")
        .attr("class", cColumn);

    cities.append("path")
        .attr("class", "line")
        .attr("d", function (d) { return line(d.values); })
        .style("stroke", function (d) { return color(d.key); })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .attr("id", function (d) { return d.key; })



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
*/


var color = d3.scale.category10();



// Set the dimensions of the canvas / graph
var margin = {
    top: 30,
    right: 30,
    bottom: 30,
    left: 30
};


function removeSpaces(s: string) {
    return s.replace(/\s/g, "");
}

function isNull(val:any) {
    return typeof (val) === "undefined";
}


function distinct(value:any, index:any, self:any) {
    return self.indexOf(value) === index;
}


function formatDate(d: any) {

    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var months = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
        'November', 'December'
    ];

    var day = days[new Date(d).getDay()].substr(0, 3);
    var month = months[new Date(d).getMonth()];

    return day + " " + month + " " + new Date(d).getDate() + ", " + new Date(d).getFullYear();
};
