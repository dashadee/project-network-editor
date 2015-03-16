/* Data Model of the Graph */
var Graph = function (nodes, edges, params) {
    this.newNodeId = 0;
    this.newEdgeId = 0;
    this.nodes = nodes || [];
    this.edges = edges || [];
    this.params = params || {
        resAmount1: 0,
        resAmount2: 0,
        defaultSequence: -1,
        sequences: []
    };
};

Graph.prototype.deleteGraph = function () {
    this.newNodeId = 0;
    this.newEdgeId = 0;
    this.nodes = [];
    this.edges = [];
    this.params = {
        resAmount1: 0,
        resAmount2: 0,
        defaultSequence: -1,
        sequences: []
    };
};

Graph.prototype.addNode = function (title, x, y, nodeId, resource1, resource2) {    
    if (nodeId) {
        if (nodeId > this.newNodeId) {
            this.newNodeId = nodeId + 1;
        }
    } else {
        nodeId = this.newNodeId++;
    }
    
    if (!resource1) {
        resource1 = {
            value: 0,
            startTime: 0,
            endTime: 0
        };
    }
    if (!resource2) {
        resource2 = {
            value: 0,
            startTime: 0,
            endTime: 0
        };
    }
    
    var newNode = {
        nodeId: nodeId,
        title: title,
        numInEdges: 0,
        numOutEdges: 0,
        resource1: resource1,
        resource2: resource2,
        x: x,
        y: y
    };
    this.nodes.push(newNode);

    return newNode;
};

//recreate nodes from json object
Graph.prototype.uploadNodes = function (uploadedNodes) {
    var graph = this;
    uploadedNodes.forEach(function (e, i) {
        graph.addNode(e.title, e.x, e.y, e.nodeId, e.resource1, e.resource2);
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
};

//recreate params from json object
Graph.prototype.uploadParams = function (uploadedParams) {
    var graph = this;
    graph.params = uploadedParams;
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
