/* View for the Graph */
var GraphView = function (svg) {

    this.consts = {
        defaultNodeTitle: "new node",
        selectedClass: "selected",
        connectClass: "connect-node",
        knotGClass: "conceptG",
        graphClass: "graph",
        activeEditId: "active-editing",
        BACKSPACE_KEY: 8,
        DELETE_KEY: 46,
        ENTER_KEY: 13,
        nodeWidth: 100,
        nodeHeight: 100
    };

    this.svg = svg;
    this.svgG = svg.append("g").classed(this.consts.graphClass, true);

    // svg nodes and edges
    //paths = [{}]
    this.paths = this.svgG.append("g").selectAll("g");
    //knots = [{}]
    this.knots = this.svgG.append("g").selectAll("g");

    var defs = svg.append('svg:defs');

    // define circles-ends markers for graph links
    defs.append('svg:marker')
            .attr('id', 'marker-circle')
            .attr('refX', 5)
            .attr('refY', 5)
            .attr('markerWidth', 10)
            .attr('markerHeight', 10)
            .append('svg:circle')
            .attr('cx', 5)
            .attr('cy', 5)
            .attr('r', 4)
            .attr('stroke', 'none')
            .attr('fill', 'black');

    // define arrow markers for leading arrow
    defs.append('svg:marker')
            .attr('id', 'mark-end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 7)
            .attr('markerWidth', 3.5)
            .attr('markerHeight', 3.5)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5');

    // displayed when dragging between nodes
    this.dragLine = this.svgG.append('svg:path')
            .attr('class', 'link dragline hidden')
            .attr('d', 'M0,0L0,0')
            .style('marker-end', 'url(#mark-end-arrow)');

};

/* PROTOTYPE FUNCTIONS */

//
GraphView.prototype.on = function (type, listener) {
    this.svg.on(type, listener);
};

GraphView.prototype.zoomed = function (dragging) {
    this.svg.call(dragging).on("dblclick.zoom", null);
};

//
GraphView.prototype.updateWindow = function () {
    var docEl = document.documentElement,
            bodyEl = document.getElementsByTagName('body')[0];
    var x = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth;
    var y = window.innerHeight || docEl.clientHeight || bodyEl.clientHeight;
    this.svg.attr("width", x).attr("height", y);
};

GraphView.prototype.updatePaths = function (edges, selectedEdge) {
    console.log(edges.toSource());
    this.paths = this.paths.data(edges, function (d) {
        return String(d.sourceNode.nodeId) + "_" + String(d.targetNode.nodeId);
    });
    this.paths.style('marker-end', 'url(#marker-circle)')
            .style('marker-start', 'url(#marker-circle)')
            .classed(this.consts.selectedClass, function (d) {
                return d === selectedEdge;
            })
            .attr("d", function (d) {
                return "M" + d.sourceNode.x + "," + d.sourceNode.y + "L" + d.targetNode.x + "," + d.targetNode.y;
            });
};
GraphView.prototype.addNewPaths = function (graphManager) {
    this.paths.enter()
            .append("path")
            .style('marker-end', 'url(#marker-circle)')
            .style('marker-start', 'url(#marker-circle)')
            .classed("link", true)
            .attr("d", function (d) {
                return "M" + d.sourceNode.x + "," + d.sourceNode.y + "L" + d.targetNode.x + "," + d.targetNode.y;
            })
            .on("mousedown", function (d) {
                //TODO: refactor + analize
                //graphManager.pathMouseDown.call(graphManager, d3.select(this), d);
                graphManager.pathMouseDown(d3.select(this), d);
            })
            .on("mouseup", function (d) {
                graphManager.state.mouseDownEdge = null;
            });

    // remove old links
    this.paths.exit().remove();
};

GraphView.prototype.updateKnots = function (nodes) {
    console.log(nodes.toSource());
    this.knots = this.knots.data(nodes, function (d) {
        return d.nodeId;
    });
    var consts = this.consts;
    this.knots.attr("transform", function (d) {
        return "translate(" + (d.x - consts.nodeWidth / 2) + "," + (d.y - consts.nodeHeight / 2) + ")";
    });
};
GraphView.prototype.addNewKnots = function (graphManager) {

    //TODO: refactor - minimize
    var newGs = this.knots.enter()
            .append("g");

    var graphView = this,
            consts = this.consts;
    newGs.classed(consts.knotGClass, true)
            .attr("transform", function (d) {
                return "translate(" + (d.x - consts.nodeWidth / 2) + "," + (d.y - consts.nodeHeight / 2) + ")";
            })
            .on("mouseover", function (d) {
                if (graphManager.state.isShiftNodeDrag) {
                    d3.select(this).classed(consts.connectClass, true);
                }
            })
            .on("mouseout", function (d) {
                d3.select(this).classed(consts.connectClass, false);
            })
            .on("mousedown", function (d) {
                //thisGraph.circleMouseDown.call(thisGraph, d3.select(this), d);
                graphManager.circleMouseDown(d3.select(this), d);
            })
            .on("mouseup", function (d) {
                //thisGraph.circleMouseUp.call(thisGraph, d3.select(this), d);
                graphManager.circleMouseUp(d3.select(this), d);
            })
            .call(graphManager.drag);

    newGs.append("rect")
            .attr("width", String(consts.nodeWidth))
            .attr("height", String(consts.nodeHeight));

    newGs.each(function (d) {
        graphView.insertTitleLinebreaks(d3.select(this), d.title);
    });

    // remove old nodes
    this.knots.exit().remove();
};

/* insert svg line breaks: taken from http://stackoverflow.com/questions/13241475/how-do-i-include-newlines-in-labels-in-d3-charts */
GraphView.prototype.insertTitleLinebreaks = function (gEl, title) {
    var words = title.split(/\s+/g),
            nwords = words.length;
    var el = gEl.append("text")
            .attr("x", String(this.consts.nodeWidth / 2))
            .attr("y", String(this.consts.nodeHeight / 2))
            .attr("text-anchor", "middle")
            .attr("dy", "-" + (nwords - 1) * 7.5);

    for (var i = 0; i < words.length; i++) {
        var tspan = el.append('tspan').text(words[i]);
        if (i > 0) {
            tspan.attr("x", String(this.consts.nodeWidth / 2)).attr('dy', '15');
            //tspan.attr('x', 0).attr('dy', '15');

        }
    }
};

/* place editable text on node in place of svg text */
GraphView.prototype.changeTextOfNode = function (d3node, d) {
    var graphView = this,
            consts = this.consts,
            htmlEl = d3node.node();
    
    d3node.selectAll("text").remove();
    var nodeBCR = htmlEl.getBoundingClientRect(),
            //curScale = nodeBCR.width/consts.nodeRadius,
            curScale = nodeBCR.width / (consts.nodeWidth / 2),
            placePad = 5 * curScale,
            //useHW = curScale > 1 ? nodeBCR.width*0.71 : consts.nodeRadius*1.42;
            useW = curScale > 1 ? nodeBCR.width * 0.71 : consts.nodeWidth * 1.42,
            useH = curScale > 1 ? nodeBCR.width * 0.71 : consts.nodeHeight * 1.42;

    // replace with editable content text
    var d3txt = graphView.svg.selectAll("foreignObject")
            .data([d])
            .enter()
            .append("foreignObject")
            //.attr("x", nodeBCR.left + placePad )
            //.attr("y", nodeBCR.top + placePad)
            .attr("x", nodeBCR.left + placePad)
            .attr("y", nodeBCR.top + placePad)
            .attr("height", useH)
            .attr("width", useW)
            //.attr("height", 2*useHW)
            //.attr("width", useHW)
            .append("xhtml:p")
            .attr("id", consts.activeEditId)
            .attr("contentEditable", "true")
            .text(d.title)
            .on("mousedown", function (d) {
                d3.event.stopPropagation();
            })
            .on("keydown", function (d) {
                d3.event.stopPropagation();
                //!!
                if (d3.event.keyCode == consts.ENTER_KEY && !d3.event.shiftKey) {
                    this.blur();
                }
            })
            .on("blur", function (d) {
                d.title = this.textContent;
                graphView.insertTitleLinebreaks(d3node, d.title);
                d3.select(this.parentElement).remove();
            });
    return d3txt;
};