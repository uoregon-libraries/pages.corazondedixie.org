// Set the resize function
d3.select(window).on("resize", sizeChange);

// ~ = ~ = ~ = ~ = ~ SVG elements (non-map) ~ = ~ = ~ = ~ = ~ //

// The timeline SVG
var svg = d3.select("#timeline")
    .append("svg")
    .attr("class", "svg-chart")
    .attr("width", "100%");
var chart = $(".svg-chart");
var container = chart.parent(),
    containerParent = container.parent();

// Math out the parts of the plot
outerWidth = container.width();
outerHeight = container.height();
width = outerWidth - margin.left - margin.right;
height = outerHeight - margin.top - margin.bottom;
innerWidth = width - padding.left - padding.right;
innerHeight = height - padding.top - padding.bottom;
endX = startX + width;
endY = startY + height;
endInX = startInX + innerWidth;
endInY = startInY + innerHeight;
var aspect = outerWidth / outerHeight;

// The top-level group for the timeline
var mainGroup = svg.append("g")
    .attr("class", "topGroup");


// ~ = ~ = ~ = ~ = ~ The map elements ~ = ~ = ~ = ~ = ~ //
var map = new L.Map("map", {
        center: [26.91, -100.93],
        zoom: 4
    })
    .addLayer(new L.TileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"));

map.on("zoomend", function(e) {
    updateMarkers();
});

var mapSVG = d3.select(map.getPanes().overlayPane)
    .append("svg")
    .attr("class", "svg-map")
    .attr("width", $("#map").width())
    .attr("height", $("#map").height());

var mapG = mapSVG.append("g").attr("class", "leaflet-zoom-hide");

var markerLayer = L.featureGroup().addTo(map);
var fromIcon = new L.divIcon({
    iconSize: new L.Point(12, 12),
    className: 'from-icon'
});

var toIcon = new L.divIcon({
    iconSize: new L.Point(12, 12),
    className: 'to-icon'
});

// specify popup options
var customOptions = {
    'maxWidth': '500',
    'maxHeight': '55',
    'className': 'custom'
};
var mapMarks = {};


// - - - - - Tooltips - - - - - - - - - //
var mapChart = $("#map");

// Timeline tooltip element
var timelineDiv = d3.select("body")
    .append("div")
    .attr("class", "timelineTooltip")
    .style("top", container.offset().top + outerHeight);

// The map tooltip element
var mapDiv = d3.select("body").append("div")
    .attr("class", "mapTooltip")
    .style("top", (mapChart.height() / 2.0) + "px")
    .style("left", startX + "px")
    .style("opacity", 0);


// ~ ~ ~ Function to scale the main group ~  ~ ~
function sizeChange() {

    // Resize the timeline
    var wide = container.width(),
        high = container.height();
    var scale = wide / outerWidth;
    d3.select(".topGroup").attr("transform", "scale(" + scale + ")");
    $(".svg-chart").height(wide * (1.0 / aspect));

}


// ~ = ~ = ~ = ~ = ~ Data manipulations  ~ = ~ = ~ = ~ = ~ //

// The scale for timeline dot radii, x and y axes
var xScale = d3.time.scale().range([startInX, endInX]);

// The date formatter
var parseDate = d3.time.format("%Y");
var xVal = function(d) {
    return xScale(parseDate.parse(d.toString()));
};

var currentDate;
var periods;
var instants;
var selectedPaths = [];

// The x axis
var axisGroup = mainGroup.append("g")
    .attr("class", "xaxis")
    .attr("transform", "translate(0," + endInY + ")");
var xAxis = d3.svg.axis()
    .scale(xScale)
    .tickSize(12.5, 15)
    .tickPadding(15)
    .orient("bottom");

// The timeline marker
var timeMarker = mainGroup.append("g");
var timeLine = timeMarker.append("line")
    .attr("class", "timelineMarker")
    .attr("y1", endInY)
    .attr("y2", endInY - 85);
var timeText = timeMarker.append("text")
    .attr("class", "timeline-text")
    .attr("y", endInY + 22.5);
var tri = d3.svg.symbol().type('triangle-up')
    .size(50);
var timeTriangle = timeMarker.append("path")
    .attr('d', tri)
    .attr("class", "timelineMarker");
var tri2 = d3.svg.symbol().type('triangle-down')
    .size(50);
var timeTriangle2 = timeMarker.append("path")
    .attr('d', tri2)
    .attr("class", "timelineMarker");
var timeTriangleDrag = d3.behavior.drag();
timeMarker.call(timeTriangleDrag);

// + + + Update the timeline elements + + + //
var updateTimeline = function() {

    mainGroup.selectAll(".single-timeline").remove();

    // Go through the data, create timeline vis
    var dotPos = endInY - 72;

    // Create a group for each timeline
    var singleLine = mainGroup.append("g")
        .attr("class", "single-timeline");

    // Create the instant circles
    var timeInstant = singleLine.selectAll("g")
        .data(instants)
        .enter();
    timeInstant.append("line")
        .attr("class", "dots")
        .attr("x1", function(d) {
            return xVal(parseInt(d.data[0].startDate));
        })
        .attr("y1", dotPos)
        .attr("x2", function(d) {
            return xVal(parseInt(d.data[0].startDate));
        })
        .attr("y2", endInY)
        .attr("stroke", "DarkGray")
        .attr("stroke-width", function(d) {
            var selected = false;
            for (i in d.data)
                if (d.data[i].isSelected)
                    selected = true;
            if (selected)
                return "2px";
            else
                return "1px";
        });
    timeInstant.append("circle")
        .attr("class", "dots")
        .attr("r", 4)
        .attr("cx", function(d) {
            return xVal(parseInt(d.data[0].startDate));
        })
        .attr("cy", dotPos)
        .attr("stroke", "DarkGray")
        .attr("stroke-width", function(d) {
            var selected = false;
            for (i in d.data)
                if (d.data[i].isSelected)
                    selected = true;
            if (selected)
                return "3px";
            else
                return "1px";
        })
        .on("mouseover", function(d) {
            selectedPaths.push(d);
            for (i in d.data)
                d.data[i].isSelected = true;
            updateMarkers();
            d3.select(this)
                .classed("active", true)
                .attr("stroke-width", "3px");
            timelineDiv.transition()
                .duration(200)
                .style("opacity", .75);
            timelineDiv.html(d.timelineLabel)
                //.style("left", (d3.event.pageX - 250) + "px");
                .style("left", ($(this).offset().left) + "px");
        })
        .on("mouseout", function(d) {
            //mouseUp();
            selectedPaths = [];
            for (i in d.data)
                d.data[i].isSelected = false;
            // updateMarkers();
            d3.select(this)
                .classed("active", false)
                .attr("stroke-width", "1px");
            timelineDiv.transition()
                .duration(1500)
                .style("opacity", 0);
        });

    // Create the periods
    var timePeriod = singleLine.selectAll("g")
        .data(periods)
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return d.data[0].x;
        })
        .attr("y", function(d) {
            return d.data[0].pos - 1;
        })
        .attr("width", function(d) {
            return d.data[0].wide;
        })
        .attr("height", 8)
        .attr("fill", function(d) {
            return d.data[0].color;
        })
        .attr("stroke-width", "0.5")
        .attr("stroke", "black")
        .attr("opacity", function(d) {
            var selected = false;
            for (i in d.data)
                if (d.data[i].isSelected)
                    selected = true;
            if (selected)
                return 1;
            else
                return 0.5;
        })
        .on("mouseover", function(d) {
            // console.log("mouseover bar");
            selectedPaths.push(d);

            for (i in d.data)
                d.data[i].isSelected = true;
            updateMarkers();

            d3.select(this)
                .attr("opacity", 1.0)
                .classed("active", true);
            timelineDiv.transition()
                .duration(200)
                .style("opacity", .75);
            timelineDiv.html(d.timelineLabel)
                //.style("left", (d3.event.pageX - 200) + "px");
                .style("left", ($(this).offset().left) + "px")
                .style("top", container.offset().top + container.height());
            mapDiv.transition()
                .duration(400)
                .style("opacity", 0);
        })
        .on("mouseout", function(d) {
            selectedPaths = [];

            for (i in d.data) {
                d.data[i].isSelected = false;
            }

            d3.select(this)
                .attr("opacity", 0.5)
                .classed("active", false);
            timelineDiv.transition()
                .duration(1500)
                .style("opacity", 0);
        });
}

