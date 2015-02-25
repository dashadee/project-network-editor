/* Controller of the Graph */
var GraphManager = function (graphView, graphModel) {

    var graphManager = this;

    this.view = graphView;
    this.graph = graphModel;

    this.state = {
        selectedNode: null,
        selectedEdge: null,
        mouseDownNode: null,
        mouseDownEdge: null,
        isDragged: false,
        isScaled: false,
        lastKeyDown: -1,
        isShiftNodeDrag: false,
        graphMouseDown: false
    };

    this.drag = d3.behavior.drag()
            .origin(function (d) {
                return {x: d.x, y: d.y};
            })
            .on("drag", function (args) {
                graphManager.state.isDragged = true;
                graphManager.dragMove.call(graphManager, args);
            })
            .on("dragend", function () {
                // todo check if edge-mode is selected
            });

    // listen for key events
    d3.select(window)
            .on("keydown", function () {
                graphManager.svgKeyDown.call(graphManager);
            })
            .on("keyup", function () {
                graphManager.svgKeyUp.call(graphManager);
            });

    this.view.on("mousedown", function (d) {
        graphManager.svgMouseDown.call(graphManager, d);
    });
    this.view.on("mouseup", function (d) {
        graphManager.svgMouseUp.call(graphManager, d);
    });

    // listen for dragging
    var dragging = d3.behavior.zoom()
            .on("zoom", function () {
                if (d3.event.sourceEvent.shiftKey) {
                    // TODO  the internal d3 state is still changing
                    return false;
                } else {
                    graphManager.zoomed.call(graphManager);
                }
                return true;
            })
            .on("zoomstart", function () {
                var ael = d3.select("#" + graphManager.view.consts.activeEditId).node();
                if (ael) {
                    ael.blur();
                }
                if (!d3.event.sourceEvent.shiftKey)
                    d3.select('body').style("cursor", "move");
            })
            .on("zoomend", function () {
                d3.select('body').style("cursor", "auto");
            });

    this.view.zoomed(dragging);

    // listen for resize
    window.onresize = function () {
        graphManager.view.updateWindow();
    };

    //!!!
    // handle download data
    d3.select("#download-input").on("click", function () {
        var saveEdges = [];
        graphManager.graph.edges.forEach(function (val, i) {
            saveEdges.push({edgeId: val.edgeId, sourceNode: val.sourceNode.nodeId, targetNode: val.targetNode.nodeId});
        });
        var blob = new Blob([window.JSON.stringify({"nodes": graphManager.graph.nodes, "edges": saveEdges})], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "myGraph.json");
    });

    // handle uploaded data
    d3.select("#upload-input").on("click", function () {
        document.getElementById("hidden-file-upload").click();
    });
    //!!!! refactoring
    d3.select("#hidden-file-upload").on("change", function () {
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            var uploadFile = this.files[0];
            var filereader = new window.FileReader();

            filereader.onload = function () {
                var txtRes = filereader.result;
                // TODO better error handling
                try {
                    var jsonObj = JSON.parse(txtRes);
                    graphManager.deleteGraph(true);
                    var builder = new GraphBuilder();
                    graphManager.graph = builder.buildGraphFromJson(jsonObj);
                    //!!! refactoring
                    //graphManager.graph.uploadGraph(jsonObj.nodes, jsonObj.edges);
                    graphManager.updateGraph();
                } catch (err) {
                    window.alert("Error parsing uploaded file\nerror message: " + err.message);
                    return;
                }
            };
            filereader.readAsText(uploadFile);

        } else {
            alert("Your browser won't let you save this graph -- try upgrading your browser to IE 10+ or Chrome or Firefox.");
        }
    });

    // handle delete graph
    d3.select("#delete-graph").on("click", function () {
        graphManager.deleteGraph(false);
    });
};

/* PROTOTYPE FUNCTIONS */

//??
GraphManager.prototype.dragMove = function (d) {
    var graphManager = this,
            view = this.view,
            graph = this.graph;
    if (graphManager.state.isShiftNodeDrag) {
        view.drawDragLine(d, true);
    } else {
        graph.changeNodeCoordinates(d, d3.event.dx, d3.event.dy);
        graphManager.updateGraph();
    }
};

//!!!
// keydown on main svg
GraphManager.prototype.svgKeyDown = function () {
    var graphManager = this,
            state = this.state,
            consts = this.view.consts,
            graph = this.graph;
    // make sure repeated key presses don't register for each keydown
    if (state.lastKeyDown !== -1)
        return;

    state.lastKeyDown = d3.event.keyCode;
    var selectedNode = state.selectedNode,
            selectedEdge = state.selectedEdge;

    switch (d3.event.keyCode) {
        case consts.BACKSPACE_KEY:
        case consts.DELETE_KEY:
            d3.event.preventDefault();
            if (selectedNode) {
                graph.deleteNode(selectedNode);
                state.selectedNode = null;
                graphManager.updateGraph();
            } else if (selectedEdge) {
                //delete infromation about selectedEdge from nodes
                graph.deleteEdge(selectedEdge);
                state.selectedEdge = null;
                graphManager.updateGraph();
            }
            break;
    }
};

// keyup on main svg  
GraphManager.prototype.svgKeyUp = function () {
    this.state.lastKeyDown = -1;
};

// mousedown on main svg
GraphManager.prototype.svgMouseDown = function () {
    this.state.graphMouseDown = true;
};

