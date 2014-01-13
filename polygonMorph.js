var width = 960, height = 700;
var playerToPlay = "player2";

//var path1="M446,333L446,333"//L542,424L556,273L534,265Z"
var path1 = "M199,700L329,449L10,252L0,252L0,700Z"
var path2 = "M199,700L329,449L10,252L0,252L0,700Z"

//var path2="M446,333L471,418L548,360L556,273L534,265Z"
var polygon1 = pathToPolygon(path1)
var polygon2 = pathToPolygon(path2)

var pt = ["254","240"]

function polygonLine(d) {
  return "M" + d.join("L") + "Z";
}

function solve2dSystem(A,Y)
{
// [[a,b],[c,d]][x1,x2]=[y1,y2]
// ax1 + bx2 = y1
// cx1 + dx2 = y2
// Solve AX = Y, 2x2 system.
  var det  = A[0][0]*A[1][1]-A[0][1]*A[1][0];
  var x1,x2;
  if (Math.abs(det)>0.00001){
     x1 = (Y[0]*A[1][1] - A[0][1]*Y[1])/det;
     x2 = (A[0][0]*Y[0]-A[1][0]*Y[0])/det;
  }else if ((Math.abs(A[0][0]*Y[1]- A[1][0]*Y[0]) > 0.00001) || (Math.abs(A[0][1]*Y[1]- A[1][1]*Y[0]) > 0.00001 )){
    return undefined;
  }
  else if (Math.abs(A[0][0])>0.00001){
      x1 = Y[0]/A[0][0];
      y1 = 0.0;
  }else if (Math.abs(A[0][0])>0.00001){
      x1 = 0.0;
      y1 = Y[0]/A[0][1];
  }else{
       x1 = 0.0;
       y1 = 0.0;
  }
  return [Math.round(x1),Math.round(x2)];
}

// [ptA,ptB], [ptC,ptD]
function segmentIntersection(s1, s2)
{
   var a = s1[0];
   var b = s1[1];
   var c = s2[0];
   var d = s2[1];
   var matA = [[a[0]-b[0], d[0]-c[0]],[a[1]-b[1], d[1]-c[1]]];
   var Y = [d[0]-b[0], d[1]-b[1]];
   var solution = solve2dSystem(matA, Y);
   if (solution[0]<0.0 || solution[0]>1.0 || solution[1]<0.0 || solution[1]>1.0) return false;
   var intersection = d3.interpolate(b,a)(solution[0]);
   return intersection;
}

function projectOnPolygon(pt, poly)
{
  var centroid = poly.point;
  var nbSides  = poly.length;
  var segmentOut = [[centroid.x,centroid.y],pt];
  var i = 0;
  side = [poly[nbSides-1],poly[0]];
  var intersection =segmentIntersection(segmentOut,side);
  while((i<nbSides-1)&&(!intersection))
  {
    side = [poly[i],poly[i+1]];
    intersection = segmentIntersection(segmentOut,side);
    i++;
  }
  // if !(intersection) {throw new UserException("intersection not found")};
  return intersection;
}

function polygonInterpolator(sourcePolygon, destinationPolygon)
{
  // determiner quel polygon est le plus petit
  var sA = d3.geom.polygon(sourcePolygon).area();
  var dA = d3.geom.polygon(destinationPolygon).area();
  var contraction = dA < sA;
  var bigPolygon = contraction ? sourcePolygon : destinationPolygon;
  var smallPolygon = contraction ? destinationPolygon : sourcePolygon;

  var interpolators = new Array();
   for (var i = 0; i< bigPolygon.length; i++)
   {
      var projection = projectOnPolygon(bigPolygon[i], smallPolygon);
      var interp =  contraction? d3.interpolate(bigPolygon[i],projection) : d3.interpolate(projection,bigPolygon[i]);
      interpolators.push(interp);
   }

   return function(t){
                  var res = t < 1 ? "M" + interpolators.map(function(p) { return p(t); }).join("L") +"Z": polygonLine(destinationPolygon);
                  return res;
                }
}

function pathPoint(d){
  return "M"+d.point.x+","+d.point.y+"L"+d.point.x+","+d.point.y+"Z";
}

function pathToPolygon(p){
  var a = p.substring(1, p.length - 1).split("L").map(function(d){ return d.split(",");});
  var c =  (a.length) >2 ? d3.geom.polygon(a).centroid(): a[0];
  a.point = {x:c[0], y:c[1]};
  return a;
}

function pathTween(d,i,a){
  var sourcePolygon = pathToPolygon(a);
  this.setAttribute("d", polygonLine(d));
  return polygonInterpolator(sourcePolygon, d);
}

var path = d3.select("body")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .append("path")
                    .attr("d", path1)
                    .attr("fill","blue")

d3.select("svg")
                    .append("path")
                    .attr("d", path1)
                    .attr("fill","green")
                    .attr("transform","translate(300,0)" )

d3.select("svg")
                    .append("path")
                    .attr("d", path2)
                    .attr("fill","red")
                    .attr("transform","translate(600,0)" )

var circles = d3.select("svg").selectAll("line")
circles = circles.data(dataLines)
circles.enter().append("line")
                      .attr("x1",function(d){ return d[0][0]})
                      .attr("y1",function(d){ return d[0][1]})
                      .attr("x2",function(d){ return d[1][0]})
                      .attr("y2",function(d){ return d[1][1]})

var pieceOfData = [polygon2]
path.data(pieceOfData)
       .transition()
       .duration(5000)
       .attrTween("d", pathTween)





