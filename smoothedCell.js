var smoothingFatctor = 0.70
var width = 960, height = 700;

// use quadratic Bézier

var pathPoly = "M598,196L602,255L614,297L654,320L703,331L811,0L790,0Z"



var path = "M 100 350 q 150 -300 300 0"

// M 100 350 q 150 -300 300 0
function pathToPolygon(p){
  var a = p.substring(1, p.length - 1)
                .split("L").map( function(d){ return d.split(",")
                                                                        .map( function(x) { return parseFloat(x) } );});
  var c =  (a.length) >2 ? d3.geom.polygon(a).centroid(): a[0];
  a.point = {x:c[0], y:c[1]};
  return a;
}

function bezier(a1,c,a2){
    return a1[0]+" "+a1[1]+" Q "+c[0]+" "+c[1]+" "+a2[0]+" "+a2[1];
}


function polygonToCell(p,smoothingFatctor){
    var f = p[0];
    var l = p[p.length-1]
    p.unshift(l);
    p.push(f);
    b=""
    for ( var i = 1; i< p.length-1; i++){
        var previous = p[i-1];
        var next = p[i+1];
        var control = p[i];
        var anchor1 = d3.interpolate(control,previous)(smoothingFatctor);
        var anchor2 = d3.interpolate(control,next)(smoothingFatctor);
        b += bezier(anchor1,control,anchor2) +"L";
    }
    return "M"+b.substring(0,b.length-1);
}

// pour change sommet, constuire les 2 ancres adjacentes et retourner la bezier.
// linker les bezier entre elles.
// les curves de beziers peuvent etre linker en utilisant L.
// utiliser Q et non pas q.

x = {type:"C", x:100.0, y:200.0}

var svg = d3.select("body")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)


var p = pathToPolygon(pathPoly)
svg.append("path").attr("d", path)
//svg.append("path").attr("d", pathPoly)
svg.append("path").attr("d", polygonToCell(p,0.5))

