
window.Animate = Animate;

/* https://gist.github.com/paulirish/5438650 */
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

/* https://gist.github.com/paulirish/1579671 */
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