// + + +  Upate the markers being shown + + + //
var updateMarkers = function() {
    // Remove previous paths and markers
    markerLayer.clearLayers();
    mapG.selectAll("path").remove();

    var showEm = [];

    // Add paths selected by date slider
    for (i in mapMarks) {
        startDate = i.split(",")[0];
        endDate = i.split(",")[1];

        // Test the dates to see if we add markers
        if ((startDate <= currentDate) && (currentDate <= endDate)) {

            // Grab all the selected markers
            for (x in mapMarks[i].data) {
                showEm.push(mapMarks[i].data[x]);
                mapMarks[i].data[x].fromMarker.addTo(markerLayer);
                mapMarks[i].data[x].toMarker.addTo(markerLayer);
            }
        }
    }

    // Add to and from markers for selected paths
    for (i in selectedPaths) {
        for (x in selectedPaths[i].data) {
            showEm.push(selectedPaths[i].data[x]);
            selectedPaths[i].data[x].toMarker.addTo(markerLayer);
            selectedPaths[i].data[x].fromMarker.addTo(markerLayer);
        }
    }

    // Add the paths
    var pathEnter = mapG.selectAll("g")
        .data(showEm)
        .enter();

    // Bottom path is black stroke
    var path = pathEnter.append("path")
        .attr("id", "noArrow")
        .attr("d", function(d) {
            return linkArc(d, d.bend);
        })
        .attr("stroke", "Black")
        .attr("stroke-width", "5px")
        .attr("fill", "none")
        .attr("stroke-dasharray", function() {
            return dasharray(this);
        })
        .attr("stroke-dashoffset", function() {
            return dashoffset(this);
        })
        .transition()
        .duration(2000)
        .attr("stroke-dashoffset", 0);

    // Arrows match bottom stroke
    var pathArray = mapG.selectAll("#noArrow")[0];
    addArrows(pathArray);

    // Top path is color fill
    pathEnter.append("path")
        .attr("d", function(d) {
            return linkArc(d, d.bend);
        })
        .attr("class", "travel-path")
        .attr("fill", "none")
        .attr("style", "cursor: default")
        .attr("stroke", function(d) {
            if (d.isSelected)
                return d.color;
            else
                return "SlateGray";
        })
        .attr("stroke-dasharray", function() {
            return dasharray(this);
        })
        .attr("stroke-dashoffset", function() {
            return dashoffset(this);
        })
        .on("mouseover", function(d) {
            d.isSelected = true;
            mapDiv.transition()
                .style("opacity", 1.0);
            mapDiv.html(d.mapLabel);
            updateTimeline();
        })
        .on("mouseout", function(d) {
            d.isSelected = false
            mapDiv.transition()
                .duration(400)
                .style("opacity", 0);
            updateTimeline();
        })
        .transition()
        .duration(2000)
        .attr("stroke-dashoffset", 0);

    function dasharray(path) {
        var len = path.getTotalLength();
        return len + " " + len;
    }

    function dashoffset(path) {
        var len = path.getTotalLength();
        return len;
    }

    function addArrows(pathArray) {
        mapG.selectAll('image').remove();
        pathArray.forEach(function(p, index) {
            var arrow = mapG.append("image")
                .attr("xlink:href", "images/arrow.svg")
                .attr("width", 10)
                .attr("height", 10)
                .attr("y", -10)
                .attr("orient", "top")
                .transition()
                .duration(2000)
                .attrTween("transform", function() {
                    return translateAlong(p)
                })
                .remove();
        });
    };

    function translateAlong(path) {

        return function(t) {
            var previous = path.getPointAtLength(t * path.getTotalLength());
            var current = path.getPointAtLength(t * path.getTotalLength() + 5);

            var angle = Math.atan2(current.y - previous.y, current.x - previous.x) * 180 / Math.PI - 135;

            return "translate(" + current.x + "," + current.y + ")rotate(" + angle + ")";
        };
    }

    sizeChange();
}


