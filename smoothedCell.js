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

var svg = d3.select("body")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)


var p = pathToPolygon(pathPoly)
svg.append("path").attr("d", path)
//svg.append("path").attr("d", pathPoly)
svg.append("path").attr("d", polygonToCell(p,0.5))


