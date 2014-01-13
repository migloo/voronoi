var width = 960, height = 700;
var playerToPlay = "player2";
var counter = 0;
var tolerance = 0.1;
/*
Voronoi can take an data model, as long as the x and y accessor are specified in its initalisation.

References :
http://bl.ocks.org/mbostock/3808234
http://bl.ocks.org/mbostock/3916621
http://bl.ocks.org/cloudshapes/5662135
http://bost.ocks.org/mike/transition/

http://www.jasondavies.com/voroboids/

* Clean vertices removing duplicates and invalid positions
* Need to compute surface 1 and surface 2
* Rendre le truc joli en dessinant une cellule.
* Ordonner les cotes des polygones. using array.sort( prendre l'angle par rapport a la verticale.)

To understand what is Enter(), Exit() and Remove():
http://bost.ocks.org/mike/join/

Add a Force() on Vertices to make it more lively:
need to change vertices format ?

Closure defines the variable for
a closure is the local variables for a function — kept alive after the function has returned, or
a closure is a stack-frame which is not deallocated when the function returns (as if a 'stack-frame' were malloc'ed instead of being on the stack!).

<path class="8" d="M470,300L494,371L611,320L561,281Z" style="fill: #669900;"></path>

*/
function isAlive(v){
  return v.isAlive;
}

function roundPoint(p){
  return [Math.round(p[0]),Math.round(p[1])];
}

function alternatePlayer(){
  // define a type player, that has a name and a color scheme.
  playerToPlay =  (playerToPlay=="player1")?"player2":"player1"
}

function touchBorder(polygon){
  // polygon is an array of Array[2]
  for (var i = 0; i < polygon.length; i++){
    var a = polygon[i][0], b = polygon[i][1];
    if ((a==0.0)||(b==0.0)||(a==width)||(b==height)) return true;
  }
  return false;
}

function updateIsAlive(triangulation, tessellation){
 tessellation.forEach( function(t) { t.point.isAlive =  touchBorder(d3.geom.polygon(t)) })
 triangulation.forEach( function(lk) {     if (lk.source.player == lk.target.player ) {
                                                                lk.source.isAlive =true;
                                                                lk.target.isAlive = true;
                                                              }
                                                       })
}

function polygonLine(d) {
  var dMod = d.map(function(x){ return x.map(function(z){return Math.round(z);}); })
  return "M" + dMod.join("L") + "Z";
}

function solve2dSystem(A,Y)
{
// [[a,b],[c,d]][x1,x2]=[y1,y2]
// ax1 + bx2 = y1
// cx1 + dx2 = y2
// Solve AX = Y, 2x2 system.
  var det  = A[0][0]*A[1][1]-A[0][1]*A[1][0];
  var x1,x2;
  if (Math.abs(det)>tolerance){
     x1 = (A[1][1]*Y[0]-A[0][1]*Y[1])/det;
     x2 = (A[0][0]*Y[1]-A[1][0]*Y[0])/det;
  }else if ((Math.abs(A[0][0]*Y[1]- A[1][0]*Y[0]) > tolerance) || (Math.abs(A[0][1]*Y[1]- A[1][1]*Y[0]) > tolerance )){
    return undefined;
  }
  else if (Math.abs(A[0][0])>tolerance){
      x1 = Y[0]/A[0][0];
      y1 = 0.0;
  }else if (Math.abs(A[0][0])>tolerance){
      x1 = 0.0;
      y1 = Y[0]/A[0][1];
  }else{
       x1 = 0.0;
       y1 = 0.0;
  }
  return [x1,x2];
}

