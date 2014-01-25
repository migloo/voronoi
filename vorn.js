
var boardDisplay = {
                                width: 760,
                                height: 500,
                                 smoothingParameter: 0.1,
                                 colorPlayer1 : "#FF3399",
                                 colorPlayer2 : "#F3F315"
                               }

var game = {
                    counter: 0.,
                    playerToPlay: "player1",
                    scorePlayer1: 0.5,
                    scorePlayer2:  0.5
                    }

var vertices = new Array();
vertices[0] =  {x:Math.random() * boardDisplay.width,
                       y:Math.random() * boardDisplay.height,
                       player:"player1",
                       isAlive:true};


/*
Voronoi can take an data model, as long as the x and y accessor are specified in its initalisation.

References :
http://bl.ocks.org/mbostock/3808234
http://bl.ocks.org/mbostock/3916621
http://bl.ocks.org/cloudshapes/5662135
http://bost.ocks.org/mike/transition/
http://www.jasondavies.com/voroboids/

* Creer un objet qui represente le jeu.
* Gerer le debut du jeu.
* Rendre le truc robuste pour que ca plante pas sur le premier player.
* Clean vertices removing duplicates and invalid positions.
* Clean les paths tween de maniere a ce qu'il ne reste qu'une fonction au lieu de 2.
* Ajouter du texte decrivant les regles du jeu.

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
  d3.select("#"+game.playerToPlay)
      .style("-webkit-animation",null)
  game.playerToPlay =  (game.playerToPlay=="player1")?"player2":"player1"
  d3.select("#"+game.playerToPlay)
      .style("-webkit-animation","glow .5s infinite alternate")
}

function touchBorder(polygon){
  // polygon is an array of Array[2]
  for (var i = 0; i < polygon.length; i++){
    var a = polygon[i][0], b = polygon[i][1];
    if ((a==0.0)||(b==0.0)||(a==boardDisplay.width)||(b==boardDisplay.height)) return true;
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

function pathTween(d, i, a ) {
        var precision = 4;
        var path0 = this.cloneNode();
        var path1 = this;
        var pathData = Math.abs(boardDisplay.smoothingParameter) < 0.01 ?  polygonLine(d) : polygonToCell( d , boardDisplay.smoothingParameter)
        path1.setAttribute("d", pathData); // polygonLine(d)); // confusing but here attribute "d" corresponds to a.

        var n0 = path0.getTotalLength();
        var n1 = path1.getTotalLength();
        var vP = d.point;

        // Uniform sampling of distance based on specified precision.
        var distances = [0], i = 0, dt = precision / Math.max(n0, n1);
        while ((i += dt) < 1) distances.push(i);
        distances.push(1);

        var resampledPath0 = distances.map(function(t) { return path0.getPointAtLength(t * n0)} )
                                                          .sort(function(a,b) { var sa = segment(vP, a), sb = segment(vP, b);
                                                                                         return angleToVertical(sa) - angleToVertical(sb) } )

        var resampledPath1 = distances.map(function(t) { return path1.getPointAtLength(t * n1)} )
                                                          .sort(function(a,b) { var sa = segment(vP, a), sb = segment(vP, b);
                                                                                         return angleToVertical(sa) - angleToVertical(sb) } )

        var zipped = zip(resampledPath0, resampledPath1);
        var interpolators = zipped.map(function(z) { var p1 = [z[0].x,z[0].y];
                                                                              var p2 = [z[1].x, z[1].y];
                                                                              return d3.interpolate(p1,p2) } );

        return function(t){
                  var res  = t < 1 ? "M" + interpolators.map(function(p) { return p(t); }).join("L") : pathData;
                  return res;
                }
}

function disappearTween(d, i, a ) { // d: data, i: index, a: attribute, this: node
       var precision = 4;
       var path0 = this;
       var n0 = this.getTotalLength();

        var centroid = d.point
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
  var c = (d.point.isAlive)?((d.point.player=="player1")?boardDisplay.colorPlayer1:boardDisplay.colorPlayer2):"red";
  return c;
}

var onMouseClick = function(d){
  var m = d3.mouse(this);
  vertices.push({x:m[0], y:m[1], player:game.playerToPlay, isAlive:true});
  alternatePlayer();
  redraw();
}

///////// Events /////////
var voronoi = d3.geom.voronoi()
                           .x(function(d) { return d.x; })
                           .y(function(d) { return d.y; })
                           .clipExtent([[0, 0], [boardDisplay.width, boardDisplay.height]]);

var svg = d3.select("#board")
                    .attr("width", boardDisplay.width)
                    .attr("height", boardDisplay.height)
                    .on("click", onMouseClick);

var path    = svg.append("g").selectAll("path")
var circles = svg.append("g").selectAll("circle")
var scoreBar = d3.select("#scoreBar")
                            .attr("width", boardDisplay.width)
                            .attr("height", boardDisplay.height * 0.05)
var barPlayer1 = scoreBar.append("rect").attr("id","scorePlayer1")
var barPlayer2 = scoreBar.append("rect").attr("id","scorePlayer2")

function updateScore(tessellation){
  // could use map & filter here.
  game.scorePlayer1 = 0.0;
  game.scorePlayer2 = 0.0;
  for (var i=0; i < tessellation.length; i++){
    var t = tessellation[i];
    var a = d3.geom.polygon(t).area();
    var p = t.point.player;
    if (p=="player1"){
      game.scorePlayer1 += a;
    }else{
      game.scorePlayer2 += a;
    }
  }
  var total = game.scorePlayer1 + game.scorePlayer2;
  game.scorePlayer1 /= total;
  game.scorePlayer2 /= total;
}

function updateScoreBar(){
  barPlayer1.attr("height", boardDisplay.height * 0.05)
                  .style("fill", boardDisplay.colorPlayer1)
                  .transition()
                  .duration(1000)
                  .attr("width", boardDisplay.width*game.scorePlayer1)
  barPlayer2.attr("height", boardDisplay.height * 0.05)
                   .style("fill", boardDisplay.colorPlayer2)
                  .transition()
                  .duration(1000)
                  .attr("x", boardDisplay.width*game.scorePlayer1)
                  .attr("width", boardDisplay.width*game.scorePlayer2)
}

updateScoreBar();
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
         .attr("class", function(d, i) { return ++game.counter; })
         .attr("d", pathPoint)
         .transition()
         .duration(1000)
         .attrTween("d", pathTween)
         .each("end",cleanDeadCells)

  updateScore(tessellation);
  updateScoreBar();
  path.style("fill", color )
}

function updatePaths(){
    path.transition()
            .duration(1000)
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
  updateScore(tessellation);
  updateScoreBar();
}
