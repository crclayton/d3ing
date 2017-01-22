"use strict";

declare var d3 : any; // defined in d3.js


var globalTooltip;


d3.format(".0%")(0.123);  // rounded percentage, "12%"


interface IGraphOptions {
    xIsDate:        boolean;
    isBubble:       boolean;
    legend: boolean;
    autoDomain:     boolean;
    xColumn:        string;
    yColumn:        string;
    rColumn:        string;
    cColumn:        string;
    nColumn:        string;
    height:         number;
    width:          number;
    xAxisName:      string;
    yAxisName:      string;
    xTickFormat: string;
    yTickFormat: string;
    yTicks: number;
    xTicks: number;
    radRange: Array<number>;
    xRange:     Array<number>;
    yRange:     Array<number>;
    appendTo:       string;
    title:          string;
    pointOpacity:   number;
    fadeOutOpacity: number;
    dateFormat:     string;
    [key: string]:  any;
}

var defaultOptions: IGraphOptions = {
    xIsDate: false,
    isBubble: false,
    legend: true,
    autoDomain: true,
    xColumn:    null,
    yColumn:    null,
    rColumn:    null, 
    cColumn:    "category",
    nColumn:    "note",
    height:     300,
    width:      600,
    xAxisName:  "",
    yAxisName: "",
    xTickFormat: "d",
    yTickFormat: "d",
    yTicks: null,
    xTicks: null,
    radRange: [2, 6],
    xRange: [0, 100],
    yRange: [0, 100],
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
        var rads: any = [];
        data.forEach((d: any) => { rads.push(d[options.rColumn]); });

        const max = Math.max(...rads);
        const min = Math.min(...rads);

        var scaleBetween: Function = d3.scale.linear()
            .domain([min, max])
            .range([options.radRange[0], options.radRange[1]]);

        return {
            tooltip: (d:any) : any => d[options.rColumn],              // for showing the real value in the tooltip
            numeric: (d:any) : any => scaleBetween(d[options.rColumn]) // for creating the scaled radius
        };
    } else {
        return {
            tooltip: () : any => options.radRange[1],
            numeric: () : any => options.radRange[1]
        };
    }
}

var createCanvas = (xAxis: any, yAxis: any, options: any) => {

     globalTooltip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .attr("class", "tooltip")
    .style("opacity", 0);
    // todo: auto vs. specified .ticks(5) for axes

    // svg
    var svg = d3.select(options.appendTo)
        .append("svg")
        .attr("width", options.width + margin.left + margin.right)
        .attr("height", options.height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // title
    svg.append("text")
        .attr("x", (options.width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text(options.title);

    // axes lines
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${options.height})`)
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    // axes labels
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${options.height})`)
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
}

var line = (data: Array<Object>, options: IGraphOptions) => {
    throw ("Not implemented");
}

var bar = (data: Array<Object>, options: IGraphOptions) => {
    throw ("Not implemented");
}




var cleveland = (data: Array<Object>, options: IGraphOptions) => {

    var radius = setupRadiusValue(data, options);
    var xVal: Function      = (d: any) => d[options.xColumn];
    var yVal: Function      = (d: any) => d[options.yColumn];
    var category: Function  = (d: any) => d[options.cColumn];
    var note: Function      = (d: any) => d[options.nColumn];

    var x = d3.scale.linear().range([0, options.width]);
    x.domain(d3.extent(data, d => d[options.xColumn]));

    var yVals = [], flags = [];
    for (let i = 0; i < data.length; i++) {
        if (flags[yVal(data[i])]) continue;
        flags[yVal(data[i])] = true;
        yVals.push(yVal(data[i]));
    }
    yVals.sort();

    options.yTickFormat = "text";


    var y = d3.scale.ordinal()
        .domain(yVals)
        .rangePoints([0, options.height]);

    // Define the axes
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
        .attr("class", d => wtf(category(d))) // the subject name is the class
        .attr("cy", d => y(yVal(d)))
        .attr("cx", d => x(xVal(d)))
        .attr("r", d => radius.numeric(d))
        .style("fill", d => color(category(d)))
        .on("mouseover", d => showTooltip(note(d), x(d), y(d), category(d), category(d)))
        .on("mouseout", hideTooltip);

}

var scatter = (data: Array<Object>, options: IGraphOptions) => {


    options = fillInDefaultOptions(options);

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


    if (options.autoDomain) {
        yDomain.domain(d3.extent(data, (d: any) => d[options.yColumn]));
        xDomain.domain(d3.extent(data, (d: any) => d[options.xColumn]));
    } else {
        yDomain.domain([
            options.yRange[0],
            d3.max(data, () => options.yRange[1])
        ]);

        xDomain.domain([
            options.xRange[0],
            d3.max(data, () => options.xRange[1])
        ]);    
    }

    // Define the axes
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

    // Add the scatterplot
    svg.selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", (d: any) => wtf(category(d)))
        .attr("r", (d: any) => radius.numeric(d))
        .style("fill", (d: any) => color(category(d)))
        .attr("cx", (d: any) => +xDomain(d[options.xColumn]))
        .attr("cy", (d: any) => yDomain(y(d)))
        .on("mouseover", d => showTooltip(note(d), x.tooltip(d), y(d), category(d), category(d)))
        .on("mouseout", hideTooltip);



    // get unique categories for the legend
    // const categories = [...data.map(d => d.category)].filter(distinct);

    var categories = [], flags = [];
    for (let i = 0; i < data.length; i++) {
        if (flags[category(data[i])]) continue;
        flags[category(data[i])] = true;
        categories.push(category(data[i]));
    }
    categories.sort();



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
            .attr("class", (d:any) => wtf(d)) // the subject name is the class
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


}



var color = d3.scale.category10();

function fillInDefaultOptions(options : IGraphOptions) {

    Object.keys(defaultOptions).forEach((key: any) => {
        // if the default option is null and it also hasn't been provided, stop
        if (isNull(defaultOptions[key]) && isNull(options[key]))
            throw (`Option:${key} not supplied`);

        // if the supplied option is null, assign the default option
        if (isNull(options[key])) options[key] = defaultOptions[key];
    });

    return options;
}


// todo: these should be options
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

// Set the dimensions of the canvas / graph
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

        globalTooltip.html(`${note}` +
            `<table><tr><td>X</td><td> ${x} </td></tr>` +
            `<tr><td>Y</td><td>        ${y} </td></tr>` +
            `<tr><td>Category</td><td> ${c} </td></tr>` +
            `<tr><td>Radius</td><td>   ${r} </td></tr></table>`)
            .style("left", (d3.event.pageX + 5) + "px")
            .style("top", (d3.event.pageY - 28) + "px");

}

function hideTooltip() {
    globalTooltip.transition()
        .duration(200)
        .style("opacity", 0);
}

// the function and purpose of this crazy thing is left
// as an exercise for the reader, just for fun :)
function wtf(str: string) : string {
    var hash = 0;
    for (let i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
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

function isNull(val:any) {
    return typeof (val) === "undefined";
}

function distinct(value:any, index:any, self:any) {
    return self.indexOf(value) === index;
}

function formatDate(d: any) {

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May",
        "June", "July", "August", "September", "October", "November", "December"
    ];

    const day = days[new Date(d).getDay()].substr(0, 3);
    const month = months[new Date(d).getMonth()];

    return day + " " + month + " " + new Date(d).getDate() + ", " + new Date(d).getFullYear();
};

