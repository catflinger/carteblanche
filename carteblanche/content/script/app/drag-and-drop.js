angular.module("cbApp")
.service("DragAndDropHelper", [function () {

    var currentDrag = {
        type: "",
        data: undefined
    };

    // currentDataType is a hack to work around for dragover events not being able to read event.dataTransfer.getData()
    // Without this the drop targets are not be able to determine what sort of custom data is being dragged and so 
    // can not determine if they should accept the dragged item.  At the toime of writing only dataTransfer types of "Text" and "Url" are available in all browsers
    this.getCurrentDragType = function () {
        return currentDrag.type;
    };

    this.getCurrentDragData = function () {
        return currentDrag.data;
    };

    this.clearCurrentDrag = function () {
        currentDrag.type = "";
        currentDrag.data = undefined;
    };

    // Encoder for custom drag and drop data
    this.setCurrentDrag = function (type, data) {
        type = type || "anything";
        
        currentDrag.type = type;
        currentDrag.data = data;
    };

}]);


// USAGE:
// <div draggable drag-data-type="chicken" drag-data="getMyChicken()">drag a chicken</div>
angular.module("cbApp")
.directive('draggable', ['DragAndDropHelper', function (encoder) {

    return {
        
        scope: {
            dragStart: '&',
            dragEnd: '&'
        },
        
        link: function (scope, element, attrs) {
            var dragDataExpression = attrs.dragData;
            var dragDataType = attrs.dragDataType;

            // this gives us the native JS object
            var el = element[0];

            el.draggable = true;

            el.addEventListener(
                'dragstart',
                function (e) {
                    e.dataTransfer.effectAllowed = 'copy';

                    var data = {};
                    
                    //evaluate the data expression if we have one
                    if (dragDataExpression) {
                        data = scope.$parent.$eval(dragDataExpression);
                    }

                    encoder.setCurrentDrag(dragDataType, data);

                    e.dataTransfer.setData('Text', "");

                    scope.$apply(function () {
                        scope.dragStart({
                            data: data,
                            dataType: dragDataType,
                            event: e
                        });
                    });

                    return false;
                },
                false
            );

            el.addEventListener(
                'dragend',
                function (e) {

                    encoder.clearCurrentDrag();

                    scope.$apply(function () {
                        scope.dragEnd();
                    });

                    return false;
                },
                false
            );
        }
    }
}]);

// USAGE: <div dropable drag-accept="chicken,cow,goat" drop="myDropHandler(data, event)">drop farm animals here</div>
angular.module("cbApp").directive('droppable', ["DragAndDropHelper", function (encoder) {
    return {
        scope: {
            drop: '&',
            dragEnter: '&',
            dragLeave: '&'
        },
        link: function (scope, element, attrs) {
            var dropAccepts = attrs.dropAccepts;

            var el = element[0];

            el.addEventListener(

                'dragover',

                function (e) {

                    //check for allowable data types

                    if (dropAccepts) {
                        var types = dropAccepts.split(",");
                        var dataType = encoder.getCurrentDragType();

                        if (types.indexOf(dataType) > -1) {

                            e.dataTransfer.dropEffect = 'copy';

                            // allows us to drop
                            e.preventDefault();
                        }
                    }
                },

                //bubble phase
                false
            );

            el.addEventListener(
                'dragenter',
                function (e) {
                    if (scope.dragEnter) {
                        e.preventDefault();

                        // call the passed drop function
                        scope.$apply(function () {
                            scope.dragEnter({
                                data: encoder.getCurrentDragData(),
                                dataType: encoder.getCurrentDragType(),
                                event: e
                            });
                        });
                    }
                    return false;
                },
                false
            );

            el.addEventListener(
                'dragleave',
                function (e) {
                    if (scope.dragLeave) {
                        e.preventDefault();

                        // call the passed drop function
                        scope.$apply(function () {
                            scope.dragLeave({
                                data: encoder.getCurrentDragData(),
                                dataType: encoder.getCurrentDragType(),
                                event: e
                            });
                        });
                    }
                    return false;
                },
                false
            );

            el.addEventListener(
                'drop',
                function (e) {
                    // Stops some browsers from redirecting.
                    if (e.stopPropagation) e.stopPropagation();

                    // call the passed drop function
                    scope.$apply(function () {
                        scope.drop({
                            data: encoder.getCurrentDragData(),
                            dataType: encoder.getCurrentDragType(),
                            event: e
                        });
                    });

                    return false;
                },
                false
            );
        }
    }
}]);