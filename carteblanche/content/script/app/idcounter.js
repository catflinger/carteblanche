"use strict";

angular.module("cbApp").factory("idCounter", [function () {
    var _nextId = 0;
    return {
        init: function (num) {
            _nextId = num ? num : 0;
        },
        nextId: function () {
            _nextId++;
            return _nextId;
        }
    };
}]);

