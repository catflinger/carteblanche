﻿"use strict";

angular.module("cbApp")
.controller("cbController", ["$scope", "$uibModal", "lights", "grid", "idCounter", function (scope, modal, lights, grid, idCounter) {
    var ACROSS = 'across';
    var DOWN = 'down';
    var cookieName = "xwordscbdata";
    var cookie = null;
    var gridDimensions;

    scope.messages = {
        warning: "",
        info: ""
    };

    function _clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    function _initGrid(data) {

        idCounter.init(data.nextId);

        grid.load(data.grid);
        lights.load(data.lights, grid);

        gridDimensions = grid.getDimensions();
        scope.gridStyle = {
            'min-width': gridDimensions.width + "px",
            'min-height': gridDimensions.height + "px"
        };

        scope.grid = grid;
        scope.lights = lights;
    };

    function _initGridSettings() {
        var data;

        //set up some default data
        var defaultSettings = {
            cellsAcross: 12,
            cellsDown: 12
        };
        var defaultData = {
            nextId: 0,
            lights: [],
            grid: {
                cellsAcross: defaultSettings.cellsAcross,
                cellsDown: defaultSettings.cellsDown,
                cells: []
            }
        }

        //see if local storage is available
        scope.storageAvailable = false;
        if (typeof (Storage) !== "undefined") {
            scope.storageAvailable = true;

            //get any stored data
            cookie = localStorage.getItem(cookieName);
        } else {
            scope.messages.warning = "HTML5 local storage is not available on this browser. Storing your work will not be possible";
        }

        //initialise the grid etc...
        if (cookie) {
            //we a previous puzzle in storage
            data = JSON.parse(cookie);
            _initGrid(data);
        } else {

            //starting a new puzzle
            modal.open({
                animation: true,
                templateUrl: 'gridSettings.html',
                controller: 'gridSettingsController',
                size: 'lg',
                resolve: {
                    settings: function () { return _clone(defaultSettings); }
                }
            }).result.then(
                function (settings) {
                    data = _clone(defaultData);
                    data.grid.cellsAcross = settings.cellsAcross;
                    data.grid.cellsDown = settings.cellsDown;
                    _initGrid(data);
                },
                function () {
                    //setting change cancelled
                    _initGrid(_clone(defaultData));
                }
            );
        }
    };

    //for creating new lights
    scope.light = {
        text: '',
        orientation: ACROSS
    };

    scope.dragLight = null;

    function _redrawGrid() {

        //reset all cells to blanks
        grid.cells.forEach(function (cell) {
            cell.letter = '';
            cell.selected = false;
        });

        _redrawGridHelper(ACROSS);
        _redrawGridHelper(DOWN);
    };

    function _redrawGridHelper(orientation) {

        //update the letters and highlight status of each grid cell
        lights.items.forEach(function (light) {
            if (light.orientation == orientation) {
                light.cells.forEach(function (cell, index) {
                    if (cell.letter !== light.text.charAt(index)) {
                        cell.letter += light.text.charAt(index);
                    }
                    cell.selected = cell.selected || light.selected;
                });
            }
        });
    };

    function _endDrag() {
        scope.dragLight = null;
        grid.clearSelection();
        _redrawGrid();
    };

    scope.onTrashDrop = function (data, event) {
        //find the light being dropped
        var lightData = data['json/light'];

        lights.remove(lightData.id);
        _endDrag();
    };

    scope.onDragStart = function (data, event) {
        var id;

        //console.log("drag start");

        grid.clearSelection();
        scope.dragLight = null;

        if (data['json/light']) {
            //find the light being dragged
            id = data['json/light'].id;
            scope.dragLight = lights.getLight(id);
        }
    };

    scope.onDragEnd = function (event) {
        _endDrag();
    };

    scope.onCellDragEnter = function (event) {
        var cellId;

        //console.log("drag enter");

        grid.clearSelection();

        if (scope.dragLight) {

            //find the cell being dropped on
            cellId = event.target.id;
            scope.dragLight.cells = grid.getCells(cellId, scope.dragLight.orientation, scope.dragLight.text.length);

            scope.dragLight.cells.forEach(function (cell, idx) {
                cell.selected = true;
                cell.letter = scope.dragLight.text.charAt(idx);

            });

            _redrawGrid();
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

            _endDrag();
        } else if (data['json/bar']) {

            barData = data['json/bar'];
            cell = grid.getCell(cellId);

            cell.rightbar = barData.right;
            cell.bottombar = barData.bottom;

            _endDrag();

        } else if (data['json/black-light']) {

            cell = grid.getCell(cellId);

            cell.rightbar = false;
            cell.bottombar = false;
            cell.black = true;

            _endDrag();

        } else if (data['json/white-light']) {

            cell = grid.getCell(cellId);

            cell.rightbar = false;
            cell.bottombar = false;
            cell.black = false;

            _endDrag();
        }
    };

    scope.onPanelDrop = function (data, event, orientation) {
        var id, light;

        if (data['json/light']) {

            //find the light being dropped
            id = data['json/light'].id;

            light = lights.getLight(id);

            if (light.orientation !== orientation) {
                light.orientation = (orientation == ACROSS ? ACROSS : DOWN);
                light.deployed = false;
                light.cells = [];
            }
            _endDrag();
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
            if (scope.storageAvailable) {
                localStorage.removeItem(cookieName);
            }
            grid.clearDecorations();
            lights.clear();
            _redrawGrid();

            scope.messages.info = "puzzle reset";
        }
    };

    scope.addLight = function () {
        var txt;

        lights.unselectAll();

        txt = scope.light.text.toUpperCase().replace(/\s/g, '');
        if (txt) {
            lights.addLight(txt, scope.light.orientation);
        }

        scope.light.text = "";
        _redrawGrid();
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

    //kick it all off with the settings dialog...
    _initGridSettings();
}]); 

