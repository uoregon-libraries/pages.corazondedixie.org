
// Define size variables
var margin = {top: 5, right: 25, bottom: 20, left: 25},
    padding = {top: 5, right: 10, bottom: 20, left: 10},
    outerWidth, outerHeight, innerWidth, innerHeight, 
    width, height;
var startX = margin.left, 
    startY = margin.top, 
    startInX = startX + padding.left, 
    startInY = startY + padding.top;
var endX, endY, endInX, endInY;


// + + + Make a label for the paths + + + //
var makeLabel = function(d){
    var label = "<br><center><b>";
    if(d['Years Start'] == d['Years End'])
	label += d['Years Start'];
    else
	label += d['Years Start'] +" to " + d['Years End'];
    label += "</b></center>"
	+"<i>From " + d["From Label"] + " to " + d["To Label"] + ".</i><br>" 
	+ d["Label Note"];
    return label;
}

var customColorScale = [d3.rgb('#0048BA')];

// Create an arc between two markers
function linkArc(data){

    var to = data.toMarker;
    var from = data.fromMarker;

    bend = data.bend || 1;
    var srcXY = map.latLngToLayerPoint( from.getLatLng()),
	trgXY = map.latLngToLayerPoint( to.getLatLng() );
    var dx = trgXY.x - srcXY.x,
	dy = trgXY.y - srcXY.y,
	dr = Math.sqrt(dx * dx + dy * dy)*bend;
    return "M" + srcXY.x + "," + srcXY.y + "A" + (-dr) + "," + (-dr) + " 0 0,1 " + trgXY.x + "," + trgXY.y;
    
}
