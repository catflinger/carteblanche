"use strict";

angular.module("cbApp")
.controller("gridSettingsController", ["$scope", "$uibModalInstance", "settings", function (scope, modalInstance, settings) {
    scope.settings = settings;

    scope.onOk = function () {
        modalInstance.close(scope.settings);
    };

    scope.onCancel = function () {
        modalInstance.dismiss();
    };
}]);
