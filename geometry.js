
function roundPoint(p){
  return [Math.round(p[0]),Math.round(p[1])];
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

function segment(A,B){
  return [B.x - A.x, B.y -A.y];
}

function angleToVertical(v){
    var x = v[0];
    var y = v[1];
    var z = Math.sqrt(x*x + y*y);
    var cos = x / z;
    var theta = Math.acos(cos);
    return (y>0) ? theta : 2.0*Math.PI - theta;
}

function bezier(a1,c,a2){
    return a1[0]+" "+a1[1]+" Q "+c[0]+" "+c[1]+" "+a2[0]+" "+a2[1];
}

function polygonToCell(p,smoothingFatctor){
    var f = p[0], l = p[p.length-1], b=""
    p.unshift(l);
    p.push(f);
    for ( var i = 1; i< p.length-1; i++){
        var previous = p[i-1];
        var next = p[i+1];
        var control = p[i];
        var anchor1 = d3.interpolate(control, previous)(smoothingFatctor);
        var anchor2 = d3.interpolate(control, next)(smoothingFatctor);
        b += bezier(anchor1, control, anchor2) +"L";
    }
    return "M"+b.substring(0,b.length-1);
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

function pathTween2(d,i,a){
  var sourcePolygon = pathToPolygon(a);
  this.setAttribute("d", polygonLine(d));
  return polygonInterpolator(sourcePolygon, d);
}
