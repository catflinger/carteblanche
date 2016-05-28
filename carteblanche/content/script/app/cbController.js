"use strict";


angular.module("cbApp")
.controller("cbController", ["$scope", "lights", "grid", "idCounter", function (scope, lights, grid, idCounter) {

    var data;
    var ACROSS = 'across';
    var DOWN = 'down';
    var cookieName = "xwordscbdata";
    var cookie = null;
    var gridDimensions;

    scope.messages = {
        warning: "",
        info: ""
    };

    scope.storageAvailable = false;

    if (typeof (Storage) !== "undefined") {
        scope.storageAvailable = true;
        cookie = localStorage.getItem(cookieName);
    } else {
        scope.messages.warning = "HTML5 local storage is not available on this browser. Storing your work will not be possible";
    }

    //initialise the grid etc...
    if (cookie) {
        data = JSON.parse(cookie);
    } else {
        data = {
            nextId: 0,
            lights: [],
            grid: {
                cellsAcross: 12,
                cellsDown: 12,
                cells: []
            }
        };
    }

    idCounter.init(data.nextId);

    grid.load(data.grid);
    lights.load(data.lights, grid);

    //for creating new lights
    scope.light = {
        text: '',
        orientation: ACROSS
    };

    scope.dragLight = null;

    gridDimensions = grid.getDimensions();
    scope.gridStyle = {
        'min-width': gridDimensions.width + "px",
        'min-height': gridDimensions.height + "px"
    };

    var _redrawGrid = function () {
        //reset all cells to blanks
        grid.cells.forEach(function (cell) {
            cell.letter = '';
            cell.selected = false;
        });

        //update the letters and highlight status of each grid cell
        lights.items.forEach(function (light) {
            light.cells.forEach(function (cell, index) {
                cell.letter = light.text.charAt(index);
                cell.selected = cell.selected|| light.selected;
            });
        });
    };

    scope.grid = grid;
    scope.lights = lights;

    scope.onTrashDrop = function (data, event) {
        //find the light being dropped
        var lightData = data['json/light'];

        lights.remove(lightData.id);
        _redrawGrid();
    };

    scope.onDragStart = function (data, event) {
        var id;

        //console.log("drag start");

        grid.clearSelection();

        if (data['json/light']) {
            //find the light being dragged
            id = data['json/light'].id;
            scope.dragLight = lights.getLight(id);
        }
    };

    scope.onDragEnd = function (event) {
        scope.dragLight = null;
        grid.clearSelection();
    };

    scope.onCellDragEnter = function (event) {
        var cellId, cells;

        //console.log("drag enter");

        grid.clearSelection();

        if (scope.dragLight) {
            //find the cell being dropped on
            cellId = event.target.id;
            cells = grid.getCells(cellId, scope.dragLight.orientation, scope.dragLight.text.length);

            cells.forEach(function (cell) {
                cell.selected = true;
            });
        }
    };

    scope.onCellDragLeave = function (event) {
        //console.log("drag leave");
        //grid.clearSelection();
    };

    scope.onDrop = function (data, event) {
        var cell, cellId, cells, lightData, barData, lightId, light, parts;

        lights.unselectAll();

        //find the cell being dropped on
        cellId = event.target.id;

        if (data['json/light']) {

            //find the light being dropped
            lightData = data['json/light'];
            lightId = lightData.id;
            light = lights.getLight(lightId);

            //get the cells that this light will cover
            cells = grid.getCells(cellId, light.orientation, light.text.length);

            //remeber the cell selection in the light
            light.cells = cells;
            light.deployed = true;

            //draw the light into the grid
            cells.forEach(function (cell, index) {
                cell.letter = light.text.charAt(index);
            });
            grid.clearSelection();

        } else if (data['json/bar']) {

            barData = data['json/bar'];
            cell = grid.getCell(cellId);

            cell.rightbar = barData.right;
            cell.bottombar = barData.bottom;
            grid.clearSelection();
            _drawGrid()

        } else if (data['json/black-light']) {

            cell = grid.getCell(cellId);

            cell.rightbar = false;
            cell.bottombar = false;
            cell.black = true;
            grid.clearSelection();
            _drawGrid()

        } else if (data['json/white-light']) {

            cell = grid.getCell(cellId);

            cell.rightbar = false;
            cell.bottombar = false;
            cell.black = false;
            grid.clearSelection();
            _drawGrid()
        }
    };

    scope.onPanelDrop = function (data, event, orientation) {
        var id, light;

        if (data['json/light']) {

            //find the light being dropped
            id = data['json/light'].id;

            light = lights.getLight(id);

            if (light.orientation != orientation) {
                light.orientation = (orientation == ACROSS ? ACROSS : DOWN);
            }
        }
    };

    scope.clearLights = function () {
        lights.undeployAll();
        _redrawGrid();
    };

    scope.clearDecorations = function () {
        grid.clearDecorations();
        _redrawGrid();
    };

    scope.reset = function () {
        if (confirm("WARNING: all data in this puzzle will be lost. Continue?")) {
            grid.clearDecorations();
            lights.clear();
            _redrawGrid();
        }
    };

    scope.addLight = function () {
        var txt;

        lights.unselectAll();
        _redrawGrid();

        txt = scope.light.text.toUpperCase().replace(/\s/g, '');
        if (txt) {
            lights.addLight(txt, scope.light.orientation);
        }

        scope.light.text = "";
    }

    scope.dumpDebug = function () {

        var cookie = {
            lights: lights.toJson(),
            grid: grid.toJson()
        };

        localStorage.setItem("xwDebug", JSON.stringify({lights: lights}));

        scope.messages.info = "debug dumped";
    };

    scope.savePuzzle = function () {

        lights.unselectAll();
        _redrawGrid();

        var cookie = {
            nextId: idCounter.nextId(),
            lights: lights.toJson(),
            grid: grid.toJson()
        };

        localStorage.setItem(cookieName, JSON.stringify(cookie));

        scope.messages.info = "puzzle saved";
    };

    scope.dismissMessages = function () {
        scope.messages.info = "";
        scope.messages.warning = "";
    };

    scope.onCellClick = function (cellId) {
        var lts;
        var cell = grid.getCell(cellId);

        if (cell.selected) {
            //user has clicked on a selected cell so get the currently selected light
            lts = lights.getLightsForCell(cellId, true);

            //remove the light from the grid
            if (lts.length > 0) {
                lts[0].undeploy();
                lts[0].selected = false;
            }

        } else if (cell.letter.length > 0) {
            //user has clicked on an unselected cell that is part of deployed light
            lts = lights.getLightsForCell(cellId);

            //select the first matching deployed light
            if (lts.length > 0) {
                //select only this one
                lights.unselectAll();
                lts[0].selected = true;
            }

        } else {
            //if user click on unselected cell then clear highlighting
            lights.unselectAll();
        }
        _redrawGrid();
    };

}]);

