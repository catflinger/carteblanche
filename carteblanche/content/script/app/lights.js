"use strict";

angular.module("cbApp").factory("lights", ["idCounter", function (idCounter) {
    var _items = [];
    var ACROSS = 'across';
    var DOWN = 'down';

    var Light = function (text, orientation) {
        return {
            id: "light-" + idCounter.nextId(),
            text: text,
            orientation: orientation === DOWN ? DOWN : ACROSS,
            cells: [],
            deployed: false,
            selected: false,
            undeploy: function () {
                while (this.cells.pop()) { }
                this.deployed = false;
                this.selected = false;
            }
        };
    };

    var _addLight = function (text, orientation) {
        _items.push(Light(text, orientation));
    };

    var _clear = function () {
        while (_items.pop()) { }
    };

    var _unselectAll = function () {
        _items.forEach(function (light) {
            light.selected = false;
        });
    };

    var _undeployAll = function () {
        _items.forEach(function (light) {
            light.undeploy();
        });
    };

    var _getLight = function (id) {
        var i;

        for (i = 0; i < _items.length; i++) {
            if (_items[i].id === id) {
                return _items[i];
            }
        }
        return null;
    }

    var _remove = function (id) {
        var i;

        for (i = 0; i < _items.length; i++) {
            if (_items[i].id == id) {
                _items.splice(i, 1);
                break;
            }
        }
        return null;
    }

    var _getLightsForCell = function (cellId, selectedOnly) {
        var result = [];
        var i;

        _items.forEach(function (light) {
            light.cells.forEach(function (cell) {
                if (cell.id == cellId && (!selectedOnly || light.selected)) {
                    result.push(light);
                }
            });
        });

        return result;
    };

    //TO DO: rename this function
    var _toJson = function () {
        var result = [];

        _items.forEach(function (light) {
            var cellIds = [];

            light.cells.forEach(function (cell) {
                cellIds.push(cell.id);
            });

            result.push({
                id: light.id,
                t: light.text,
                o: (light.orientation == ACROSS ? 'a' : 'd'),
                c: cellIds,
                d: light.deployed
            });
        });

        return result;
    };

    var _load = function (data, grid) {
        data.forEach(function (data) {
            var orientation = data.o == 'a' ? ACROSS : DOWN;

            var light = Light(data.t, orientation);
            light.id = data.id;
            //only lights with cells can be deployed
            light.deployed = data.c.length ? data.d : false;

            data.c.forEach(function (cellId) {
                light.cells.push(grid.getCell(cellId));
            });

            _items.push(light);
        });
    };

    return {
        items: _items,
        addLight: _addLight,
        getLight: _getLight,
        getLightsForCell: _getLightsForCell,
        clear: _clear,
        toJson: _toJson,
        load: _load,
        unselectAll: _unselectAll,
        undeployAll: _undeployAll,
        remove: _remove
    };

}]);

