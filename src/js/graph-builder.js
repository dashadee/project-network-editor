/* Build different Graphs */
var GraphBuilder = function() {
};

GraphBuilder.prototype.buildGraphFromJson = function (jsonObj) {
    var newGraph = new Graph();
    newGraph.uploadNodes(jsonObj.nodes);
    newGraph.uploadEdges(jsonObj.edges);
    newGraph.uploadParams(jsonObj.params);
    return newGraph;
};

GraphBuilder.prototype.buildJsonFromGraph = function (graph) {
    var saveEdges = [];
    graph.edges.forEach(function (val, i) {
        saveEdges.push({
            edgeId: val.edgeId,
            sourceNode: val.sourceNode.nodeId,
            targetNode: val.targetNode.nodeId
        });
    });
    var graphJson = {
        "nodes": graph.nodes,
        "edges": saveEdges,
        "params": graph.params
    }
    return graphJson;
};