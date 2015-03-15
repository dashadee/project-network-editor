/* View for the Graph */
var GraphView = function (svg) {

    this.consts = {
        epsilone: 0.0001,
        defaultNodeTitle: "new node",
        selectedClass: "selected",
        connectClass: "connect-node",
        knotGClass: "conceptG",
        knotTitleClass: "title",
        firstResClass: "first-res",
        secondResClass: "second-res",
        textResClass: "text-res",
        graphClass: "graph",
        activeEditId: "active-editing",
        BACKSPACE_KEY: 8,
        DELETE_KEY: 46,
        ENTER_KEY: 13,
        nodeWidth: 100,
        nodeHeight: 60,
        minResWidth: 10,
        maxResWidth: 98
    };

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

    this.svg = svg;
    this.svgG = svg.append("g").classed(this.consts.graphClass, true);

    // displayed when dragging between nodes
    this.dragLine = this.svgG.append('svg:path')
            .attr('class', 'link dragline hidden')
            .attr('d', 'M0,0L0,0')
            .style('marker-end', 'url(#mark-end-arrow)');

    // svg nodes and edges
    //paths = [{edge, sourceNodeId+targetNodeId}]
    this.paths = this.svgG.append("g").selectAll("g");
    //knots = [{}]
    this.knots = this.svgG.append("g").selectAll("g");
};

/* PROTOTYPE FUNCTIONS */

GraphView.prototype.diagonal = function (sourceX, sourceY, targetX, targetY) {
    return d3.svg.diagonal()
            .source(function(d) { return {"x":sourceY, "y":sourceX}; })
            .target(function(d) { return {"x":targetY, "y":targetX}; })
            .projection(function(d) { return [d.y, d.x]; });
}

//
GraphView.prototype.on = function (type, listener) {
    this.svg.on(type, listener);
};

GraphView.prototype.zoomed = function (dragging) {
    this.svg.call(dragging).on("dblclick.zoom", null);
};

//draw dragLine by coordinates
GraphView.prototype.drawDragLine = function (d, isHidden) {
    if (isHidden) {
        //draw line to mouse coordinates
        this.dragLine.attr('d', this.diagonal(d.x, d.y, d3.mouse(this.svgG.node())[0], d3.mouse(this.svgG.node())[1]));
    } else {
        //make line invisible
        this.dragLine.attr('d', this.diagonal(d.x, d.y, d.x , d.y));
    }
};

//change dlagLine class to hidden (true or false)
GraphView.prototype.makeDragLineHidden = function (isHidden) {
    this.dragLine.classed("hidden", isHidden);
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
    var graphView = this;
    
    graphView.paths = graphView.paths.data(edges, function (d) {
        return String(d.sourceNode.nodeId) + "+" + String(d.targetNode.nodeId);
    });
    graphView.paths.style('marker-end', 'url(#marker-circle)')
            .style('marker-start', 'url(#marker-circle)')
            .classed(this.consts.selectedClass, function (d) {
                return d === selectedEdge;
            })
            .attr("d", function (d) {
                return graphView.diagonal(d.sourceNode.x, d.sourceNode.y, d.targetNode.x, d.targetNode.y)();
            });
};
GraphView.prototype.addNewPaths = function (graphManager) {
    var graphView = this;
    
    graphView.paths.enter()
            .append("path")
            .style('marker-end', 'url(#marker-circle)')
            .style('marker-start', 'url(#marker-circle)')
            .classed("link", true)
            .attr("d", function (d) {
                return graphView.diagonal(d.sourceNode.x, d.sourceNode.y, d.targetNode.x, d.targetNode.y)();
            })
            .on("mousedown", function (d) {
                //TODO: refactor + analize
                graphManager.pathMouseDown.call(graphManager, d3.select(this), d);
                //graphManager.pathMouseDown(d3.select(this), d);
            })
            .on("mouseup", function (d) {
                graphManager.state.mouseDownEdge = null;
            });
    // remove old links
    graphView.paths.exit().remove();
};

GraphView.prototype.updateKnots = function (nodes) {
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
                graphManager.knotMouseDown.call(graphManager, d3.select(this), d);
            })
            .on("mouseup", function (d) {
                graphManager.knotMouseUp.call(graphManager, d3.select(this), d);
            })
            .call(graphManager.drag);

    newGs.append("rect")
            .attr("width", String(consts.nodeWidth))
            .attr("height", String(consts.nodeHeight));
    
    graphView.addKnotResources(
        newGs.append("g").attr("transform", function (d) {
            return "translate(0, " + consts.nodeHeight + ")";
        })
    );

    newGs.each(function (d) {
        graphView.insertTitleLinebreaks(d3.select(this), d.title);
    });

    // remove old nodes
    this.knots.exit().remove();
};

