"use strict";

angular.module("cbApp")
    .controller("gridImageController", ["$scope", "$uibModalInstance", "url", function (scope, modalInstance, url) {
        scope.url = url;

        console.log("url is " + url);

        scope.onOk = function () {
            modalInstance.close();
        };

        scope.onCancel = function () {
            modalInstance.dismiss();
        };

    }]);