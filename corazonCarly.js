// Set the resize function
d3.select(window).on("resize", sizeChange);

// ~ = ~ = ~ = ~ = ~ SVG elements (non-map) ~ = ~ = ~ = ~ = ~ //

// The timeline SVG
var svg =  d3.select("#timeline")
    .append("svg")
    .attr("id", "svg-chart")
    .attr("width", "100%");
var chart = $("#svg-chart");
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
var aspect = outerWidth/outerHeight;

// The top-level group for the timeline
var mainGroup = svg.append("g")
    .attr("class", "topGroup");

// ~ = ~ = ~ = ~ = ~ The map elements ~ = ~ = ~ = ~ = ~ //
var map =  new L.Map("map", {center: [26.91, -100.93], zoom: 4})
    .addLayer(new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"));
map.on("zoomend", function (e) { sizeChange(); updateMarkers(); });
map.on("move", function (e) { sizeChange(); updateMarkers(); });
var mapSVG = d3.select(map.getPanes().overlayPane)
    .append("svg")
    .attr("id", "svg-map")
    .attr("width", $("#map").width())
    .attr("height", $("#map").height());
var mapG = mapSVG.append("g").attr("class", "leaflet-zoom-hide");

var markerLayer = L.featureGroup().addTo(map);    
var toMarkers = {};
var fromMarkers = {};
var lengths = {};
var labels = {};
var fromIcon = new L.divIcon({ iconSize: new L.Point(12, 12), className: 'from-icon' });
var toIcon = new L.divIcon({ iconSize: new L.Point(12, 12), className: 'to-icon' });
// specify popup options 
var customOptions = { 'maxWidth': '500', 'maxHeight': '55',  
		      'className' : 'custom'} ;
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
    .style("top", (mapChart.height()/2.0) + "px")
    .style("left", startX + "px")
    .style("opacity", 0);

// ~ ~ ~ Function to scale the main group ~  ~ ~
function sizeChange(){

    // Resize the timeline
    var wide = container.width(),
	high = container.height();
    var scale = wide/outerWidth;
    d3.select(".topGroup").attr("transform", "scale(" + scale + ")");
    $("#svg-chart").height(wide*(1.0/aspect));    
    if(mapSVG){
	var xy = map.containerPointToLayerPoint([0,0]);
	mapSVG.style("transform", "translate3d(" + xy.x + "px, " + xy.y + "px, 0px)");
	mapG.attr("transform", "translate(" +  (-xy.x) + "," + (-xy.y) + ")");
    }
}

// ~ = ~ = ~ = ~ = ~ Data manipulations  ~ = ~ = ~ = ~ = ~ //

// The scale for timeline dot radii, x and y axes
var xScale = d3.time.scale().range([startInX, endInX]); 

// The date formatter
var parseDate = d3.time.format("%Y");
var xVal = function(d){ return xScale(parseDate.parse(d.toString())); };

var currentDate;
var periods;
var instants;
var selectedPaths = [];

// The x axis
var axisGroup = mainGroup.append("g")
    .attr("class", "xaxis")
    .attr("transform", "translate(0," + endInY +")");
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
    .attr("y2", endInY-85);
var timeText = timeMarker.append("text")
    .attr("class", "timeline-text")
    .attr("y", endInY+22.5);
var tri = d3.svg.symbol().type('triangle-up')
    .size(50);
var timeTriangle = timeMarker.append("path")
    .attr('d',tri)
    .attr("class", "timelineMarker");
var tri2 = d3.svg.symbol().type('triangle-down')
    .size(50);
var timeTriangle2 = timeMarker.append("path")
    .attr('d',tri2)
    .attr("class", "timelineMarker");
var timeTriangleDrag = d3.behavior.drag();
timeMarker.call(timeTriangleDrag);


// + + + Update the timeline elements + + + //
var updateTimeline = function(){

   mainGroup.selectAll(".single-timeline").remove();

    // Go through the data, create timeline vis
    var dotPos = endInY-72;

    // Create a group for each timeline
    var singleLine = mainGroup.append("g")
	.attr("class", "single-timeline");

    // Create the instant circles
    var timeInstant = singleLine.selectAll("g")
	.data(instants)
	.enter();
    timeInstant.append("line")
	.attr("class", "dots")
	.attr("x1", function(d){
	    return xVal(parseInt(d.data[0].startDate));
	})
	.attr("y1", dotPos)
	.attr("x2", function(d){ return xVal(parseInt(d.data[0].startDate)); })
	.attr("y2", endInY)
	.attr("stroke", "DarkGray")
	.attr("stroke-width", function(d){
	    var selected = false;
	    for(i in d.data)
		if(d.data[i].isSelected)
		    selected = true;
	    if(selected)
		return "2px";
	    else
		return "1px";
	});
    timeInstant.append("circle")
	.attr("class", "dots")
	.attr("r", 4)
	.attr("cx", function(d){ return xVal(parseInt(d.data[0].startDate)); })
	.attr("cy", dotPos)
	.attr("stroke","DarkGray")
	.attr("stroke-width", function(d){
	    var selected = false;
	    for(i in d.data)
		if(d.data[i].isSelected)
		    selected = true;
	    if(selected)
		return "3px";
	    else
		return "1px";
	})
	.on("mouseover", function(d){ 
	    selectedPaths.push(d);
	    for(i in d.data)
		d.data[i].isSelected = true;
	    updateMarkers();
	    d3.select(this)
		.classed("active", true )
		.attr("stroke-width", "3px");
	    timelineDiv.transition()
      		.duration(200)		
      		.style("opacity", .75);	
      	    timelineDiv.html(d.timelineLabel)
		.style("left", (d3.event.pageX-250) + "px");
	})
	.on("mouseout", function(d){
		mouseUp();
	    selectedPaths = [];
	    for(i in d.data)
		d.data[i].isSelected = false;
	    updateMarkers();
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
	.attr("x", function(d){	return d.data[0].x; })
	.attr("y", function(d){ return d.data[0].pos-1; })
	.attr("width", function(d){ return d.data[0].wide; })
	.attr("height", 8)
	.attr("fill", function(d){ return d.data[0].color; })
    	.attr("stroke-width", "0.5px")
	.attr("stroke", "black")
	.attr("opacity", function(d){
	    var selected = false;
	    for(i in d.data)
		if(d.data[i].isSelected)
		    selected = true;
	    if(selected)
		return 1;
	    else
		return 0.5;
	})
	.on("mouseover", function(d){ 
	    selectedPaths.push(d);
	    for(i in d.data)
		d.data[i].isSelected = true;
	    updateMarkers();
	    d3.select(this)
		.attr("opacity", 1.0)
		.classed("active", true );
	    timelineDiv.transition()
      		.duration(200)		
      		.style("opacity", .75);	
      	    timelineDiv.html(d.timelineLabel)
		.style("left", (d3.event.pageX - 200) + "px");
	})
	.on("mouseout", function(d){
	    selectedPaths = [];
	    for(i in d.data)
		d.data[i].isSelected = false;
	    updateMarkers();
	    d3.select(this)
		.attr("opacity", 0.5)
		.classed("active", false);
	    timelineDiv.transition()		
      		.duration(1500)		
      		.style("opacity", 0);
	});
}

// + + +  Upate the markers being shown + + + //
var updateMarkers = function(){

    markerLayer.clearLayers();
    mapG.selectAll("path").remove();

    var showEm = [];
    var lengths = [10];
  
    for(i in mapMarks){

	startDate = i.split(",")[0];
	endDate = i.split(",")[1];

	// Test the dates to see if we add markers
	if ((startDate <= currentDate) && (currentDate <= endDate)){

	    // Grab all the selected markers
	    for(x in mapMarks[i].data){
		showEm.push(mapMarks[i].data[x]);
		mapMarks[i].data[x].fromMarker.addTo(markerLayer);
		mapMarks[i].data[x].toMarker.addTo(markerLayer);
		
		//calculate and add path lengths
		var test = svg.append("path")
    		.attr("d", linkArc(mapMarks[i].data[x]));
		//len = test.node().getTotalLength();
		//showEm.push(length);
		mapMarks[i].data[x].length = test.node().getTotalLength();
		test.remove();
	    }	    
	}
    }

    for(i in selectedPaths){
	for(x in selectedPaths[i].data){
	    showEm.push(selectedPaths[i].data[x]);
	    selectedPaths[i].data[x].toMarker.addTo(markerLayer);
	    selectedPaths[i].data[x].fromMarker.addTo(markerLayer);
	}	       
    }
    

    // Add the paths
    var pathEnter = mapG.selectAll("g")
	.data(showEm)
	.enter(); 
	
	
	
    pathEnter.append("path")
    	.attr("d", function(d){ return linkArc(d); })
	.attr("stroke", "transparent")
	.attr("stroke-width", "10px")
	.attr("fill", "none")
    	.on("mouseover", function(d){
	    d.isSelected = true;
	    d3.select("#travel-path")
	    	.attr("stroke", function(d){ 
		    if(d.isSelected)
			return d.color;
		    else
			return "SlateGray";
		});
	    mapDiv.transition()
		.duration(200)
		.style("opacity", 1.0);
	    mapDiv.html(d.mapLabel);
	    updateMarkers();
	    updateTimeline();
	}).on("mouseout", function(d){
	    d.isSelected = false
	    mapDiv.transition()		
      		.duration(1500)		
      		.style("opacity", 0);
	    updateMarkers();
	    updateTimeline();
	})
	
	
	
   var path = pathEnter.append("path")
   	.attr("id", "noArrow")
	.attr("d", function(d){ return linkArc(d, d.bend); })
	.attr("stroke", "Black")
	.attr("stroke-width", "4px")
	.attr("fill", "none")
	.attr("stroke-dasharray", function(d){ return dasharray(d);})
	.attr("stroke-dashoffset", function(d){ return dashoffset(d);})
	.transition()
		.duration(2000)
		.attr("stroke-dashoffset", 0);
	
    pathEnter.append("path")
	.attr("d", function(d){ return linkArc(d, d.bend); })
	.attr("class", "travel-path")
	.attr("pointer-events", "none")
	//.attr("marker-end", "url(#marker)")
	.attr("stroke", function(d){ 
	    if(d.isSelected)
		return d.color;
	    else
		return "SlateGray";
	})
	.attr("stroke-dasharray", function(d){ return dasharray(d);})
	.attr("stroke-dashoffset", function(d){ return dashoffset(d);})
	.transition()
		.duration(2000)
		.attr("stroke-dashoffset", 0);
	
function dasharray(data){
	var len = data.length; 
	return len + " " + len;
}

function dashoffset(data){
	var len = data.length; 
	return len;
}

//arrows
var pathArray =  mapG.selectAll("#noArrow")[0];

function addArrows(){
	pathArray.forEach(function(p){
		var arrow = mapG.append("image")
			.data(showEm)
			//.attr("xlink:href", "http://iconizer.net/files/DefaultIcon_ver_0.11/orig/arrow-right.png")
			.attr("xlink:href", "http://www.osddisplays.com/images/icon-arrow-down.png")
			.attr("width", 20)
			.attr("height", 20)
			.attr("orient", "top")
			.transition()
				.duration(2000)
				.attrTween("transform", function(d) { return translateAlong(p, d) })
			.remove();
	});
};

addArrows();
	 

function translateAlong(path, d) {
	//console.log(path);
	//console.log(d.length);
	return function(t) {
		//console.log(path);
		var previous = path.getPointAtLength(0);
		var current = path.getPointAtLength(t * d.length);
		//console.log("previous x: " + previous.x + " current x: " + current.x);
		var angle = Math.atan2(current.y - previous.y, current.x - previous.x) * 180/Math.PI * 1.5 - 90;
		//var angle = 20;
		//var adjusted = path.getPointAtLength(t * d.length - 10)
		//console.log("translate(" + adjusted.x + "," + adjusted.y + ")rotate(" + angle + ", 5, 12)");
		return "translate(" + current.x + "," + current.y + ")rotate(" + angle + ", 10, 10)";
		//return "translate(" + adjusted.x + "," + adjusted.y + ")";
	};
}
		
				
    
   
}


sizeChange();

// @ @ @ @ @ @ Start Control @ @ @ @ @ @ @ //

// Read in the data from Google spreadsheets
 var ds = new Miso.Dataset({
     key: "11Gw4VPQ77viKBSthdR4dcXIm4qTm27bQB4EH6_4mNk4",
     worksheet : "1",
     importer: Miso.Dataset.Importers.GoogleSpreadsheet,
     parser : Miso.Dataset.Parsers.GoogleSpreadsheet
 });
ds.fetch({
    success : function() {

	// Save off date info
	dates = []
	periods = [];
	instants = [];
	var tmpInst = {};
	
	// Go through the data, create markers
	this.each(function(d){
	 
	    // - - - - Extract data for the timeline - - - - //
	    // Add to the dates 
	    dates.push(d['Years Start']);
	    dates.push(d['Years End']);
	    
	    // Get the start & end dates, create a tag
	    sDate = d['Years Start'];
	    eDate = d['Years End'];
	    var tag = sDate +","+ eDate; 

	    // Create a mapMark for each time period/instant
	    if (!(tag in mapMarks)){
		mapMarks[tag] = { isInstant: false,
				  data: [] ,
				  timelineLabel: "test" };
	    }
	   
	    // Create the markers
	    var toTitle = "<center><b>" + d['To Label'] + "</b></center>";
	    var toMarker = L.marker([d["To Latitude"],d["To Longitude"]], 
				    {  icon: toIcon,
				       title: toTitle
				    });
	    toMarker.bindPopup(toTitle, customOptions);
	    var fmTitle = "<center><b>" + d['From Label'] + "</b></center>";
	    var fromMarker = L.marker(new L.LatLng(d["From Latitude"],d["From Longitude"]),
				      {	  icon: fromIcon,
					  title: fmTitle
				      });
	    fromMarker.bindPopup(fmTitle, customOptions);

	    var isInstant = true;
	    if(sDate != eDate) 
		isInstant = false;
	    mapMarks[tag].isInstant = isInstant;
	    mapMarks[tag]['data'].push( { toMarker: toMarker,
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
	var minDate = Math.min.apply(null,dates)-5;
	var maxDate = Math.max.apply(null,dates)+5;
	xScale.domain([parseDate.parse(minDate.toString()), 
		       parseDate.parse(maxDate.toString())]).nice(); 
	axisGroup.call(xAxis);
	timeLine.attr("x1", xVal(minDate+5))
	    .attr("x2", xVal(minDate+5));
	timeText.attr("x", xVal(minDate+5)-15).text(minDate+5);
	timeTriangle.attr("transform", "translate("+xVal(minDate+5)+"," + (endInY+5) +")");
	timeTriangle2.attr("transform", "translate("+xVal(minDate+5)+"," + (endInY-80) +")");
	currentDate = minDate+5;

	// Create the labels and data for the single instants
	for(i in mapMarks){
	    if(mapMarks[i].isInstant){
		var label = "<b>" + mapMarks[i].data[0].endDate 
		    +"</b><br>";
		for(x in mapMarks[i].data){
		    d = mapMarks[i].data[x];	
		    label += "From " + d.from
		    + " to " + d.to + ".<br>";
		}
		mapMarks[i].timelineLabel = label;
		instants.push(mapMarks[i]);
	    }
	    else{
		var label = "<b>" + mapMarks[i].data[0].startDate 
		    + " to " + mapMarks[i].data[0].endDate + "</b><br>";
		for(x in mapMarks[i].data){
		    d = mapMarks[i].data[x];
		    
		    label += "From " + d.from
			+ " to " + d.to + ".<br>";
		    d.x = xVal(d.startDate);
		    d.wide = xVal(d.endDate) - xVal(d.startDate);
		}
		mapMarks[i].timelineLabel = label;
		periods.push(mapMarks[i]);
	    }
	}

	updateTimeline();

	function dragTime(){
	    // Get the x mouse position
	    var mx = d3.event.x;
	    
	    // Clamp the line position
	    if ( mx < startInX )
		mx = startInX;
	    if ( mx > endInX )
		mx = endInX;
	    
	    // Find the current date
	    currentDate = parseDate(xScale.invert(mx));
	    
	    // Set the slider position
	    timeLine.attr("x1", mx).attr("x2", mx);
	    timeText.attr("x", mx-15).text(currentDate);
	    timeTriangle.attr("transform", "translate("+ mx+"," + (endInY+5) +")");
	    timeTriangle2.attr("transform", "translate("+ mx+"," + (endInY-85) +")");
	    
	    updateMarkers();
	}
	timeTriangleDrag.on("drag", dragTime);

	updateMarkers();
	sizeChange();
    },
     error : function() {
	 // your error callback here!
	 console.log("Error in reading data!!");
     }
 });
 
//  	TimeInstant.append("marker")
// 		.attr("markerWidth", 5)
// 		.attr("markerHeight", 5)
// 		.attr("cx", function(d){ return xVal(parseInt(d.data[0].startDate)); })
// 		.attr("cy", dotPos)
// 		.attr("stroke","DarkGray");