// mouseup on main svg
GraphManager.prototype.svgMouseUp = function () {
    var graphManager = this,
            state = this.state,
            graph = this.graph,
            consts = this.view.consts,
            view = this.view;
    if (state.isScaled) {
        // dragged not clicked
        state.isScaled = false;
    } else if (state.graphMouseDown && d3.event.shiftKey) {
        // clicked not dragged from svg
        // TODO: refactoring !!!!
        var xycoords = d3.mouse(view.svgG.node());
        var d = graph.addNode(consts.defaultNodeTitle, xycoords[0], xycoords[1]);
        graphManager.updateGraph();
        // make title of text immediently editable
        var d3txt = view.changeTextOfNode(view.knots.filter(function (dval) {
            return dval.nodeId === d.nodeId;
        }), d),
                txtNode = d3txt.node();
        graphManager.selectElementContents(txtNode);
        txtNode.focus();
    } else if (state.isShiftNodeDrag) {
        // dragged from node
        state.isShiftNodeDrag = false;
        view.makeDragLineHidden(true);
    }
    state.graphMouseDown = false;
};

/// mouseup on nodes
GraphManager.prototype.knotMouseUp = function (d3node, d) {
    var graphManager = this,
            state = this.state,
            consts = this.view.consts,
            view = this.view;
    // reset the states
    state.isShiftNodeDrag = false;
    d3node.classed(consts.connectClass, false);

    var mouseDownNode = state.mouseDownNode;

    if (!mouseDownNode)
        return;

    view.makeDragLineHidden(true);

    if (mouseDownNode !== d) {
        // we're in a different node: create new edge for mousedown edge and add to graph
        graphManager.graph.addEdge(mouseDownNode, d);
        graphManager.updateGraph();
    } else {
        // we're in the same node
        if (state.isDragged) {
            // dragged, not clicked
            state.isDragged = false;
        } else {
            // clicked, not dragged
            if (d3.event.shiftKey) {
                // shift-clicked node: edit text content
                var d3txt = view.changeTextOfNode(d3node, d);
                var txtNode = d3txt.node();
                graphManager.selectElementContents(txtNode);
                txtNode.focus();
            } else {
                if (state.selectedEdge) {
                    graphManager.removeSelectFromEdge();
                }
                var prevNode = state.selectedNode;

                if (!prevNode || prevNode.nodeId !== d.nodeId) {
                    graphManager.replaceSelectNode(d3node, d);
                } else {
                    graphManager.removeSelectFromNode();
                }
            }
        }
    }
    state.mouseDownNode = null;
    return;

}; // end of knot mouseup

GraphManager.prototype.knotMouseDown = function (d3node, d) {
    var state = this.state,
            view = this.view;
    d3.event.stopPropagation();
    state.mouseDownNode = d;
    if (d3.event.shiftKey) {
        state.isShiftNodeDrag = d3.event.shiftKey;
        // reposition dragged directed edge
        view.makeDragLineHidden(false);
        view.drawDragLine(d, false);
        return;
    }
};

GraphManager.prototype.replaceSelectEdge = function (d3Path, edgeData) {
    var graphManager = this,
            state = this.state,
            consts = this.view.consts;
    d3Path.classed(consts.selectedClass, true);
    if (state.selectedEdge) {
        graphManager.removeSelectFromEdge();
    }
    state.selectedEdge = edgeData;
};

GraphManager.prototype.replaceSelectNode = function (d3Node, nodeData) {
    var graphManager = this,
            state = this.state,
            consts = this.view.consts;
    d3Node.classed(consts.selectedClass, true);
    if (state.selectedNode) {
        graphManager.removeSelectFromNode();
    }
    state.selectedNode = nodeData;
};

GraphManager.prototype.removeSelectFromNode = function () {
    var state = this.state,
            consts = this.view.consts,
            knots = this.view.knots;
    knots.filter(function (cd) {
        return cd.nodeId === state.selectedNode.nodeId;
    }).classed(consts.selectedClass, false);
    state.selectedNode = null;
};

GraphManager.prototype.removeSelectFromEdge = function () {
    var state = this.state,
            consts = this.view.consts,
            paths = this.view.paths;
    paths.filter(function (cd) {
        return cd === state.selectedEdge;
    }).classed(consts.selectedClass, false);
    state.selectedEdge = null;
};

/* select all text in element: taken from http://stackoverflow.com/questions/6139107/programatically-select-text-in-a-contenteditable-html-element */
GraphManager.prototype.selectElementContents = function (el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
};

//propagate changes to graph
GraphManager.prototype.updateGraph = function () {

    // update existing paths
    this.view.updatePaths(this.graph.edges, this.state.selectedEdge);

    // add new paths and remove old links
    this.view.addNewPaths(this);

    // update existing nodes
    this.view.updateKnots(this.graph.nodes);

    // add new nodes and remove old nodes
    this.view.addNewKnots(this);
};

GraphManager.prototype.pathMouseDown = function (d3path, d) {
    var graphManager = this,
            state = this.state;
    d3.event.stopPropagation();
    state.mouseDownEdge = d;

    if (state.selectedNode) {
        graphManager.removeSelectFromNode();
    }

    var prevEdge = state.selectedEdge;
    if (!prevEdge || prevEdge !== d) {
        graphManager.replaceSelectEdge(d3path, d);
    } else {
        graphManager.removeSelectFromEdge();
    }
};

GraphManager.prototype.zoomed = function () {
    this.state.isScaled = true;
    d3.select("." + this.view.consts.graphClass)
            .attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
};

GraphManager.prototype.deleteGraph = function (skipPrompt) {
    var doDelete = true;
    if (!skipPrompt) {
        doDelete = window.confirm("Press OK to delete this graph");
    }
    if (doDelete) {
        this.graph.deleteGraph();
        this.updateGraph();
    }
};