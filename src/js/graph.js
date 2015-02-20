/* Data Model of the Graph */
var Graph = function(nodes, edges){

    this.newNodeId=0;
    this.newEdgeId=0;
    //nodes=[{ nodeId:"", title:"", numInEdges:"", numOutEdges:"", resource1:"", resource2:"" }]
    this.nodes = nodes || [];
    //edges=[{ edgeId:"", sourceNode:"", targetNode:""}]
    this.edges = edges || [];
};

Graph.prototype.deleteGraph = function(){
    this.newNodeId=0;
    this.newEdgeId=0;
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
Graph.prototype.addNode = function(title, x, y){
    var newNode = {nodeId: this.newNodeId++, title: title, numInEdges:0, numOutEdges:0, x:x, y:y };
    this.nodes.push(newNode);
    //!!
    return newNode;
};

Graph.prototype.changeNodeTitle = function(node, newTitle){
    this.nodes[this.nodes.indexOf(node)].title = newTitle;
};

Graph.prototype.addEdge = function(sourceNode, targetNode) {
    var newEdge = { edgeId:this.newEdgeId++, sourceNode:sourceNode, targetNode:targetNode};
    this.edges.push(newEdge);
    sourceNode.numOutEdges++;
    targetNode.numInEdges++;
};

Graph.prototype.deleteNode = function(nodeToDelete){
    var graph = this;
    //find all edges which will be spliced(deleted)
    var toSplice = graph.edges.filter(function(l) {
      return (l.sourceNode === nodeToDelete || l.targetNode === nodeToDelete);
    });
    //create new array where all toSplice edges deleted
    toSplice.map(function(l) {
      //delete information about l edge from nodes
      graph.deleteEdge(l);
    });
    //delete nodeToDelete
    graph.nodes.splice(graph.nodes.indexOf(nodeToDelete), 1);
};

Graph.prototype.deleteEdge = function(edgeToDelete) {
    var graph = this;
    //delete information about edgeToDelete from nodes
    edgeToDelete.sourceNode.numOutEdges--;
    edgeToDelete.targetNode.numInEdges--;
     //delete l edge
    graph.edges.splice(graph.edges.indexOf(edgeToDelete), 1);
    
};