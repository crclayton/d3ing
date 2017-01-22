"use strict";

declare var d3 : any; // defined in d3.js


interface IGraphOptions {
    xIsDate:        boolean;
    bubble:         boolean;
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
    xIsDate:  false,    
    bubble:  false,
    legend:  true,
    xColumn:  null,
    yColumn:  null,
    rColumn:  null, 
    cColumn:  "category",
    nColumn:  "note",
    height:  300,
    width:  600,
    xAxisName:  "",
    yAxisName:  "",
    maxRad:  4,
    minRad:  1,
    appendTo:  "body",
    title:  "",
    pointOpacity:  0.7,
    fadeOutOpacity:  0.1,
    dateFormat: "%d/%m/%Y"
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


    // this is a bit of a cheeky hack, but if there's no radius column
    // ie. it's a scatter plot, not a bubble plot, set the rColumn to 
    // be the yColumn, but make the range of the bubble size equal

    // Set the ranges
    var x = d3.time.scale().range([0, options.width]);
    var y = d3.scale.linear().range([options.height, 0]);

    data.forEach((d:any) => {
        d[options.yColumn] = +d[options.yColumn];
    });

    y.domain([
        0, d3.max(data, (d : any) => d[options.yColumn])
    ]);

    var xValue : any, rValue : any, rValueScaled : any;

    if (options["bubble"]) {

        // get largest and smallest radius value so we can scale to that
        var rads : Array<number> = [];

        data.forEach((d: any) => {
            rads.push(d[options.rColumn]);
        });

        var max = Math.max.apply(Math, rads);
        var min = Math.min.apply(Math, rads);

        var scaleBetween = d3.scale.linear()
            .domain([min, max])
            .range([options.maxRad, options.minRad]);

        rValue = (d: any) => d[options.rColumn];     
        rValueScaled = (d: any) => scaleBetween(d[options.rColumn]);
    }
    else 
    {
        rValue = () => options.maxRad;
        rValueScaled = () => options.maxRad;
    }

    if (options.xIsDate) {
        var dateFormat = options.dateFormat;

        // Parse the date / time
        var parseDate = d3.time.format(dateFormat).parse;

        // parse date to present in a pretty way in the tooltip
        xValue = (d: any) => {

            var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            var months = [
                'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
                'November', 'December'
            ];

            d = d[options.xColumn];

            var day = days[new Date(d).getDay()].substr(0, 3);
            var month = months[new Date(d).getMonth()];

            return day + " " + month + " " + new Date(d).getDate() + ", " + new Date(d).getFullYear();

        };


        data.forEach((d:any) => {
            d[options.xColumn] = parseDate(d[options.xColumn]);
        });

        // Scale the range of the data
        x.domain(d3.extent(data, (d : any) => d[options.xColumn]));

    } else {
        xValue = (d : any): string => d[options.xColumn];

        data.forEach((d:any) => {
            d[options.xColumn] = +(d[options.xColumn]);
        });

        x.domain([
            0, d3.max(data, (d:any) => d[options.xColumn])
        ]);
    }



    // Define the axes
    var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(5),
        yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(5);

    var yValue = (d:any) => d[options.yColumn],
        cValue = (d:any) => d[options["cColumn"]];

    // add the tooltip area to the webpage
    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Adds the svg canvas
    var svg = d3.select(options["appendTo"])
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
        .text(options["title"]);

    // x-axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + options.height + ")")
        .append("text")
        .attr("class", "label")
        .attr("x", options.width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(options["xAxisName"]);

    // y-axis
    svg.append("g")
        .attr("class", "y axis")
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(options["yAxisName"]);


    // Add the scatterplot
    svg.selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", (d:any, i:number) => d[options.cColumn])
        .attr("r",      (d:any) =>  rValueScaled(d))
        .style("fill",  (d:any) =>  color(cValue(d)))
        .attr("cx",     (d:any) =>  x(d[options.xColumn]))
        .attr("cy",     (d:any) =>  y(d[options.yColumn]))
        .on("mouseover",
            (d:any) =>  {
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
    const categories = [... data.map((obj: any) => obj[options["cColumn"]])].filter(distinct);

    // draw legend
    if (options["legend"]) {
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
            .attr("class", (d:any) => colorClass(d)) // the subject name is the class
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

    // if the cColumn has a space in it, it will
    // be given two classes, so remove spaces
    function colorClass(d : string) {
        return d.replace(/ /g, "");
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


function isNull(val:any) {
    return typeof (val) === "undefined";
}


function distinct(value:any, index:any, self:any) {
    return self.indexOf(value) === index;
}