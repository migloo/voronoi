function zip(arrayA, arrayB) {
    var length = Math.min(arrayA.length, arrayB.length);
    var result = [];
    for (var n = 0; n < length; n++) {
        result.push([arrayA[n], arrayB[n]]);
    }
    return result;
}
