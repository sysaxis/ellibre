
window.bindObjectWithDOM = bindObjectWithDOM;
window.bindElement = bindElement;

function _getTargetPropertyAtAddress(object, address) {
    var _object = object;
    var point;
    address = address.split('.');
    var lastNode = address.pop();
    while(point = address.shift()) _object = _object[point];
    return {propertyName: lastNode, targetObject: _object};
}

/**
    Binds given data object's property with DOM element properties using mutators and observers.
    Observers allow to customize the objects property value, based on the changed DOM element property.
    Mutators allow to customize the DOM element property value based on the changed data objects property value.
    @param {Object} object The data object to be binded with
    @param {String} objectProperty The object selector referring to the object's property to be binded with.
    @param {Object} element The DOM element object that the data object will be binded with.
    @param {Object} elementProperties The binding definitions { 'propertySelector': function mutator{} || {mutator: function() {}, observer: function() {}}  }
    @param {function} propertyObserver The general observer that is called when any value is changed.
*/
function bindObjectWithDOM(object, objectProperty, element, elementProperties, propertyObserver) {

    var objectTarget = _getTargetPropertyAtAddress(object, objectProperty);
    var _object = objectTarget.targetObject;
    var _objectProperty = objectTarget.propertyName;

    var _value = _object[_objectProperty];

    // create reference object for properties: [{ propertyName, targetObject, mutator, observer }]
    var _properties; 
    
    if (!Array.isArray(elementProperties)) {
        // { selector: mutator || {mutator, observer} }
        _properties = Object.keys(elementProperties).map(function(propertySelector) {
            var property = elementProperties[propertySelector];
            var propertyReference = _getTargetPropertyAtAddress(element, propertySelector);
            if(typeof(property) === 'function') propertyReference.mutator = property;
            else {
                propertyReference.mutator = property.mutator;
                propertyReference.observer = property.observer;
            }
            propertyReference.selector = propertySelector;

            return propertyReference;
        });
    } else {
        // [{selector, mutator, observer}]
        _properties = elementProperties.map(function(property) {
            var propertyReference = _getTargetPropertyAtAddress(element, property.selector);
            propertyReference.mutator = property.mutator;
            propertyReference.observer = property.observer;
            propertyReference.selector = property.selector;

            return propertyReference;
        });
    }
    
    // set initial property values
    _properties.forEach(function(property) {
        property.targetObject[property.propertyName] = property.mutator ? property.mutator(_value) : _value;
    });

    // define accessors for given object
    Object.defineProperty(_object, _objectProperty, {
        enumerable: true,
        get: function() {
            return _value;
        },
        set: function(value) {
            _value = value;

            _properties.forEach(function(property) {
                property.targetObject[property.propertyName] = property.mutator ? property.mutator(value) : value;
                if (propertyObserver) propertyObserver(element, property.selector, value);
            });

            return true;
        }
    });

    // add listeners to element property changes
    _properties.forEach(function(property) {
        var propertyObserver = property.observer;

        var targetObject = property.targetObject,
            propertyName = property.propertyName;

        if (!targetObject.addEventListener) return;
        
        targetObject.addEventListener('change', function(event) {

            var newValue = targetObject[propertyName];
            var observedResult;
            if (propertyObserver)
                observedResult = propertyObserver.call(this, targetObject, newValue, _value); // refObj, newVal, oldVal
            else
                observedResult = newValue;
            
            // if value is other than undefined then it will be set on the DOM element property
            if (observedResult === undefined) return;
            
            event.preventDefault();
            targetObject[propertyName] = observedResult;
            _value = observedResult;

        }, { capture: true });

    });
}

/**
* Binds DOM element with given object.
* @param {Object} baseElement The DOM element to bind with.
* @param {Object} baseObject The data object that is the base for the binding.
* @param {Object} binders Binding definitions in the form: {'objectProperyName:elementPropertyName: {observer, mutator} || function mutator() {}} .
* @param {function} observer Listener for mutations made on the DOM via user input.
*/
function bindElement(baseElement, baseObject, binders, observer) {

    Object.keys(binders).forEach(function(objectReference) {
        var binder = binders[objectReference];
        if (objectReference.split(':').length === 2) {
            var references = objectReference.split(':');
            objectReference = references[0];
            var elementReference = references[1];
            var _binder = {};
            _binder[elementReference] = binder;
            binder = _binder;
        }

        bindObjectWithDOM(baseObject, objectReference, baseElement, binder, observer);
    });

    
    Object.defineProperty(baseObject, '_element', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: baseElement
    });

}
