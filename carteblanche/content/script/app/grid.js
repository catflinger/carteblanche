"use strict";

angular.module("cbApp").factory("grid", [function () {
    var _cellsAcross = 0;
    var _cellsDown = 0;
    var _cellSize = 30;
    var _cells = [];
    var ACROSS = 'across';
    var DOWN = 'down';
    var _hasSymmetry = true;

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

            //TO DO: this should be moved up closer to the presentation tier
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

    var _clearDecoration = function (cellId) {
        var cell = _getCell(cellId);
        var symCell = _getSymmetricCell(cell);

        if (cell) {
            clearCell(cell);
        }
        if (symCell) {
            clearCell(symCell);
        }

        //private helper function
        function clearCell(cell) {
            var cellAbove = _getCellAbove(cell);
            var cellBefore = _getCellBefore(cell);
            
            cell.black = false;
            cell.bottombar = false;
            cell.rightbar = false;
            if (cellAbove) {
                cellAbove.bottombar = false;
            }
            if (cellBefore) {
                cellBefore.rightbar = false;
            }

        }
    }

    var _addDecoration = function (cellId, rightBar, bottomBar, blacked) {
        var cell = _getCell(cellId);
        var symCell = _getSymmetricCell(cell);

        if (blacked) {
            addBlack(cell);
            addBlack(symCell);
        }
        if (rightBar) {
            addRBar(cell);
            //the symmetrically positioned cell should have a left bar.  Mimic
            //this by adding a right bar the the previous cell
            addRBar(_getCellBefore(symCell));
        }
        if (bottomBar) {
            addBBar(cell);
            //the symmetrically positioned cell should have a top bar.  Mimic
            //this by adding a bottom bar the the cell above
            addBBar(_getCellAbove(symCell));
        }

        //private helper functions
        function addBlack(cell) {
            if (cell) {
                cell.black = true;
                cell.rightBar = false;
                cell.bottombar = false;
            }
        }
        function addRBar(cell) {
            //dont allow right-bars on the last column
            if (cell && cell.x < _cellsAcross - 1) {
                cell.rightbar = true;
            }
        }
        function addBBar(cell) {
            //don't allow bottom bars on the bottom row
            if (cell && cell.y < _cellsDown - 1) {
                cell.bottombar = true;
            }
        }

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
    
    //get the cell at the specfied position (from top-left corner zero-indexed)
    var _cellAt = function (x, y) {
        var cell = null;

        if (x >= 0 && x < _cellsAcross && y >= 0 && y < _cellsDown) {
            cell = _cells[y * _cellsAcross + x];
        }
        return cell;
    }

    //gets the cell above this one
    var _getCellAbove = function (cell) {
        var cellAbove = null;

        if (cell && cell.y > 0) {
            cellAbove = _cellAt(cell.x, cell.y - 1);
        }
        return cellAbove;
    }

    //gets the cell to the left of this one
    var _getCellBefore = function (cell) {
        var cellBefore = null;

        if (cell && cell.x > 0) {
            cellBefore = _cellAt(cell.x - 1, cell.y);
        }
        return cellBefore;
    }

    //gets the cell in a 180 degree rotated grid
    var _getSymmetricCell = function (cell) {
        var x, y, symCell = null;

        if (_hasSymmetry) {
            x = cell.x;
            y = cell.y;

            //transform to graphical coordinates so that the origin is in the centre
            //of the grid and cells are positioned according to their centre points
            //TO DO: would this be neater using affine matrices or just overkill?
            var yOffset = _cellsAcross / 2 - 0.5;
            var xOffset = _cellsDown / 2 - 0.5;

            x -= xOffset;
            y -= yOffset;

            //rotate the grid 180 degrees
            x = -x;
            y = -y;

            //transform back to original coordinates
            x += xOffset;
            y += yOffset;

            //get the cell at this position
            symCell = _cellAt(x, y);
        }
        return symCell;
    }

    //gets an array of cells from the grid
    var _getCells = function (cellId, direction, len) {
        var cell, i, j, x, y;
        var result = [];

        cell = _getCell(cellId);

        if (cell) {
            x = cell.x;
            y = cell.y;

            if (direction === ACROSS) {
                for (i = 0; i < len && x + i < _cellsAcross; i++) {
                    result.push(_cellAt(x + i, y));
                    //result.push(_cells[ + i]);
                }
            } else {
                for (j = 0; j < len && y + j < _cellsDown; j++) {
                    result.push(_cellAt(x, y + j));
                    //result.push(_cells[(y + i) * _cellsAcross + x]);
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
        _hasSymmetry = data.hasSymmetry ? data.hasSymmetry : false;

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

    var _toJson = function () {

        var result = {
            cellsAcross: _cellsAcross,
            cellsDown: _cellsDown,
            hasSymmetry: _hasSymmetry,
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

    var _reset = function () {
        var _cellsAcross = 0;
        var _cellsDown = 0;
        var _cellSize = 30;
        var _cells = [];
        var ACROSS = 'across';
        var DOWN = 'down';
        var _hasSymmetry = true;
    };


    return {
        load: _load,
        cells: _cells,
        clear: _clear,
        clearSelection: _clearSelection,
        addDecoration: _addDecoration,
        clearDecoration: _clearDecoration,
        clearDecorations: _clearDecorations,
        getCells: _getCells,
        getCell: _getCell,
        getDimensions: _getDimensions,
        toJson: _toJson,
        reset: _reset
    }

}]);
