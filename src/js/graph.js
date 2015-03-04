/* Data Model of the Graph */
var Graph = function (nodes, edges) {

    this.newNodeId = 0;
    this.newEdgeId = 0;
    //nodes=[{ nodeId:"", title:"", numInEdges:"", numOutEdges:"", resource1:"", resource2:"" }]
    this.nodes = nodes || [];
    //edges=[{ edgeId:"", sourceNode:"", targetNode:""}]
    this.edges = edges || [];
};

Graph.prototype.deleteGraph = function () {
    this.newNodeId = 0;
    this.newEdgeId = 0;
    this.nodes = [];
    this.edges = [];
};
/*
 Graph.prototype.addNode = function(title, resource1, resource2){
 var newNode = {nodeId: this.newNodeId++, title: title, numInEdges:0, numOutEdges:0, resource1:resource1, resource2:resource2 };
 this.nodes.push(newNode);
 };
 */

//!!
Graph.prototype.addNode = function (title, x, y, nodeId) {
    var newNode = {};
    if (nodeId) {
        newNode = {nodeId: nodeId, title: title, numInEdges: 0, numOutEdges: 0, x: x, y: y};
        if (nodeId > this.newNodeId) {
            this.newNodeId = ++nodeId;
        }
    } else {
        newNode = {nodeId: this.newNodeId++, title: title, numInEdges: 0, numOutEdges: 0, x: x, y: y};
    }
    this.nodes.push(newNode);
    //!!
    return newNode;
};

//recreate nodes from json object
Graph.prototype.uploadNodes = function (uploadedNodes) {
    var graph = this;
    uploadedNodes.forEach(function (e, i) {
        graph.addNode(e.title, e.x, e.y, e.nodeId);
        //console.log(graph.addNode(e.title, e.x, e.y, e.nodeId).toSource());
    });
};

//recreate edges from json object
Graph.prototype.uploadEdges = function (uploadedEdges) {
    var graph = this;
    uploadedEdges.forEach(function (e, i) {
        graph.addEdge(graph.nodes.filter(function (n) {
            return n.nodeId === e.sourceNode;
        })[0],
        graph.nodes.filter(function (n) {
            return n.nodeId === e.targetNode;
        })[0]);
    });
    //console.log(graph.edges.toSource());
};

Graph.prototype.changeNodeTitle = function (node, newTitle) {
    this.nodes[this.nodes.indexOf(node)].title = newTitle;
};

Graph.prototype.changeNodeCoordinates = function (node, dx, dy) {
    node.x += dx;
    node.y += dy;
};

Graph.prototype.addEdge = function (sourceNode, targetNode, edgeId) {
    var newEdge = {};
    if (edgeId) {
        //for uploaded graph
        newEdge = {edgeId: edgeId, sourceNode: sourceNode, targetNode: targetNode};
        if (edgeId > this.newEdgeId) {
            this.newEdgeId = ++edgeId;
        }
    } else {
        newEdge = {edgeId: this.newEdgeId++, sourceNode: sourceNode, targetNode: targetNode};
    }
    //check if this NewEdge is already exists
    var isEdgeAlreadyExist = false;
    this.edges.filter(function (l) {
        if (l.sourceNode === newEdge.sourceNode && l.targetNode === newEdge.targetNode) {
            isEdgeAlreadyExist = true;
        }
    });
    if (!isEdgeAlreadyExist) {
        this.edges.push(newEdge);
        sourceNode.numOutEdges++;
        targetNode.numInEdges++;
    }
};

Graph.prototype.deleteNode = function (nodeToDelete) {
    var graph = this;
    //find all edges which will be spliced(deleted)
    var toSplice = graph.edges.filter(function (l) {
        return (l.sourceNode === nodeToDelete || l.targetNode === nodeToDelete);
    });
    //create new array where all toSplice edges deleted
    toSplice.map(function (l) {
        //delete information about l edge from nodes
        graph.deleteEdge(l);
    });
    //delete nodeToDelete
    graph.nodes.splice(graph.nodes.indexOf(nodeToDelete), 1);
};

Graph.prototype.deleteEdge = function (edgeToDelete) {
    var graph = this;
    //delete information about edgeToDelete from nodes
    edgeToDelete.sourceNode.numOutEdges--;
    edgeToDelete.targetNode.numInEdges--;
    //delete l edge
    graph.edges.splice(graph.edges.indexOf(edgeToDelete), 1);

};
