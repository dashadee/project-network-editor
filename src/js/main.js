document.onload = (function (d3, saveAs, Blob, undefined) {
    //"use strict";

    var docEl = document.documentElement,
            bodyEl = document.getElementsByTagName('body')[0];

    var settings = {
        mainCanvas: "#main-canvas",
        width: window.innerWidth || docEl.clientWidth || bodyEl.clientWidth,
        height: window.innerHeight || docEl.clientHeight || bodyEl.clientHeight
    };

    /**** MAIN ****/
    var svg = d3.select(settings.mainCanvas).append("svg")
            .attr("width", settings.width)
            .attr("height", settings.height);
    var graphView = new GraphView(svg);
    var graphModel = new Graph();
    var graph = new GraphManager(graphView, graphModel);
    graph.updateGraph();


})(window.d3, window.saveAs, window.Blob);