GraphView.prototype.addKnotResources = function (resGroup) {
    
    var consts = this.consts;
    
    function addResource(number, resGroup, resWidth, resHeight, styleStr) {
        var resTop = resHeight * (number - 1);
        
        resGroup.append("rect")
            .attr("id", function (d) {
                return "resRect" + d.nodeId + "-" + number;
            })
            .attr("width", String(resWidth))
            .attr("height", String(resHeight))
            .attr("style", styleStr)
            .attr("transform", function (d) {
                return "translate(1, " + (resTop + 1) + ")";
            });
        
        var textNode = resGroup.append("text").classed(consts.textResClass, true)
            .attr("id", function (d) {
                return "resText" + d.nodeId + "-" + number;
            })
            .attr("x", String(resWidth / 2))
            .attr("y", String(resTop))
            .attr("dy", "1em")
            .attr("stroke", "white")
            .attr("fill", "white")
            .attr("text-anchor", "middle")
            .append("tspan");
        textNode.text(String(resValue));

        resGroup.on("mousedown", editText(number, textNode, "resource" + number, "value"))
            .on("mouseup", function (d) {
                d3.event.stopPropagation();
            });
    }
    
    function editText(number, textNode, objectName, fieldName) {
        return function (d) {
            d3.event.stopPropagation();
            
            if (d3.event.button == 0) {
                var editedText = prompt("Enter new value:", textNode.text());
                if (editedText != null && !isNaN(parseFloat(editedText)) && isFinite(editedText)) {
                    textNode.text(editedText);
                    d[objectName][fieldName] = parseFloat(editedText);
                    recalcResRects(d);
                }
            }
        };
    }
    
    function recalcResRects(data) {
        var value1 = data.resource1.value;
        var value2 = data.resource2.value;
        var width1 = value1 > consts.epsilone ? consts.maxResWidth : consts.minResWidth;
        var width2 = value2 > consts.epsilone ? consts.maxResWidth : consts.minResWidth;

        if (value1 > consts.epsilone && value2 > consts.epsilone) {
            if (value1 > value2) {
                width1 = consts.maxResWidth;
                width2 = Math.max(value2 / value1 * consts.maxResWidth, consts.minResWidth);
            } else if (value1 < value2) {
                width2 = consts.maxResWidth;
                width1 = Math.max(value1 / value2 * consts.maxResWidth, consts.minResWidth);
            }
        }
        d3.select("#resRect" + data.nodeId + "-1").attr("width", String(width1));
        d3.select("#resText" + data.nodeId + "-1").attr("x", String(width1 / 2));

        d3.select("#resRect" + data.nodeId + "-2").attr("width", String(width2));
        d3.select("#resText" + data.nodeId + "-2").attr("x", String(width2 / 2));
    }

    resGroup.append("rect")
        .attr("width", String(consts.nodeWidth))
        .attr("height", String(consts.nodeHeight / 2.5));

    var resValue = 0;
    var resWidth = consts.minResWidth;
    var resHeight = consts.nodeHeight / 5 - 1;
    
    addResource(1, resGroup.append("g"), resWidth, resHeight,
        "fill: #319fdd; stroke-width: 0");

    addResource(2, resGroup.append("g"), resWidth, resHeight,
        "fill: #1064bc; stroke-width: 0");
    
}

/* insert svg line breaks: taken from http://stackoverflow.com/questions/13241475/how-do-i-include-newlines-in-labels-in-d3-charts */
GraphView.prototype.insertTitleLinebreaks = function (gEl, title) {
    var words = title.split(/\s+/g);
    var lines = [];
    var maxCharsInLine = 10;
    var currentLine = "";
    for (var i = 0; i < words.length; i++) {
        currentLine += words[i];
        var potentialLength = currentLine.length + ( i < (words.length - 1)
                                                        ? 1 + words[i + 1].length
                                                        : maxCharsInLine );
        if (potentialLength > maxCharsInLine) {
            lines.push(currentLine);
            currentLine = "";
        } else {
            currentLine += " ";
        }
    }
    var nlines = lines.length;
    
    var el = gEl.append("text").classed(this.consts.knotTitleClass, true)
            .attr("x", String(this.consts.nodeWidth / 2))
            .attr("y", String(this.consts.nodeHeight / 2))
            .attr("text-anchor", "middle")
            .attr("dy", "-" + (nlines - 1) * 5.2);    
    
    for (var i = 0; i < lines.length; i++) {
        var tspan = el.append('tspan').text(lines[i]);
        if (i > 0) {
            tspan.attr("x", String(this.consts.nodeWidth / 2)).attr('dy', '15');
        }
    }
};

/* place editable text on node in place of svg text */
GraphView.prototype.changeTextOfNode = function (d3node, d) {
    var graphView = this,
            consts = this.consts,
            htmlEl = d3node.node();

    d3node.selectAll("." + consts.knotTitleClass).remove();
    var nodeBCR = htmlEl.getBoundingClientRect(),
            //curScale = nodeBCR.width/consts.nodeRadius,
            curScale = nodeBCR.width / (consts.nodeWidth / 2),
            placePadL = 5 * curScale,
            placePadT = 0,//1 * curScale,
            //useHW = curScale > 1 ? nodeBCR.width*0.71 : consts.nodeRadius*1.42;
            useW = curScale > 1 ? nodeBCR.width * 0.8 : consts.nodeWidth * 1.42,
            useH = curScale > 1 ? nodeBCR.width * 0.8 : consts.nodeHeight * 1.42;

    // replace with editable content text
    var d3txt = graphView.svg.selectAll("foreignObject")
            .data([d])
            .enter()
            .append("foreignObject")
            .attr("x", nodeBCR.left + placePadL)
            .attr("y", nodeBCR.top + placePadT)
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