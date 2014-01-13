var width = 960, height = 700;
var playerToPlay = "player2";

/*
Voronoi can take an data model, as long as the x and y accessor are specified in its initalisation.

References :
http://bl.ocks.org/mbostock/3808234
http://bl.ocks.org/mbostock/3916621
http://bl.ocks.org/cloudshapes/5662135
http://bost.ocks.org/mike/transition/

* Clean vertices removing duplicates and invalid positions
* Need to compute surface 1 and surface 2
* Rendre le truc joli en dessinant une cellule.

To understand what is Enter(), Exit() and Remove():
http://bost.ocks.org/mike/join/

Add a Force() on Vertices to make it more lively:
need to change vertices format ?

Closure defines the variable for
a closure is the local variables for a function — kept alive after the function has returned, or
a closure is a stack-frame which is not deallocated when the function returns (as if a 'stack-frame' were malloc'ed instead of being on the stack!).

*/
function isAlive(v){
  return v.isAlive;
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
  // the key function will be called on 'undefined values' when a new point is added ... why is that ?
  // dans le binding, appelle la function key sur un truc qui n'a pas de data .... Regarder la call stack.
  return "M" + d.join("L") + "Z";
}

function pathPoint(d){
  return "M"+d.point.x+","+d.point.y+"L"+d.point.x+","+d.point.y+"Z";
}

function pathTween(d, i, a ) {
       var precision = 4;
       var path0 = this.cloneNode(),
            path1 = this,
            n0 = path0.getTotalLength(),
            n1 = (path1.setAttribute("d", polygonLine(d)), path1).getTotalLength();

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

function disappearTween(d, i, a ) {
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

function setOpacity(d){
  return Math.random()*0.5+0.45;
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

  path.enter()
         .append("path")
         .attr("class", function(d, i) { return "q" + (i % 2) + "-2"; })
         .attr("d", pathPoint)

  path.style("fill", color )

  path.transition()
         .duration(500)
         .attrTween("d", pathTween)
         .each("end",cleanDeadCells)
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

}

