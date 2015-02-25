/* Build different Graphs */
var GraphBuilder = function() {
};
GraphBuilder.prototype.buildGraphFromJson = function (jsonObj) {
    var newGraph = new Graph();
    newGraph.uploadNodes(jsonObj.nodes);
    newGraph.uploadEdges(jsonObj.edges);
    return newGraph;
};