// [ptA,ptB], [ptC,ptD]
function segmentIntersection(AB, CD)
{
   var A = AB[0];
   var B = AB[1];
   var C = CD[0];
   var D = CD[1];
   var matrix = [[A[0]-B[0], D[0]-C[0]],[A[1]-B[1], D[1]-C[1]]];
   var Y = [D[0]-B[0], D[1]-B[1]];
   var solution = solve2dSystem(matrix, Y);
   if (solution[0]<0.0-tolerance || solution[0]>1.0 +tolerance|| solution[1]<0.0-tolerance || solution[1]>1.0+tolerance) return false;
   var intersection = d3.interpolate(B,A)(solution[0]);
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
      var toBeProjected = roundPoint(bigPolygon[i]) // because of rounding point can happen to be inside of the polygon which messes up evrythg.
      var projection = projectOnPolygon(toBeProjected, smallPolygon);
      var interp =  contraction? d3.interpolate(toBeProjected,projection) : d3.interpolate(projection,toBeProjected);
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

function pathTween2(d,i,a){
  var sourcePolygon = pathToPolygon(a);
  this.setAttribute("d", polygonLine(d));
  return polygonInterpolator(sourcePolygon, d);
}

function pathTween(d, i, a ) {
        var precision = 4;
        var path0 = this.cloneNode();
        var path1 = this;
        path1.setAttribute("d", polygonLine(d)); // confusing but here attribute "d" corresponds to a.
        var n0 = path0.getTotalLength();
        var n1 = path1.getTotalLength();

        // Uniform sampling of distance based on specified precision.
        var distances = [0], i = 0, dt = precision / Math.max(n0, n1);
        while ((i += dt) < 1) distances.push(i);
        distances.push(1);

        // Compute point-interpolators at each distance.
        var points = distances.map(function(t) {
          var p0 = path0.getPointAtLength(t * n0),
                p1 = path1.getPointAtLength(t * n1);
          return d3.interpolate([p0.x, p0.y], [p1.x, p1.y]);
        });
        return function(t){
                  return t < 1 ? "M" + points.map(function(p) { return p(t); }).join("L") : polygonLine(d);
                }
}

function disappearTween(d, i, a ) { // d: data, i: index, a: attribute, this: node
       var precision = 4;
       var path0 = this;
       var n0 = this.getTotalLength();

        var centroid = this.__data__.point // HTF access __data__ ????
        // Uniform sampling of distance based on specified precision.
        var distances = [0], i = 0, dt = precision / n0;
        while ((i += dt) < 1) distances.push(i);
        distances.push(1);

        // Compute point-interpolators at each distance.
        var points = distances.map(function(t) {
          var p0 = path0.getPointAtLength(t * n0)
          return d3.interpolate([p0.x, p0.y], [centroid.x, centroid.y]);
        });
        return function(t){
                  var endPath = "M"+centroid.x+","+centroid.y+"L"+centroid.x+","+centroid.y+"Z";
                  return t < 1 ? "M" + points.map(function(p) { return p(t); }).join("L") : endPath;
                }
}

function color(d){
  colorPlayer1 = "#FF3399";
  colorPlayer2 = "#669900";
  //var a = d3.geom.polygon(d).area();
  var c = (d.point.isAlive)?((d.point.player=="player1")?colorPlayer1:colorPlayer2):"red";
  return c;
}

//////////// Vertices initialization ////////////////
var vertices = new Array();
vertices[0] =  {x:Math.random() * width, y:Math.random() * height, player:"player1",isAlive:true};
//////////// Vertices initialization ////////////////

///////// Events /////////
var onMouseClick = function(d){
  var m = d3.mouse(this);
  vertices.push({x:m[0], y:m[1], player:playerToPlay, isAlive:true});
  alternatePlayer();
  redraw();
}

///////// Events /////////
var voronoi = d3.geom.voronoi()
                           .x(function(d) { return d.x; })
                           .y(function(d) { return d.y; })
                           .clipExtent([[0, 0], [width, height]]);

var svg = d3.select("body")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .on("click", onMouseClick);

var path = svg.append("g").selectAll("path")
var circles = svg.append("g").selectAll("circle")
redraw();

function redraw() {
  // update underlying data before updating visuals
  var aliveVertices = vertices.filter(isAlive);
  var triangulation = voronoi.links(aliveVertices);
  var tessellation = voronoi(aliveVertices);
  updateIsAlive(triangulation,tessellation);
  // update underlying data before updating visuals

  circles = circles.data(aliveVertices, function(d){ return d.x+","+d.y;})

  circles.enter()
            .append("circle")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("r", 3);
   circles.exit().remove()

  //the result of the data function is the update selection
  //the update selection also has an enter and an exit method.
  path = path.data(tessellation, pathPoint); // using the vertice coordinate as Key
  updatePaths();
  path.enter()
         .append("path")
         .attr("class", function(d, i) { return ++counter; })
         .attr("d", pathPoint)
         .transition()
         .duration(200)
         .attrTween("d", pathTween)
         .each("end",cleanDeadCells)

  path.style("fill", color )
}

function updatePaths(){
    path.transition()
            .duration(200)
            .attrTween("d", pathTween)
}

function cleanDeadCells()// Now we're going to remove eaten cells.
{
  aliveVertices = vertices.filter(isAlive);
  triangulation = voronoi.links(aliveVertices);
  tessellation = voronoi(aliveVertices);

  path = path.data(tessellation, pathPoint);
   path.exit()
      .transition()
          .duration(2000)
          .attrTween("d", disappearTween)
          .remove()
          .each("end",updatePaths)

  circles = circles.data(aliveVertices, function(d){ return d.x+","+d.y;})
  circles.exit().remove()
}

