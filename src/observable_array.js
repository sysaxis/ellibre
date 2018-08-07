
window.OArray = OArray;

const _getOwnPropertyDescriptors = (function() {
    if (Object.getOwnPropertyDescriptors) return Object.getOwnPropertyDescriptors;
    return function(object) {
        var propertyDescriptors = {};
        Object.getOwnPropertyNames(object).forEach(function(propertyName) {
            propertyDescriptors[propertyName] = Object.getOwnPropertyDescriptor(object, propertyName);
        });
        return propertyDescriptors;
    }
})();

/**
 * Observable Array object
 * @param {Number} capacity The maximum length that the object can function in.
 * @param {function} observer The function that will be called upon OArray mutations
 */
function OArray(capacity, observer) {

    var array = {};
    var reference = []; // reference object to hold values and apply array methods
    
    if (!observer) observer = function noop() {};

    function getContentsChanges(property, args, result) {
        var _args = Object.keys(args).map(function(k) { return args[k]; });
        switch(property) {
            case 'pop': return { added: [], removed: [result] };
            case 'push': return { added: _args, removed: [] };
            case 'shift': return { added: [], removed: [result] };
            case 'unshift': return { added: _args, removed: [] };
            case 'splice': return {
                added: _args.slice((typeof(_args[1]) !== 'string' && !isNaN(_args[1])) ? 2 : 1),
                removed: result
            };
            case 'fill': return {
                added: result,
                removed: [] // difficult to determine
            };
            case 'set':
            return {
                added: [result],
                removed: _args[0] ? _args : [] 
            }
            default: return null;
        }
    }

    const propertyDescriptors = _getOwnPropertyDescriptors(Array.prototype);
    Object.keys(propertyDescriptors).forEach(function(property) {

        // the property will be binded to array, but applied on reference!
        var descriptor = propertyDescriptors[property];
        var attributes = {
            configurable: descriptor.configurable,
            enumerable: descriptor.enumerable,
            writable: descriptor.writable,
            value: function() {
                var newValue = descriptor.value.apply(reference, arguments);

                if (observer) {
                    var changes = getContentsChanges(property, arguments, newValue);
                    if (changes) observer.call(changes);
                }

                return newValue;
            }
        };
        // exception to length
        if (property === 'length') {
            delete attributes.value;
            delete attributes.writable;
            attributes.get = function() {
                return reference.length
            };
            attributes.set = function(length) {
                reference.length = length;
            };
        }
        
        Object.defineProperty(array, property, attributes);
    });

    var indexerProperties = {};
    for (var k = 0; k < capacity; k++) {

        indexerProperties[k] = {
            configurable: true,
            get: (function() {
                var _i = k;
                return function() {
                    return reference[_i];
                }
            })(),
            set: (function() {
                var _i = k;
                return function(value) {
                    if (observer) {
                        var changes = getContentsChanges('set', {0: reference[_i]}, value);
                        if (changes) observer.call(changes);
                    }

                    reference[_i] = value;
                    return true;
                }
            })()
        };
    }
    Object.defineProperties(array, indexerProperties);

    return array;
}