// @ @ @ @ @ @ Start Control @ @ @ @ @ @ @ //

// Read in the data from Google spreadsheet's CSV export
var sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSKO-cnJx6vRv6rx3MoFx5IknwR5I7JduqKWmwI0dNLsIgWeiVBd1KdZDAkC6qxoaU6e45GyordMhOy/pub?gid=0&single=true&output=csv";
d3.csv(sheetURL, function(error, data) {
        // Save off date info
        dates = []
        periods = [];
        instants = [];
        var tmpInst = {};

        // Go through the data, create markers
        data.forEach(function(d) {

            // - - - - Extract data for the timeline - - - - //
            // Add to the dates
            dates.push(d['Years Start']);
            dates.push(d['Years End']);

            // Get the start & end dates, create a tag
            sDate = d['Years Start'];
            eDate = d['Years End'];
            var tag = sDate + "," + eDate;

            // Create a mapMark for each time period/instant
            if (!(tag in mapMarks)) {
                mapMarks[tag] = {
                    isInstant: false,
                    data: [],
                    timelineLabel: "test"
                };
            }

            // Create the markers
            var toTitle = d['To Label'];
            var toMarker = L.marker([d["To Latitude"], d["To Longitude"]], {
                icon: toIcon,
                title: toTitle
            });
            toMarker.bindPopup(toTitle, customOptions);
            var fmTitle = d['From Label'];
            var fromMarker = L.marker(new L.LatLng(d["From Latitude"], d["From Longitude"]), {
                icon: fromIcon,
                title: fmTitle
            });
            fromMarker.bindPopup(fmTitle, customOptions);

            var isInstant = true;
            if (sDate != eDate)
                isInstant = false;
            mapMarks[tag].isInstant = isInstant;
            mapMarks[tag]['data'].push({
                toMarker: toMarker,
                fromMarker: fromMarker,
                mapLabel: makeLabel(d),
                color: d['Color'],
                pos: endInY - d['Pos'],
                startDate: sDate,
                endDate: eDate,
                x: 0,
                wide: 0,
                from: d['From Label'],
                to: d['To Label'],
                bend: d['Bend'],
                isSelected: false
            });
        });

        // Set up the timescale
        var minDate = Math.min.apply(null, dates) - 5;
        var maxDate = Math.max.apply(null, dates) + 5;
        xScale.domain([parseDate.parse(minDate.toString()),
            parseDate.parse(maxDate.toString())
        ]).nice();
        axisGroup.call(xAxis);
        timeLine.attr("x1", xVal(minDate + 5))
            .attr("x2", xVal(minDate + 5));
        timeText.attr("x", xVal(minDate + 5) - 15).text(minDate + 5);
        timeTriangle.attr("transform", "translate(" + xVal(minDate + 5) + "," + (endInY + 5) + ")");
        timeTriangle2.attr("transform", "translate(" + xVal(minDate + 5) + "," + (endInY - 80) + ")");
        currentDate = minDate + 5;

        // Create the labels and data for the single instants
        for (i in mapMarks) {
            if (mapMarks[i].isInstant) {
                var label = "<b>" + mapMarks[i].data[0].endDate +
                    "</b><br>";
                for (x in mapMarks[i].data) {
                    d = mapMarks[i].data[x];
                    label += "From " + d.from +
                        " to " + d.to + ".<br>";
                }
                mapMarks[i].timelineLabel = label;
                instants.push(mapMarks[i]);
            } else {
                var label = "<b>" + mapMarks[i].data[0].startDate +
                    " to " + mapMarks[i].data[0].endDate + "</b><br>";
                for (x in mapMarks[i].data) {
                    d = mapMarks[i].data[x];

                    label += "From " + d.from +
                        " to " + d.to + ".<br>";
                    d.x = xVal(d.startDate);
                    d.wide = xVal(d.endDate) - xVal(d.startDate);
                }
                mapMarks[i].timelineLabel = label;
                periods.push(mapMarks[i]);
            }
        }

        updateTimeline();

        function dragTime() {
            // Get the x mouse position
            var mx = d3.event.x;

            // Clamp the line position
            if (mx < startInX)
                mx = startInX;
            if (mx > endInX)
                mx = endInX;

            // Find the current date
            currentDate = parseDate(xScale.invert(mx));

            // Set the slider position
            timeLine.attr("x1", mx).attr("x2", mx);
            timeText.attr("x", mx - 15).text(currentDate);
            timeTriangle.attr("transform", "translate(" + mx + "," + (endInY + 5) + ")");
            timeTriangle2.attr("transform", "translate(" + mx + "," + (endInY - 80) + ")");

            // updateMarkers();
        }
        timeTriangleDrag.on("drag", dragTime);
        timeTriangleDrag.on("dragend", updateMarkers);

        updateMarkers();
        sizeChange();
});
