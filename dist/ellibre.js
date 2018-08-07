/**
 * Advanced functionalities for web architecture written in vanilla js.
 * @author Eduard Kotov (sysaxis)
 * @version 1.0.0
 * @license
 * Copyright (c) Eduard Kotov (sysaxis)
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
(function() {
	"use strict";

	window.Animate = Animate;
	
	// https://gist.github.com/paulirish/5438650
	(function() {
	    if ("performance" in window == false) {
	        window.performance = {};
	    }
	    Date.now = (Date.now || function () {
	        return new Date().getTime();
	    });
	    if ("now" in window.performance == false){
	        var nowOffset = Date.now();
	        if (performance.timing && performance.timing.navigationStart){
	            nowOffset = performance.timing.navigationStart
	        }
	        window.performance.now = function now(){
	            return Date.now() - nowOffset;
	        }
	    }
	})();
	
	// https://gist.github.com/paulirish/1579671
	(function() {
	    var lastTime = 0;
	    var vendors = ['ms', 'moz', 'webkit', 'o'];
	    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
	        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
	        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
	                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
	    }
	 
	    if (!window.requestAnimationFrame)
	        window.requestAnimationFrame = function(callback, element) {
	            var currTime = new Date().getTime();
	            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
	            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
	              timeToCall);
	            lastTime = currTime + timeToCall;
	            return id;
	        };
	 
	    if (!window.cancelAnimationFrame)
	        window.cancelAnimationFrame = function(id) {
	            clearTimeout(id);
	        };
	}());
	
	/**
	 * Uses window.[..animationFrame] and Performance API to change values.
	 * @param {Object} element The target DOM element to animate
	 * @param {String} property The element property to animate
	 * @param {String|Number} fromValue The value to animate from (if units are neccessary then they must be specified, i.e. "20%")
	 * @param {String|Number} toValue The value to animate to (if units are neccessary then they must be specified, i.e. "20%")
	 * @param {Number} duration Animation duration.
	 * @param {Number} power Animation equation power (1 to x)
	 * @param {String} style Animation style: pop, softPop, peek
	 * @param {function} callback (optional) function to call when animation has ended (used for chaining animation)
	 */
	function Animate(element, property, fromValue, toValue, duration, power, style, callback) {
	    function getNumericValue(value) {
	        return +(/[-0-9\.]+/g.exec(value) || [])[0];
	    }
	
	    const sample = fromValue;
	    const numericCore = getNumericValue(sample);
	    if (isNaN(numericCore)) throw new Error('Unable to animate. Animatable value does not have a numeric representation');
	    const numericCoreString = numericCore.toString();
	    const prefix = sample.substring(0, sample.indexOf(numericCoreString)),
	        suffix = sample.substring(sample.indexOf(numericCoreString) + numericCoreString.length);
	
	    function wrapNumericValue(value) {
	        return prefix + value + suffix;
	    }
	
	    const numericFromValue = getNumericValue(fromValue);
	    const valueSpread = getNumericValue(toValue) - numericFromValue;
	    power = power || 1;
	
	    const styles = {
	        pop: function(x) { return (Math.exp(power * x) - 1) / (Math.exp(power) - 1); },
	        softPop: function(x) { return Math.pow(Math.sin(x * Math.PI / 2), power); },
	        peek: function(x) { return Math.pow(Math.sin(x * Math.PI), power); }
	    };
	
	    // sin(x*Pi/2)^(1/2)
	    //return Math.sqrt(Math.sin(x * Math.PI / power));
	    // (asin(x*2-1)/Pi+0.5)^1
	    //return 0.5 + (Math.asin(Math.pow(2 * x - 1, 2 * power - 1)) / Math.PI);
	    // x^2
	    // return Math.pow(x, power);
	    // (e^(k x) - 1) / (e^k - 1) // best so far 500ms, 3
	        
	    var scaleFormula = styles[style || 'pop'];
	
	    function scaleValue(position) {
	        return numericFromValue + (valueSpread * scaleFormula(position));
	    }
	
	    const start = window.performance.now();
	
	    window.requestAnimationFrame(function nextFrame(now) {
	        const progress = now - start;
	        if (progress < 0) {
	            window.requestAnimationFrame(nextFrame);
	            return;
	        }
	        const newValue = scaleValue(progress / duration);
	        element[property] = wrapNumericValue(newValue);
	
	        if (progress < duration) {
	            window.requestAnimationFrame(nextFrame);
	            return;
	        }
	        if (callback) callback();
	    });
	}
	

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
	        if (!property.observer) return;
	
	        var targetObject = property.targetObject,
	            propertyName = property.propertyName;
	
	        if (!targetObject.addEventListener) return;
	        
	        targetObject.addEventListener('change', function(event) {
	
	            var newValue = targetObject[propertyName];
	            var observedResult = property.observer.call(this, targetObject, newValue, _value); // refObj, newVal, oldVal
	
	            // if value returned other than undefined then it will be set on the DOM element property
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
	

	window.createTemplate = createTemplate;
	
	/**
	 * Create a template in html:
	 * 1) Name the template using the attribute 'id'.
	 * 2) Mark the style attributes position to 'absolute' and visibility to 'hidden'.
	 * 3) Name it's decendants using the attribute 'name'.
	 * The function will create a cloned DOM element where it's decendants are easily accessible by their names.
	 */
	function createTemplate(elementName) {
	    var sourceNode = document.getElementById(elementName);
	    if (!sourceNode) throw new Error('Template not found');
	    var node = sourceNode.cloneNode(true);
	    delete node.id;
	    node.style.visibility = 'visible';
	    node.style.position = 'static';
	    
	    function bindChild(node) {
	        for(var k in node.children) {
	            var child = node.children[k];
	            var nameAttribute = child.attributes && child.attributes.name;
	            if (nameAttribute) node[nameAttribute.value] = child;
	            if (child.children && child.children.length) bindChild(child);
	        }
	    }
	    bindChild(node);
	    return node;
	}
	
})();