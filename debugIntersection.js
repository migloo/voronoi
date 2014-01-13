var width = 960, height = 700;
var tolerance = 0.1

//<path class="5" d="M960,385L753,254L708,257L643,700L960,700Z" style="/* fill: #ff3399; */"></path>

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

var A = [634,393]
var B = [960,700]
var C =[648,176]
var D = [466,698]
var AB = [A,B];
var CD = [C,D];
var dataLines = [AB,CD];

var svg = d3.select("body")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)

var lines = svg.selectAll("line")
lines = lines.data(dataLines)
lines.enter().append("line")
                      .attr("x1",function(d){ return d[0][0]})
                      .attr("y1",function(d){ return d[0][1]})
                      .attr("x2",function(d){ return d[1][0]})
                      .attr("y2",function(d){ return d[1][1]})
