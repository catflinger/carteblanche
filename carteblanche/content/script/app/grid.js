"use strict";

angular.module("cbApp").factory("grid", [function () {
    var _cellsAcross = 0;
    var _cellsDown = 0;
    var _cellSize = 30;
    var _cells = [];
    var ACROSS = 'across';
    var DOWN = 'down';

    //Constructor function for creating grid cells
    var GridCell = function (data) {
        return {
            id: data.id ? data.id : 'cell-' + data.x + '-' + data.y,
            x: data.x,
            y: data.y,
            letter: data.l,
            selected: false,
            rightbar: data.rb ? data.rb : false,
            bottombar: data.bb ? data.bb : false,
            black: data.b ? data.b : false,

            getStyle: function () {
                var result = {};
                var backColor = 'white';

                if (this.black) {
                    backColor = 'black';
                } else if (this.selected) {
                    backColor = 'skyblue';
                } 

                result['left'] = this.x * _cellSize + 'px';
                result['top'] = this.y * _cellSize + 'px';
                result['background-color'] = backColor;
                result['border-right'] = 'solid black ' + (this.rightbar ? '3px' : '1px');
                result['border-bottom'] = 'solid black ' + (this.bottombar ? '3px' : '1px');

                return result;
            }
        };
    }

    var _getDimensions = function () {
        return {
            height: _cellsDown * _cellSize,
            width: _cellsAcross * _cellSize,
        };
    };

    var _getCell = function (id) {
        var i;

        for (i = 0; i < _cells.length; i++) {
            if (_cells[i].id === id) {
                return _cells[i];
            }
        }
        return null;
    };

    //gets an array of cells from the grid
    var _getCells = function (cellId, direction, len) {
        var cell, i, x, y;
        var result = [];

        cell = _getCell(cellId);

        if (cell) {
            x = cell.x;
            y = cell.y;

            if (direction == ACROSS) {
                for (i = 0; i < len && x + i < _cellsAcross; i++) {
                    result.push(_cells[y * _cellsDown + x + i]);
                }
            } else {
                for (i = 0; i < len && y + i < _cellsDown; i++) {
                    result.push(_cells[(y + i) * _cellsDown + x]);
                }
            }
        }
        return result;
    };

    var _clear = function () {
        _cells.forEach(function (cell) {
            cell.letter = '';
        });
    };

    var _clearDecorations = function () {
        _cells.forEach(function (cell) {
            cell.rightbar = false;
            cell.bottombar = false;
            cell.black = false;
        });
    };

    var _clearSelection = function () {
        _cells.forEach(function (cell) {
            cell.selected = false;
        });
    };

    var _load = function (data) {

        _cellsAcross = data.cellsAcross;
        _cellsDown = data.cellsDown;

        if (data.cells.length > 0) {
            data.cells.forEach(function (cellData) {
                _cells.push(GridCell(cellData));
            });

        } else {
            //initialise the grid with empty cells
            var x, y;
            for (y = 0; y < _cellsDown; y++) {
                for (x = 0; x < _cellsAcross; x++) {
                    _cells.push(GridCell({
                        x: x,
                        y: y,
                        letter: ''
                    }));
                }
            }
        }
    }

    //TO DO: rename this function
    var _toJson = function () {

        var result = {
            cellsAcross: _cellsAcross,
            cellsDown: _cellsDown,
            cells: []
        };

        _cells.forEach(function (cell) {
            result.cells.push({
                id: cell.id,
                x: cell.x,
                y: cell.y,
                l: cell.letter,
                rb: cell.rightbar,
                bb: cell.bottombar,
                b: cell.black
            });
        });

        return result;
    };


    return {
        load: _load,
        cells: _cells,
        clear: _clear,
        clearSelection: _clearSelection,
        clearDecorations: _clearDecorations,
        getCells: _getCells,
        getCell: _getCell,
        getDimensions: _getDimensions,
        toJson: _toJson
    }

}]);
