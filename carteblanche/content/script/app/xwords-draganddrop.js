/*! Angular draganddrop v0.2.2 | (c) 2013 Greg Bergé | License MIT */

angular
.module('cbApp')
.directive('draggable', draggableDirective)
.directive('drop', ['$parse', dropDirective]);

/**
 * Draggable directive.
 *
 * @example
 * <div draggable="true" effect-allowed="link" draggable-type="image" draggable-data="{foo: 'bar'}"></div>
 *
 * - "draggable" Make the element draggable. Accepts a boolean.
 * - "effect-allowed" Allowed effects for the dragged element,
     see https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer#effectAllowed.28.29.
     Accepts a string.
 * - "draggable-type" Type of data object attached to the dragged element, this type
     is prefixed by "json/". Accepts a string.
 * - "draggable-data" Data attached to the dragged element, data are serialized in JSON.
     Accepts an Angular expression.
 */

function draggableDirective($parse) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var domElement = element[0];
      var effectAllowed = attrs.effectAllowed;
      var draggableData = attrs.draggableData;
      var draggableType = attrs.draggableType;
      var draggable = attrs.draggable === 'false' ? false : true;
      var dragStartHandler = $parse(attrs.dragStart);
      var dragEndHandler = $parse(attrs.dragEnd);

      // Make element draggable or not.
      domElement.draggable = draggable;

      if (! draggable) return ;

      domElement.addEventListener('dragstart', function (e) {
        // Restrict drag effect.
        e.dataTransfer.effectAllowed = effectAllowed || e.dataTransfer.effectAllowed;

        // Eval and serialize data.
        var data = scope.$eval(draggableData);
        var jsonData =  angular.toJson(data);

        // Set drag data and drag type.
        e.dataTransfer.setData('json/' + draggableType, jsonData);

        // Call dragStartHandler
        scope.$apply(function () {
            dragStartHandler(scope, { $data: getData(e), $event: event });
        });

        e.stopPropagation();
      });

      domElement.addEventListener('dragend', function (e) {

          // Call dragEndHandler
          scope.$apply(function () {
              dragEndHandler(scope, { $event: e });
          });

          e.stopPropagation();
      });


        //TO DO: these are duplicated in both directives - consilidate them
      function getData(event) {
          var types = toArray(event.dataTransfer.types);

          return types.reduce(function (collection, type) {
              // Get data.
              var data = event.dataTransfer.getData(type);

              // Get data format.
              var format = /(.*)\//.exec(type);
              format = format ? format[1] : null;

              // Parse data.
              if (format === 'json') data = JSON.parse(data);

              collection[type] = data;

              return collection;
          }, {});
      }
      function toArray(collection) {
          return Array.prototype.slice.call(collection);
      }


    }
  };
}

/**
 * Drop directive.
 *
 * @example
 * <div drop="onDrop($data, $event)" drop-effect="link" drop-accept="'json/image'"
 * drag-over="onDragOver($event)" drag-over-class="drag-over"></div>
 *
 * - "drop" Drop handler, executed on drop. Accepts an Angular expression.
 * - "drop-effect" Drop effect to set,
     see https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer#dropEffect.28.29.
     Accepts a string.
 * - "drop-accept" Types accepted or function to prevent unauthorized drag and drop.
 *   Accepts a string, an array, a function or a boolean.
 * - "drag-over" Drag over handler, executed on drag over. Accepts an Angular expression.
 * - "drag-over-class" Class set on drag over, when the drag is authorized. Accepts a string.
 */

function dropDirective($parse) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var domElement = element[0];
      var dropEffect = attrs.dropEffect;
      var dropAccept = attrs.dropAccept;
      var dragOverClass = attrs.dragOverClass;

      var dragEnterHandler = $parse(attrs.dragEnter);
      var dragOverHandler = $parse(attrs.dragOver);
      var dragLeaveHandler = $parse(attrs.dragLeave);
      var dropHandler = $parse(attrs.drop);

      domElement.addEventListener('dragenter', dragEnterListener);
      domElement.addEventListener('dragover', dragOverListener);
      domElement.addEventListener('dragleave', dragLeaveListener);
      domElement.addEventListener('drop', dropListener);

      scope.$on('$destroy', function () {
        domElement.removeEventListener('dragenter', dragEnterListener);
        domElement.removeEventListener('dragover', dragOverListener);
        domElement.removeEventListener('dragleave', dragLeaveListener);
        domElement.removeEventListener('drop', dropListener);
      });

      function dragEnterListener(event) {
          // Check if type is accepted.
          if (!accepts(scope.$eval(dropAccept), event)) return true;

          // Set up drop effect to link.
          event.dataTransfer.dropEffect = dropEffect || event.dataTransfer.dropEffect;

          if (dragOverClass) element.addClass(dragOverClass);

          // Call dragEnterHandler
          scope.$apply(function () {
              dragEnterHandler(scope, { $event: event });
          });

          // Prevent default to accept drag and drop.
          event.preventDefault();
      }

      function dragOverListener(event) {
        // Check if type is accepted.
        if (! accepts(scope.$eval(dropAccept), event)) return true;

        // Set up drop effect to link.
        event.dataTransfer.dropEffect = dropEffect || event.dataTransfer.dropEffect;

        // Call dragOverHandler
        scope.$apply(function () {
          dragOverHandler(scope, { $event: event });
        });

        // Prevent default to accept drag and drop.
        event.preventDefault();
      }

      function dropListener(event) {
        var data = getData(event);

        element.removeClass(dragOverClass);

        // Call dropHandler
        scope.$apply(function () {
          dropHandler(scope, { $data: data, $event: event });
        });

        // Prevent default navigator behaviour.
        event.preventDefault();
      }

      /**
       * Drag Leave listener.
       */

      function dragLeaveListener() {

          // Check if type is accepted.
          if (!accepts(scope.$eval(dropAccept), event)) return true;

          // Set up drop effect to link.
          event.dataTransfer.dropEffect = dropEffect || event.dataTransfer.dropEffect;

          element.removeClass(dragOverClass);

          // Call dragEnterHandler
          scope.$apply(function () {
              dragLeaveHandler(scope, { $event: event });
          });

          // Prevent default to accept drag and drop.
          event.preventDefault();
      }

      /**
       * Test if a type is accepted.
       *
       * @param {String|Array|Function} type
       * @param {Event} event
       * @returns {Boolean}
       */

      function accepts(type, event) {
        if (typeof type === 'boolean') return type;
        if (typeof type === 'string') return accepts([type], event);
        if (Array.isArray(type)) {
          return accepts(function (types) {
            return types.some(function (_type) {
              return type.indexOf(_type) !== -1;
            });
          }, event);
        }
        if (typeof type === 'function') return type(toArray(event.dataTransfer.types));

        return false;
      }

      /**
       * Get data from a drag event.
       *
       * @param {Event} event
       * @returns {Object}
       */

      function getData(event) {
        var types = toArray(event.dataTransfer.types);

        return types.reduce(function (collection, type) {
          // Get data.
          var data = event.dataTransfer.getData(type);

          // Get data format.
          var format = /(.*)\//.exec(type);
          format = format ? format[1] : null;

          // Parse data.
          if (format === 'json') data = JSON.parse(data);

          collection[type] = data;

          return collection;
        }, {});
      }

      /**
       * Convert a collection to an array.
       *
       * @param {Object} collection
       */

      function toArray(collection) {
        return Array.prototype.slice.call(collection);
      }
    }
  };
}
