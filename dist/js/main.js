//  Based on Zeptos touch.js
//  https://raw.github.com/madrobby/zepto/master/src/touch.js
//  Zepto.js may be freely distributed under the MIT license.

;
(function ($) {

    var touch = {},
        touchTimeout, tapTimeout, swipeTimeout, longTapTimeout,
        longTapDelay = 750,
        gesture;

    function swipeDirection(x1, x2, y1, y2) {
        return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down');
    }

    function longTap() {
        longTapTimeout = null;
        if (touch.last) {
            touch.el.trigger('longTap');
            touch = {};
        }
    }

    function cancelLongTap() {
        if (longTapTimeout) clearTimeout(longTapTimeout);
        longTapTimeout = null;
    }

    function cancelAll() {
        if (touchTimeout)   clearTimeout(touchTimeout);
        if (tapTimeout)     clearTimeout(tapTimeout);
        if (swipeTimeout)   clearTimeout(swipeTimeout);
        if (longTapTimeout) clearTimeout(longTapTimeout);
        touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null;
        touch = {};
    }

    function isPrimaryTouch(event) {
        return event.pointerType == event.MSPOINTER_TYPE_TOUCH && event.isPrimary;
    }

    $(function () {
        var now, delta, deltaX = 0, deltaY = 0, firstTouch;

        if ('MSGesture' in window) {
            gesture = new MSGesture();
            gesture.target = document.body;
        }

        $(document)
            .on('MSGestureEnd gestureend', function (e) {

                var swipeDirectionFromVelocity = e.originalEvent.velocityX > 1 ? 'Right' : e.originalEvent.velocityX < -1 ? 'Left' : e.originalEvent.velocityY > 1 ? 'Down' : e.originalEvent.velocityY < -1 ? 'Up' : null;

                if (swipeDirectionFromVelocity) {
                    touch.el.trigger('swipe');
                    touch.el.trigger('swipe' + swipeDirectionFromVelocity);
                }
            })
            // MSPointerDown: for IE10
            // pointerdown: for IE11
            .on('touchstart MSPointerDown pointerdown', function (e) {

                if (e.type == 'MSPointerDown' && !isPrimaryTouch(e.originalEvent)) return;

                firstTouch = (e.type == 'MSPointerDown' || e.type == 'pointerdown') ? e : e.originalEvent.touches[0];

                now = Date.now();
                delta = now - (touch.last || now);
                touch.el = $('tagName' in firstTouch.target ? firstTouch.target : firstTouch.target.parentNode);

                if (touchTimeout) clearTimeout(touchTimeout);

                touch.x1 = firstTouch.pageX;
                touch.y1 = firstTouch.pageY;

                if (delta > 0 && delta <= 250) touch.isDoubleTap = true;

                touch.last = now;
                longTapTimeout = setTimeout(longTap, longTapDelay);

                // adds the current touch contact for IE gesture recognition
                if (gesture && ( e.type == 'MSPointerDown' || e.type == 'pointerdown' || e.type == 'touchstart' )) {
                    gesture.addPointer(e.originalEvent.pointerId);
                }

            })
            // MSPointerMove: for IE10
            // pointermove: for IE11
            .on('touchmove MSPointerMove pointermove', function (e) {

                if (e.type == 'MSPointerMove' && !isPrimaryTouch(e.originalEvent)) return;

                firstTouch = (e.type == 'MSPointerMove' || e.type == 'pointermove') ? e : e.originalEvent.touches[0];

                cancelLongTap();
                touch.x2 = firstTouch.pageX;
                touch.y2 = firstTouch.pageY;

                deltaX += Math.abs(touch.x1 - touch.x2);
                deltaY += Math.abs(touch.y1 - touch.y2);
            })
            // MSPointerUp: for IE10
            // pointerup: for IE11
            .on('touchend MSPointerUp pointerup', function (e) {

                if (e.type == 'MSPointerUp' && !isPrimaryTouch(e.originalEvent)) return;

                cancelLongTap();

                // swipe
                if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) || (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30)) {

                    swipeTimeout = setTimeout(function () {
                        touch.el.trigger('swipe');
                        touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)));
                        touch = {};
                    }, 0);

                    // normal tap
                } else if ('last' in touch) {

                    // don't fire tap when delta position changed by more than 30 pixels,
                    // for instance when moving to a point and back to origin
                    if (isNaN(deltaX) || (deltaX < 30 && deltaY < 30)) {
                        // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
                        // ('tap' fires before 'scroll')
                        tapTimeout = setTimeout(function () {

                            // trigger universal 'tap' with the option to cancelTouch()
                            // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
                            var event = $.Event('tap');
                            event.cancelTouch = cancelAll;
                            touch.el.trigger(event);

                            // trigger double tap immediately
                            if (touch.isDoubleTap) {
                                touch.el.trigger('doubleTap');
                                touch = {};
                            }

                            // trigger single tap after 250ms of inactivity
                            else {
                                touchTimeout = setTimeout(function () {
                                    touchTimeout = null;
                                    touch.el.trigger('singleTap');
                                    touch = {};
                                }, 250);
                            }
                        }, 0);
                    } else {
                        touch = {};
                    }
                    deltaX = deltaY = 0;
                }
            })
            // when the browser window loses focus,
            // for example when a modal dialog is shown,
            // cancel all ongoing events
            .on('touchcancel MSPointerCancel', cancelAll);

        // scrolling the window indicates intention of the user
        // to scroll, not tap or swipe, so cancel all ongoing events
        $(window).on('scroll', cancelAll);
    });

    ['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function (eventName) {
        $.fn[eventName] = function (callback) {
            return $(this).on(eventName, callback);
        };
    });
})(jQuery);/*! Hammer.JS - v2.0.4 - 2014-09-28
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2014 Jorik Tangelder;
 * Licensed under the MIT license */
(function (window, document, exportName, undefined) {
    'use strict';

    var VENDOR_PREFIXES = ['', 'webkit', 'moz', 'MS', 'ms', 'o'];
    var TEST_ELEMENT = document.createElement('div');

    var TYPE_FUNCTION = 'function';

    var round = Math.round;
    var abs = Math.abs;
    var now = Date.now;

    /**
     * set a timeout with a given scope
     * @param {Function} fn
     * @param {Number} timeout
     * @param {Object} context
     * @returns {number}
     */
    function setTimeoutContext(fn, timeout, context) {
        return setTimeout(bindFn(fn, context), timeout);
    }

    /**
     * if the argument is an array, we want to execute the fn on each entry
     * if it aint an array we don't want to do a thing.
     * this is used by all the methods that accept a single and array argument.
     * @param {*|Array} arg
     * @param {String} fn
     * @param {Object} [context]
     * @returns {Boolean}
     */
    function invokeArrayArg(arg, fn, context) {
        if (Array.isArray(arg)) {
            each(arg, context[fn], context);
            return true;
        }
        return false;
    }

    /**
     * walk objects and arrays
     * @param {Object} obj
     * @param {Function} iterator
     * @param {Object} context
     */
    function each(obj, iterator, context) {
        var i;

        if (!obj) {
            return;
        }

        if (obj.forEach) {
            obj.forEach(iterator, context);
        } else if (obj.length !== undefined) {
            i = 0;
            while (i < obj.length) {
                iterator.call(context, obj[i], i, obj);
                i++;
            }
        } else {
            for (i in obj) {
                obj.hasOwnProperty(i) && iterator.call(context, obj[i], i, obj);
            }
        }
    }

    /**
     * extend object.
     * means that properties in dest will be overwritten by the ones in src.
     * @param {Object} dest
     * @param {Object} src
     * @param {Boolean} [merge]
     * @returns {Object} dest
     */
    function extend(dest, src, merge) {
        var keys = Object.keys(src);
        var i = 0;
        while (i < keys.length) {
            if (!merge || (merge && dest[keys[i]] === undefined)) {
                dest[keys[i]] = src[keys[i]];
            }
            i++;
        }
        return dest;
    }

    /**
     * merge the values from src in the dest.
     * means that properties that exist in dest will not be overwritten by src
     * @param {Object} dest
     * @param {Object} src
     * @returns {Object} dest
     */
    function merge(dest, src) {
        return extend(dest, src, true);
    }

    /**
     * simple class inheritance
     * @param {Function} child
     * @param {Function} base
     * @param {Object} [properties]
     */
    function inherit(child, base, properties) {
        var baseP = base.prototype,
            childP;

        childP = child.prototype = Object.create(baseP);
        childP.constructor = child;
        childP._super = baseP;

        if (properties) {
            extend(childP, properties);
        }
    }

    /**
     * simple function bind
     * @param {Function} fn
     * @param {Object} context
     * @returns {Function}
     */
    function bindFn(fn, context) {
        return function boundFn() {
            return fn.apply(context, arguments);
        };
    }

    /**
     * let a boolean value also be a function that must return a boolean
     * this first item in args will be used as the context
     * @param {Boolean|Function} val
     * @param {Array} [args]
     * @returns {Boolean}
     */
    function boolOrFn(val, args) {
        if (typeof val == TYPE_FUNCTION) {
            return val.apply(args ? args[0] || undefined : undefined, args);
        }
        return val;
    }

    /**
     * use the val2 when val1 is undefined
     * @param {*} val1
     * @param {*} val2
     * @returns {*}
     */
    function ifUndefined(val1, val2) {
        return (val1 === undefined) ? val2 : val1;
    }

    /**
     * addEventListener with multiple events at once
     * @param {EventTarget} target
     * @param {String} types
     * @param {Function} handler
     */
    function addEventListeners(target, types, handler) {
        each(splitStr(types), function (type) {
            target.addEventListener(type, handler, false);
        });
    }

    /**
     * removeEventListener with multiple events at once
     * @param {EventTarget} target
     * @param {String} types
     * @param {Function} handler
     */
    function removeEventListeners(target, types, handler) {
        each(splitStr(types), function (type) {
            target.removeEventListener(type, handler, false);
        });
    }

    /**
     * find if a node is in the given parent
     * @method hasParent
     * @param {HTMLElement} node
     * @param {HTMLElement} parent
     * @return {Boolean} found
     */
    function hasParent(node, parent) {
        while (node) {
            if (node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }

    /**
     * small indexOf wrapper
     * @param {String} str
     * @param {String} find
     * @returns {Boolean} found
     */
    function inStr(str, find) {
        return str.indexOf(find) > -1;
    }

    /**
     * split string on whitespace
     * @param {String} str
     * @returns {Array} words
     */
    function splitStr(str) {
        return str.trim().split(/\s+/g);
    }

    /**
     * find if a array contains the object using indexOf or a simple polyFill
     * @param {Array} src
     * @param {String} find
     * @param {String} [findByKey]
     * @return {Boolean|Number} false when not found, or the index
     */
    function inArray(src, find, findByKey) {
        if (src.indexOf && !findByKey) {
            return src.indexOf(find);
        } else {
            var i = 0;
            while (i < src.length) {
                if ((findByKey && src[i][findByKey] == find) || (!findByKey && src[i] === find)) {
                    return i;
                }
                i++;
            }
            return -1;
        }
    }

    /**
     * convert array-like objects to real arrays
     * @param {Object} obj
     * @returns {Array}
     */
    function toArray(obj) {
        return Array.prototype.slice.call(obj, 0);
    }

    /**
     * unique array with objects based on a key (like 'id') or just by the array's value
     * @param {Array} src [{id:1},{id:2},{id:1}]
     * @param {String} [key]
     * @param {Boolean} [sort=False]
     * @returns {Array} [{id:1},{id:2}]
     */
    function uniqueArray(src, key, sort) {
        var results = [];
        var values = [];
        var i = 0;

        while (i < src.length) {
            var val = key ? src[i][key] : src[i];
            if (inArray(values, val) < 0) {
                results.push(src[i]);
            }
            values[i] = val;
            i++;
        }

        if (sort) {
            if (!key) {
                results = results.sort();
            } else {
                results = results.sort(function sortUniqueArray(a, b) {
                    return a[key] > b[key];
                });
            }
        }

        return results;
    }

    /**
     * get the prefixed property
     * @param {Object} obj
     * @param {String} property
     * @returns {String|Undefined} prefixed
     */
    function prefixed(obj, property) {
        var prefix, prop;
        var camelProp = property[0].toUpperCase() + property.slice(1);

        var i = 0;
        while (i < VENDOR_PREFIXES.length) {
            prefix = VENDOR_PREFIXES[i];
            prop = (prefix) ? prefix + camelProp : property;

            if (prop in obj) {
                return prop;
            }
            i++;
        }
        return undefined;
    }

    /**
     * get a unique id
     * @returns {number} uniqueId
     */
    var _uniqueId = 1;

    function uniqueId() {
        return _uniqueId++;
    }

    /**
     * get the window object of an element
     * @param {HTMLElement} element
     * @returns {DocumentView|Window}
     */
    function getWindowForElement(element) {
        var doc = element.ownerDocument;
        return (doc.defaultView || doc.parentWindow);
    }

    var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;

    var SUPPORT_TOUCH = ('ontouchstart' in window);
    var SUPPORT_POINTER_EVENTS = prefixed(window, 'PointerEvent') !== undefined;
    var SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && MOBILE_REGEX.test(navigator.userAgent);

    var INPUT_TYPE_TOUCH = 'touch';
    var INPUT_TYPE_PEN = 'pen';
    var INPUT_TYPE_MOUSE = 'mouse';
    var INPUT_TYPE_KINECT = 'kinect';

    var COMPUTE_INTERVAL = 25;

    var INPUT_START = 1;
    var INPUT_MOVE = 2;
    var INPUT_END = 4;
    var INPUT_CANCEL = 8;

    var DIRECTION_NONE = 1;
    var DIRECTION_LEFT = 2;
    var DIRECTION_RIGHT = 4;
    var DIRECTION_UP = 8;
    var DIRECTION_DOWN = 16;

    var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
    var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
    var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;

    var PROPS_XY = ['x', 'y'];
    var PROPS_CLIENT_XY = ['clientX', 'clientY'];

    /**
     * create new input type manager
     * @param {Manager} manager
     * @param {Function} callback
     * @returns {Input}
     * @constructor
     */
    function Input(manager, callback) {
        var self = this;
        this.manager = manager;
        this.callback = callback;
        this.element = manager.element;
        this.target = manager.options.inputTarget;

        // smaller wrapper around the handler, for the scope and the enabled state of the manager,
        // so when disabled the input events are completely bypassed.
        this.domHandler = function (ev) {
            if (boolOrFn(manager.options.enable, [manager])) {
                self.handler(ev);
            }
        };

        this.init();

    }

    Input.prototype = {
        /**
         * should handle the inputEvent data and trigger the callback
         * @virtual
         */
        handler: function () {
        },

        /**
         * bind the events
         */
        init: function () {
            this.evEl && addEventListeners(this.element, this.evEl, this.domHandler);
            this.evTarget && addEventListeners(this.target, this.evTarget, this.domHandler);
            this.evWin && addEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
        },

        /**
         * unbind the events
         */
        destroy: function () {
            this.evEl && removeEventListeners(this.element, this.evEl, this.domHandler);
            this.evTarget && removeEventListeners(this.target, this.evTarget, this.domHandler);
            this.evWin && removeEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
        }
    };

    /**
     * create new input type manager
     * called by the Manager constructor
     * @param {Hammer} manager
     * @returns {Input}
     */
    function createInputInstance(manager) {
        var Type;
        var inputClass = manager.options.inputClass;

        if (inputClass) {
            Type = inputClass;
        } else if (SUPPORT_POINTER_EVENTS) {
            Type = PointerEventInput;
        } else if (SUPPORT_ONLY_TOUCH) {
            Type = TouchInput;
        } else if (!SUPPORT_TOUCH) {
            Type = MouseInput;
        } else {
            Type = TouchMouseInput;
        }
        return new (Type)(manager, inputHandler);
    }

    /**
     * handle input events
     * @param {Manager} manager
     * @param {String} eventType
     * @param {Object} input
     */
    function inputHandler(manager, eventType, input) {
        var pointersLen = input.pointers.length;
        var changedPointersLen = input.changedPointers.length;
        var isFirst = (eventType & INPUT_START && (pointersLen - changedPointersLen === 0));
        var isFinal = (eventType & (INPUT_END | INPUT_CANCEL) && (pointersLen - changedPointersLen === 0));

        input.isFirst = !!isFirst;
        input.isFinal = !!isFinal;

        if (isFirst) {
            manager.session = {};
        }

        // source event is the normalized value of the domEvents
        // like 'touchstart, mouseup, pointerdown'
        input.eventType = eventType;

        // compute scale, rotation etc
        computeInputData(manager, input);

        // emit secret event
        manager.emit('hammer.input', input);

        manager.recognize(input);
        manager.session.prevInput = input;
    }

    /**
     * extend the data with some usable properties like scale, rotate, velocity etc
     * @param {Object} manager
     * @param {Object} input
     */
    function computeInputData(manager, input) {
        var session = manager.session;
        var pointers = input.pointers;
        var pointersLength = pointers.length;

        // store the first input to calculate the distance and direction
        if (!session.firstInput) {
            session.firstInput = simpleCloneInputData(input);
        }

        // to compute scale and rotation we need to store the multiple touches
        if (pointersLength > 1 && !session.firstMultiple) {
            session.firstMultiple = simpleCloneInputData(input);
        } else if (pointersLength === 1) {
            session.firstMultiple = false;
        }

        var firstInput = session.firstInput;
        var firstMultiple = session.firstMultiple;
        var offsetCenter = firstMultiple ? firstMultiple.center : firstInput.center;

        var center = input.center = getCenter(pointers);
        input.timeStamp = now();
        input.deltaTime = input.timeStamp - firstInput.timeStamp;

        input.angle = getAngle(offsetCenter, center);
        input.distance = getDistance(offsetCenter, center);

        computeDeltaXY(session, input);
        input.offsetDirection = getDirection(input.deltaX, input.deltaY);

        input.scale = firstMultiple ? getScale(firstMultiple.pointers, pointers) : 1;
        input.rotation = firstMultiple ? getRotation(firstMultiple.pointers, pointers) : 0;

        computeIntervalInputData(session, input);

        // find the correct target
        var target = manager.element;
        if (hasParent(input.srcEvent.target, target)) {
            target = input.srcEvent.target;
        }
        input.target = target;
    }

    function computeDeltaXY(session, input) {
        var center = input.center;
        var offset = session.offsetDelta || {};
        var prevDelta = session.prevDelta || {};
        var prevInput = session.prevInput || {};

        if (input.eventType === INPUT_START || prevInput.eventType === INPUT_END) {
            prevDelta = session.prevDelta = {
                x: prevInput.deltaX || 0,
                y: prevInput.deltaY || 0
            };

            offset = session.offsetDelta = {
                x: center.x,
                y: center.y
            };
        }

        input.deltaX = prevDelta.x + (center.x - offset.x);
        input.deltaY = prevDelta.y + (center.y - offset.y);
    }

    /**
     * velocity is calculated every x ms
     * @param {Object} session
     * @param {Object} input
     */
    function computeIntervalInputData(session, input) {
        var last = session.lastInterval || input,
            deltaTime = input.timeStamp - last.timeStamp,
            velocity, velocityX, velocityY, direction;

        if (input.eventType != INPUT_CANCEL && (deltaTime > COMPUTE_INTERVAL || last.velocity === undefined)) {
            var deltaX = last.deltaX - input.deltaX;
            var deltaY = last.deltaY - input.deltaY;

            var v = getVelocity(deltaTime, deltaX, deltaY);
            velocityX = v.x;
            velocityY = v.y;
            velocity = (abs(v.x) > abs(v.y)) ? v.x : v.y;
            direction = getDirection(deltaX, deltaY);

            session.lastInterval = input;
        } else {
            // use latest velocity info if it doesn't overtake a minimum period
            velocity = last.velocity;
            velocityX = last.velocityX;
            velocityY = last.velocityY;
            direction = last.direction;
        }

        input.velocity = velocity;
        input.velocityX = velocityX;
        input.velocityY = velocityY;
        input.direction = direction;
    }

    /**
     * create a simple clone from the input used for storage of firstInput and firstMultiple
     * @param {Object} input
     * @returns {Object} clonedInputData
     */
    function simpleCloneInputData(input) {
        // make a simple copy of the pointers because we will get a reference if we don't
        // we only need clientXY for the calculations
        var pointers = [];
        var i = 0;
        while (i < input.pointers.length) {
            pointers[i] = {
                clientX: round(input.pointers[i].clientX),
                clientY: round(input.pointers[i].clientY)
            };
            i++;
        }

        return {
            timeStamp: now(),
            pointers: pointers,
            center: getCenter(pointers),
            deltaX: input.deltaX,
            deltaY: input.deltaY
        };
    }

    /**
     * get the center of all the pointers
     * @param {Array} pointers
     * @return {Object} center contains `x` and `y` properties
     */
    function getCenter(pointers) {
        var pointersLength = pointers.length;

        // no need to loop when only one touch
        if (pointersLength === 1) {
            return {
                x: round(pointers[0].clientX),
                y: round(pointers[0].clientY)
            };
        }

        var x = 0, y = 0, i = 0;
        while (i < pointersLength) {
            x += pointers[i].clientX;
            y += pointers[i].clientY;
            i++;
        }

        return {
            x: round(x / pointersLength),
            y: round(y / pointersLength)
        };
    }

    /**
     * calculate the velocity between two points. unit is in px per ms.
     * @param {Number} deltaTime
     * @param {Number} x
     * @param {Number} y
     * @return {Object} velocity `x` and `y`
     */
    function getVelocity(deltaTime, x, y) {
        return {
            x: x / deltaTime || 0,
            y: y / deltaTime || 0
        };
    }

    /**
     * get the direction between two points
     * @param {Number} x
     * @param {Number} y
     * @return {Number} direction
     */
    function getDirection(x, y) {
        if (x === y) {
            return DIRECTION_NONE;
        }

        if (abs(x) >= abs(y)) {
            return x > 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
        }
        return y > 0 ? DIRECTION_UP : DIRECTION_DOWN;
    }

    /**
     * calculate the absolute distance between two points
     * @param {Object} p1 {x, y}
     * @param {Object} p2 {x, y}
     * @param {Array} [props] containing x and y keys
     * @return {Number} distance
     */
    function getDistance(p1, p2, props) {
        if (!props) {
            props = PROPS_XY;
        }
        var x = p2[props[0]] - p1[props[0]],
            y = p2[props[1]] - p1[props[1]];

        return Math.sqrt((x * x) + (y * y));
    }

    /**
     * calculate the angle between two coordinates
     * @param {Object} p1
     * @param {Object} p2
     * @param {Array} [props] containing x and y keys
     * @return {Number} angle
     */
    function getAngle(p1, p2, props) {
        if (!props) {
            props = PROPS_XY;
        }
        var x = p2[props[0]] - p1[props[0]],
            y = p2[props[1]] - p1[props[1]];
        return Math.atan2(y, x) * 180 / Math.PI;
    }

    /**
     * calculate the rotation degrees between two pointersets
     * @param {Array} start array of pointers
     * @param {Array} end array of pointers
     * @return {Number} rotation
     */
    function getRotation(start, end) {
        return getAngle(end[1], end[0], PROPS_CLIENT_XY) - getAngle(start[1], start[0], PROPS_CLIENT_XY);
    }

    /**
     * calculate the scale factor between two pointersets
     * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
     * @param {Array} start array of pointers
     * @param {Array} end array of pointers
     * @return {Number} scale
     */
    function getScale(start, end) {
        return getDistance(end[0], end[1], PROPS_CLIENT_XY) / getDistance(start[0], start[1], PROPS_CLIENT_XY);
    }

    var MOUSE_INPUT_MAP = {
        mousedown: INPUT_START,
        mousemove: INPUT_MOVE,
        mouseup: INPUT_END
    };

    var MOUSE_ELEMENT_EVENTS = 'mousedown';
    var MOUSE_WINDOW_EVENTS = 'mousemove mouseup';

    /**
     * Mouse events input
     * @constructor
     * @extends Input
     */
    function MouseInput() {
        this.evEl = MOUSE_ELEMENT_EVENTS;
        this.evWin = MOUSE_WINDOW_EVENTS;

        this.allow = true; // used by Input.TouchMouse to disable mouse events
        this.pressed = false; // mousedown state

        Input.apply(this, arguments);
    }

    inherit(MouseInput, Input, {
        /**
         * handle mouse events
         * @param {Object} ev
         */
        handler: function MEhandler(ev) {
            var eventType = MOUSE_INPUT_MAP[ev.type];

            // on start we want to have the left mouse button down
            if (eventType & INPUT_START && ev.button === 0) {
                this.pressed = true;
            }

            if (eventType & INPUT_MOVE && ev.which !== 1) {
                eventType = INPUT_END;
            }

            // mouse must be down, and mouse events are allowed (see the TouchMouse input)
            if (!this.pressed || !this.allow) {
                return;
            }

            if (eventType & INPUT_END) {
                this.pressed = false;
            }

            this.callback(this.manager, eventType, {
                pointers: [ev],
                changedPointers: [ev],
                pointerType: INPUT_TYPE_MOUSE,
                srcEvent: ev
            });
        }
    });

    var POINTER_INPUT_MAP = {
        pointerdown: INPUT_START,
        pointermove: INPUT_MOVE,
        pointerup: INPUT_END,
        pointercancel: INPUT_CANCEL,
        pointerout: INPUT_CANCEL
    };

// in IE10 the pointer types is defined as an enum
    var IE10_POINTER_TYPE_ENUM = {
        2: INPUT_TYPE_TOUCH,
        3: INPUT_TYPE_PEN,
        4: INPUT_TYPE_MOUSE,
        5: INPUT_TYPE_KINECT // see https://twitter.com/jacobrossi/status/480596438489890816
    };

    var POINTER_ELEMENT_EVENTS = 'pointerdown';
    var POINTER_WINDOW_EVENTS = 'pointermove pointerup pointercancel';

// IE10 has prefixed support, and case-sensitive
    if (window.MSPointerEvent) {
        POINTER_ELEMENT_EVENTS = 'MSPointerDown';
        POINTER_WINDOW_EVENTS = 'MSPointerMove MSPointerUp MSPointerCancel';
    }

    /**
     * Pointer events input
     * @constructor
     * @extends Input
     */
    function PointerEventInput() {
        this.evEl = POINTER_ELEMENT_EVENTS;
        this.evWin = POINTER_WINDOW_EVENTS;

        Input.apply(this, arguments);

        this.store = (this.manager.session.pointerEvents = []);
    }

    inherit(PointerEventInput, Input, {
        /**
         * handle mouse events
         * @param {Object} ev
         */
        handler: function PEhandler(ev) {
            var store = this.store;
            var removePointer = false;

            var eventTypeNormalized = ev.type.toLowerCase().replace('ms', '');
            var eventType = POINTER_INPUT_MAP[eventTypeNormalized];
            var pointerType = IE10_POINTER_TYPE_ENUM[ev.pointerType] || ev.pointerType;

            var isTouch = (pointerType == INPUT_TYPE_TOUCH);

            // get index of the event in the store
            var storeIndex = inArray(store, ev.pointerId, 'pointerId');

            // start and mouse must be down
            if (eventType & INPUT_START && (ev.button === 0 || isTouch)) {
                if (storeIndex < 0) {
                    store.push(ev);
                    storeIndex = store.length - 1;
                }
            } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
                removePointer = true;
            }

            // it not found, so the pointer hasn't been down (so it's probably a hover)
            if (storeIndex < 0) {
                return;
            }

            // update the event in the store
            store[storeIndex] = ev;

            this.callback(this.manager, eventType, {
                pointers: store,
                changedPointers: [ev],
                pointerType: pointerType,
                srcEvent: ev
            });

            if (removePointer) {
                // remove from the store
                store.splice(storeIndex, 1);
            }
        }
    });

    var SINGLE_TOUCH_INPUT_MAP = {
        touchstart: INPUT_START,
        touchmove: INPUT_MOVE,
        touchend: INPUT_END,
        touchcancel: INPUT_CANCEL
    };

    var SINGLE_TOUCH_TARGET_EVENTS = 'touchstart';
    var SINGLE_TOUCH_WINDOW_EVENTS = 'touchstart touchmove touchend touchcancel';

    /**
     * Touch events input
     * @constructor
     * @extends Input
     */
    function SingleTouchInput() {
        this.evTarget = SINGLE_TOUCH_TARGET_EVENTS;
        this.evWin = SINGLE_TOUCH_WINDOW_EVENTS;
        this.started = false;

        Input.apply(this, arguments);
    }

    inherit(SingleTouchInput, Input, {
        handler: function TEhandler(ev) {
            var type = SINGLE_TOUCH_INPUT_MAP[ev.type];

            // should we handle the touch events?
            if (type === INPUT_START) {
                this.started = true;
            }

            if (!this.started) {
                return;
            }

            var touches = normalizeSingleTouches.call(this, ev, type);

            // when done, reset the started state
            if (type & (INPUT_END | INPUT_CANCEL) && touches[0].length - touches[1].length === 0) {
                this.started = false;
            }

            this.callback(this.manager, type, {
                pointers: touches[0],
                changedPointers: touches[1],
                pointerType: INPUT_TYPE_TOUCH,
                srcEvent: ev
            });
        }
    });

    /**
     * @this {TouchInput}
     * @param {Object} ev
     * @param {Number} type flag
     * @returns {undefined|Array} [all, changed]
     */
    function normalizeSingleTouches(ev, type) {
        var all = toArray(ev.touches);
        var changed = toArray(ev.changedTouches);

        if (type & (INPUT_END | INPUT_CANCEL)) {
            all = uniqueArray(all.concat(changed), 'identifier', true);
        }

        return [all, changed];
    }

    var TOUCH_INPUT_MAP = {
        touchstart: INPUT_START,
        touchmove: INPUT_MOVE,
        touchend: INPUT_END,
        touchcancel: INPUT_CANCEL
    };

    var TOUCH_TARGET_EVENTS = 'touchstart touchmove touchend touchcancel';

    /**
     * Multi-user touch events input
     * @constructor
     * @extends Input
     */
    function TouchInput() {
        this.evTarget = TOUCH_TARGET_EVENTS;
        this.targetIds = {};

        Input.apply(this, arguments);
    }

    inherit(TouchInput, Input, {
        handler: function MTEhandler(ev) {
            var type = TOUCH_INPUT_MAP[ev.type];
            var touches = getTouches.call(this, ev, type);
            if (!touches) {
                return;
            }

            this.callback(this.manager, type, {
                pointers: touches[0],
                changedPointers: touches[1],
                pointerType: INPUT_TYPE_TOUCH,
                srcEvent: ev
            });
        }
    });

    /**
     * @this {TouchInput}
     * @param {Object} ev
     * @param {Number} type flag
     * @returns {undefined|Array} [all, changed]
     */
    function getTouches(ev, type) {
        var allTouches = toArray(ev.touches);
        var targetIds = this.targetIds;

        // when there is only one touch, the process can be simplified
        if (type & (INPUT_START | INPUT_MOVE) && allTouches.length === 1) {
            targetIds[allTouches[0].identifier] = true;
            return [allTouches, allTouches];
        }

        var i,
            targetTouches,
            changedTouches = toArray(ev.changedTouches),
            changedTargetTouches = [],
            target = this.target;

        // get target touches from touches
        targetTouches = allTouches.filter(function (touch) {
            return hasParent(touch.target, target);
        });

        // collect touches
        if (type === INPUT_START) {
            i = 0;
            while (i < targetTouches.length) {
                targetIds[targetTouches[i].identifier] = true;
                i++;
            }
        }

        // filter changed touches to only contain touches that exist in the collected target ids
        i = 0;
        while (i < changedTouches.length) {
            if (targetIds[changedTouches[i].identifier]) {
                changedTargetTouches.push(changedTouches[i]);
            }

            // cleanup removed touches
            if (type & (INPUT_END | INPUT_CANCEL)) {
                delete targetIds[changedTouches[i].identifier];
            }
            i++;
        }

        if (!changedTargetTouches.length) {
            return;
        }

        return [
            // merge targetTouches with changedTargetTouches so it contains ALL touches, including 'end' and 'cancel'
            uniqueArray(targetTouches.concat(changedTargetTouches), 'identifier', true),
            changedTargetTouches
        ];
    }

    /**
     * Combined touch and mouse input
     *
     * Touch has a higher priority then mouse, and while touching no mouse events are allowed.
     * This because touch devices also emit mouse events while doing a touch.
     *
     * @constructor
     * @extends Input
     */
    function TouchMouseInput() {
        Input.apply(this, arguments);

        var handler = bindFn(this.handler, this);
        this.touch = new TouchInput(this.manager, handler);
        this.mouse = new MouseInput(this.manager, handler);
    }

    inherit(TouchMouseInput, Input, {
        /**
         * handle mouse and touch events
         * @param {Hammer} manager
         * @param {String} inputEvent
         * @param {Object} inputData
         */
        handler: function TMEhandler(manager, inputEvent, inputData) {
            var isTouch = (inputData.pointerType == INPUT_TYPE_TOUCH),
                isMouse = (inputData.pointerType == INPUT_TYPE_MOUSE);

            // when we're in a touch event, so  block all upcoming mouse events
            // most mobile browser also emit mouseevents, right after touchstart
            if (isTouch) {
                this.mouse.allow = false;
            } else if (isMouse && !this.mouse.allow) {
                return;
            }

            // reset the allowMouse when we're done
            if (inputEvent & (INPUT_END | INPUT_CANCEL)) {
                this.mouse.allow = true;
            }

            this.callback(manager, inputEvent, inputData);
        },

        /**
         * remove the event listeners
         */
        destroy: function destroy() {
            this.touch.destroy();
            this.mouse.destroy();
        }
    });

    var PREFIXED_TOUCH_ACTION = prefixed(TEST_ELEMENT.style, 'touchAction');
    var NATIVE_TOUCH_ACTION = PREFIXED_TOUCH_ACTION !== undefined;

// magical touchAction value
    var TOUCH_ACTION_COMPUTE = 'compute';
    var TOUCH_ACTION_AUTO = 'auto';
    var TOUCH_ACTION_MANIPULATION = 'manipulation'; // not implemented
    var TOUCH_ACTION_NONE = 'none';
    var TOUCH_ACTION_PAN_X = 'pan-x';
    var TOUCH_ACTION_PAN_Y = 'pan-y';

    /**
     * Touch Action
     * sets the touchAction property or uses the js alternative
     * @param {Manager} manager
     * @param {String} value
     * @constructor
     */
    function TouchAction(manager, value) {
        this.manager = manager;
        this.set(value);
    }

    TouchAction.prototype = {
        /**
         * set the touchAction value on the element or enable the polyfill
         * @param {String} value
         */
        set: function (value) {
            // find out the touch-action by the event handlers
            if (value == TOUCH_ACTION_COMPUTE) {
                value = this.compute();
            }

            if (NATIVE_TOUCH_ACTION) {
                this.manager.element.style[PREFIXED_TOUCH_ACTION] = value;
            }
            this.actions = value.toLowerCase().trim();
        },

        /**
         * just re-set the touchAction value
         */
        update: function () {
            this.set(this.manager.options.touchAction);
        },

        /**
         * compute the value for the touchAction property based on the recognizer's settings
         * @returns {String} value
         */
        compute: function () {
            var actions = [];
            each(this.manager.recognizers, function (recognizer) {
                if (boolOrFn(recognizer.options.enable, [recognizer])) {
                    actions = actions.concat(recognizer.getTouchAction());
                }
            });
            return cleanTouchActions(actions.join(' '));
        },

        /**
         * this method is called on each input cycle and provides the preventing of the browser behavior
         * @param {Object} input
         */
        preventDefaults: function (input) {
            // not needed with native support for the touchAction property
            if (NATIVE_TOUCH_ACTION) {
                return;
            }

            var srcEvent = input.srcEvent;
            var direction = input.offsetDirection;

            // if the touch action did prevented once this session
            if (this.manager.session.prevented) {
                srcEvent.preventDefault();
                return;
            }

            var actions = this.actions;
            var hasNone = inStr(actions, TOUCH_ACTION_NONE);
            var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);
            var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);

            if (hasNone ||
                (hasPanY && direction & DIRECTION_HORIZONTAL) ||
                (hasPanX && direction & DIRECTION_VERTICAL)) {
                return this.preventSrc(srcEvent);
            }
        },

        /**
         * call preventDefault to prevent the browser's default behavior (scrolling in most cases)
         * @param {Object} srcEvent
         */
        preventSrc: function (srcEvent) {
            this.manager.session.prevented = true;
            srcEvent.preventDefault();
        }
    };

    /**
     * when the touchActions are collected they are not a valid value, so we need to clean things up. *
     * @param {String} actions
     * @returns {*}
     */
    function cleanTouchActions(actions) {
        // none
        if (inStr(actions, TOUCH_ACTION_NONE)) {
            return TOUCH_ACTION_NONE;
        }

        var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
        var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);

        // pan-x and pan-y can be combined
        if (hasPanX && hasPanY) {
            return TOUCH_ACTION_PAN_X + ' ' + TOUCH_ACTION_PAN_Y;
        }

        // pan-x OR pan-y
        if (hasPanX || hasPanY) {
            return hasPanX ? TOUCH_ACTION_PAN_X : TOUCH_ACTION_PAN_Y;
        }

        // manipulation
        if (inStr(actions, TOUCH_ACTION_MANIPULATION)) {
            return TOUCH_ACTION_MANIPULATION;
        }

        return TOUCH_ACTION_AUTO;
    }

    /**
     * Recognizer flow explained; *
     * All recognizers have the initial state of POSSIBLE when a input session starts.
     * The definition of a input session is from the first input until the last input, with all it's movement in it. *
     * Example session for mouse-input: mousedown -> mousemove -> mouseup
     *
     * On each recognizing cycle (see Manager.recognize) the .recognize() method is executed
     * which determines with state it should be.
     *
     * If the recognizer has the state FAILED, CANCELLED or RECOGNIZED (equals ENDED), it is reset to
     * POSSIBLE to give it another change on the next cycle.
     *
     *               Possible
     *                  |
     *            +-----+---------------+
     *            |                     |
     *      +-----+-----+               |
     *      |           |               |
     *   Failed      Cancelled          |
     *                          +-------+------+
     *                          |              |
     *                      Recognized       Began
     *                                         |
     *                                      Changed
     *                                         |
     *                                  Ended/Recognized
     */
    var STATE_POSSIBLE = 1;
    var STATE_BEGAN = 2;
    var STATE_CHANGED = 4;
    var STATE_ENDED = 8;
    var STATE_RECOGNIZED = STATE_ENDED;
    var STATE_CANCELLED = 16;
    var STATE_FAILED = 32;

    /**
     * Recognizer
     * Every recognizer needs to extend from this class.
     * @constructor
     * @param {Object} options
     */
    function Recognizer(options) {
        this.id = uniqueId();

        this.manager = null;
        this.options = merge(options || {}, this.defaults);

        // default is enable true
        this.options.enable = ifUndefined(this.options.enable, true);

        this.state = STATE_POSSIBLE;

        this.simultaneous = {};
        this.requireFail = [];
    }

    Recognizer.prototype = {
        /**
         * @virtual
         * @type {Object}
         */
        defaults: {},

        /**
         * set options
         * @param {Object} options
         * @return {Recognizer}
         */
        set: function (options) {
            extend(this.options, options);

            // also update the touchAction, in case something changed about the directions/enabled state
            this.manager && this.manager.touchAction.update();
            return this;
        },

        /**
         * recognize simultaneous with an other recognizer.
         * @param {Recognizer} otherRecognizer
         * @returns {Recognizer} this
         */
        recognizeWith: function (otherRecognizer) {
            if (invokeArrayArg(otherRecognizer, 'recognizeWith', this)) {
                return this;
            }

            var simultaneous = this.simultaneous;
            otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
            if (!simultaneous[otherRecognizer.id]) {
                simultaneous[otherRecognizer.id] = otherRecognizer;
                otherRecognizer.recognizeWith(this);
            }
            return this;
        },

        /**
         * drop the simultaneous link. it doesnt remove the link on the other recognizer.
         * @param {Recognizer} otherRecognizer
         * @returns {Recognizer} this
         */
        dropRecognizeWith: function (otherRecognizer) {
            if (invokeArrayArg(otherRecognizer, 'dropRecognizeWith', this)) {
                return this;
            }

            otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
            delete this.simultaneous[otherRecognizer.id];
            return this;
        },

        /**
         * recognizer can only run when an other is failing
         * @param {Recognizer} otherRecognizer
         * @returns {Recognizer} this
         */
        requireFailure: function (otherRecognizer) {
            if (invokeArrayArg(otherRecognizer, 'requireFailure', this)) {
                return this;
            }

            var requireFail = this.requireFail;
            otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
            if (inArray(requireFail, otherRecognizer) === -1) {
                requireFail.push(otherRecognizer);
                otherRecognizer.requireFailure(this);
            }
            return this;
        },

        /**
         * drop the requireFailure link. it does not remove the link on the other recognizer.
         * @param {Recognizer} otherRecognizer
         * @returns {Recognizer} this
         */
        dropRequireFailure: function (otherRecognizer) {
            if (invokeArrayArg(otherRecognizer, 'dropRequireFailure', this)) {
                return this;
            }

            otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
            var index = inArray(this.requireFail, otherRecognizer);
            if (index > -1) {
                this.requireFail.splice(index, 1);
            }
            return this;
        },

        /**
         * has require failures boolean
         * @returns {boolean}
         */
        hasRequireFailures: function () {
            return this.requireFail.length > 0;
        },

        /**
         * if the recognizer can recognize simultaneous with an other recognizer
         * @param {Recognizer} otherRecognizer
         * @returns {Boolean}
         */
        canRecognizeWith: function (otherRecognizer) {
            return !!this.simultaneous[otherRecognizer.id];
        },

        /**
         * You should use `tryEmit` instead of `emit` directly to check
         * that all the needed recognizers has failed before emitting.
         * @param {Object} input
         */
        emit: function (input) {
            var self = this;
            var state = this.state;

            function emit(withState) {
                self.manager.emit(self.options.event + (withState ? stateStr(state) : ''), input);
            }

            // 'panstart' and 'panmove'
            if (state < STATE_ENDED) {
                emit(true);
            }

            emit(); // simple 'eventName' events

            // panend and pancancel
            if (state >= STATE_ENDED) {
                emit(true);
            }
        },

        /**
         * Check that all the require failure recognizers has failed,
         * if true, it emits a gesture event,
         * otherwise, setup the state to FAILED.
         * @param {Object} input
         */
        tryEmit: function (input) {
            if (this.canEmit()) {
                return this.emit(input);
            }
            // it's failing anyway
            this.state = STATE_FAILED;
        },

        /**
         * can we emit?
         * @returns {boolean}
         */
        canEmit: function () {
            var i = 0;
            while (i < this.requireFail.length) {
                if (!(this.requireFail[i].state & (STATE_FAILED | STATE_POSSIBLE))) {
                    return false;
                }
                i++;
            }
            return true;
        },

        /**
         * update the recognizer
         * @param {Object} inputData
         */
        recognize: function (inputData) {
            // make a new copy of the inputData
            // so we can change the inputData without messing up the other recognizers
            var inputDataClone = extend({}, inputData);

            // is is enabled and allow recognizing?
            if (!boolOrFn(this.options.enable, [this, inputDataClone])) {
                this.reset();
                this.state = STATE_FAILED;
                return;
            }

            // reset when we've reached the end
            if (this.state & (STATE_RECOGNIZED | STATE_CANCELLED | STATE_FAILED)) {
                this.state = STATE_POSSIBLE;
            }

            this.state = this.process(inputDataClone);

            // the recognizer has recognized a gesture
            // so trigger an event
            if (this.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED | STATE_CANCELLED)) {
                this.tryEmit(inputDataClone);
            }
        },

        /**
         * return the state of the recognizer
         * the actual recognizing happens in this method
         * @virtual
         * @param {Object} inputData
         * @returns {Const} STATE
         */
        process: function (inputData) {
        }, // jshint ignore:line

        /**
         * return the preferred touch-action
         * @virtual
         * @returns {Array}
         */
        getTouchAction: function () {
        },

        /**
         * called when the gesture isn't allowed to recognize
         * like when another is being recognized or it is disabled
         * @virtual
         */
        reset: function () {
        }
    };

    /**
     * get a usable string, used as event postfix
     * @param {Const} state
     * @returns {String} state
     */
    function stateStr(state) {
        if (state & STATE_CANCELLED) {
            return 'cancel';
        } else if (state & STATE_ENDED) {
            return 'end';
        } else if (state & STATE_CHANGED) {
            return 'move';
        } else if (state & STATE_BEGAN) {
            return 'start';
        }
        return '';
    }

    /**
     * direction cons to string
     * @param {Const} direction
     * @returns {String}
     */
    function directionStr(direction) {
        if (direction == DIRECTION_DOWN) {
            return 'down';
        } else if (direction == DIRECTION_UP) {
            return 'up';
        } else if (direction == DIRECTION_LEFT) {
            return 'left';
        } else if (direction == DIRECTION_RIGHT) {
            return 'right';
        }
        return '';
    }

    /**
     * get a recognizer by name if it is bound to a manager
     * @param {Recognizer|String} otherRecognizer
     * @param {Recognizer} recognizer
     * @returns {Recognizer}
     */
    function getRecognizerByNameIfManager(otherRecognizer, recognizer) {
        var manager = recognizer.manager;
        if (manager) {
            return manager.get(otherRecognizer);
        }
        return otherRecognizer;
    }

    /**
     * This recognizer is just used as a base for the simple attribute recognizers.
     * @constructor
     * @extends Recognizer
     */
    function AttrRecognizer() {
        Recognizer.apply(this, arguments);
    }

    inherit(AttrRecognizer, Recognizer, {
        /**
         * @namespace
         * @memberof AttrRecognizer
         */
        defaults: {
            /**
             * @type {Number}
             * @default 1
             */
            pointers: 1
        },

        /**
         * Used to check if it the recognizer receives valid input, like input.distance > 10.
         * @memberof AttrRecognizer
         * @param {Object} input
         * @returns {Boolean} recognized
         */
        attrTest: function (input) {
            var optionPointers = this.options.pointers;
            return optionPointers === 0 || input.pointers.length === optionPointers;
        },

        /**
         * Process the input and return the state for the recognizer
         * @memberof AttrRecognizer
         * @param {Object} input
         * @returns {*} State
         */
        process: function (input) {
            var state = this.state;
            var eventType = input.eventType;

            var isRecognized = state & (STATE_BEGAN | STATE_CHANGED);
            var isValid = this.attrTest(input);

            // on cancel input and we've recognized before, return STATE_CANCELLED
            if (isRecognized && (eventType & INPUT_CANCEL || !isValid)) {
                return state | STATE_CANCELLED;
            } else if (isRecognized || isValid) {
                if (eventType & INPUT_END) {
                    return state | STATE_ENDED;
                } else if (!(state & STATE_BEGAN)) {
                    return STATE_BEGAN;
                }
                return state | STATE_CHANGED;
            }
            return STATE_FAILED;
        }
    });

    /**
     * Pan
     * Recognized when the pointer is down and moved in the allowed direction.
     * @constructor
     * @extends AttrRecognizer
     */
    function PanRecognizer() {
        AttrRecognizer.apply(this, arguments);

        this.pX = null;
        this.pY = null;
    }

    inherit(PanRecognizer, AttrRecognizer, {
        /**
         * @namespace
         * @memberof PanRecognizer
         */
        defaults: {
            event: 'pan',
            threshold: 10,
            pointers: 1,
            direction: DIRECTION_ALL
        },

        getTouchAction: function () {
            var direction = this.options.direction;
            var actions = [];
            if (direction & DIRECTION_HORIZONTAL) {
                actions.push(TOUCH_ACTION_PAN_Y);
            }
            if (direction & DIRECTION_VERTICAL) {
                actions.push(TOUCH_ACTION_PAN_X);
            }
            return actions;
        },

        directionTest: function (input) {
            var options = this.options;
            var hasMoved = true;
            var distance = input.distance;
            var direction = input.direction;
            var x = input.deltaX;
            var y = input.deltaY;

            // lock to axis?
            if (!(direction & options.direction)) {
                if (options.direction & DIRECTION_HORIZONTAL) {
                    direction = (x === 0) ? DIRECTION_NONE : (x < 0) ? DIRECTION_LEFT : DIRECTION_RIGHT;
                    hasMoved = x != this.pX;
                    distance = Math.abs(input.deltaX);
                } else {
                    direction = (y === 0) ? DIRECTION_NONE : (y < 0) ? DIRECTION_UP : DIRECTION_DOWN;
                    hasMoved = y != this.pY;
                    distance = Math.abs(input.deltaY);
                }
            }
            input.direction = direction;
            return hasMoved && distance > options.threshold && direction & options.direction;
        },

        attrTest: function (input) {
            return AttrRecognizer.prototype.attrTest.call(this, input) &&
                (this.state & STATE_BEGAN || (!(this.state & STATE_BEGAN) && this.directionTest(input)));
        },

        emit: function (input) {
            this.pX = input.deltaX;
            this.pY = input.deltaY;

            var direction = directionStr(input.direction);
            if (direction) {
                this.manager.emit(this.options.event + direction, input);
            }

            this._super.emit.call(this, input);
        }
    });

    /**
     * Pinch
     * Recognized when two or more pointers are moving toward (zoom-in) or away from each other (zoom-out).
     * @constructor
     * @extends AttrRecognizer
     */
    function PinchRecognizer() {
        AttrRecognizer.apply(this, arguments);
    }

    inherit(PinchRecognizer, AttrRecognizer, {
        /**
         * @namespace
         * @memberof PinchRecognizer
         */
        defaults: {
            event: 'pinch',
            threshold: 0,
            pointers: 2
        },

        getTouchAction: function () {
            return [TOUCH_ACTION_NONE];
        },

        attrTest: function (input) {
            return this._super.attrTest.call(this, input) &&
                (Math.abs(input.scale - 1) > this.options.threshold || this.state & STATE_BEGAN);
        },

        emit: function (input) {
            this._super.emit.call(this, input);
            if (input.scale !== 1) {
                var inOut = input.scale < 1 ? 'in' : 'out';
                this.manager.emit(this.options.event + inOut, input);
            }
        }
    });

    /**
     * Press
     * Recognized when the pointer is down for x ms without any movement.
     * @constructor
     * @extends Recognizer
     */
    function PressRecognizer() {
        Recognizer.apply(this, arguments);

        this._timer = null;
        this._input = null;
    }

    inherit(PressRecognizer, Recognizer, {
        /**
         * @namespace
         * @memberof PressRecognizer
         */
        defaults: {
            event: 'press',
            pointers: 1,
            time: 500, // minimal time of the pointer to be pressed
            threshold: 5 // a minimal movement is ok, but keep it low
        },

        getTouchAction: function () {
            return [TOUCH_ACTION_AUTO];
        },

        process: function (input) {
            var options = this.options;
            var validPointers = input.pointers.length === options.pointers;
            var validMovement = input.distance < options.threshold;
            var validTime = input.deltaTime > options.time;

            this._input = input;

            // we only allow little movement
            // and we've reached an end event, so a tap is possible
            if (!validMovement || !validPointers || (input.eventType & (INPUT_END | INPUT_CANCEL) && !validTime)) {
                this.reset();
            } else if (input.eventType & INPUT_START) {
                this.reset();
                this._timer = setTimeoutContext(function () {
                    this.state = STATE_RECOGNIZED;
                    this.tryEmit();
                }, options.time, this);
            } else if (input.eventType & INPUT_END) {
                return STATE_RECOGNIZED;
            }
            return STATE_FAILED;
        },

        reset: function () {
            clearTimeout(this._timer);
        },

        emit: function (input) {
            if (this.state !== STATE_RECOGNIZED) {
                return;
            }

            if (input && (input.eventType & INPUT_END)) {
                this.manager.emit(this.options.event + 'up', input);
            } else {
                this._input.timeStamp = now();
                this.manager.emit(this.options.event, this._input);
            }
        }
    });

    /**
     * Rotate
     * Recognized when two or more pointer are moving in a circular motion.
     * @constructor
     * @extends AttrRecognizer
     */
    function RotateRecognizer() {
        AttrRecognizer.apply(this, arguments);
    }

    inherit(RotateRecognizer, AttrRecognizer, {
        /**
         * @namespace
         * @memberof RotateRecognizer
         */
        defaults: {
            event: 'rotate',
            threshold: 0,
            pointers: 2
        },

        getTouchAction: function () {
            return [TOUCH_ACTION_NONE];
        },

        attrTest: function (input) {
            return this._super.attrTest.call(this, input) &&
                (Math.abs(input.rotation) > this.options.threshold || this.state & STATE_BEGAN);
        }
    });

    /**
     * Swipe
     * Recognized when the pointer is moving fast (velocity), with enough distance in the allowed direction.
     * @constructor
     * @extends AttrRecognizer
     */
    function SwipeRecognizer() {
        AttrRecognizer.apply(this, arguments);
    }

    inherit(SwipeRecognizer, AttrRecognizer, {
        /**
         * @namespace
         * @memberof SwipeRecognizer
         */
        defaults: {
            event: 'swipe',
            threshold: 10,
            velocity: 0.65,
            direction: DIRECTION_HORIZONTAL | DIRECTION_VERTICAL,
            pointers: 1
        },

        getTouchAction: function () {
            return PanRecognizer.prototype.getTouchAction.call(this);
        },

        attrTest: function (input) {
            var direction = this.options.direction;
            var velocity;

            if (direction & (DIRECTION_HORIZONTAL | DIRECTION_VERTICAL)) {
                velocity = input.velocity;
            } else if (direction & DIRECTION_HORIZONTAL) {
                velocity = input.velocityX;
            } else if (direction & DIRECTION_VERTICAL) {
                velocity = input.velocityY;
            }

            return this._super.attrTest.call(this, input) &&
                direction & input.direction &&
                input.distance > this.options.threshold &&
                abs(velocity) > this.options.velocity && input.eventType & INPUT_END;
        },

        emit: function (input) {
            var direction = directionStr(input.direction);
            if (direction) {
                this.manager.emit(this.options.event + direction, input);
            }

            this.manager.emit(this.options.event, input);
        }
    });

    /**
     * A tap is ecognized when the pointer is doing a small tap/click. Multiple taps are recognized if they occur
     * between the given interval and position. The delay option can be used to recognize multi-taps without firing
     * a single tap.
     *
     * The eventData from the emitted event contains the property `tapCount`, which contains the amount of
     * multi-taps being recognized.
     * @constructor
     * @extends Recognizer
     */
    function TapRecognizer() {
        Recognizer.apply(this, arguments);

        // previous time and center,
        // used for tap counting
        this.pTime = false;
        this.pCenter = false;

        this._timer = null;
        this._input = null;
        this.count = 0;
    }

    inherit(TapRecognizer, Recognizer, {
        /**
         * @namespace
         * @memberof PinchRecognizer
         */
        defaults: {
            event: 'tap',
            pointers: 1,
            taps: 1,
            interval: 300, // max time between the multi-tap taps
            time: 250, // max time of the pointer to be down (like finger on the screen)
            threshold: 2, // a minimal movement is ok, but keep it low
            posThreshold: 10 // a multi-tap can be a bit off the initial position
        },

        getTouchAction: function () {
            return [TOUCH_ACTION_MANIPULATION];
        },

        process: function (input) {
            var options = this.options;

            var validPointers = input.pointers.length === options.pointers;
            var validMovement = input.distance < options.threshold;
            var validTouchTime = input.deltaTime < options.time;

            this.reset();

            if ((input.eventType & INPUT_START) && (this.count === 0)) {
                return this.failTimeout();
            }

            // we only allow little movement
            // and we've reached an end event, so a tap is possible
            if (validMovement && validTouchTime && validPointers) {
                if (input.eventType != INPUT_END) {
                    return this.failTimeout();
                }

                var validInterval = this.pTime ? (input.timeStamp - this.pTime < options.interval) : true;
                var validMultiTap = !this.pCenter || getDistance(this.pCenter, input.center) < options.posThreshold;

                this.pTime = input.timeStamp;
                this.pCenter = input.center;

                if (!validMultiTap || !validInterval) {
                    this.count = 1;
                } else {
                    this.count += 1;
                }

                this._input = input;

                // if tap count matches we have recognized it,
                // else it has began recognizing...
                var tapCount = this.count % options.taps;
                if (tapCount === 0) {
                    // no failing requirements, immediately trigger the tap event
                    // or wait as long as the multitap interval to trigger
                    if (!this.hasRequireFailures()) {
                        return STATE_RECOGNIZED;
                    } else {
                        this._timer = setTimeoutContext(function () {
                            this.state = STATE_RECOGNIZED;
                            this.tryEmit();
                        }, options.interval, this);
                        return STATE_BEGAN;
                    }
                }
            }
            return STATE_FAILED;
        },

        failTimeout: function () {
            this._timer = setTimeoutContext(function () {
                this.state = STATE_FAILED;
            }, this.options.interval, this);
            return STATE_FAILED;
        },

        reset: function () {
            clearTimeout(this._timer);
        },

        emit: function () {
            if (this.state == STATE_RECOGNIZED) {
                this._input.tapCount = this.count;
                this.manager.emit(this.options.event, this._input);
            }
        }
    });

    /**
     * Simple way to create an manager with a default set of recognizers.
     * @param {HTMLElement} element
     * @param {Object} [options]
     * @constructor
     */
    function Hammer(element, options) {
        options = options || {};
        options.recognizers = ifUndefined(options.recognizers, Hammer.defaults.preset);
        return new Manager(element, options);
    }

    /**
     * @const {string}
     */
    Hammer.VERSION = '2.0.4';

    /**
     * default settings
     * @namespace
     */
    Hammer.defaults = {
        /**
         * set if DOM events are being triggered.
         * But this is slower and unused by simple implementations, so disabled by default.
         * @type {Boolean}
         * @default false
         */
        domEvents: false,

        /**
         * The value for the touchAction property/fallback.
         * When set to `compute` it will magically set the correct value based on the added recognizers.
         * @type {String}
         * @default compute
         */
        touchAction: TOUCH_ACTION_COMPUTE,

        /**
         * @type {Boolean}
         * @default true
         */
        enable: true,

        /**
         * EXPERIMENTAL FEATURE -- can be removed/changed
         * Change the parent input target element.
         * If Null, then it is being set the to main element.
         * @type {Null|EventTarget}
         * @default null
         */
        inputTarget: null,

        /**
         * force an input class
         * @type {Null|Function}
         * @default null
         */
        inputClass: null,

        /**
         * Default recognizer setup when calling `Hammer()`
         * When creating a new Manager these will be skipped.
         * @type {Array}
         */
        preset: [
            // RecognizerClass, options, [recognizeWith, ...], [requireFailure, ...]
            [RotateRecognizer, {enable: false}],
            [PinchRecognizer, {enable: false}, ['rotate']],
            [SwipeRecognizer, {direction: DIRECTION_HORIZONTAL}],
            [PanRecognizer, {direction: DIRECTION_HORIZONTAL}, ['swipe']],
            [TapRecognizer],
            [TapRecognizer, {event: 'doubletap', taps: 2}, ['tap']],
            [PressRecognizer]
        ],

        /**
         * Some CSS properties can be used to improve the working of Hammer.
         * Add them to this method and they will be set when creating a new Manager.
         * @namespace
         */
        cssProps: {
            /**
             * Disables text selection to improve the dragging gesture. Mainly for desktop browsers.
             * @type {String}
             * @default 'none'
             */
            userSelect: 'none',

            /**
             * Disable the Windows Phone grippers when pressing an element.
             * @type {String}
             * @default 'none'
             */
            touchSelect: 'none',

            /**
             * Disables the default callout shown when you touch and hold a touch target.
             * On iOS, when you touch and hold a touch target such as a link, Safari displays
             * a callout containing information about the link. This property allows you to disable that callout.
             * @type {String}
             * @default 'none'
             */
            touchCallout: 'none',

            /**
             * Specifies whether zooming is enabled. Used by IE10>
             * @type {String}
             * @default 'none'
             */
            contentZooming: 'none',

            /**
             * Specifies that an entire element should be draggable instead of its contents. Mainly for desktop browsers.
             * @type {String}
             * @default 'none'
             */
            userDrag: 'none',

            /**
             * Overrides the highlight color shown when the user taps a link or a JavaScript
             * clickable element in iOS. This property obeys the alpha value, if specified.
             * @type {String}
             * @default 'rgba(0,0,0,0)'
             */
            tapHighlightColor: 'rgba(0,0,0,0)'
        }
    };

    var STOP = 1;
    var FORCED_STOP = 2;

    /**
     * Manager
     * @param {HTMLElement} element
     * @param {Object} [options]
     * @constructor
     */
    function Manager(element, options) {
        options = options || {};

        this.options = merge(options, Hammer.defaults);
        this.options.inputTarget = this.options.inputTarget || element;

        this.handlers = {};
        this.session = {};
        this.recognizers = [];

        this.element = element;
        this.input = createInputInstance(this);
        this.touchAction = new TouchAction(this, this.options.touchAction);

        toggleCssProps(this, true);

        each(options.recognizers, function (item) {
            var recognizer = this.add(new (item[0])(item[1]));
            item[2] && recognizer.recognizeWith(item[2]);
            item[3] && recognizer.requireFailure(item[3]);
        }, this);
    }

    Manager.prototype = {
        /**
         * set options
         * @param {Object} options
         * @returns {Manager}
         */
        set: function (options) {
            extend(this.options, options);

            // Options that need a little more setup
            if (options.touchAction) {
                this.touchAction.update();
            }
            if (options.inputTarget) {
                // Clean up existing event listeners and reinitialize
                this.input.destroy();
                this.input.target = options.inputTarget;
                this.input.init();
            }
            return this;
        },

        /**
         * stop recognizing for this session.
         * This session will be discarded, when a new [input]start event is fired.
         * When forced, the recognizer cycle is stopped immediately.
         * @param {Boolean} [force]
         */
        stop: function (force) {
            this.session.stopped = force ? FORCED_STOP : STOP;
        },

        /**
         * run the recognizers!
         * called by the inputHandler function on every movement of the pointers (touches)
         * it walks through all the recognizers and tries to detect the gesture that is being made
         * @param {Object} inputData
         */
        recognize: function (inputData) {
            var session = this.session;
            if (session.stopped) {
                return;
            }

            // run the touch-action polyfill
            this.touchAction.preventDefaults(inputData);

            var recognizer;
            var recognizers = this.recognizers;

            // this holds the recognizer that is being recognized.
            // so the recognizer's state needs to be BEGAN, CHANGED, ENDED or RECOGNIZED
            // if no recognizer is detecting a thing, it is set to `null`
            var curRecognizer = session.curRecognizer;

            // reset when the last recognizer is recognized
            // or when we're in a new session
            if (!curRecognizer || (curRecognizer && curRecognizer.state & STATE_RECOGNIZED)) {
                curRecognizer = session.curRecognizer = null;
            }

            var i = 0;
            while (i < recognizers.length) {
                recognizer = recognizers[i];

                // find out if we are allowed try to recognize the input for this one.
                // 1.   allow if the session is NOT forced stopped (see the .stop() method)
                // 2.   allow if we still haven't recognized a gesture in this session, or the this recognizer is the one
                //      that is being recognized.
                // 3.   allow if the recognizer is allowed to run simultaneous with the current recognized recognizer.
                //      this can be setup with the `recognizeWith()` method on the recognizer.
                if (session.stopped !== FORCED_STOP && ( // 1
                    !curRecognizer || recognizer == curRecognizer || // 2
                    recognizer.canRecognizeWith(curRecognizer))) { // 3
                    recognizer.recognize(inputData);
                } else {
                    recognizer.reset();
                }

                // if the recognizer has been recognizing the input as a valid gesture, we want to store this one as the
                // current active recognizer. but only if we don't already have an active recognizer
                if (!curRecognizer && recognizer.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED)) {
                    curRecognizer = session.curRecognizer = recognizer;
                }
                i++;
            }
        },

        /**
         * get a recognizer by its event name.
         * @param {Recognizer|String} recognizer
         * @returns {Recognizer|Null}
         */
        get: function (recognizer) {
            if (recognizer instanceof Recognizer) {
                return recognizer;
            }

            var recognizers = this.recognizers;
            for (var i = 0; i < recognizers.length; i++) {
                if (recognizers[i].options.event == recognizer) {
                    return recognizers[i];
                }
            }
            return null;
        },

        /**
         * add a recognizer to the manager
         * existing recognizers with the same event name will be removed
         * @param {Recognizer} recognizer
         * @returns {Recognizer|Manager}
         */
        add: function (recognizer) {
            if (invokeArrayArg(recognizer, 'add', this)) {
                return this;
            }

            // remove existing
            var existing = this.get(recognizer.options.event);
            if (existing) {
                this.remove(existing);
            }

            this.recognizers.push(recognizer);
            recognizer.manager = this;

            this.touchAction.update();
            return recognizer;
        },

        /**
         * remove a recognizer by name or instance
         * @param {Recognizer|String} recognizer
         * @returns {Manager}
         */
        remove: function (recognizer) {
            if (invokeArrayArg(recognizer, 'remove', this)) {
                return this;
            }

            var recognizers = this.recognizers;
            recognizer = this.get(recognizer);
            recognizers.splice(inArray(recognizers, recognizer), 1);

            this.touchAction.update();
            return this;
        },

        /**
         * bind event
         * @param {String} events
         * @param {Function} handler
         * @returns {EventEmitter} this
         */
        on: function (events, handler) {
            var handlers = this.handlers;
            each(splitStr(events), function (event) {
                handlers[event] = handlers[event] || [];
                handlers[event].push(handler);
            });
            return this;
        },

        /**
         * unbind event, leave emit blank to remove all handlers
         * @param {String} events
         * @param {Function} [handler]
         * @returns {EventEmitter} this
         */
        off: function (events, handler) {
            var handlers = this.handlers;
            each(splitStr(events), function (event) {
                if (!handler) {
                    delete handlers[event];
                } else {
                    handlers[event].splice(inArray(handlers[event], handler), 1);
                }
            });
            return this;
        },

        /**
         * emit event to the listeners
         * @param {String} event
         * @param {Object} data
         */
        emit: function (event, data) {
            // we also want to trigger dom events
            if (this.options.domEvents) {
                triggerDomEvent(event, data);
            }

            // no handlers, so skip it all
            var handlers = this.handlers[event] && this.handlers[event].slice();
            if (!handlers || !handlers.length) {
                return;
            }

            data.type = event;
            data.preventDefault = function () {
                data.srcEvent.preventDefault();
            };

            var i = 0;
            while (i < handlers.length) {
                handlers[i](data);
                i++;
            }
        },

        /**
         * destroy the manager and unbinds all events
         * it doesn't unbind dom events, that is the user own responsibility
         */
        destroy: function () {
            this.element && toggleCssProps(this, false);

            this.handlers = {};
            this.session = {};
            this.input.destroy();
            this.element = null;
        }
    };

    /**
     * add/remove the css properties as defined in manager.options.cssProps
     * @param {Manager} manager
     * @param {Boolean} add
     */
    function toggleCssProps(manager, add) {
        var element = manager.element;
        each(manager.options.cssProps, function (value, name) {
            element.style[prefixed(element.style, name)] = add ? value : '';
        });
    }

    /**
     * trigger dom event
     * @param {String} event
     * @param {Object} data
     */
    function triggerDomEvent(event, data) {
        var gestureEvent = document.createEvent('Event');
        gestureEvent.initEvent(event, true, true);
        gestureEvent.gesture = data;
        data.target.dispatchEvent(gestureEvent);
    }

    extend(Hammer, {
        INPUT_START: INPUT_START,
        INPUT_MOVE: INPUT_MOVE,
        INPUT_END: INPUT_END,
        INPUT_CANCEL: INPUT_CANCEL,

        STATE_POSSIBLE: STATE_POSSIBLE,
        STATE_BEGAN: STATE_BEGAN,
        STATE_CHANGED: STATE_CHANGED,
        STATE_ENDED: STATE_ENDED,
        STATE_RECOGNIZED: STATE_RECOGNIZED,
        STATE_CANCELLED: STATE_CANCELLED,
        STATE_FAILED: STATE_FAILED,

        DIRECTION_NONE: DIRECTION_NONE,
        DIRECTION_LEFT: DIRECTION_LEFT,
        DIRECTION_RIGHT: DIRECTION_RIGHT,
        DIRECTION_UP: DIRECTION_UP,
        DIRECTION_DOWN: DIRECTION_DOWN,
        DIRECTION_HORIZONTAL: DIRECTION_HORIZONTAL,
        DIRECTION_VERTICAL: DIRECTION_VERTICAL,
        DIRECTION_ALL: DIRECTION_ALL,

        Manager: Manager,
        Input: Input,
        TouchAction: TouchAction,

        TouchInput: TouchInput,
        MouseInput: MouseInput,
        PointerEventInput: PointerEventInput,
        TouchMouseInput: TouchMouseInput,
        SingleTouchInput: SingleTouchInput,

        Recognizer: Recognizer,
        AttrRecognizer: AttrRecognizer,
        Tap: TapRecognizer,
        Pan: PanRecognizer,
        Swipe: SwipeRecognizer,
        Pinch: PinchRecognizer,
        Rotate: RotateRecognizer,
        Press: PressRecognizer,

        on: addEventListeners,
        off: removeEventListeners,
        each: each,
        merge: merge,
        extend: extend,
        inherit: inherit,
        bindFn: bindFn,
        prefixed: prefixed
    });

    if (typeof define == TYPE_FUNCTION && define.amd) {
        define(function () {
            return Hammer;
        });
    } else if (typeof module != 'undefined' && module.exports) {
        module.exports = Hammer;
    } else {
        window[exportName] = Hammer;
    }

})(window, document, 'Hammer');

// jquery.hammer.js
// This jQuery plugin is just a small wrapper around the Hammer() class.
// It also extends the Manager.emit method by triggering jQuery events.
// $(element).hammer(options).bind("pan", myPanHandler);
// The Hammer instance is stored at $element.data("hammer").
// https://github.com/hammerjs/jquery.hammer.js

(function ($, Hammer) {
    function hammerify(el, options) {
        var $el = $(el);
        if (!$el.data('hammer')) {
            $el.data('hammer', new Hammer($el[0], options));
        }
    }

    $.fn.hammer = function (options) {
        return this.each(function () {
            hammerify(this, options);
        });
    };

    // extend the emit method to also trigger jQuery events
    Hammer.Manager.prototype.emit = (function (originalEmit) {
        return function (type, data) {
            originalEmit.call(this, type, data);
            $(this.element).trigger({
                type: type,
                gesture: data
            });
        };
    })(Hammer.Manager.prototype.emit);
})($, Hammer);/**
 * Pinch zoom using jQuery
 * @version 0.0.2
 * @author Manuel Stofer <mst@rtp.ch>
 * @param el
 * @param options
 * @constructor
 */

var PinchZoom = function (el, options) {
        this.el = $(el);
        this.zoomFactor = 1;
        this.lastScale = 1;
        this.offset = {
            x: 0,
            y: 0
        };
        this.options = $.extend({}, this.defaults, options);
        this.setupMarkup();
        this.bindEvents();
        this.update();
        // default enable.
        this.enable();

    },
    sum = function (a, b) {
        return a + b;
    },
    isCloseTo = function (value, expected) {
        return value > expected - 0.01 && value < expected + 0.01;
    };

PinchZoom.prototype = {

    defaults: {
        tapZoomFactor: 2,
        zoomOutFactor: 1.3,
        animationDuration: 300,
        animationInterval: 5,
        maxZoom: 5,
        minZoom: 0.5,
        lockDragAxis: false,
        use2d: false,
        zoomStartEventName: 'pz_zoomstart',
        zoomEndEventName: 'pz_zoomend',
        dragStartEventName: 'pz_dragstart',
        dragEndEventName: 'pz_dragend',
        doubleTapEventName: 'pz_doubletap'
    },

    /**
     * Event handler for 'dragstart'
     * @param event
     */
    handleDragStart: function (event) {
        this.el.trigger(this.options.dragStartEventName);
        this.stopAnimation();
        this.lastDragPosition = false;
        this.hasInteraction = true;
        this.handleDrag(event);
    },

    /**
     * Event handler for 'drag'
     * @param event
     */
    handleDrag: function (event) {

        if (this.zoomFactor > 1.0) {
            var touch = this.getTouches(event)[0];
            this.drag(touch, this.lastDragPosition);
            this.offset = this.sanitizeOffset(this.offset);
            this.lastDragPosition = touch;
        }
    },

    handleDragEnd: function () {
        this.el.trigger(this.options.dragEndEventName);
        this.end();
    },

    /**
     * Event handler for 'zoomstart'
     * @param event
     */
    handleZoomStart: function (event) {
        this.el.trigger(this.options.zoomStartEventName);
        this.stopAnimation();
        this.lastScale = 1;
        this.nthZoom = 0;
        this.lastZoomCenter = false;
        this.hasInteraction = true;
    },

    /**
     * Event handler for 'zoom'
     * @param event
     */
    handleZoom: function (event, newScale) {

        // a relative scale factor is used
        var touchCenter = this.getTouchCenter(this.getTouches(event)),
            scale = newScale / this.lastScale;
        this.lastScale = newScale;

        // the first touch events are thrown away since they are not precise
        this.nthZoom += 1;
        if (this.nthZoom > 3) {

            this.scale(scale, touchCenter);
            this.drag(touchCenter, this.lastZoomCenter);
        }
        this.lastZoomCenter = touchCenter;
    },

    handleZoomEnd: function () {
        this.el.trigger(this.options.zoomEndEventName);
        this.end();
    },

    /**
     * Event handler for 'doubletap'
     * @param event
     */
    handleDoubleTap: function (event) {
        var center = this.getTouches(event)[0],
            zoomFactor = this.zoomFactor > 1 ? 1 : this.options.tapZoomFactor,
            startZoomFactor = this.zoomFactor,
            updateProgress = (function (progress) {
                this.scaleTo(startZoomFactor + progress * (zoomFactor - startZoomFactor), center);
            }).bind(this);

        if (this.hasInteraction) {
            return;
        }
        if (startZoomFactor > zoomFactor) {
            center = this.getCurrentZoomCenter();
        }

        this.animate(this.options.animationDuration, this.options.animationInterval, updateProgress, this.swing);
        this.el.trigger(this.options.doubleTapEventName);
    },

    /**
     * Max / min values for the offset
     * @param offset
     * @return {Object} the sanitized offset
     */
    sanitizeOffset: function (offset) {
        var maxX = (this.zoomFactor - 1) * this.getContainerX(),
            maxY = (this.zoomFactor - 1) * this.getContainerY(),
            maxOffsetX = Math.max(maxX, 0),
            maxOffsetY = Math.max(maxY, 0),
            minOffsetX = Math.min(maxX, 0),
            minOffsetY = Math.min(maxY, 0);

        return {
            x: Math.min(Math.max(offset.x, minOffsetX), maxOffsetX),
            y: Math.min(Math.max(offset.y, minOffsetY), maxOffsetY)
        };
    },

    /**
     * Scale to a specific zoom factor (not relative)
     * @param zoomFactor
     * @param center
     */
    scaleTo: function (zoomFactor, center) {
        this.scale(zoomFactor / this.zoomFactor, center);
    },

    /**
     * Scales the element from specified center
     * @param scale
     * @param center
     */
    scale: function (scale, center) {
        scale = this.scaleZoomFactor(scale);
        this.addOffset({
            x: (scale - 1) * (center.x + this.offset.x),
            y: (scale - 1) * (center.y + this.offset.y)
        });
    },

    /**
     * Scales the zoom factor relative to current state
     * @param scale
     * @return the actual scale (can differ because of max min zoom factor)
     */
    scaleZoomFactor: function (scale) {
        var originalZoomFactor = this.zoomFactor;
        this.zoomFactor *= scale;
        this.zoomFactor = Math.min(this.options.maxZoom, Math.max(this.zoomFactor, this.options.minZoom));
        return this.zoomFactor / originalZoomFactor;
    },

    /**
     * Drags the element
     * @param center
     * @param lastCenter
     */
    drag: function (center, lastCenter) {
        if (lastCenter) {
            if (this.options.lockDragAxis) {
                // lock scroll to position that was changed the most
                if (Math.abs(center.x - lastCenter.x) > Math.abs(center.y - lastCenter.y)) {
                    this.addOffset({
                        x: -(center.x - lastCenter.x),
                        y: 0
                    });
                }
                else {
                    this.addOffset({
                        y: -(center.y - lastCenter.y),
                        x: 0
                    });
                }
            }
            else {
                this.addOffset({
                    y: -(center.y - lastCenter.y),
                    x: -(center.x - lastCenter.x)
                });
            }
        }
    },

    /**
     * Calculates the touch center of multiple touches
     * @param touches
     * @return {Object}
     */
    getTouchCenter: function (touches) {
        return this.getVectorAvg(touches);
    },

    /**
     * Calculates the average of multiple vectors (x, y values)
     */
    getVectorAvg: function (vectors) {
        return {
            x: vectors.map(function (v) {
                return v.x;
            }).reduce(sum) / vectors.length,
            y: vectors.map(function (v) {
                return v.y;
            }).reduce(sum) / vectors.length
        };
    },

    /**
     * Adds an offset
     * @param offset the offset to add
     * @return return true when the offset change was accepted
     */
    addOffset: function (offset) {
        this.offset = {
            x: this.offset.x + offset.x,
            y: this.offset.y + offset.y
        };
    },

    sanitize: function () {
        if (this.zoomFactor < this.options.zoomOutFactor) {
            this.zoomOutAnimation();
        } else if (this.isInsaneOffset(this.offset)) {
            this.sanitizeOffsetAnimation();
        }
    },

    /**
     * Checks if the offset is ok with the current zoom factor
     * @param offset
     * @return {Boolean}
     */
    isInsaneOffset: function (offset) {
        var sanitizedOffset = this.sanitizeOffset(offset);
        return sanitizedOffset.x !== offset.x ||
            sanitizedOffset.y !== offset.y;
    },

    /**
     * Creates an animation moving to a sane offset
     */
    sanitizeOffsetAnimation: function () {
        var targetOffset = this.sanitizeOffset(this.offset),
            startOffset = {
                x: this.offset.x,
                y: this.offset.y
            },
            updateProgress = (function (progress) {
                this.offset.x = startOffset.x + progress * (targetOffset.x - startOffset.x);
                this.offset.y = startOffset.y + progress * (targetOffset.y - startOffset.y);
                this.update();
            }).bind(this);

        this.animate(
            this.options.animationDuration,
            this.options.animationInterval,
            updateProgress,
            this.swing
        );
    },

    /**
     * Zooms back to the original position,
     * (no offset and zoom factor 1)
     */
    zoomOutAnimation: function () {
        var startZoomFactor = this.zoomFactor,
            zoomFactor = 1,
            center = this.getCurrentZoomCenter(),
            updateProgress = (function (progress) {
                this.scaleTo(startZoomFactor + progress * (zoomFactor - startZoomFactor), center);
            }).bind(this);

        this.animate(
            this.options.animationDuration,
            this.options.animationInterval,
            updateProgress,
            this.swing
        );
    },

    /**
     * Updates the aspect ratio
     */
    updateAspectRatio: function () {
        // this.setContainerY(this.getContainerX() / this.getAspectRatio());
        // @modified
        this.setContainerY()
    },

    /**
     * Calculates the initial zoom factor (for the element to fit into the container)
     * @return the initial zoom factor
     */
    getInitialZoomFactor: function () {
        // use .offsetWidth instead of width()
        // because jQuery-width() return the original width but Zepto-width() will calculate width with transform.
        // the same as .height()
        return this.container[0].offsetWidth / this.el[0].offsetWidth;
    },

    /**
     * Calculates the aspect ratio of the element
     * @return the aspect ratio
     */
    getAspectRatio: function () {
        return this.el[0].offsetWidth / this.el[0].offsetHeight;
    },

    /**
     * Calculates the virtual zoom center for the current offset and zoom factor
     * (used for reverse zoom)
     * @return {Object} the current zoom center
     */
    getCurrentZoomCenter: function () {

        // uses following formula to calculate the zoom center x value
        // offset_left / offset_right = zoomcenter_x / (container_x - zoomcenter_x)
        var length = this.container[0].offsetWidth * this.zoomFactor,
            offsetLeft = this.offset.x,
            offsetRight = length - offsetLeft - this.container[0].offsetWidth,
            widthOffsetRatio = offsetLeft / offsetRight,
            centerX = widthOffsetRatio * this.container[0].offsetWidth / (widthOffsetRatio + 1),

        // the same for the zoomcenter y
            height = this.container[0].offsetHeight * this.zoomFactor,
            offsetTop = this.offset.y,
            offsetBottom = height - offsetTop - this.container[0].offsetHeight,
            heightOffsetRatio = offsetTop / offsetBottom,
            centerY = heightOffsetRatio * this.container[0].offsetHeight / (heightOffsetRatio + 1);

        // prevents division by zero
        if (offsetRight === 0) {
            centerX = this.container[0].offsetWidth;
        }
        if (offsetBottom === 0) {
            centerY = this.container[0].offsetHeight;
        }

        return {
            x: centerX,
            y: centerY
        };
    },

    canDrag: function () {
        return !isCloseTo(this.zoomFactor, 1);
    },

    /**
     * Returns the touches of an event relative to the container offset
     * @param event
     * @return array touches
     */
    getTouches: function (event) {
        var position = this.container.offset();
        return Array.prototype.slice.call(event.touches).map(function (touch) {
            return {
                x: touch.pageX - position.left,
                y: touch.pageY - position.top
            };
        });
    },

    /**
     * Animation loop
     * does not support simultaneous animations
     * @param duration
     * @param interval
     * @param framefn
     * @param timefn
     * @param callback
     */
    animate: function (duration, interval, framefn, timefn, callback) {
        var startTime = new Date().getTime(),
            renderFrame = (function () {
                if (!this.inAnimation) {
                    return;
                }
                var frameTime = new Date().getTime() - startTime,
                    progress = frameTime / duration;
                if (frameTime >= duration) {
                    framefn(1);
                    if (callback) {
                        callback();
                    }
                    this.update();
                    this.stopAnimation();
                    this.update();
                } else {
                    if (timefn) {
                        progress = timefn(progress);
                    }
                    framefn(progress);
                    this.update();
                    setTimeout(renderFrame, interval);
                }
            }).bind(this);
        this.inAnimation = true;
        renderFrame();
    },

    /**
     * Stops the animation
     */
    stopAnimation: function () {
        this.inAnimation = false;
    },

    /**
     * Swing timing function for animations
     * @param p
     * @return {Number}
     */
    swing: function (p) {
        return -Math.cos(p * Math.PI) / 2 + 0.5;
    },

    getContainerX: function () {
        // return this.container[0].offsetWidth;
        // @modified
        return window.innerWidth
    },

    getContainerY: function () {
        // return this.container[0].offsetHeight;
        // @modified
        return window.innerHeight
    },

    setContainerY: function (y) {
        // return this.container.height(y);
        // @modified
        var t = window.innerHeight;
        return this.el.css({height: t}), this.container.height(t);
    },

    /**
     * Creates the expected html structure
     */
    setupMarkup: function () {
        this.container = $('<div class="pinch-zoom-container"></div>');
        this.el.before(this.container);
        this.container.append(this.el);

        this.container.css({
            'overflow': 'hidden',
            'position': 'relative'
        });

        // Zepto doesn't recognize `webkitTransform..` style
        this.el.css({
            '-webkit-transform-origin': '0% 0%',
            '-moz-transform-origin': '0% 0%',
            '-ms-transform-origin': '0% 0%',
            '-o-transform-origin': '0% 0%',
            'transform-origin': '0% 0%',
            'position': 'absolute'
        });
    },

    end: function () {
        this.hasInteraction = false;
        this.sanitize();
        this.update();
    },

    /**
     * Binds all required event listeners
     */
    bindEvents: function () {
        detectGestures(this.container.get(0), this);
        // Zepto and jQuery both know about `on`
        $(window).on('resize', this.update.bind(this));
        $(this.el).find('img').on('load', this.update.bind(this));
    },

    /**
     * Updates the css values according to the current zoom factor and offset
     */
    update: function () {

        if (this.updatePlaned) {
            return;
        }
        this.updatePlaned = true;

        setTimeout((function () {
            this.updatePlaned = false;
            this.updateAspectRatio();

            var zoomFactor = this.getInitialZoomFactor() * this.zoomFactor,
                offsetX = -this.offset.x / zoomFactor,
                offsetY = -this.offset.y / zoomFactor,
                transform3d = 'scale3d(' + zoomFactor + ', ' + zoomFactor + ',1) ' +
                    'translate3d(' + offsetX + 'px,' + offsetY + 'px,0px)',
                transform2d = 'scale(' + zoomFactor + ', ' + zoomFactor + ') ' +
                    'translate(' + offsetX + 'px,' + offsetY + 'px)',
                removeClone = (function () {
                    if (this.clone) {
                        this.clone.remove();
                        delete this.clone;
                    }
                }).bind(this);

            // Scale 3d and translate3d are faster (at least on ios)
            // but they also reduce the quality.
            // PinchZoom uses the 3d transformations during interactions
            // after interactions it falls back to 2d transformations
            if (!this.options.use2d || this.hasInteraction || this.inAnimation) {
                this.is3d = true;
                removeClone();
                this.el.css({
                    '-webkit-transform': transform3d,
                    '-o-transform': transform2d,
                    '-ms-transform': transform2d,
                    '-moz-transform': transform2d,
                    'transform': transform3d
                });
            } else {

                // When changing from 3d to 2d transform webkit has some glitches.
                // To avoid this, a copy of the 3d transformed element is displayed in the
                // foreground while the element is converted from 3d to 2d transform
                if (this.is3d) {
                    this.clone = this.el.clone();
                    this.clone.css('pointer-events', 'none');
                    this.clone.appendTo(this.container);
                    setTimeout(removeClone, 200);
                }
                this.el.css({
                    '-webkit-transform': transform2d,
                    '-o-transform': transform2d,
                    '-ms-transform': transform2d,
                    '-moz-transform': transform2d,
                    'transform': transform2d
                });
                this.is3d = false;
            }
        }).bind(this), 0);
    },

    /**
     * Enables event handling for gestures
     */
    enable: function () {
        this.enabled = true;
    },

    /**
     * Disables event handling for gestures
     */
    disable: function () {
        this.enabled = false;
    }
};

var detectGestures = function (el, target) {
    var interaction = null,
        fingers = 0,
        lastTouchStart = null,
        startTouches = null,

        setInteraction = function (newInteraction, event) {
            if (interaction !== newInteraction) {

                if (interaction && !newInteraction) {
                    switch (interaction) {
                        case "zoom":
                            target.handleZoomEnd(event);
                            break;
                        case 'drag':
                            target.handleDragEnd(event);
                            break;
                    }
                }

                switch (newInteraction) {
                    case 'zoom':
                        target.handleZoomStart(event);
                        break;
                    case 'drag':
                        target.handleDragStart(event);
                        break;
                }
            }
            interaction = newInteraction;
        },

        updateInteraction = function (event) {
            if (fingers === 2) {
                setInteraction('zoom');
            } else if (fingers === 1 && target.canDrag()) {
                setInteraction('drag', event);
            } else {
                setInteraction(null, event);
            }
        },

        targetTouches = function (touches) {
            return Array.prototype.slice.call(touches).map(function (touch) {
                return {
                    x: touch.pageX,
                    y: touch.pageY
                };
            });
        },

        getDistance = function (a, b) {
            var x, y;
            x = a.x - b.x;
            y = a.y - b.y;
            return Math.sqrt(x * x + y * y);
        },

        calculateScale = function (startTouches, endTouches) {
            var startDistance = getDistance(startTouches[0], startTouches[1]),
                endDistance = getDistance(endTouches[0], endTouches[1]);
            return endDistance / startDistance;
        },

        cancelEvent = function (event) {
            event.stopPropagation();
            event.preventDefault();
        },

        detectDoubleTap = function (event) {
            var time = (new Date()).getTime();

            if (fingers > 1) {
                lastTouchStart = null;
            }

            if (time - lastTouchStart < 300) {
                cancelEvent(event);

                target.handleDoubleTap(event);
                switch (interaction) {
                    case "zoom":
                        target.handleZoomEnd(event);
                        break;
                    case 'drag':
                        target.handleDragEnd(event);
                        break;
                }
            }

            if (fingers === 1) {
                lastTouchStart = time;
            }
        },
        firstMove = true;

    el.addEventListener('touchstart', function (event) {
        if (target.enabled) {
            firstMove = true;
            fingers = event.touches.length;
            detectDoubleTap(event);
        }
    });

    el.addEventListener('touchmove', function (event) {
        if (target.enabled) {
            if (firstMove) {
                updateInteraction(event);
                if (interaction) {
                    cancelEvent(event);
                }
                startTouches = targetTouches(event.touches);
            } else {
                switch (interaction) {
                    case 'zoom':
                        target.handleZoom(event, calculateScale(startTouches, targetTouches(event.touches)));
                        break;
                    case 'drag':
                        target.handleDrag(event);
                        break;
                }
                if (interaction) {
                    cancelEvent(event);
                    target.update();
                }
            }

            firstMove = false;
        }
    });

    el.addEventListener('touchend', function (event) {
        if (target.enabled) {
            fingers = event.touches.length;
            updateInteraction(event);
        }
    });
};

// ui基础js

var UI = UI || {};

;
(function ($, UI) {

    UI.support = {};

    UI.support.transition = (function () {
        var transitionEnd = (function () {
            // https://developer.mozilla.org/en-US/docs/Web/Events/transitionend#Browser_compatibility
            var element = window.document.body || window.document.documentElement;
            var transEndEventNames = {
                WebkitTransition: 'webkitTransitionEnd',
                MozTransition: 'transitionend',
                OTransition: 'oTransitionEnd otransitionend',
                transition: 'transitionend'
            };
            var name;

            for (name in transEndEventNames) {
                if (element.style[name] !== undefined) {
                    return transEndEventNames[name];
                }
            }
        })();

        return transitionEnd && {end: transitionEnd};
    })();

    UI.support.animation = (function () {
        var animationEnd = (function () {
            var element = window.document.body || window.document.documentElement;
            var animEndEventNames = {
                WebkitAnimation: 'webkitAnimationEnd',
                MozAnimation: 'animationend',
                OAnimation: 'oAnimationEnd oanimationend',
                animation: 'animationend'
            };
            var name;

            for (name in animEndEventNames) {
                if (element.style[name] !== undefined) {
                    return animEndEventNames[name];
                }
            }
        })();

        return animationEnd && {end: animationEnd};
    })();

    UI.support.requestAnimationFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };

    UI.support.touch = (
    ('ontouchstart' in window &&
    navigator.userAgent.toLowerCase().match(/mobile|tablet/)) ||
    (window.DocumentTouch && document instanceof window.DocumentTouch) ||
    (window.navigator['msPointerEnabled'] &&
    window.navigator['msMaxTouchPoints'] > 0) || //IE 10
    (window.navigator['pointerEnabled'] &&
    window.navigator['maxTouchPoints'] > 0) || //IE >=11
    false);

    // https://developer.mozilla.org/zh-CN/docs/DOM/MutationObserver
    UI.support.mutationobserver = (window.MutationObserver ||
    window.WebKitMutationObserver || window.MozMutationObserver || null);

    UI.utils = {};

    UI.utils.debounce = function (func, wait, immediate) {
        var timeout;
        return function () {
            var context = this;
            var args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) {
                    func.apply(context, args);
                }
            };
            var callNow = immediate && !timeout;

            clearTimeout(timeout);
            timeout = setTimeout(later, wait);

            if (callNow) {
                func.apply(context, args);
            }
        };
    };

    UI.utils.isInView = function (element, options) {
        var $element = $(element);
        var visible = !!($element.width() || $element.height()) &&
            $element.css('display') !== 'none';

        if (!visible) {
            return false;
        }

        var windowLeft = $win.scrollLeft();
        var windowTop = $win.scrollTop();
        var offset = $element.offset();
        var left = offset.left;
        var top = offset.top;

        options = $.extend({topOffset: 0, leftOffset: 0}, options);

        return (top + $element.height() >= windowTop &&
        top - options.topOffset <= windowTop + $win.height() &&
        left + $element.width() >= windowLeft &&
        left - options.leftOffset <= windowLeft + $win.width());
    };

    UI.utils.generateGUID = function (namespace) {
        var uid = namespace + '-' || 'cc-';
        do {
            uid += Math.random().toString(36).substring(2, 7);
        } while (document.getElementById(uid));

        return uid;
    };

    UI.utils.options = function (string) {
        if ($.isPlainObject(string)) {
            return string;
        }

        var start = (string ? string.indexOf('{') : -1);
        var options = {};

        if (start != -1) {
            try {
                options = (new Function('',
                    'var json = ' + string.substr(start) +
                    '; return JSON.parse(JSON.stringify(json));'))();
            } catch (e) {
            }
        }

        return options;
    };

    $.support.transition = UI.support.transition;
    $.debounce = UI.utils.debounce;

    // http://blog.alexmaccaw.com/css-transitions
    $.fn.emulateTransitionEnd = function (duration) {
        var called = false;
        var $el = this;

        $(this).one(UI.support.transition.end, function () {
            called = true;
        });

        var callback = function () {
            if (!called) {
                $($el).trigger(UI.support.transition.end);
            }
            $el.transitionEndTimmer = undefined;
        };
        this.transitionEndTimmer = setTimeout(callback, duration);
        return this;
    };

    $.fn.redraw = function () {
        $(this).each(function () {
            var redraw = this.offsetHeight;
        });
        return this;
    };

    $.fn.transitionEnd = function (callback) {
        var endEvent = UI.support.transition.end;
        var dom = this;

        function fireCallBack(e) {
            callback.call(this, e);
            endEvent && dom.off(endEvent, fireCallBack);
        }

        if (callback && endEvent) {
            dom.on(endEvent, fireCallBack);
        }

        return this;
    };

    // handle multiple browsers for requestAnimationFrame()
    // http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
    // https://github.com/gnarf/jquery-requestAnimationFrame
    UI.utils.rAF = (function () {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
                // if all else fails, use setTimeout
            function (callback) {
                return window.setTimeout(callback, 1000 / 60); // shoot for 60 fps
            };
    })();

    // handle multiple browsers for cancelAnimationFrame()
    UI.utils.cancelAF = (function () {
        return window.cancelAnimationFrame ||
            window.webkitCancelAnimationFrame ||
            window.mozCancelAnimationFrame ||
            window.oCancelAnimationFrame ||
            function (id) {
                window.clearTimeout(id);
            };
    })();

    // via http://davidwalsh.name/detect-scrollbar-width
    UI.utils.measureScrollbar = function () {
        if (document.body.clientWidth >= window.innerWidth) {
            return 0;
        }

        // if ($html.width() >= window.innerWidth) return;
        // var scrollbarWidth = window.innerWidth - $html.width();
        var $measure = $('<div ' +
            'style="width: 100px;height: 100px;overflow: scroll;' +
            'position: absolute;top: -9999px;"></div>');

        $(document.body).append($measure);

        var scrollbarWidth = $measure[0].offsetWidth - $measure[0].clientWidth;

        $measure.remove();

        return scrollbarWidth;
    };

    UI.utils.imageLoader = function ($image, callback) {
        function loaded() {
            callback($image[0]);
        }

        function bindLoad() {
            this.one('load', loaded);
            if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) {
                var src = this.attr('src'),
                    param = src.match(/\?/) ? '&' : '?';

                param += 'random=' + (new Date()).getTime();
                this.attr('src', src + param);
            }
        }

        if (!$image.attr('src')) {
            loaded();
            return;
        }
        if ($image[0].complete || $image[0].readyState === 4) {
            loaded();
        } else {
            bindLoad.call($image);
        }
    };

    // 模板解析
    $.parseTpl = function (str, data) {
        var tmpl = 'var __p=[];' + 'with(obj||{}){__p.push(\'' +
                str.replace(/\\/g, '\\\\')
                    .replace(/'/g, '\\\'')
                    .replace(/<%=([\s\S]+?)%>/g, function (match, code) {
                        return '\',' + code.replace(/\\'/, '\'') + ',\'';
                    })
                    .replace(/<%([\s\S]+?)%>/g, function (match, code) {
                        return '\');' + code.replace(/\\'/, '\'')
                                .replace(/[\r\n\t]/g, ' ') + '__p.push(\'';
                    })
                    .replace(/\r/g, '\\r')
                    .replace(/\n/g, '\\n')
                    .replace(/\t/g, '\\t') +
                '\');}return __p.join("");',

            func = new Function('obj', tmpl);
        return data ? func(data) : func;
    };


    $.UI = UI;

})(jQuery, UI);// 抽屉菜单插件

// <div class="cc-panel">
// 	<div class="cc-panel-content">		
// 		<a href="#" data-panel="close">close</a>			
// 	</div>
// </div> 

;
(function ($) {

    "use strict";

    var $win = $(window);
    var $doc = $(document);

    //记录滚动条位置
    var scrollPos;

    // Constructor
    function Panel($element, settings) {
        this.settings = $.extend({},
            Panel.DEFAULTS, settings || {});
        this.$element = $element;
        this.active = null;
        this.events();
        return this;
    }

    // 初始值
    Panel.DEFAULTS = {
        duration: 300,
        effect: 'overlay', //push||overlay
        target: null,
        width: null
    };

    Panel.prototype = {

        open: function () {
            var $element = this.$element;
            if (!$element.length || $element.hasClass('cc-active')) {
                return;
            }
            var effect = this.settings.effect;
            var $html = $('html');
            var $body = $('body');
            var $bar = $element.find('.cc-panel-content').first();

            // 设置宽度
            if (this.settings.width) {
                typeof this.settings.width == 'number' ? $bar.width(this.settings.width + 'px') : $bar.width(this.settings.width);
            }

            // 展出方向 左|右
            var dir = $bar.hasClass('cc-panel-flip') ? -1 : 1;
            $bar.addClass('cc-panel-' + effect);
            scrollPos = {
                x: window.scrollX,
                y: window.scrollY
            };
            $element.addClass('cc-active');
            $body.css({
                width: window.innerWidth,
                height: $win.height()
            }).addClass('cc-panel-page');
            if (effect !== 'overlay') {
                $body.css({
                    'margin-left': $bar.outerWidth() * dir
                }).width();
            }
            $html.css('margin-top', scrollPos.y * -1);
            setTimeout(function () {
                    $bar.addClass('cc-active').width();
                },
                0);
            $element.trigger('open.panel');
            this.active = true;
            $element.off('click.panel').on('click.panel', $.proxy(function (e) {
                    var $target = $(e.target);
                    if (!e.type.match(/swipe/)) {
                        if ($target.hasClass('cc-panel-content')) {
                            return;
                        }
                        if ($target.parents('.cc-panel-content').first().length) {
                            return;
                        }
                    }
                    e.stopImmediatePropagation();
                    this.close();
                },
                this));

            // esc键取消
            // $html.on('keydown.panel', $.proxy(function(e) {
            // 	if (e.keyCode === 27) {
            // 		this.close();
            // 	}
            // },
            // this));
        },

        // 关闭方法 || 快速关闭
        close: function (force) {
            var me = this;
            var $html = $('html');
            var $body = $('body');
            var $element = this.$element;
            var $bar = $element.find('.cc-panel-content').first();
            if (!$element.length || !$element.hasClass('cc-active')) {
                return;
            }
            $element.trigger('close.panel');
            function complete() {
                $body.removeClass('cc-panel-page').css({
                    width: '',
                    height: '',
                    'margin-left': '',
                    'margin-right': ''
                });
                $element.removeClass('cc-active');
                $bar.removeClass('cc-active');
                $html.css('margin-top', '');
                window.scrollTo(scrollPos.x, scrollPos.y);
                $element.trigger('closed.panel');
                me.active = false;
            }

            // 关闭时的动画效果	需要 $.fn.transition插件
            // transition helper depend http://getbootstrap.com/javascript/#transitions
            if (!force && $.support.transition) {
                setTimeout(function () {
                        $bar.removeClass('cc-active');
                    },
                    0);
                $body.css('margin-left', '').one($.support.transition.end,
                    function () {
                        complete();
                    }).emulateTransitionEnd(this.settings.duration);
            } else {
                complete();
            }
            $element.off('click.panel');
            $html.off('.panel');
        },

        events: function () {

            // 关闭所有
            $doc.on('click.panel', '[data-panel="closeAll"]', $.proxy(function (e) {
                e.preventDefault();
                this.close();
            }, this));

            // 关闭当前的弹框，只限于放在打开的panel中
            $doc.on('click.panel', '[data-panel="close"]', function (e) {
                e.preventDefault();
                var _this = $(this);
                var closestPanel = _this.closest('.cc-panel');
                closestPanel.length && closestPanel.panel('close');
            });

            // resize 时关闭
            // $win.on('resize.panel orientationchange.panel', $.proxy(function(e) {
            // 	this.active && this.close();
            // },
            // this));
        },

        toggle: function () {
            this.active ? this.close() : this.open();
        }
    }

    //  插件
    function Plugin(option) {
        return this.each(function () {
            // debugger;
            var $this = $(this);
            var data = $this.data('panel');
            var options = $.extend({}, Panel.DEFAULTS,
                typeof option == 'object' && option);

            if (!data) {
                $this.data('panel', (data = new Panel($this, options)));
            }

            if (typeof option == 'string') {
                data[option] && data[option]();
            }
            else {
                data.toggle();
            }
        });
    }

    $.fn.panel = Plugin;

    // 自动绑定

    $doc.on('click.panel', '[data-role="panel"]', function (e) {
        e.preventDefault();
        var $this = $(this);
        var options = UI.utils.options($this.data('options'));
        var $target = $(options.target ||
            (this.href && this.href.replace(/.*(?=#[^\s]+$)/, '')) || $this.data('target'));
        if (!$target.length) return;
        var option = $target.data('panel') ? 'open' : options;

        Plugin.call($target, option, this);

    });

})(jQuery);
// button组件，可用于模拟checkbox, radio 

;
(function ($) {

    // Constructor
    var Button = function (element, options) {
        this.$element = $(element);
        this.options = $.extend({}, Button.DEFAULTS, options);
        this.isloading = false;
        this.init();
    }

    Button.DEFAULTS = {
        loadingText: 'loading...',
        type: null,
        className: {
            loading: 'ui-btn-loading',
            disabled: 'disabled',
            active: 'ui-active',
            parent: 'ui-btn-group'
        }
    }

    Button.prototype = {

        init: function () {

        },

        // state = loading || reset
        setState: function (state) {
            var disabled = 'disabled',
                options = this.options,
                $element = this.$element,
                val = $element.is('input') ? 'val' : 'html',
                loadingClassName = options.className.disabled + ' ' + options.className.loading;
            state = state + 'Text';

            if (!options.resetText) {
                options.resetText = $element[val]();
            }

            $element[val](options[state]);

            setTimeout($.proxy(function () {
                if (state == 'loadingText') {
                    $element.addClass(loadingClassName).attr(disabled, disabled);
                    this.isloading = true;
                }
                else if (this.isloading) {
                    $element.removeClass(loadingClassName).removeAttr(disabled);
                    this.isLoading = false;
                }
            }, this), 0);
        },

        toggle: function () {
            var changed = true;
            $element = this.$element,
                $parent = this.$element.parent('.' + this.options.className.parent),
                activeClassName = this.options.className.active;

            if ($parent.length) {
                var $input = this.$element.find('input');
                if ($input.prop('disabled') == true) {
                    $element.addClass(this.options.className.disabled);
                    return;
                }
                if ($input.prop('type') == 'radio') {
                    if ($input.prop('checked') && $element.hasClass(activeClassName)) {
                        changed = false;
                    } else {
                        $parent.find('.' + activeClassName).removeClass(activeClassName);
                    }
                }
                if (changed) {
                    $input.prop('checked', !$element.hasClass(activeClassName)).trigger('change');
                }
            }

            if (changed) {
                $element.toggleClass(activeClassName);
                if (!$element.hasClass(activeClassName)) {
                    $element.blur();
                }
            }
        }

    }

    //插件
    $.fn.button = function (option) {
        return this.each(function () {

            var $this = $(this);
            var data = $this.data('ui.button');
            var options = typeof option == 'object' && {};

            if (!data) {
                $this.data('ui.button', (data = new Button(this, options)));
            }

            if (option == 'toggle') {
                data.toggle();
            }
            else if (typeof option == 'string') {
                data.setState(option);
            }
        });
    }

    // 自动绑定
    $(document).on('click.button', '[data-role="button"]', function (e) {
        var $btn = $(this);
        $btn.button('toggle');
        e.preventDefault();
    });

})(jQuery);// 选项卡插件

// <div class="ui-tabs">
// <ul class="ui-tabs-nav">
// 	<li><a href="#">tab1</a></li>
// 	<li><a href="#">tab2</a></li>
// 	<li><a href="#">tab3</a></li>
// </ul>
// <div class="ui-tabs-content">
// 	<div class="ui-tabs-panel ui-active" id="tab1">
// 	</div>
// 	<div class="ui-tabs-panel" id="tab2">
// 	</div>
// 	<div class="ui-tabs-panel" id="tab3">
// 	</div>
// </div>
// </div> 

;
(function ($) {

    "use strict";

    function Tabs(element, options) {

        this.$element = $(element);
        this.options = $.extend({}, Tabs.DEFAULTS, options || {});

        this.$tabNav = this.$element.find(this.options.selector.nav);
        this.$navs = this.$tabNav.find('a');

        this.$content = this.$element.find(this.options.selector.content);
        this.$tabPanels = this.$content.find(this.options.selector.panel);

        this.transitioning = false;

        this.init();
    };

    Tabs.DEFAULTS = {
        selector: {
            nav: '.cc-tabs-nav',
            content: '.cc-tabs-content',
            panel: '.cc-tabs-panel'
        },
        className: {
            active: 'cc-active'
        },
        swipe: true
    };

    Tabs.prototype = {

        init: function () {

            var me = this;
            var options = this.options;

            // Activate the first Tab when no active Tab or multiple active Tabs
            if (this.$tabNav.find('> .cc-active').length !== 1) {
                var $tabNav = this.$tabNav;
                this.activate($tabNav.children('li').first(), $tabNav);
                this.activate(this.$tabPanels.first(), this.$content);
            }

            this.$navs.on('click.tabs.ui', function (e) {
                e.preventDefault();
                me.open($(this));
            });

            if (options.swipe) {
                var hammer = new Hammer(this.$content[0]);
                hammer.get('pan').set({
                    direction: Hammer.DIRECTION_HORIZONTAL,
                    threshold: 100
                });
                hammer.on('swipeleft', $.debounce(function (e) {
                    e.preventDefault();
                    var $target = $(e.target);
                    if (!$target.is(options.selector.panel)) {
                        $target = $target.closest(options.selector.panel)
                    }
                    $target.focus();
                    var $nav = me.getNextNav($target);
                    $nav && me.open($nav)
                }, 100));
                hammer.on('swiperight', $.debounce(function (e) {
                    e.preventDefault();
                    var $target = $(e.target);
                    if (!$target.is(options.selector.panel)) {
                        $target = $target.closest(options.selector.panel)
                    }
                    var $nav = me.getPrevNav($target);
                    $nav && me.open($nav)
                }, 100))
            }
        },

        open: function ($nav) {

            if (!$nav || this.transitioning || $nav.parent('li').hasClass('cc-active')) {
                return;
            }
            var $tabNav = this.$tabNav;
            var $navs = this.$navs;
            var $tabContent = this.$content;
            var href = $nav.attr('href');
            var regexHash = /^#.+$/;
            var $target = regexHash.test(href) && this.$content.find(href) ||
                this.$tabPanels.eq($navs.index($nav));
            var previous = $tabNav.find('.cc-active a')[0];
            var e = $.Event('open.tabs.ui', {
                relatedTarget: previous
            });

            $nav.trigger(e);

            if (e.isDefaultPrevented()) {
                return;
            }

            // activate Tab nav
            this.activate($nav.closest('li'), $tabNav);

            // activate Tab content
            this.activate($target, $tabContent, function () {
                $nav.trigger({
                    type: 'opened.tabs.ui',
                    relatedTarget: previous
                });
            });

        },

        activate: function ($element, $container, callback) {

            this.transitioning = true;

            var $active = $container.find('> .cc-active');
            var transition = callback && $.support.transition && !!$active.length;

            $active.removeClass('cc-active');
            // $element.width();
            $element.addClass('cc-active');

            // 回调函数
            if (transition) {
                $active.one($.support.transition.end, function () {
                    callback && callback();
                });
            } else {
                callback && callback();
            }

            this.transitioning = false;
        },
        getNextNav: function ($panel) {
            var navIndex = this.$tabPanels.index($panel);
            var rightSpring = 'animation-right-spring';
            if (navIndex + 1 >= this.$navs.length) {
                animation && $panel.addClass(rightSpring).on(animation.end, function () {
                    $panel.removeClass(rightSpring)
                });
                return null
            } else {
                return this.$navs.eq(navIndex + 1)
            }
        },
        getPrevNav: function ($panel) {
            var navIndex = this.$tabPanels.index($panel);
            var leftSpring = 'animation-left-spring';
            if (navIndex === 0) {
                animation && $panel.addClass(leftSpring).on(animation.end, function () {
                    $panel.removeClass(leftSpring)
                });
                return null
            } else {
                return this.$navs.eq(navIndex - 1)
            }
        }
    }

    $.fn.tabs = function (option) {
        return this.each(function () {

            var $this = $(this);

            var $tabs = $this.is('.cc-tabs') && $this || $this.closest('.cc-tabs');
            var data = $tabs.data('ui.tabs');
            var options = $.extend({}, $.isPlainObject(option) ? option : {});

            if (!data) {
                $tabs.data('ui.tabs', (data = new Tabs($tabs[0], options)));
            }

            if (typeof option == 'string' && $this.is('.cc-tabs-nav a')) {
                data[option]($this);
            }
        });
    }

})(jQuery);

$(function () {
    $('[data-role="tabs"]').tabs();
});// 商品数量加减插件
;
(function ($) {
    "use strict";

    var spinningTimer;
    var Spinning = function (el, options) {
        this.$el = el;
        this.options = $.extend({}, Spinning.rules.defaults, Spinning.rules[options.rule] || {}, options || {});
        this.min = parseFloat(this.options.min) || 0;
        this.max = parseFloat(this.options.max) || 0;

        this.$el
            .on('focus.spinner', $.proxy(function (e) {
                e.preventDefault();
                $(document).trigger('mouseup.spinner');
                this.oldValue = this.value();
            }, this))
            .on('change.spinner', $.proxy(function (e) {
                e.preventDefault();
                this.value(this.$el.val());
            }, this))
            .on('keydown.spinner', $.proxy(function (e) {
                var dir = {38: 'up', 40: 'down'}[e.which];
                if (dir) {
                    e.preventDefault();
                    this.spin(dir);
                }
            }, this));

        //init input value
        this.oldValue = this.value();
        this.value(this.$el.val());
        return this;
    };

    Spinning.rules = {
        defaults: {min: 0, max: null, step: 1, precision: 0},
        currency: {min: 0.00, max: null, step: 0.01, precision: 2},
        quantity: {min: 1, max: 999, step: 1, precision: 0},
        percent: {min: 1, max: 100, step: 1, precision: 0},
        month: {min: 1, max: 12, step: 1, precision: 0},
        day: {min: 1, max: 31, step: 1, precision: 0},
        hour: {min: 0, max: 23, step: 1, precision: 0},
        minute: {min: 1, max: 59, step: 1, precision: 0},
        second: {min: 1, max: 59, step: 1, precision: 0}
    };

    Spinning.prototype = {
        spin: function (dir) {
            if (this.$el.attr('disabled') === 'disabled') {
                return;
            }

            this.oldValue = this.value();
            switch (dir) {
                case 'up':
                    this.value(this.oldValue + Number(this.options.step, 10));
                    break;
                case 'down':
                    this.value(this.oldValue - Number(this.options.step, 10));
                    break;
            }
        },

        value: function (v) {
            if (v === null || v === undefined) {
                return this.numeric(this.$el.val());
            }
            v = this.numeric(v);

            var valid = this.validate(v);
            if (valid !== 0) {
                v = (valid === -1) ? this.min : this.max;
            }
            this.$el.val(v.toFixed(this.options.precision));

            if (this.oldValue !== this.value()) {
                //changing.spinner
                this.$el.trigger('changing.spinner', [this.value(), this.oldValue]);

                //lazy changed.spinner
                clearTimeout(spinningTimer);
                spinningTimer = setTimeout($.proxy(function () {
                    this.$el.trigger('changed.spinner', [this.value(), this.oldValue]);
                }, this), Spinner.delay);
            }
        },

        numeric: function (v) {
            v = this.options.precision > 0 ? parseFloat(v, 10) : parseInt(v, 10);
            return v || this.options.min || 0;
        },

        validate: function (val) {
            if (this.options.min !== null && val < this.min) {
                return -1;
            }
            if (this.options.max !== null && val > this.max) {
                return 1;
            }
            return 0;
        }
    };

    var Spinner = function (el, options) {
        this.$el = el;
        this.$spinning = $("[data-spin='spinner']", this.$el);
        if (this.$spinning.length === 0) {
            this.$spinning = $(":input[type='text']", this.$el);
        }
        this.spinning = new Spinning(this.$spinning, this.$spinning.data());

        this.$el
            .on('tap.spinner click.spinner', "[data-spin='up'],[data-spin='down']", $.proxy(this.spin, this))
            .on('mousedown.spinner', "[data-spin='up'],[data-spin='down']", $.proxy(this.spin, this));

        $(document).on('mouseup.spinner', $.proxy(function () {
            clearTimeout(this.spinTimeout);
            clearInterval(this.spinInterval);
        }, this));

        options = $.extend({}, options);
        if (options.delay) {
            this.delay(options.delay);
        }
        if (options.changed) {
            this.changed(options.changed);
        }
        if (options.changing) {
            this.changing(options.changing);
        }
    };

    Spinner.delay = 0;

    Spinner.prototype = {
        constructor: Spinner,

        spin: function (e) {
            var dir = $(e.currentTarget).data('spin');
            switch (e.type) {
                case 'click':
                    e.preventDefault();
                    var target = $(e.target);
                    // 如果有disabled直接返回
                    if (target.is(':disabled') || target.hasClass('disabled')) return;
                    this.spinning.spin(dir);
                    break;

                case 'mousedown':
                    if (e.which === 1) {
                        this.spinTimeout = setTimeout($.proxy(this.beginSpin, this, dir), 300);
                    }
                    break;
            }
        },

        delay: function (ms) {
            var delay = parseInt(ms, 10);
            if (delay > 0) {
                this.constructor.delay = delay + 100;
            }
        },

        value: function () {
            return this.spinning.value();
        },

        changed: function (fn) {
            this.bindHandler('changed.spinner', fn);
        },

        changing: function (fn) {
            this.bindHandler('changing.spinner', fn);
        },

        bindHandler: function (t, fn) {
            if ($.isFunction(fn)) {
                this.$spinning.on(t, fn);
            } else {
                this.$spinning.off(t);
            }
        },

        beginSpin: function (dir) {
            this.spinInterval = setInterval($.proxy(this.spinning.spin, this.spinning, dir), 100);
        }
    };

    $.fn.spinner = function (options, value) {
        return this.each(function () {
            var self = $(this), data = self.data('spinner');
            if (!data) {
                self.data('spinner', (data = new Spinner(self, $.extend({}, self.data(), options))));
            }
            if (options === 'delay' || options === 'changed' || options === 'changing') {
                data[options](value);
            }
            if (options === 'spin' && value) {
                data.spinning.spin(value);
            }
        });
    };

    $(function () {
        $('[data-role="spinner"]').spinner();
    });
})(jQuery);// 遮罩插件 

;
(function ($) {

    "use strict";

    var $doc = $(document);
    var supportTransition = $.support.transition;

    var Mask = function (options) {
        this.settings = $.extend({},
            Mask.DEFAULTS, options || {});
        this.id = "ID" + (new Date().getTime()) + "RAND" + (Math.ceil(Math.random() * 100000));
        this.$element = $(this.settings.tpl, {
            id: this.id
        });

        this.inited = false;
        this.scrollbarWidth = 0;
        this.used = $([]);
    };

    Mask.DEFAULTS = {
        tpl: '<div class="cc-mask" data-role="mask"></div>',
        duration: 300
    };

    Mask.prototype = {

        init: function () {

            if (!this.inited) {
                $(document.body).append(this.$element);
                this.settings.opacity && this.$element.css('opacity', this.settings.opacity);
                this.inited = true;
                $doc.trigger('init.mask');
            }

            return this;
        },

        open: function (relatedElement) {

            if (!this.inited) {
                this.init();
            }

            var $element = this.$element;

            // 用于多重调用
            if (relatedElement) {
                this.used = this.used.add($(relatedElement));
            }

            this.checkScrollbar().setScrollbar();

            $element.show().trigger('open.mask');

            setTimeout(function () {
                $element.addClass('cc-active');
            }, 0);

            return this;

        },

        close: function (relatedElement, force) {

            this.used = this.used.not($(relatedElement));

            if (!force && this.used.length) {
                return this;
            }

            var $element = this.$element;

            $element.removeClass('cc-active').trigger('close.mask');

            function complete() {
                this.resetScrollbar();
                $element.hide();
            }

            // 动画支持
            if (supportTransition) {
                $element.one(supportTransition.end, $.proxy(complete, this)).emulateTransitionEnd(this.settings.duration);
            } else {
                complete.call(this);
            }

            return this;

        },

        checkScrollbar: function () {

            this.scrollbarWidth = UI.utils.measureScrollbar();
            return this;

        },

        setScrollbar: function () {

            var $body = $(document.body);
            var bodyPaddingRight = parseInt(($body.css('padding-right') || 0), 10);

            if (this.scrollbarWidth) {
                $body.css('padding-right', bodyPaddingRight + this.scrollbarWidth);
            }

            $body.addClass('cc-mask-active');

            return this;

        },

        resetScrollbar: function () {

            $(document.body).css('padding-right', '').removeClass('cc-mask-active');
            return this;

        }

    }

// 这个方法要重构，不可以传参数
    $.mask = new Mask();

})(jQuery);// 弹出框插件

// <div class="cc-modal modal-dialog">
//   <div class="cc-modal-header">
//     header
//     <a href="javascript:;" class="ui-close" data-modal="close">&times;</a>
//   </div>
//   <div class="cc-modal-content">
//     content
//   </div>
//   <div class="cc-modal-footer">
//     <a href="#" class="cc-modal-btn" data-modal="close">cancel</a>
//     <a href="#" class="cc-modal-btn" data-modal="confirm">confirm</a>
//   </div>
// </div>

;
(function ($) {

    "use strict";

    var $doc = $(document);
    var supportTransition = UI.support.transition;

    //记录滚动条位置
    var scrollPos;

    var Modal = function (element, options) {
        this.options = $.extend({}, Modal.DEFAULTS, options || {});
        this.$element = $(element);

        if (!this.$element.attr('id')) {
            this.$element.attr('id', "ID" + (new Date().getTime()) + "RAND" + (Math.ceil(Math.random() * 100000)));
        }

        this.isPopup = this.$element.hasClass('cc-popup');
        this.active = this.transitioning = null;

        this.events();
    };

    Modal.DEFAULTS = {
        className: {
            active: 'cc-modal-active',
            out: 'cc-modal-out'
        },
        selector: {
            modal: '.cc-modal',
            active: '.cc-modal-active'
        },
        cancelable: true,
        onConfirm: function () {
        },
        onCancel: function () {
        },
        duration: 300,
        transitionEnd: supportTransition.end &&
        supportTransition.end + '.modal'
    };

    Modal.prototype = {

        toggle: function (relatedElement) {
            return this.active ? this.close() : this.open(relatedElement);
        },

        open: function (relatedElement) {
            var $element = this.$element;
            var options = this.options;
            var isPopup = this.isPopup;

            if (this.active) {
                return;
            }

            if (!this.$element.length) {
                return;
            }

            scrollPos = {
                x: window.scrollX,
                y: window.scrollY
            };

            //console.log(scrollPos);

            // 判断如果还在动画，就先触发之前的closed事件
            if (this.transitioning) {
                clearTimeout($element.transitionEndTimmer);
                $element.transitionEndTimmer = null;
                $element.trigger(options.transitionEnd).off(options.transitionEnd);
            }

            isPopup && this.$element.show();

            this.active = true;

            $element.trigger($.Event('open.modal',
                {relatedElement: relatedElement}));

            $.mask.open($element);

            $element.show().redraw();

            !isPopup && $element.css({
                marginTop: -parseInt($element.height() / 2, 10) + 'px'
            });

            $element.
                removeClass(options.className.out).
                addClass(options.className.active);

            this.transitioning = 1;

            var complete = function () {
                $element.trigger($.Event('opened.modal',
                    {relatedElement: relatedElement}));
                this.transitioning = 0;
            };

            if (!supportTransition) {
                return complete.call(this);
            }

            $element.
                one(options.transitionEnd, $.proxy(complete, this)).
                emulateTransitionEnd(options.duration);
        },

        close: function (relatedElement) {

            if (!this.active) {
                return;
            }

            var $element = this.$element;
            var options = this.options;
            var isPopup = this.isPopup;

            // 判断如果还在动画，就先触发之前的opened事件
            if (this.transitioning) {
                clearTimeout($element.transitionEndTimmer);
                $element.transitionEndTimmer = null;
                $element.trigger(options.transitionEnd).off(options.transitionEnd);
                $.mask.close($element, true);
            }

            this.$element.trigger($.Event('close.modal',
                {relatedElement: relatedElement}));

            this.transitioning = 1;

            var complete = function () {
                $element.trigger('closed.modal');
                isPopup && $element.removeClass(options.className.out);
                $element.hide();
                this.transitioning = 0;
                this.active = false;
                setTimeout(function () {
                    window.scrollTo(scrollPos.x, scrollPos.y);
                }, 0);
            };

            $element.
                removeClass(options.className.active).
                addClass(options.className.out);

            if (!supportTransition) {
                return complete.call(this);
            }

            $element
                .one(options.transitionEnd, $.proxy(complete, this))
                .emulateTransitionEnd(options.duration);

            $.mask.close($element, false);

        },

        // 事件绑定
        events: function () {

            var that = this;
            var $element = this.$element;
            var $ipt = $element.find('[data-modal="input"]');

            if (this.options.cancelable) {
                $.mask.$element.on('click', function (e) {
                    that.close();
                });
            }

            // Close button
            $element.find('[data-modal="close"]').on('click.modal', function (e) {
                e.preventDefault();
                that.close();
            });

            $element.find('[data-modal="cancel"]').on('click.modal', function (e) {
                e.preventDefault();
                that.options.onCancel.call(that, $ipt.val());
                that.close();
            });

            $element.find('[data-modal="confirm"]').on('click.modal', function (e) {
                e.preventDefault();
                that.options.onConfirm.call(that, $ipt.val());
                that.close();
            });

        }

    }

    // 插件
    $.fn.modal = function (option, relatedElement) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('modal');
            var options = $.extend({},
                Modal.DEFAULTS, typeof option == 'object' && option);

            if (!data) {
                $this.data('modal', (data = new Modal(this, options)));
            }

            if (typeof option == 'string') {
                data[option](relatedElement);
            } else {
                data.open(option && option.relatedElement || undefined);
            }
        });
    }

    // 自动绑定
    $doc.on('click.modal', '[data-role="modal"]', function (e) {
        e.preventDefault();
        var $this = $(this);
        var options = UI.utils.options($this.attr('data-options'));
        // console.log(options);
        var $target = $(options.target ||
            (this.href && this.href.replace(/.*(?=#[^\s]+$)/, '')) || $this.data('target'));
        var option = $target.data('modal') ? 'toggle' : options;

        $.fn.modal.call($target, option, this);
    });

    // 弹框alert
    var alertTpl = '<div id="alertModal" class="cc-modal hide">' +
        '<div class="cc-modal-header"></div>' +
        '<div class="cc-modal-content"></div>' +
        '<div class="cc-modal-footer">' +
        '<a href="#" class="cc-modal-btn" data-modal="confirm">确定</a>' +
        '</div>' +
        '</div>';

    $.alert = function (text, title, callbackOk) {

        if (typeof title === 'function') {
            callbackOk = arguments[1];
            title = undefined;
        }
        var modal = $('#alertModal');
        if (!modal.length) {
            $('body').append(alertTpl);
            modal = $('#alertModal')
        }

        modal.find('.cc-modal-header').html(typeof title === 'undefined' ? '' : title);
        modal.find('.cc-modal-content').html(text || '');

        return modal.modal({
            cancelable: false,
            onConfirm: function () {
                $.isFunction(callbackOk) && callbackOk.call(this);
                modal.remove();
            }
        });

    }

    // 弹框confirm
    var confirmTpl = '<div id="confirmModal" class="cc-modal hide">' +
        '<div class="cc-modal-header"></div>' +
        '<div class="cc-modal-content"></div>' +
        '<div class="cc-modal-footer">' +
        '<a href="#" class="cc-modal-btn" data-modal="cancel">取消</a>' +
        '<a href="#" class="cc-modal-btn" data-modal="confirm">确定</a>' +
        '</div>' +
        '</div>';

    $.confirm = function (text, title, callbackOk, callbackCancel) {
        if (typeof title === 'function') {
            callbackCancel = arguments[2];
            callbackOk = arguments[1];
            title = undefined;
        }

        var modal = $('#confirmModal');
        if (!modal.length) {
            $('body').append(confirmTpl);
            modal = $('#confirmModal')
        }

        modal.find('.cc-modal-header').html(typeof title === 'undefined' ? '' : title);
        modal.find('.cc-modal-content').html(text || '');

        return modal.modal({
            cancelable: false,
            onConfirm: function () {
                $.isFunction(callbackOk) && callbackOk.call(this);
                modal.remove();
            },
            onCancel: function () {
                $.isFunction(callbackCancel) && callbackCancel.call(this);
                modal.remove();
            }
        });

    };

    // 弹框prompt
    var promptTpl = '<div id="promptModal" class="cc-modal hide">' +
        '<div class="cc-modal-header"></div>' +
        '<div class="cc-modal-content"><p class="modal-prompt-text"></p>' +
        '<input type="text" class="cc-input" data-modal="input">' +
        '</div>' +
        '<div class="cc-modal-footer">' +
        '<a href="#" class="cc-modal-btn" data-modal="cancel">取消</a>' +
        '<a href="#" class="cc-modal-btn" data-modal="confirm">确定</a>' +
        '</div>' +
        '</div>';

    $.prompt = function (text, title, callbackOk, callbackCancel) {
        if (typeof title === 'function') {
            callbackCancel = arguments[2];
            callbackOk = arguments[1];
            title = undefined;
        }
        var modal = $('#promptModal');
        if (!modal.length) {
            $('body').append(promptTpl);
            modal = $('#promptModal')
        }

        modal.find('.cc-modal-header').html(typeof title === 'undefined' ? '' : title);
        modal.find('.cc-modal-content .modal-prompt-text').html(text || '');

        return modal.modal({
            cancelable: false,
            onConfirm: function (val) {
                $.isFunction(callbackOk) && callbackOk.call(this);
                modal.remove();
            },
            onCancel: function (val) {
                $.isFunction(callbackCancel) && callbackCancel.call(this);
                modal.remove();
            }
        });
    };

    // 自定义按钮对话框

    var dialogTpl = '<div id="dialogModal" class="cc-modal hide">' +
        '<div class="cc-modal-header"><%=title%></div>' +
        '<div class="cc-modal-content"><%=content%></div>' +
        '<%if(buttons){%>' +
        '<div class="cc-modal-footer">' +
        '<% for(var i=0; i<buttons.length; i++) { var item = buttons[i];%>' +
        '<a href="javascript:;" class="cc-modal-btn" data-index="<%=item.index%>" data-key="<%=item.key%>"><%=item.text%></a>' +
        '<%}%>' +
        '</div>' +
        '<%}%>' +
        '</div>';

    $.dialog = function (text, title, btns) {

        var options = {};
        if (typeof text === 'object') {
            options = arguments[0];
        }
        if (typeof title === 'object') {
            btns = arguments[1];
            title = undefined;
        }

        var dafaults = {
            title: title ? title : '',
            content: typeof text === 'string' ? text : '',
            btns: btns ? btns : {
                '取消': function (dialog) {
                },
                '确定': function (dialog) {
                }
            }
        };

        var opts = $.extend(dafaults, options || {});
        var i = 0;
        var buttons = [];

        // todo 有点sb需要改下
        opts.btns && $.each(opts.btns, function (key) {
            buttons.push({
                index: ++i,
                text: key,
                key: key
            });
        });

        opts = $.extend(opts, {buttons: buttons})

        var dialogModal = $('#dialogModal');
        if (!dialogModal.length) {
            dialogModal = $($.parseTpl(dialogTpl, opts)).appendTo('body');
        }

        dialogModal.modal();

        dialogModal.on('click', '.cc-modal-btn', function (e) {
            e.preventDefault;
            var me = $(this);
            var fn = opts.btns[me.attr('data-key')];
            fn && fn(dialogModal);
        });

    }

})(jQuery);// 信息提示插件

// <div class="ui-notify ui-notify-center">
//     <div class="ui-notify-message">
//         <a class="ui-close">×</a>
//         <div class="ui-notify-content">content</div>
//     </div>
// </div> 

// todo 传入指定id时，只产生一个notify
// via https:https://github.com/uikit

;
(function ($) {

    "use strict";

    // 可以提示多个
    var containers = {},
        messages = {},

        notify = function (options, callFn) {

            if ($.type(options) == 'string') {
                options = {
                    message: options
                };
            }

            if (arguments[1]) {
                options = $.extend(options, $.type(arguments[1]) == 'string' ? {
                    status: arguments[1]
                } : arguments[1]);
            }

            // 回调函数
            if (callFn != undefined && $.isFunction(callFn)) {
                options.onClose = callFn;
            }

            return (new Message(options)).show();
        },
        closeAll = function (group, instantly) {
            if (group) {
                for (var id in messages) {
                    if (group === messages[id].group) messages[id].close(instantly);
                }
            } else {
                for (var id in messages) {
                    messages[id].close(instantly);
                }
            }
        };

    // 定义消息方法
    var Message = function (options) {

        var $this = this;

        this.options = $.extend({}, Message.defaults, options);

        if (this.options.id) {
            this.uuid = this.options.id;
        } else {
            this.uuid = "ID" + (new Date().getTime()) + "RAND" + (Math.ceil(Math.random() * 100000));
        }

        this.element = $([

            '<div class="cc-notify-message">', '<a class="cc-close">×</a>', '<div class="cc-notify-content">' + this.options.message + '</div>', '</div>'

        ].join('')).data("notifyMessage", this);

        // status
        if (this.options.status) {
            this.element.addClass('cc-notify-message-' + this.options.status);
            this.currentstatus = this.options.status;
        }

        if (!this.options.showClose) {
            this.element.find('.cc-close').hide();
        }

        this.group = this.options.group;

        messages[this.uuid] = this;

        if (!containers[this.options.pos]) {
            containers[this.options.pos] = $('<div class="cc-notify cc-notify-' + this.options.pos + '"></div>').appendTo('body').on("click", ".cc-notify-message", function () {
                $(this).data("notifyMessage").close();
            });
        }

        // 遮罩层
        if (this.options.showMask) {
            this.mask = $('<div class="cc-notify-mask"></div>').appendTo('body');
            // console.log(this.mask);
            this.options.opacity && this.mask.css('opacity', this.options.opacity);

            this.mask.on('click', function () {
                $this.close();
            })
        }

    };

    Message.defaults = {
        id: null,
        message: "",
        status: "",
        timeout: 3000,
        showMask: true,
        group: null,
        showClose: false,
        pos: 'center',
        onClose: function () {
        }
    };


    Message.prototype = {

        uuid: false,
        element: false,
        timout: false,
        currentstatus: "",
        group: false,

        show: function () {

            if (this.element.is(":visible")) return;

            var $this = this;

            containers[this.options.pos].show().prepend(this.element);

            var marginbottom = parseInt(this.element.css("margin-bottom"), 10);

            this.element.css({
                "opacity": 0,
                "margin-top": -1 * this.element.outerHeight(),
                "margin-bottom": 0
            }).animate({
                "opacity": 1,
                "margin-top": 0,
                "margin-bottom": marginbottom
            }, function () {

                if ($this.options.timeout) {

                    var closefn = function () {
                        $this.close();
                    };

                    $this.timeout = setTimeout(closefn, $this.options.timeout);

                    $this.element.hover(
                        function () {
                            clearTimeout($this.timeout);
                        }, function () {
                            $this.timeout = setTimeout(closefn, $this.options.timeout);
                        });
                }

            });

            return this;
        },

        close: function (instantly) {

            var $this = this,
                finalize = function () {
                    $this.options.showMask && $this.mask.remove();
                    $this.element.remove();

                    if (!containers[$this.options.pos].children().length) {
                        containers[$this.options.pos].hide();
                    }

                    $this.options.onClose.apply($this, []);

                    delete messages[$this.uuid];
                };

            if (this.timeout) clearTimeout(this.timeout);

            if (instantly) {
                finalize();
            } else {
                this.element.animate({
                    "opacity": 0,
                    "margin-top": -1 * this.element.outerHeight(),
                    "margin-bottom": 0
                }, function () {
                    finalize();
                });
            }

        },

        content: function (html) {

            var container = this.element.find(".cc-notify-content");

            if (!html) {
                return container.html();
            }

            container.html(html);

            return this;
        },

        status: function (status) {

            if (!status) {
                return this.currentstatus;
            }

            this.element.removeClass('cc-notify-message-' + this.currentstatus).addClass('cc-notify-message-' + status);

            this.currentstatus = status;

            return this;
        }
    }

    // 插件
    $.notify = notify;
    $.notify.closeAll = closeAll;

})(jQuery);// 图片延时加载
// edit by guo
// add function echo.refresh();

// "description": "Lazy-loading with data-* attributes, offset and throttle options",
// "author": "@toddmotto",
// "license": "MIT",
// "homepage": "https://github.com/toddmotto/echo",

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return factory(root);
        });
    } else if (typeof exports === 'object') {
        module.exports = factory;
    } else {
        root.echo = factory(root);
    }
})(this, function (root) {

    'use strict';

    var echo = {};

    var callback = function () {
    };

    var offset, poll, delay, useDebounce, unload;

    var isHidden = function (element) {
        return (element.offsetParent === null);
    };

    var inView = function (element, view) {
        if (isHidden(element)) {
            return false;
        }

        var box = element.getBoundingClientRect();
        return (box.right >= view.l && box.bottom >= view.t && box.left <= view.r && box.top <= view.b);
    };

    var debounceOrThrottle = function () {
        if (!useDebounce && !!poll) {
            return;
        }
        clearTimeout(poll);
        poll = setTimeout(function () {
            echo.render();
            poll = null;
        }, delay);
    };

    echo.init = function (opts) {
        opts = opts || {};
        var offsetAll = opts.offset || 0;
        var offsetVertical = opts.offsetVertical || offsetAll;
        var offsetHorizontal = opts.offsetHorizontal || offsetAll;
        var optionToInt = function (opt, fallback) {
            return parseInt(opt || fallback, 10);
        };
        offset = {
            t: optionToInt(opts.offsetTop, offsetVertical),
            b: optionToInt(opts.offsetBottom, offsetVertical),
            l: optionToInt(opts.offsetLeft, offsetHorizontal),
            r: optionToInt(opts.offsetRight, offsetHorizontal)
        };
        delay = optionToInt(opts.throttle, 250);
        useDebounce = opts.debounce !== false;
        unload = !!opts.unload;
        callback = opts.callback || callback;
        echo.render();
        if (document.addEventListener) {
            root.addEventListener('scroll', debounceOrThrottle, false);
            root.addEventListener('load', debounceOrThrottle, false);
        } else {
            root.attachEvent('onscroll', debounceOrThrottle);
            root.attachEvent('onload', debounceOrThrottle);
        }
    };

    echo.render = function () {
        var nodes = document.querySelectorAll('img[data-echo], [data-echo-background]');
        var length = nodes.length;
        var src, elem;
        var view = {
            l: 0 - offset.l,
            t: 0 - offset.t,
            b: (root.innerHeight || document.documentElement.clientHeight) + offset.b,
            r: (root.innerWidth || document.documentElement.clientWidth) + offset.r
        };
        for (var i = 0; i < length; i++) {
            elem = nodes[i];
            if (inView(elem, view)) {

                if (unload) {
                    elem.setAttribute('data-echo-placeholder', elem.src);
                }

                if (elem.getAttribute('data-echo-background') !== null) {
                    elem.style.backgroundImage = "url(" + elem.getAttribute('data-echo-background') + ")";
                }
                else {
                    elem.src = elem.getAttribute('data-echo');
                }

                if (!unload) {
                    elem.removeAttribute('data-echo');
                    elem.removeAttribute('data-echo-background');
                }

                callback(elem, 'load');
            }
            else if (unload && !!(src = elem.getAttribute('data-echo-placeholder'))) {

                if (elem.getAttribute('data-echo-background') !== null) {
                    elem.style.backgroundImage = "url(" + src + ")";
                }
                else {
                    elem.src = src;
                }

                elem.removeAttribute('data-echo-placeholder');
                callback(elem, 'unload');
            }
        }
        if (!length) {
            echo.detach();
        }
    };

    echo.detach = function () {
        if (document.removeEventListener) {
            root.removeEventListener('scroll', debounceOrThrottle);
        } else {
            root.detachEvent('onscroll', debounceOrThrottle);
        }
        clearTimeout(poll);
    };

    echo.refresh = function () {
        echo.render();
        if (document.addEventListener) {
            root.addEventListener('scroll', debounceOrThrottle, false);
            root.addEventListener('load', debounceOrThrottle, false);
        } else {
            root.attachEvent('onscroll', debounceOrThrottle);
            root.attachEvent('onload', debounceOrThrottle);
        }
    }

    return echo;

});
// 平滑滚动
// 默认<span data-smooth-scroll>回到顶部</span> 

;
(function ($) {

    var rAF = UI.utils.rAF;
    var cAF = UI.utils.cancelAF;

    /**
     * Smooth Scroll
     * @param position
     * @via http://mir.aculo.us/2014/01/19/scrolling-dom-elements-to-the-top-a-zepto-plugin/
     */

    // Usage: $(window).smoothScroll([options])

    // only allow one scroll to top operation to be in progress at a time,
    // which is probably what you want
    var smoothScrollInProgress = false;

    var SmoothScroll = function (element, options) {
        options = options || {};

        var $this = $(element);
        var targetY = parseInt(options.position) || SmoothScroll.DEFAULTS.position;
        var initialY = $this.scrollTop();
        var lastY = initialY;
        var delta = targetY - initialY;
        // duration in ms, make it a bit shorter for short distances
        // this is not scientific and you might want to adjust this for
        // your preferences
        var speed = options.speed || Math.min(750, Math.min(1500, Math.abs(initialY - targetY)));
        // temp variables (t will be a position between 0 and 1, y is the calculated scrollTop)
        var start;
        var t;
        var y;
        var cancelScroll = function () {
            abort();
        };

        // abort if already in progress or nothing to scroll
        if (smoothScrollInProgress) {
            return;
        }

        if (delta === 0) {
            return;
        }

        // quint ease-in-out smoothing, from
        // https://github.com/madrobby/scripty2/blob/master/src/effects/transitions/penner.js#L127-L136

        function smooth(pos) {
            if ((pos /= 0.5) < 1) {
                return 0.5 * Math.pow(pos, 5);
            }

            return 0.5 * (Math.pow((pos - 2), 5) + 2);
        }

        function abort() {
            $this.off('touchstart.smoothscroll', cancelScroll);
            smoothScrollInProgress = false;
        }

        // when there's a touch detected while scrolling is in progress, abort
        // the scrolling (emulates native scrolling behavior)
        $this.on('touchstart.smoothscroll', cancelScroll);
        smoothScrollInProgress = true;

        // start rendering away! note the function given to frame
        // is named "render" so we can reference it again further down

        function render(now) {
            if (!smoothScrollInProgress) {
                return;
            }
            if (!start) {
                start = now;
            }

            // calculate t, position of animation in [0..1]
            t = Math.min(1, Math.max((now - start) / speed, 0));
            // calculate the new scrollTop position (don't forget to smooth)
            y = Math.round(initialY + delta * smooth(t));
            // bracket scrollTop so we're never over-scrolling
            if (delta > 0 && y > targetY) {
                y = targetY;
            }
            if (delta < 0 && y < targetY) {
                y = targetY;
            }

            // only actually set scrollTop if there was a change fromt he last frame
            if (lastY != y) {
                $this.scrollTop(y);
            }

            lastY = y;
            // if we're not done yet, queue up an other frame to render,
            // or clean up
            if (y !== targetY) {
                cAF(scrollRAF);
                scrollRAF = rAF(render);
            } else {
                cAF(scrollRAF);
                abort();
            }
        }

        var scrollRAF = rAF(render);
    };

    SmoothScroll.DEFAULTS = {
        position: 0
    };

    $.fn.smoothScroll = function (option) {
        return this.each(function () {
            new SmoothScroll(this, option);
        });
    }

    $(document).on('click.smoothScroll', '[data-role="gotop"]', function (e) {
        e.preventDefault();
        var options = UI.utils.options($(this).data('SmoothScroll'));
        $(window).smoothScroll(options);
    });

})(jQuery);// todo 增加分页参数
// add 定时播放 

/*
 * Swipe 2.0
 *
 * Brad Birdsall
 * Copyright 2013, MIT License
 *
 */
function Swipe(container, options) {

    "use strict";

    // utilities
    var noop = function () {
    }; // simple no operation function
    var offloadFn = function (fn) {
        setTimeout(fn || noop, 0)
    }; // offload a functions execution

    // check browser capabilities
    var browser = {
        addEventListener: !!window.addEventListener,
        touch: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
        transitions: (function (temp) {
            var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
            for (var i in props) if (temp.style[props[i]] !== undefined) return true;
            return false;
        })(document.createElement('swipe'))
    };

    // quit if no root element
    if (!container) return;
    var element = container.children[0];
    var slides, slidePos, width, length;
    options = options || {};
    var index = parseInt(options.startSlide, 10) || 0;
    var speed = options.speed || 300;
    options.continuous = options.continuous !== undefined ? options.continuous : true;

    function setup() {

        // cache slides
        slides = element.children;
        length = slides.length;

        // set continuous to false if only one slide
        if (slides.length < 2) options.continuous = false;

        //special case if two slides
        if (browser.transitions && options.continuous && slides.length < 3) {
            element.appendChild(slides[0].cloneNode(true));
            element.appendChild(element.children[1].cloneNode(true));
            slides = element.children;
        }

        // create an array to store current positions of each slide
        slidePos = new Array(slides.length);

        // determine width of each slide
        width = container.getBoundingClientRect().width || container.offsetWidth;

        element.style.width = (slides.length * width) + 'px';

        // stack elements
        var pos = slides.length;
        while (pos--) {

            var slide = slides[pos];

            slide.style.width = width + 'px';
            slide.setAttribute('data-index', pos);

            if (browser.transitions) {
                slide.style.left = (pos * -width) + 'px';
                move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
            }

        }

        // reposition elements before and after index
        if (options.continuous && browser.transitions) {
            move(circle(index - 1), -width, 0);
            move(circle(index + 1), width, 0);
        }

        if (!browser.transitions) element.style.left = (index * -width) + 'px';

        container.style.visibility = 'visible';

    }

    function prev() {

        if (options.continuous) slide(index - 1);
        else if (index) slide(index - 1);

    }

    function next() {

        if (options.continuous) slide(index + 1);
        else if (index < slides.length - 1) slide(index + 1);

    }

    function circle(index) {

        // a simple positive modulo using slides.length
        return (slides.length + (index % slides.length)) % slides.length;

    }

    function slide(to, slideSpeed) {

        // do nothing if already on requested slide
        if (index == to) return;

        if (browser.transitions) {

            var direction = Math.abs(index - to) / (index - to); // 1: backward, -1: forward

            // get the actual position of the slide
            if (options.continuous) {
                var natural_direction = direction;
                direction = -slidePos[circle(to)] / width;

                // if going forward but to < index, use to = slides.length + to
                // if going backward but to > index, use to = -slides.length + to
                if (direction !== natural_direction) to = -direction * slides.length + to;

            }

            var diff = Math.abs(index - to) - 1;

            // move all the slides between index and to in the right direction
            while (diff--) move(circle((to > index ? to : index) - diff - 1), width * direction, 0);

            to = circle(to);

            move(index, width * direction, slideSpeed || speed);
            move(to, 0, slideSpeed || speed);

            if (options.continuous) move(circle(to - direction), -(width * direction), 0); // we need to get the next in place

        } else {

            to = circle(to);
            animate(index * -width, to * -width, slideSpeed || speed);
            //no fallback for a circular continuous if the browser does not accept transitions
        }

        index = to;
        offloadFn(options.callback && options.callback(index, slides[index]));
    }

    function move(index, dist, speed) {

        translate(index, dist, speed);
        slidePos[index] = dist;

    }

    function translate(index, dist, speed) {

        var slide = slides[index];
        var style = slide && slide.style;

        if (!style) return;

        style.webkitTransitionDuration =
            style.MozTransitionDuration =
                style.msTransitionDuration =
                    style.OTransitionDuration =
                        style.transitionDuration = speed + 'ms';

        style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
        style.msTransform =
            style.MozTransform =
                style.OTransform = 'translateX(' + dist + 'px)';

    }

    function animate(from, to, speed) {

        // if not an animation, just reposition
        if (!speed) {

            element.style.left = to + 'px';
            return;

        }

        var start = +new Date;

        var timer = setInterval(function () {

            var timeElap = +new Date - start;

            if (timeElap > speed) {

                element.style.left = to + 'px';

                if (delay) begin();

                options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

                clearInterval(timer);
                return;

            }

            element.style.left = (( (to - from) * (Math.floor((timeElap / speed) * 100) / 100) ) + from) + 'px';

        }, 4);

    }

    // setup auto slideshow
    var delay = options.auto || 0;
    var interval;

    function begin() {

        interval = setTimeout(next, delay);

    }

    function stop() {

        delay = 0;
        clearTimeout(interval);

    }


    // setup initial vars
    var start = {};
    var delta = {};
    var isScrolling;

    // setup event capturing
    var events = {

        handleEvent: function (event) {

            switch (event.type) {
                case 'touchstart':
                    this.start(event);
                    break;
                case 'touchmove':
                    this.move(event);
                    break;
                case 'touchend':
                    offloadFn(this.end(event));
                    break;
                case 'webkitTransitionEnd':
                case 'msTransitionEnd':
                case 'oTransitionEnd':
                case 'otransitionend':
                case 'transitionend':
                    offloadFn(this.transitionEnd(event));
                    break;
                case 'resize':
                    offloadFn(setup);
                    break;
            }

            if (options.stopPropagation) event.stopPropagation();

        },
        start: function (event) {

            var touches = event.touches[0];

            // measure start values
            start = {

                // get initial touch coords
                x: touches.pageX,
                y: touches.pageY,

                // store time to determine touch duration
                time: +new Date

            };

            // used for testing first move event
            isScrolling = undefined;

            // reset delta and end measurements
            delta = {};

            // attach touchmove and touchend listeners
            element.addEventListener('touchmove', this, false);
            element.addEventListener('touchend', this, false);

        },
        move: function (event) {

            // ensure swiping with one touch and not pinching
            if (event.touches.length > 1 || event.scale && event.scale !== 1) return

            if (options.disableScroll) event.preventDefault();

            var touches = event.touches[0];

            // measure change in x and y
            delta = {
                x: touches.pageX - start.x,
                y: touches.pageY - start.y
            }

            // determine if scrolling test has run - one time test
            if (typeof isScrolling == 'undefined') {
                isScrolling = !!( isScrolling || Math.abs(delta.x) < Math.abs(delta.y) );
            }

            // if user is not trying to scroll vertically
            if (!isScrolling) {

                // prevent native scrolling
                event.preventDefault();

                // stop slideshow
                stop();

                // increase resistance if first or last slide
                if (options.continuous) { // we don't add resistance at the end

                    translate(circle(index - 1), delta.x + slidePos[circle(index - 1)], 0);
                    translate(index, delta.x + slidePos[index], 0);
                    translate(circle(index + 1), delta.x + slidePos[circle(index + 1)], 0);

                } else {

                    delta.x =
                        delta.x /
                        ( (!index && delta.x > 0               // if first slide and sliding left
                            || index == slides.length - 1        // or if last slide and sliding right
                            && delta.x < 0                       // and if sliding at all
                        ) ?
                            ( Math.abs(delta.x) / width + 1 )      // determine resistance level
                            : 1 );                                 // no resistance if false

                    // translate 1:1
                    translate(index - 1, delta.x + slidePos[index - 1], 0);
                    translate(index, delta.x + slidePos[index], 0);
                    translate(index + 1, delta.x + slidePos[index + 1], 0);
                }

            }

        },
        end: function (event) {

            // measure duration
            var duration = +new Date - start.time;

            // determine if slide attempt triggers next/prev slide
            var isValidSlide =
                Number(duration) < 250               // if slide duration is less than 250ms
                && Math.abs(delta.x) > 20            // and if slide amt is greater than 20px
                || Math.abs(delta.x) > width / 2;      // or if slide amt is greater than half the width

            // determine if slide attempt is past start and end
            var isPastBounds =
                !index && delta.x > 0                            // if first slide and slide amt is greater than 0
                || index == slides.length - 1 && delta.x < 0;    // or if last slide and slide amt is less than 0

            if (options.continuous) isPastBounds = false;

            // determine direction of swipe (true:right, false:left)
            var direction = delta.x < 0;

            // if not scrolling vertically
            if (!isScrolling) {

                if (isValidSlide && !isPastBounds) {

                    if (direction) {

                        if (options.continuous) { // we need to get the next in this direction in place

                            move(circle(index - 1), -width, 0);
                            move(circle(index + 2), width, 0);

                        } else {
                            move(index - 1, -width, 0);
                        }

                        move(index, slidePos[index] - width, speed);
                        move(circle(index + 1), slidePos[circle(index + 1)] - width, speed);
                        index = circle(index + 1);

                    } else {
                        if (options.continuous) { // we need to get the next in this direction in place

                            move(circle(index + 1), width, 0);
                            move(circle(index - 2), -width, 0);

                        } else {
                            move(index + 1, width, 0);
                        }

                        move(index, slidePos[index] + width, speed);
                        move(circle(index - 1), slidePos[circle(index - 1)] + width, speed);
                        index = circle(index - 1);

                    }

                    options.callback && options.callback(index, slides[index]);

                } else {

                    if (options.continuous) {

                        move(circle(index - 1), -width, speed);
                        move(index, 0, speed);
                        move(circle(index + 1), width, speed);

                    } else {

                        move(index - 1, -width, speed);
                        move(index, 0, speed);
                        move(index + 1, width, speed);
                    }

                }

            }

            // kill touchmove and touchend event listeners until touchstart called again
            element.removeEventListener('touchmove', events, false)
            element.removeEventListener('touchend', events, false)

        },
        transitionEnd: function (event) {

            if (parseInt(event.target.getAttribute('data-index'), 10) == index) {

                if (delay) begin();

                options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

            }

        }

    }

    // trigger setup
    setup();

    // start auto slideshow if applicable
    if (delay) begin();


    // add event listeners
    if (browser.addEventListener) {

        // set touchstart event on element
        if (browser.touch) element.addEventListener('touchstart', events, false);

        if (browser.transitions) {
            element.addEventListener('webkitTransitionEnd', events, false);
            element.addEventListener('msTransitionEnd', events, false);
            element.addEventListener('oTransitionEnd', events, false);
            element.addEventListener('otransitionend', events, false);
            element.addEventListener('transitionend', events, false);
        }

        // set resize event on window
        window.addEventListener('resize', events, false);

    } else {

        window.onresize = function () {
            setup()
        }; // to play nice with old IE

    }

    // expose the Swipe API
    return {
        setup: function () {

            setup();

        },
        slide: function (to, speed) {

            // cancel slideshow
            stop();

            slide(to, speed);

        },
        prev: function () {

            // cancel slideshow
            stop();

            prev();

        },
        next: function () {

            // cancel slideshow
            stop();

            next();

        },
        stop: function () {

            // cancel slideshow
            stop();

        },
        getPos: function () {

            // return current index position
            return index;

        },
        getNumSlides: function () {

            // return total number of slides
            return length;
        },
        kill: function () {

            // cancel slideshow
            stop();

            // reset element
            element.style.width = '';
            element.style.left = '';

            // reset slides
            var pos = slides.length;
            while (pos--) {

                var slide = slides[pos];
                slide.style.width = '';
                slide.style.left = '';

                if (browser.transitions) translate(pos, 0, 0);

            }

            // removed event listeners
            if (browser.addEventListener) {

                // remove current event listeners
                element.removeEventListener('touchstart', events, false);
                element.removeEventListener('webkitTransitionEnd', events, false);
                element.removeEventListener('msTransitionEnd', events, false);
                element.removeEventListener('oTransitionEnd', events, false);
                element.removeEventListener('otransitionend', events, false);
                element.removeEventListener('transitionend', events, false);
                window.removeEventListener('resize', events, false);

            }
            else {

                window.onresize = null;

            }

        }
    }

}


if (window.jQuery || window.Zepto) {
    (function ($) {
        $.fn.Swipe = function (option) {
            return this.each(function () {

                var $this = $(this);
                var data = $this.data('Swipe');
                var options = $.extend({},
                    typeof option == 'object' && option);

                if (!data) {
                    $this.data('Swipe', (data = new Swipe($(this)[0], option)));
                }

                if (typeof option == 'string') {
                    data[option] && data[option]();
                }

            });
        }
    })(window.jQuery || window.Zepto)
}

$(function () {

    $('[data-role="swipe"]').each(function () {

        var $swipe = $(this),
            auto = $swipe.data('auto'),
            showDots = $swipe.data('dots'),
            period = $swipe.data('period') || 5000,
            swipeItemLen = $swipe.find('.swipe-wrap li').length,
            showCounts = $swipe.data('counts'),
            counts = $swipe.find('.counts'),
            instance = $swipe.data('instance');

        if (!instance) {
            $swipe.data('instance', (instance = Swipe($swipe.get(0), {
                callback: function (pos) {
                    if (swipeItemLen == 2) {
                        pos = pos % 2;
                    }
                    //console.log(pos);
                    counts.find('.current-index').html(pos + 1);
                    $swipe.find('.dot').eq(pos).addClass('active').siblings().removeClass('active');
                }
            })));
        }

        if (auto) {
            setInterval(function () {
                instance.next();
            }, period);
        }

        if (swipeItemLen > 1 && showDots) {
            var html = '<ol class="dots">';
            for (var i = 0; i < swipeItemLen; i++) {
                html += '<li class="dot">' + i + '</li>';
            }
            html += '</ol>';
            $swipe.append(html);
            $swipe.find('.dot').on('click', function () {
                instance.slide($(this).text());
                $(this).addClass('active').siblings().removeClass('active');
            }).first().addClass('active');
        }

        if (counts.length < 1 && showCounts) {
            counts = $('<div class="counts"><span class="current-index"></span>/<span class="total-index"></span></div>').appendTo($swipe);
            counts.find('.current-index').html('1');
            counts.find('.total-index').html(swipeItemLen);
        }

    })
});// 对象填充表单
(function ($) {
    var
    // use to parse bracket notation like my[name][attribute]
        keyBreaker = /[^\[\]]+/g,
    // converts values that look like numbers and booleans and removes empty strings
        convertValue = function (value) {
            if ($.isNumeric(value)) {
                return parseFloat(value);
            } else if (value === 'true') {
                return true;
            } else if (value === 'false') {
                return false;
            } else if (value === '' || value === null) {
                return undefined;
            }
            return value;
        },
    // Access nested data
        nestData = function (elem, type, data, parts, value, seen, fullName) {
            var name = parts.shift();
            // Keep track of the dot separated fullname. Used to uniquely track seen values
            // and if they should be converted to an array or not
            fullName = fullName ? fullName + '.' + name : name;

            if (parts.length) {
                if (!data[name]) {
                    data[name] = {};
                }

                // Recursive call
                nestData(elem, type, data[name], parts, value, seen, fullName);
            } else {

                // Handle same name case, as well as "last checkbox checked"
                // case
                if (fullName in seen && type != "radio" && !$.isArray(data[name])) {
                    if (name in data) {
                        data[name] = [data[name]];
                    } else {
                        data[name] = [];
                    }
                } else {
                    seen[fullName] = true;
                }

                // Finally, assign data
                if (( type == "radio" || type == "checkbox" ) && !elem.is(":checked")) {
                    return
                }

                if (!data[name]) {
                    data[name] = value;
                } else {
                    data[name].push(value);
                }


            }

        };

    /**
     * @function jQuery.fn.formParams
     * @parent jQuery.formParams
     * @plugin jquerypp/dom/form_params
     * @test jquerypp/dom/form_params/qunit.html
     * @hide
     *
     * Returns a JavaScript object for values in a form.
     * It creates nested objects by using bracket notation in the form element name.
     *
     * @param {Object} [params] If an object is passed, the form will be repopulated
     * with the values of the object based on the name of the inputs within
     * the form
     * @param {Boolean} [convert=false] True if strings that look like numbers
     * and booleans should be converted and if empty string should not be added
     * to the result.
     * @return {Object} An object of name-value pairs.
     */
    $.fn.extend({
        formParams: function (params) {

            var convert;

            // Quick way to determine if something is a boolean
            if (!!params === params) {
                convert = params;
                params = null;
            }

            if (params) {
                return this.setParams(params);
            } else {
                return this.getParams(convert);
            }
        },
        setParams: function (params) {

            // Find all the inputs
            this.find("[name]").each(function () {

                var $this = $(this),
                    value = params[$this.attr("name")];

                // Don't do all this work if there's no value
                if (value !== undefined) {

                    // Nested these if statements for performance
                    if ($this.is(":radio")) {
                        if ($this.val() == value) {
                            $this.attr("checked", true);
                        }
                    } else if ($this.is(":checkbox")) {
                        // Convert single value to an array to reduce
                        // complexity
                        value = $.isArray(value) ? value : [value];
                        if ($.inArray($this.val(), value) > -1) {
                            $this.attr("checked", true);
                        }
                    } else {
                        $this.val(value);
                    }
                }
            });
        },
        getParams: function (convert) {
            var data = {},
            // This is used to keep track of the checkbox names that we've
            // already seen, so we know that we should return an array if
            // we see it multiple times. Fixes last checkbox checked bug.
                seen = {},
                current;

            this.find("[name]:not(:disabled)").each(function () {
                var $this = $(this),
                    type = $this.attr("type"),
                    name = $this.attr("name"),
                    value = $this.val(),
                    parts;

                // Don't accumulate submit buttons and nameless elements
                if (type == "submit" || !name) {
                    return;
                }

                // Figure out name parts
                parts = name.match(keyBreaker);
                if (!parts.length) {
                    parts = [name];
                }

                // Convert the value
                if (convert) {
                    value = convertValue(value);
                }

                // Assign data recursively
                nestData($this, type, data, parts, value, seen);

            });

            return data;
        }
    });

    return $;
})(jQuery);
(function (w) {
    "use strict";

    var InputMask = function (element) {
        if (!element) {
            throw new Error("InputMask requires an element argument.");
        }
        if (!element.getAttribute) {
            return
        }
        var groupRegMatch;
        this.element = element;
        this.groupLength = this.element.getAttribute("data-grouplength") || 3;
        groupRegMatch = this._buildRegexArr(this.groupLength);
        this.spacer = this.element.getAttribute("data-spacer") || ' ';
        this.placeholder = this.element.placeholder;
        this.groupRegNonUniform = groupRegMatch.length > 1;
        this.groupReg = new RegExp(groupRegMatch.join(''), !this.groupRegNonUniform ? 'g' : '')
    };

    InputMask.prototype._buildRegexArr = function (groupLengths) {
        var split = ('' + groupLengths).split(','),
            str = [];
        for (var j = 0, k = split.length; j < k; j++) {
            str.push('([\\S]{' + (split[j] === '' ? '1,' : split[j]) + '})' + (j > 0 ? "?" : ""))
        }
        return str
    };

    InputMask.prototype.format = function (value) {
        var val = value,
            match;
        if (this.groupRegNonUniform) {
            match = val.match(this.groupReg);
            if (match) {
                match.shift();
                for (var j = 0; j < match.length; j++) {
                    if (!match[j]) {
                        match.splice(j, 1);
                        j--
                    }
                }
            }
            val = (match || [val]).join(this.spacer)
        } else {
            val = val.replace(this.groupReg, "$1 ");
            if (val.substr(val.length - 1) === " ") {
                val = val.substr(0, val.length - 1)
            }
        }
        return val
    };

    InputMask.prototype.update = function () {
        var maxlength = this.element.getAttribute("maxlength"),
            val = this.format(this.element.value);
        if (maxlength) {
            val = val.substr(0, maxlength)
        }
        this.element.value = val
    };

    InputMask.prototype.unformat = function (value) {
        return value.replace(/\s/g, '')
    };

    InputMask.prototype.reset = function () {
        this.element.value = this.unformat(this.element.value)
    };

    w.InputMask = InputMask;

}(this));
(function ($) {
    "use strict";

    var componentName = "inputmask",
        enhancedAttr = "data-enhanced",
        initSelector = "[data-" + componentName + "]:not([" + enhancedAttr + "])";

    $.fn[componentName] = function () {
        return this.each(function () {
            var polite = new InputMask(this);
            $(this).bind("keyup", function () {
                polite.reset();
                polite.update()
            }).data(componentName, polite);
            polite.update()
        })
    };

    $(document).bind("enhance", function (e) {
        var $sel = $(e.target).is(initSelector) ? $(e.target) : $(initSelector, e.target);
        $sel[componentName]().attr(enhancedAttr, "true")
    })
}(jQuery));// 图片查看
// via https://github.com/allmobilize/amazeui/blob/master/js/ui.pureview.js

;
(function () {

    'use strict';

    var animation = UI.support.animation;
    var transition = UI.support.transition;

    var PureView = function (element, options) {
        this.$element = $(element);
        this.$body = $(document.body);
        this.options = $.extend({}, PureView.DEFAULTS, options);
        this.$pureview = $(this.options.tpl, {
            id: UI.utils.generateGUID('cc-pureview')
        });

        this.$slides = null;
        this.transitioning = null;
        this.scrollbarWidth = 0;

        this.init();
    };

    PureView.DEFAULTS = {
        tpl: '<div class="cc-pureview cc-pureview-bar-active">' +
        '<ul class="cc-pureview-slider"></ul>' +
        '<ul class="cc-pureview-direction">' +
        '<li class="cc-pureview-prev"><a href=""></a></li>' +
        '<li class="cc-pureview-next"><a href=""></a></li></ul>' +
        '<ol class="cc-pureview-nav"></ol>' +
        '<div class="cc-pureview-bar cc-active">' +
        '<span class="cc-pureview-title"></span>' +
        '<span class="cc-pureview-current"></span> / ' +
        '<span class="cc-pureview-total"></span></div>' +
        '<div class="cc-pureview-actions cc-active">' +
        '<a href="javascript:;" class="cc-back" ' +
        'data-cc-close="pureview"></a></div>' +
        '</div>',
        
        className: {
            prevSlide: 'cc-pureview-slide-prev',
            nextSlide: 'cc-pureview-slide-next',
            onlyOne: 'cc-pureview-only',
            active: 'cc-active',
            barActive: 'cc-pureview-bar-active',
            activeBody: 'cc-pureview-active'
        },

        selector: {
            slider: '.cc-pureview-slider',
            close: '[data-cc-close="pureview"]',
            total: '.cc-pureview-total',
            current: '.cc-pureview-current',
            title: '.cc-pureview-title',
            actions: '.cc-pureview-actions',
            bar: '.cc-pureview-bar',
            pinchZoom: '.cc-pinch-zoom',
            nav: '.cc-pureview-nav'
        },

        shareBtn: false,

        // 从何处获取图片，img 可以使用 data-rel 指定大图
        target: 'img',

        // 微信 Webview 中调用微信的图片浏览器
        // 实现图片保存、分享好友、收藏图片等功能
        weChatImagePreview: true
    };

    PureView.prototype.init = function () {
        var me = this;
        var options = this.options;
        var $element = this.$element;
        var $pureview = this.$pureview;
        var $slider = $pureview.find(options.selector.slider);
        var $nav = $pureview.find(options.selector.nav);
        var $slides = $([]);
        var $navItems = $([]);
        var $images = $element.find(options.target);
        var total = $images.length;
        var imgUrls = [];

        if (!total) {
            return;
        }

        if (total === 1) {
            $pureview.addClass(options.className.onlyOne);
        }

        $images.each(function (i, item) {
            var src;
            var title;

            if (options.target == 'a') {
                src = item.href; // to absolute path
                title = item.title || '';
            } else {
                src = $(item).data('rel') || item.src; // <img src='' data-rel='' />
                title = $(item).attr('alt') || '';
            }

            // hide bar: wechat_webview_type=1
            // http://tmt.io/wechat/  not working?
            imgUrls.push(src);

            $slides = $slides.add($('<li><div class="cc-pinch-zoom">' +
                '<img src="' + src + '" alt="' + title + '"/></div></li>'));
            $navItems = $navItems.add($('<li>' + (i + 1) + '</li>'));
        });

        $slider.append($slides);
        $nav.append($navItems);

        $('body').append($pureview);

        $pureview.find(options.selector.total).text(total);

        this.$title = $pureview.find(options.selector.title);
        this.$current = $pureview.find(options.selector.current);
        this.$bar = $pureview.find(options.selector.bar);
        this.$actions = $pureview.find(options.selector.actions);
        this.$navItems = $nav.find('li');
        this.$slides = $slider.find('li');

        if (options.shareBtn) {
            this.$actions.append('<a href="javascript:;" ' +
                'class="icon icon-share-square-o" data-cc-toggle="share"></a>');
        }

        $slider.find(options.selector.pinchZoom).each(function () {
            $(this).data('pinchzoom', new PinchZoom($(this), {}));
            $(this).on('pz_doubletap', function (e) {
                //
            });
        });

        $images.on('click.pureview', function (e) {
            e.preventDefault();
            var clicked = $images.index(this);

            // Invoke WeChat ImagePreview in WeChat
            // TODO: detect WeChat before init
            if (options.weChatImagePreview && window.WeixinJSBridge) {
                window.WeixinJSBridge.invoke('imagePreview', {
                    current: imgUrls[clicked],
                    urls: imgUrls
                });
            } else {
                me.open(clicked);
            }
        });

        $pureview.find('.cc-pureview-direction a').
            on('click.direction.pureview', function (e) {
                e.preventDefault();
                var $clicked = $(e.target).parent('li');

                if ($clicked.is('.cc-pureview-prev')) {
                    me.prevSlide();
                } else {
                    me.nextSlide();
                }
            });

        // Nav Contorl
        this.$navItems.on('click.nav.pureview', function () {
            var index = me.$navItems.index($(this));
            me.activate(me.$slides.eq(index));
        });

        // Close Icon
        $pureview.find(options.selector.close).
            on('click.close.pureview', function (e) {
                e.preventDefault();
                me.close();
            });

        $slider.hammer().on('click.pureview', function (e) {
            e.preventDefault();
            me.toggleToolBar();
        }).on('swipeleft.pureview', function (e) {
            e.preventDefault();
            me.nextSlide();
        }).on('swiperight.pureview', function (e) {
            e.preventDefault();
            me.prevSlide();
        });

        $slider.data('hammer').get('swipe').set({
            direction: Hammer.DIRECTION_HORIZONTAL,
            velocity: 0.35
        });

        $(document).on('keydown.pureview', $.proxy(function (e) {
            var keyCode = e.keyCode;
            if (keyCode == 37) {
                this.prevSlide();
            } else if (keyCode == 39) {
                this.nextSlide();
            } else if (keyCode == 27) {
                this.close();
            }
        }, this));

    };

    PureView.prototype.activate = function ($slide) {
        var options = this.options;
        var $slides = this.$slides;
        var activeIndex = $slides.index($slide);
        var alt = $slide.find('img').attr('alt') || '';
        var active = options.className.active;

        UI.utils.imageLoader($slide.find('img'), function (image) {
            $(image).addClass('cc-img-loaded');
        });

        if ($slides.find('.' + active).is($slide)) {
            return;
        }

        if (this.transitioning) {
            return;
        }

        this.transitioning = 1;

        this.$title.text(alt);
        this.$current.text(activeIndex + 1);
        $slides.removeClass();
        $slide.addClass(active);
        $slides.eq(activeIndex - 1).addClass(options.className.prevSlide);
        $slides.eq(activeIndex + 1).addClass(options.className.nextSlide);

        this.$navItems.removeClass().
            eq(activeIndex).addClass(options.className.active);

        if (transition) {
            $slide.one(transition.end, $.proxy(function () {
                this.transitioning = 0;
            }, this)).emulateTransitionEnd(300);
        } else {
            this.transitioning = 0;
        }
    };

    PureView.prototype.nextSlide = function () {
        if (this.$slides.length === 1) {
            return;
        }

        var $slides = this.$slides;
        var $active = $slides.filter('.cc-active');
        var activeIndex = $slides.index($active);
        var rightSpring = 'cc-animation-right-spring';

        if (activeIndex + 1 >= $slides.length) { // last one
            animation && $active.addClass(rightSpring).on(animation.end, function () {
                $active.removeClass(rightSpring);
            });
        } else {
            this.activate($slides.eq(activeIndex + 1));
        }
    };

    PureView.prototype.prevSlide = function () {
        if (this.$slides.length === 1) {
            return;
        }

        var $slides = this.$slides;
        var $active = $slides.filter('.cc-active');
        var activeIndex = this.$slides.index(($active));
        var leftSpring = 'cc-animation-left-spring';

        if (activeIndex === 0) { // first one
            animation && $active.addClass(leftSpring).on(animation.end, function () {
                $active.removeClass(leftSpring);
            });
        } else {
            this.activate($slides.eq(activeIndex - 1));
        }
    };

    PureView.prototype.toggleToolBar = function () {
        this.$pureview.toggleClass(this.options.className.barActive);
    };

    PureView.prototype.open = function (index) {
        var active = index || 0;
        this.checkScrollbar();
        this.setScrollbar();
        this.activate(this.$slides.eq(active));
        this.$pureview.addClass(this.options.className.active);
        this.$body.addClass(this.options.className.activeBody);
    };

    PureView.prototype.close = function () {
        var options = this.options;

        this.$pureview.removeClass(options.className.active);
        this.$slides.removeClass();

        function resetBody() {
            this.$body.removeClass(options.className.activeBody);
            this.resetScrollbar();
        }

        if (transition) {
            this.$pureview.one(transition.end, $.proxy(resetBody, this));
        } else {
            resetBody.call(this);
        }
    };

    PureView.prototype.checkScrollbar = function () {
        this.scrollbarWidth = UI.utils.measureScrollbar();
    };

    PureView.prototype.setScrollbar = function () {
        var bodyPaddingRight = parseInt((this.$body.css('padding-right') || 0), 10);
        if (this.scrollbarWidth) {
            this.$body.css('padding-right', bodyPaddingRight + this.scrollbarWidth);
        }
    };

    PureView.prototype.resetScrollbar = function () {
        this.$body.css('padding-right', '');
    };

    function Plugin(option) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('ui.pureview');
            var options = $.extend({},
                UI.utils.options($this.data('options')),
                typeof option == 'object' && option);

            if (!data) {
                $this.data('ui.pureview', (data = new PureView(this, options)));
            }

            if (typeof option == 'string') {
                data[option]();
            }
        });
    }

    $.fn.pureview = Plugin;

// Init code
    $(function () {
        $('[data-role="pureview"]').pureview();
    });

})(jQuery);(function (window, doc) {
    var m = Math,
        _bindArr = [],
        dummyStyle = doc.createElement('div').style,
        vendor = (function () {
            var vendors = 'webkitT,MozT,msT,OT,t'.split(','),
                t, i = 0,
                l = vendors.length;
            for (; i < l; i++) {
                t = vendors[i] + 'ransform';
                if (t in dummyStyle) {
                    return vendors[i].substr(0, vendors[i].length - 1)
                }
            }
            return false
        })(),
        cssVendor = vendor ? '-' + vendor.toLowerCase() + '-' : '',
        transform = prefixStyle('transform'),
        transitionProperty = prefixStyle('transitionProperty'),
        transitionDuration = prefixStyle('transitionDuration'),
        transformOrigin = prefixStyle('transformOrigin'),
        transitionTimingFunction = prefixStyle('transitionTimingFunction'),
        transitionDelay = prefixStyle('transitionDelay'),
        isAndroid = (/android/gi).test(navigator.appVersion),
        isTouchPad = (/hp-tablet/gi).test(navigator.appVersion),
        has3d = prefixStyle('perspective') in dummyStyle,
        hasTouch = 'ontouchstart' in window && !isTouchPad,
        hasTransform = !!vendor,
        hasTransitionEnd = prefixStyle('transition') in dummyStyle,
        RESIZE_EV = 'onorientationchange' in window ? 'orientationchange' : 'resize',
        START_EV = hasTouch ? 'touchstart' : 'mousedown',
        MOVE_EV = hasTouch ? 'touchmove' : 'mousemove',
        END_EV = hasTouch ? 'touchend' : 'mouseup',
        CANCEL_EV = hasTouch ? 'touchcancel' : 'mouseup',
        TRNEND_EV = (function () {
            if (vendor === false) return false;
            var transitionEnd = {
                '': 'transitionend',
                'webkit': 'webkitTransitionEnd',
                'Moz': 'transitionend',
                'O': 'otransitionend',
                'ms': 'MSTransitionEnd'
            };
            return transitionEnd[vendor]
        })(),
        nextFrame = (function () {
            return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
                function (callback) {
                    return setTimeout(callback, 1)
                }
        })(),
        cancelFrame = (function () {
            return window.cancelRequestAnimationFrame || window.webkitCancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.mozCancelRequestAnimationFrame || window.oCancelRequestAnimationFrame || window.msCancelRequestAnimationFrame || clearTimeout
        })(),
        translateZ = has3d ? ' translateZ(0)' : '',
        iScroll = function (el, options) {
            var that = this,
                i;
            that.wrapper = typeof el == 'object' ? el : doc.getElementById(el);
            that.wrapper.style.overflow = 'hidden';
            that.scroller = that.wrapper.children[0];
            that.translateZ = translateZ;
            that.options = {
                hScroll: true,
                vScroll: true,
                x: 0,
                y: 0,
                bounce: true,
                bounceLock: false,
                momentum: true,
                lockDirection: true,
                useTransform: true,
                useTransition: false,
                topOffset: 0,
                checkDOMChanges: false,
                handleClick: true,
                onRefresh: null,
                onBeforeScrollStart: function (e) {
                    e.preventDefault()
                },
                onScrollStart: null,
                onBeforeScrollMove: null,
                onScrollMove: null,
                onBeforeScrollEnd: null,
                onScrollEnd: null,
                onTouchEnd: null,
                onDestroy: null
            };
            for (i in options) that.options[i] = options[i];
            that.x = that.options.x;
            that.y = that.options.y;
            that.options.useTransform = hasTransform && that.options.useTransform;
            that.options.useTransition = hasTransitionEnd && that.options.useTransition;
            that.scroller.style[transitionProperty] = that.options.useTransform ? cssVendor + 'transform' : 'top left';
            that.scroller.style[transitionDuration] = '0';
            that.scroller.style[transformOrigin] = '0 0';
            if (that.options.useTransition) that.scroller.style[transitionTimingFunction] = 'cubic-bezier(0.33,0.66,0.66,1)';
            if (that.options.useTransform) that.scroller.style[transform] = 'translate(' + that.x + 'px,' + that.y + 'px)' + translateZ;
            else that.scroller.style.cssText += ';position:absolute;top:' + that.y + 'px;left:' + that.x + 'px';
            that.refresh();
            that._bind(RESIZE_EV, window);
            that._bind(START_EV);
            if (that.options.checkDOMChanges) that.checkDOMTime = setInterval(function () {
                that._checkDOMChanges()
            }, 500)
        };
    iScroll.prototype = {
        enabled: true,
        x: 0,
        y: 0,
        steps: [],
        scale: 1,
        currPageX: 0,
        currPageY: 0,
        pagesX: [],
        pagesY: [],
        aniTime: null,
        isStopScrollAction: false,
        handleEvent: function (e) {
            var that = this;
            switch (e.type) {
                case START_EV:
                    if (!hasTouch && e.button !== 0) return;
                    that._start(e);
                    break;
                case MOVE_EV:
                    that._move(e);
                    break;
                case END_EV:
                case CANCEL_EV:
                    that._end(e);
                    break;
                case RESIZE_EV:
                    that._resize();
                    break;
                case TRNEND_EV:
                    that._transitionEnd(e);
                    break
            }
        },
        _checkDOMChanges: function () {
            if (this.moved || this.animating || (this.scrollerW == this.scroller.offsetWidth * this.scale && this.scrollerH == this.scroller.offsetHeight * this.scale)) return;
            this.refresh()
        },
        _resize: function () {
            var that = this;
            setTimeout(function () {
                that.refresh()
            }, isAndroid ? 200 : 0)
        },
        _pos: function (x, y) {
            x = this.hScroll ? x : 0;
            y = this.vScroll ? y : 0;
            if (this.options.useTransform) {
                this.scroller.style[transform] = 'translate(' + x + 'px,' + y + 'px) scale(' + this.scale + ')' + translateZ
            } else {
                x = m.round(x);
                y = m.round(y);
                this.scroller.style.left = x + 'px';
                this.scroller.style.top = y + 'px'
            }
            this.x = x;
            this.y = y
        },
        _start: function (e) {
            var that = this,
                point = hasTouch ? e.touches[0] : e,
                matrix, x, y, c1, c2;
            if (!that.enabled) return;
            if (that.options.onBeforeScrollStart) that.options.onBeforeScrollStart.call(that, e);
            if (that.options.useTransition) that._transitionTime(0);
            that.moved = false;
            that.animating = false;
            that.distX = 0;
            that.distY = 0;
            that.absDistX = 0;
            that.absDistY = 0;
            that.dirX = 0;
            that.dirY = 0;
            that.isStopScrollAction = false;
            if (that.options.momentum) {
                if (that.options.useTransform) {
                    matrix = getComputedStyle(that.scroller, null)[transform].replace(/[^0-9\-.,]/g, '').split(',');
                    x = +matrix[4];
                    y = +matrix[5]
                } else {
                    x = +getComputedStyle(that.scroller, null).left.replace(/[^0-9-]/g, '');
                    y = +getComputedStyle(that.scroller, null).top.replace(/[^0-9-]/g, '')
                }
                if (m.round(x) != m.round(that.x) || m.round(y) != m.round(that.y)) {
                    that.isStopScrollAction = true;
                    if (that.options.useTransition) that._unbind(TRNEND_EV);
                    else cancelFrame(that.aniTime);
                    that.steps = [];
                    that._pos(x, y);
                    if (that.options.onScrollEnd) that.options.onScrollEnd.call(that)
                }
            }
            that.startX = that.x;
            that.startY = that.y;
            that.pointX = point.pageX;
            that.pointY = point.pageY;
            that.startTime = e.timeStamp || Date.now();
            if (that.options.onScrollStart) that.options.onScrollStart.call(that, e);
            that._bind(MOVE_EV, window);
            that._bind(END_EV, window);
            that._bind(CANCEL_EV, window)
        },
        _move: function (e) {
            var that = this,
                point = hasTouch ? e.touches[0] : e,
                deltaX = point.pageX - that.pointX,
                deltaY = point.pageY - that.pointY,
                newX = that.x + deltaX,
                newY = that.y + deltaY,
                timestamp = e.timeStamp || Date.now();
            if (that.options.onBeforeScrollMove) that.options.onBeforeScrollMove.call(that, e);
            that.pointX = point.pageX;
            that.pointY = point.pageY;
            if (newX > 0 || newX < that.maxScrollX) {
                newX = that.options.bounce ? that.x + (deltaX / 2) : newX >= 0 || that.maxScrollX >= 0 ? 0 : that.maxScrollX
            }
            if (newY > that.minScrollY || newY < that.maxScrollY) {
                newY = that.options.bounce ? that.y + (deltaY / 2) : newY >= that.minScrollY || that.maxScrollY >= 0 ? that.minScrollY : that.maxScrollY
            }
            that.distX += deltaX;
            that.distY += deltaY;
            that.absDistX = m.abs(that.distX);
            that.absDistY = m.abs(that.distY);
            if (that.absDistX < 6 && that.absDistY < 6) {
                return
            }
            if (that.options.lockDirection) {
                if (that.absDistX > that.absDistY + 5) {
                    newY = that.y;
                    deltaY = 0
                } else if (that.absDistY > that.absDistX + 5) {
                    newX = that.x;
                    deltaX = 0
                }
            }
            that.moved = true;
            that._beforePos ? that._beforePos(newY, deltaY) && that._pos(newX, newY) : that._pos(newX, newY);
            that.dirX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
            that.dirY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;
            if (timestamp - that.startTime > 300) {
                that.startTime = timestamp;
                that.startX = that.x;
                that.startY = that.y
            }
            if (that.options.onScrollMove) that.options.onScrollMove.call(that, e)
        },
        _end: function (e) {
            if (hasTouch && e.touches.length !== 0) return;
            var that = this,
                point = hasTouch ? e.changedTouches[0] : e,
                target, ev, momentumX = {
                    dist: 0,
                    time: 0
                },
                momentumY = {
                    dist: 0,
                    time: 0
                },
                duration = (e.timeStamp || Date.now()) - that.startTime,
                newPosX = that.x,
                newPosY = that.y,
                newDuration;
            that._unbind(MOVE_EV, window);
            that._unbind(END_EV, window);
            that._unbind(CANCEL_EV, window);
            if (that.options.onBeforeScrollEnd) that.options.onBeforeScrollEnd.call(that, e);
            if (!that.moved) {
                if (hasTouch && this.options.handleClick && !that.isStopScrollAction) {
                    that.doubleTapTimer = setTimeout(function () {
                        that.doubleTapTimer = null;
                        target = point.target;
                        while (target.nodeType != 1) target = target.parentNode;
                        if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA') {
                            ev = doc.createEvent('MouseEvents');
                            ev.initMouseEvent('click', true, true, e.view, 1, point.screenX, point.screenY, point.clientX, point.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, 0, null);
                            ev._fake = true;
                            target.dispatchEvent(ev)
                        }
                    }, 0)
                }
                that._resetPos(400);
                if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
                return
            }
            if (duration < 300 && that.options.momentum) {
                momentumX = newPosX ? that._momentum(newPosX - that.startX, duration, -that.x, that.scrollerW - that.wrapperW + that.x, that.options.bounce ? that.wrapperW : 0) : momentumX;
                momentumY = newPosY ? that._momentum(newPosY - that.startY, duration, -that.y, (that.maxScrollY < 0 ? that.scrollerH - that.wrapperH + that.y - that.minScrollY : 0), that.options.bounce ? that.wrapperH : 0) : momentumY;
                newPosX = that.x + momentumX.dist;
                newPosY = that.y + momentumY.dist;
                if ((that.x > 0 && newPosX > 0) || (that.x < that.maxScrollX && newPosX < that.maxScrollX)) momentumX = {
                    dist: 0,
                    time: 0
                };
                if ((that.y > that.minScrollY && newPosY > that.minScrollY) || (that.y < that.maxScrollY && newPosY < that.maxScrollY)) momentumY = {
                    dist: 0,
                    time: 0
                }
            }
            if (momentumX.dist || momentumY.dist) {
                newDuration = m.max(m.max(momentumX.time, momentumY.time), 10);
                that.scrollTo(m.round(newPosX), m.round(newPosY), newDuration);
                if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
                return
            }
            that._resetPos(200);
            if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e)
        },
        _resetPos: function (time) {
            var that = this,
                resetX = that.x >= 0 ? 0 : that.x < that.maxScrollX ? that.maxScrollX : that.x,
                resetY = that.y >= that.minScrollY || that.maxScrollY > 0 ? that.minScrollY : that.y < that.maxScrollY ? that.maxScrollY : that.y;
            if (resetX == that.x && resetY == that.y) {
                if (that.moved) {
                    that.moved = false;
                    if (that.options.onScrollEnd) that.options.onScrollEnd.call(that);
                    if (that._afterPos) that._afterPos()
                }
                return
            }
            that.scrollTo(resetX, resetY, time || 0)
        },
        _transitionEnd: function (e) {
            var that = this;
            if (e.target != that.scroller) return;
            that._unbind(TRNEND_EV);
            that._startAni()
        },
        _startAni: function () {
            var that = this,
                startX = that.x,
                startY = that.y,
                startTime = Date.now(),
                step, easeOut, animate;
            if (that.animating) return;
            if (!that.steps.length) {
                that._resetPos(400);
                return
            }
            step = that.steps.shift();
            if (step.x == startX && step.y == startY) step.time = 0;
            that.animating = true;
            that.moved = true;
            if (that.options.useTransition) {
                that._transitionTime(step.time);
                that._pos(step.x, step.y);
                that.animating = false;
                if (step.time) that._bind(TRNEND_EV);
                else that._resetPos(0);
                return
            }
            animate = function () {
                var now = Date.now(),
                    newX, newY;
                if (now >= startTime + step.time) {
                    that._pos(step.x, step.y);
                    that.animating = false;
                    if (that.options.onAnimationEnd) that.options.onAnimationEnd.call(that);
                    that._startAni();
                    return
                }
                now = (now - startTime) / step.time - 1;
                easeOut = m.sqrt(1 - now * now);
                newX = (step.x - startX) * easeOut + startX;
                newY = (step.y - startY) * easeOut + startY;
                that._pos(newX, newY);
                if (that.animating) that.aniTime = nextFrame(animate)
            };
            animate()
        },
        _transitionTime: function (time) {
            time += 'ms';
            this.scroller.style[transitionDuration] = time
        },
        _momentum: function (dist, time, maxDistUpper, maxDistLower, size) {
            var deceleration = 0.0006,
                speed = m.abs(dist) * (this.options.speedScale || 1) / time,
                newDist = (speed * speed) / (2 * deceleration),
                newTime = 0,
                outsideDist = 0;
            if (dist > 0 && newDist > maxDistUpper) {
                outsideDist = size / (6 / (newDist / speed * deceleration));
                maxDistUpper = maxDistUpper + outsideDist;
                speed = speed * maxDistUpper / newDist;
                newDist = maxDistUpper
            } else if (dist < 0 && newDist > maxDistLower) {
                outsideDist = size / (6 / (newDist / speed * deceleration));
                maxDistLower = maxDistLower + outsideDist;
                speed = speed * maxDistLower / newDist;
                newDist = maxDistLower
            }
            newDist = newDist * (dist < 0 ? -1 : 1);
            newTime = speed / deceleration;
            return {
                dist: newDist,
                time: m.round(newTime)
            }
        },
        _offset: function (el) {
            var left = -el.offsetLeft,
                top = -el.offsetTop;
            while (el = el.offsetParent) {
                left -= el.offsetLeft;
                top -= el.offsetTop
            }
            if (el != this.wrapper) {
                left *= this.scale;
                top *= this.scale
            }
            return {
                left: left,
                top: top
            }
        },
        _bind: function (type, el, bubble) {
            _bindArr.concat([el || this.scroller, type, this]);
            (el || this.scroller).addEventListener(type, this, !!bubble)
        },
        _unbind: function (type, el, bubble) {
            (el || this.scroller).removeEventListener(type, this, !!bubble)
        },
        destroy: function () {
            var that = this;
            that.scroller.style[transform] = '';
            that._unbind(RESIZE_EV, window);
            that._unbind(START_EV);
            that._unbind(MOVE_EV, window);
            that._unbind(END_EV, window);
            that._unbind(CANCEL_EV, window);
            if (that.options.useTransition) that._unbind(TRNEND_EV);
            if (that.options.checkDOMChanges) clearInterval(that.checkDOMTime);
            if (that.options.onDestroy) that.options.onDestroy.call(that);
            for (var i = 0, l = _bindArr.length; i < l;) {
                _bindArr[i].removeEventListener(_bindArr[i + 1], _bindArr[i + 2]);
                _bindArr[i] = null;
                i = i + 3
            }
            _bindArr = []
        },
        refresh: function () {
            var that = this,
                offset;
            that.wrapperW = that.wrapper.clientWidth || 1;
            that.wrapperH = that.wrapper.clientHeight || 1;
            that.minScrollY = -that.options.topOffset || 0;
            that.scrollerW = m.round(that.scroller.offsetWidth * that.scale);
            that.scrollerH = m.round((that.scroller.offsetHeight + that.minScrollY) * that.scale);
            that.maxScrollX = that.wrapperW - that.scrollerW;
            that.maxScrollY = that.wrapperH - that.scrollerH + that.minScrollY;
            that.dirX = 0;
            that.dirY = 0;
            if (that.options.onRefresh) that.options.onRefresh.call(that);
            that.hScroll = that.options.hScroll && that.maxScrollX < 0;
            that.vScroll = that.options.vScroll && (!that.options.bounceLock && !that.hScroll || that.scrollerH > that.wrapperH);
            offset = that._offset(that.wrapper);
            that.wrapperOffsetLeft = -offset.left;
            that.wrapperOffsetTop = -offset.top;
            that.scroller.style[transitionDuration] = '0';
            that._resetPos(400)
        },
        scrollTo: function (x, y, time, relative) {
            var that = this,
                step = x,
                i, l;
            that.stop();
            if (!step.length) step = [{
                x: x,
                y: y,
                time: time,
                relative: relative
            }];
            for (i = 0, l = step.length; i < l; i++) {
                if (step[i].relative) {
                    step[i].x = that.x - step[i].x;
                    step[i].y = that.y - step[i].y
                }
                that.steps.push({
                    x: step[i].x,
                    y: step[i].y,
                    time: step[i].time || 0
                })
            }
            that._startAni()
        },
        scrollToElement: function (el, time) {
            var that = this,
                pos;
            el = el.nodeType ? el : that.scroller.querySelector(el);
            if (!el) return;
            pos = that._offset(el);
            pos.left += that.wrapperOffsetLeft;
            pos.top += that.wrapperOffsetTop;
            pos.left = pos.left > 0 ? 0 : pos.left < that.maxScrollX ? that.maxScrollX : pos.left;
            pos.top = pos.top > that.minScrollY ? that.minScrollY : pos.top < that.maxScrollY ? that.maxScrollY : pos.top;
            time = time === undefined ? m.max(m.abs(pos.left) * 2, m.abs(pos.top) * 2) : time;
            that.scrollTo(pos.left, pos.top, time)
        },
        scrollToPage: function (pageX, pageY, time) {
            var that = this,
                x, y;
            time = time === undefined ? 400 : time;
            if (that.options.onScrollStart) that.options.onScrollStart.call(that);
            x = -that.wrapperW * pageX;
            y = -that.wrapperH * pageY;
            if (x < that.maxScrollX) x = that.maxScrollX;
            if (y < that.maxScrollY) y = that.maxScrollY;
            that.scrollTo(x, y, time)
        },
        disable: function () {
            this.stop();
            this._resetPos(0);
            this.enabled = false;
            this._unbind(MOVE_EV, window);
            this._unbind(END_EV, window);
            this._unbind(CANCEL_EV, window)
        },
        enable: function () {
            this.enabled = true
        },
        stop: function () {
            if (this.options.useTransition) this._unbind(TRNEND_EV);
            else cancelFrame(this.aniTime);
            this.steps = [];
            this.moved = false;
            this.animating = false
        },
        isReady: function () {
            return !this.moved && !this.animating
        }
    };

    function prefixStyle(style) {
        if (vendor === '') return style;
        style = style.charAt(0).toUpperCase() + style.substr(1);
        return vendor + style
    }

    dummyStyle = null;
    if (typeof exports !== 'undefined') exports.iScroll = iScroll;
    else window.iScroll = iScroll;
    (function ($, ns, undefined) {
        if (!$) return;
        var _iScroll = ns.iScroll,
            slice = [].slice,
            record = (function () {
                var data = {},
                    id = 0,
                    ikey = '_sid';
                return function (obj, val) {
                    var key = obj[ikey] || (obj[ikey] = ++id);
                    val !== undefined && (data[key] = val);
                    val === null && delete data[key];
                    return data[key]
                }
            })(),
            iScroll;
        ns.iScroll = iScroll = function (el, options) {
            var args = [].slice.call(arguments, 0),
                ins = new _iScroll(el, options);
            record(el, ins);
            return ins
        };
        iScroll.prototype = _iScroll.prototype;
        $.fn.iScroll = function (opts) {
            var args = slice.call(arguments, 1),
                method = typeof opts === 'string' && opts,
                ret, obj;
            $.each(this, function (i, el) {
                obj = record(el) || iScroll(el, $.isPlainObject(opts) ? opts : undefined);
                if (method === 'this') {
                    ret = obj;
                    return false
                } else if (method) {
                    if (!$.isFunction(obj[method])) {
                        throw new Error('iScroll没有此方法：' + method);
                    }
                    ret = obj[method].apply(obj, args);
                    if (ret !== undefined && ret !== obj) {
                        return false
                    }
                    ret = undefined
                }
            });
            return ret !== undefined ? ret : this
        }
    })(window.jQuery || null, window)
})(window, document);

$(function () {
    // console.log(1);
    $('[data-role="hscroller"]').iScroll({
        hScroll: true,
        vScroll: false,
        hScrollbar: false,
        vScrollbar: false
    });
});// 日历组件

;
(function ($) {

    var monthNames = ["01月", "02月", "03月", "04月", "05月", "06月",
            "07月", "08月", "09月", "10月", "11月", "12月"],

        dayNames = ["日", "一", "二", "三", "四", "五", "六"],
        offsetRE = /^(\+|\-)?(\d+)(M|Y)$/i,

    //获取月份的天数
        getDaysInMonth = function (year, month) {
            return 32 - new Date(year, month, 32).getDate();
        },

    //获取月份中的第一天是所在星期的第几天
        getFirstDayOfMonth = function (year, month) {
            return new Date(year, month, 1).getDay();
        },

    //格式化数字，不足补零.
        formatNumber = function (val, len) {
            var num = "" + val;
            while (num.length < len) {
                num = "0" + num;
            }
            return num;
        },

        parseDate = function (obj) {
            var dateRE = /^(\d{4})(?:\-|\/)(\d{1,2})(?:\-|\/)(\d{1,2})$/;
            return Object.prototype.toString.call(obj) === '[object Date]' ? obj : dateRE.test(obj) ? new Date(parseInt(RegExp.$1, 10), parseInt(RegExp.$2, 10) - 1, parseInt(RegExp.$3, 10)) : null;
        },

        formatDate = function (date) {
            return date.getFullYear() + '-' + formatNumber(date.getMonth() + 1, 2) + '-' + formatNumber(date.getDate(), 2);
        };


    var Calendar = function (element, options) {
        this.$el = $(element);
        this._options = $.extend({}, Calendar.DEFAULTS, options);
        this.minDate = this._options.minDate;
        this.maxDate = this._options.maxDate;
        this.date = this._options.date || new Date();
        this.iscroll = null;
        this.lastDate = new Date();
        this.pageIndex = 4;
        this.loading = false;
        this.init();
    }

    Calendar.DEFAULTS = {
        date: null, // 初始化日期
        firstDay: 0, // 一周从星期几开始
        minDate: null, // 最小日期
        maxDate: null, // 最大日期
        canSwipe: true,// 是否可滑动加载一个月
        perPage: 5,
        totalPage: 12,
        datePrice: null,
        loadData: function (dateStr) {

        }
    }

    Calendar.prototype = {

        init: function () {

            var el = this.$el,
                opts = this._options;
            this.renderHtml(new Date(), opts.perPage);
            // 安卓用样式不行，只能强行设置下高度
            el.find('.cc-calendar-content').height($(window).height() - 40 - $('.cc-header').height());
            this.bindEvents();
            this.refresh();

        },

        // 绑定事件
        bindEvents: function () {

            var el = this.$el,
                cell,
                date,
                _this = this,
                opts = this._options;

            $(document).on('click', '.cc-calendar-calendar tbody a', function (e) {
                var me = $(this);
                var ev = $.Event('select.calendar', {'relatedTarget': this});
                e.preventDefault();
                // if(me.hasClass('cc-active')) return;
                cell = me.parent();
                date = cell.attr('data-year') + formatNumber(cell.attr('data-month'), 2) + formatNumber(me.attr('data-date'), 2);
                var id = me.find('input').val();
                el.trigger(ev, [date, id]);
                el.find('.cc-calendar-current-day').removeClass('cc-calendar-current-day')
                el.find('.cc-calendar-calendar tbody a').removeClass('cc-active');
                me.addClass('cc-active');
            });

            this.iscroll = new iScroll(el.find('.cc-calendar-content').get(0), $.extend({
                useTransition: true,
                speedScale: 1,
                topOffset: 0
            }, {
                onScrollStart: function (e) {
                    el.trigger('scrollstart', e);
                },
                onScrollMove: function (e) {

                    if (this.y < (this.maxScrollY - 50) && _this.pageIndex < opts.totalPage) {
                        _this.loading = true;
                    }
                    el.trigger('scrollmove', e);

                },
                onScrollEnd: function (e) {
                    _this._loadingAction();
                    el.trigger('scrollend', e);
                }
            }));

        },

        // 改变状态
        setState: function (flag) {
            this.loading = flag;
        },

        // 加载数据
        _loadingAction: function () {
            var me = this,
                opts = me._options,
                loadFn = opts.loadData;
            //console.log(this.pageIndex);
            if (me.loading && this.pageIndex < opts.totalPage) {
                $.isFunction(loadFn) && loadFn(formatDate(me.lastDate));
                // 页面增加
                this.pageIndex += opts.perPage;
            }
        },

        // 外部调用，加载月份
        loadMonthData: function (priceData) {
            var opts = this._options,
                tempDate = this.lastDate,
                nowYear = tempDate.getFullYear(),
                nowMonth = tempDate.getMonth(),
                today = new Date(),
                renderDate,
                drawYear,
                drawMonth,
                minDate = this.minDate,
                maxDate = this.maxDate,
                selectedDate = this.date,
                html = '',
                i,
                j,
                firstDay,
                leadDays,
                daysInMonth,
                rows,
                printDate,
                k;

            //console.log(nowMonth);

            firstDay = (isNaN(firstDay = parseInt(opts.firstDay, 10)) ? 0 : firstDay);

            // 一次显示多少个月？

            this.lastDate = new Date(nowYear, nowMonth + opts.perPage, 1);

            for (k = 0; k < opts.perPage; k++) {

                renderDate = new Date(nowYear, nowMonth + k, 1);

                drawYear = renderDate.getFullYear();
                drawMonth = renderDate.getMonth();

                html += '<tr>' +
                    '<td colspan="7">' + this._renderHead(drawYear, drawMonth) + '</td></tr>';

                daysInMonth = getDaysInMonth(drawYear, drawMonth);
                leadDays = (getFirstDayOfMonth(drawYear, drawMonth) - firstDay + 7) % 7;
                rows = Math.ceil((leadDays + daysInMonth) / 7);
                printDate = new Date(drawYear, drawMonth, 1 - leadDays);

                for (i = 0; i < rows; i++) {
                    html += '<tr>';

                    for (j = 0; j < 7; j++) {
                        html += this._renderDay(j, printDate, firstDay, drawMonth, selectedDate, today, minDate, maxDate, priceData);
                        printDate.setDate(printDate.getDate() + 1);
                    }
                    html += '</tr>';
                }

            }

            this.$el.find('.cc-calendar-calendar').append(html);
            this.refresh();
        },
        refresh: function () {
            this.iscroll.refresh();
        },

        // 输出日期
        renderHtml: function (date, amount) {
            var opts = this._options,
                tempDate = date,
                nowYear = tempDate.getFullYear(),
                nowMonth = tempDate.getMonth(),
                today = new Date(tempDate.getFullYear(), tempDate.getMonth(),
                    tempDate.getDate()),
                renderDate,
                drawYear,
                drawMonth,
                minDate = this.minDate,
                maxDate = this.maxDate,
                selectedDate = this.date,
                html = '',
                i,
                j,
                firstDay,
                day,
                leadDays,
                daysInMonth,
                rows,
                printDate,
                k;

            //console.log(nowMonth);

            firstDay = (isNaN(firstDay = parseInt(opts.firstDay, 10)) ? 0 : firstDay);

            html += '<ul class="cc-calendar-week">';

            for (i = 0; i < 7; i++) {
                day = (i + firstDay) % 7;

                html += '<li' + ((i + firstDay + 6) % 7 >= 5 ?

                        //如果是周末则加上cc-calendar-week-end的class给th
                        ' class="cc-calendar-week-end"' : '') + '>' +
                    '<span>' + dayNames[day] + '</span></li>';
            }

            html += '</ul><div class="cc-calendar-content"><div><table  class="cc-calendar-calendar"><tbody>';


            // 一次显示多少个月？

            this.lastDate = new Date(nowYear, nowMonth + amount, 1);

            for (k = 0; k < amount; k++) {

                renderDate = new Date(nowYear, nowMonth + k, 1);

                drawYear = renderDate.getFullYear();
                drawMonth = renderDate.getMonth();

                html += '<tr>' +
                    '<td colspan="7">' + this._renderHead(drawYear, drawMonth) + '</td></tr>';

                daysInMonth = getDaysInMonth(drawYear, drawMonth);
                leadDays = (getFirstDayOfMonth(drawYear, drawMonth) - firstDay + 7) % 7;
                rows = Math.ceil((leadDays + daysInMonth) / 7);
                printDate = new Date(drawYear, drawMonth, 1 - leadDays);

                for (i = 0; i < rows; i++) {
                    html += '<tr>';

                    for (j = 0; j < 7; j++) {
                        html += this._renderDay(j, printDate, firstDay, drawMonth, selectedDate, today, minDate, maxDate, opts.datePrice);
                        printDate.setDate(printDate.getDate() + 1);
                    }
                    html += '</tr>';
                }

            }

            html += '</tbody></table></div></div>';

            this.$el.append(html);
        },

        // 显示价格
        _renderPrice: function (printDate, priceData) {

            var date,
                output = '';

            if (priceData && !$.isEmptyObject(priceData)) {
                if (priceData && $.isPlainObject(priceData)) {
                    $.each(priceData, function (k, v) {
                        date = parseDate(k);
                        if (printDate.getTime() === date.getTime()) {
                            if (v.price != '') {
                                output = '&yen;' + v.price;
                                if (v.id) {
                                    output += '<input type="hidden" value="' + v.id + '">';
                                }
                            }
                            return false;
                        }
                    });
                }
            }

            return output;

        },

        // 年月
        _renderHead: function (drawYear, drawMonth) {
            var html = '<div class="cc-calendar-header" data-date="' + drawYear + '-' + drawMonth + '-1">';

            html += '<span class="cc-calendar-year" data-value="' + drawYear + '">' + drawYear + '年' + '</span>';

            html += '<span class="cc-calendar-month" data-value="' + drawMonth + '">' + monthNames[drawMonth] + '</span>';

            return html;
        },

        // 每天
        _renderDay: function (j, printDate, firstDay, drawMonth, selectedDate, today, minDate, maxDate, priceData) {

            var otherMonth = (printDate.getMonth() !== drawMonth),
                unSelectable, priceDisplay;

            // 是否有价格
            priceDisplay = this._renderPrice(printDate, priceData);
            unSelectable = otherMonth || (minDate && printDate < minDate) || (maxDate && printDate > maxDate) || !priceDisplay;

            return "<td class='" + ((j + firstDay + 6) % 7 >= 5 ? "cc-calendar-week-end" : "") + // 标记周末

                (unSelectable ? " cc-calendar-unSelectable cc-state-disabled" : "") + //标记不可点的天

                (otherMonth || unSelectable ? '' : (printDate.getTime() === selectedDate.getTime() ? " cc-calendar-current-day" : "") + //标记当前选择
                    (printDate.getTime() === today.getTime() ? " cc-calendar-today" : "") //标记今天
                ) + "'" +

                (unSelectable ? "" : " data-month='" + (printDate.getMonth() + 1) + "' data-year='" + printDate.getFullYear() + "'") + ">" +

                (otherMonth ? "&#xa0;" : (unSelectable ? "<span class='cc-state-default'>" + (printDate.getTime() === today.getTime() ? "今天" : printDate.getDate()) + "</span>" :
                "<a class='cc-state-default" + (printDate.getTime() === today.getTime() ? " cc-state-highlight" : "") + (printDate.getTime() === selectedDate.getTime() ? " cc-state-active" : "") +
                "' href='#' data-date='" + printDate.getDate() + "'>" + (printDate.getTime() === today.getTime() ? "今天" : printDate.getDate()) + "<span class='cc-calendar-price'>" + priceDisplay + "</span></a>")) + "</td>";
        }

    }

    // 插件
    $.fn.calendar = function (option, value) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('calendar');
            var options = $.extend({}, Calendar.DEFAULTS,
                typeof option == 'object' && option);

            if (!data) {
                $this.data('calendar', (data = new Calendar(this, options)));
            }

            if (typeof option == 'string') {
                data[option] && data[option](value);
            }

        });
    }


})(jQuery);

$(function () {
    $('[data-role="calendar"]').calendar();
});
;
(function ($) {

    var FormPassword = function ($element, options) {
        this.options = $.extend({},
            FormPassword.DEFAULTS, options || {});
        this.element = $element;
        this.input = this.element.next("input").length ? this.element.next("input") : this.element.closest('.input-row').find("input");
        this.init();
    }

    FormPassword.DEFAULTS = {
        "showText": '<i class="cc-icon-eye f20 color-grayLight"></i>',
        "hideText": '<i class="cc-icon-eye-o f20 color-grayLight"></i>'
    };

    FormPassword.prototype = {

        init: function () {

            var $el = this.element,
                $input = this.input,
                me = this;

            $el.on("click", function (e) {

                e.preventDefault();

                if ($input.length) {
                    var type = $input.attr("type");
                    $input.attr("type", type == "text" ? "password" : "text");
                    $el.html(me.options[type == "text" ? "showText" : "hideText"]);
                }
            });
            $el.html(me.options[$input.is("[type='password']") ? "showText" : "hideText"]);
        }
    }

    //  插件
    $.fn.formPassword = function (settings) {
        return this.each(function () {
            var that = $(this);
            var plugin = that.data('formPassword');
            if (!plugin) {
                plugin = new FormPassword(that, settings);
                that.data('formPassword', plugin);
            }
        });
    }

})(jQuery);

$(function () {
    $('[data-role="password"]').formPassword();
});// 倒计时
;
(function ($) {

    var formatNumber = function (val, len) {
        var num = "" + val;
        while (num.length < len) {
            num = "0" + num;
        }
        return num;
    }

    $.fn.countdown = function (options) {

        var defaults = {
            diffTime: 0,
            attr: 'data-time',
            finishText: '已结束',
            onFinish: function () {

            }
        }

        var opts = $.extend(defaults, options || {});

        return this.each(function () {

            var me = $(this),
                timestamp = parseInt(me.attr(opts.attr) * 1000),
                endTime = new Date(timestamp),
                nowTime,
                TS,
                D,
                H,
                M,
                S,
                MS;

            setInterval(function () {

                nowTime = new Date();
                TS = endTime.getTime() - nowTime.getTime() + opts.diffTime;
                D = Math.floor(TS / (1000 * 60 * 60 * 24)); //天
                H = Math.floor(TS / (1000 * 60 * 60)) % 24; //小时
                M = Math.floor(TS / (1000 * 60)) % 60; //分钟
                S = Math.floor(TS / 1000) % 60; //秒
                MS = Math.floor(TS / 100) % 10; //拆分秒
                if (D >= 0) {
                    D = D == 0 ? '' : formatNumber(D, 2) + "天";
                    H = H == 0 ? '' : formatNumber(H, 2) + "小时";
                    M = M == 0 ? '' : formatNumber(M, 2) + "分";
                    S = S == 0 ? '' : formatNumber(S, 2) + "秒";
                    // var timeStr = D + "天" + H + "小时" + M + "分" + S + "." + MS +  "秒";
                    var timeStr = D + H + M + S;
                } else {
                    var timeStr = opts.finishText;
                    $.isFunction(opts.onFinish) && opts.onFinish();
                }
                me.html(timeStr);

            }, 1000);

        });

    }

})(jQuery);

$(function () {
    $('[data-role="countdown"]').countdown();
});/*
 * 微信端页面滚动插件
 * by noop
 */
;
(function ($) {

    function isIosWeixin() {
        var ua = navigator.userAgent.toLowerCase();
        if (ua.match(/MicroMessenger/i) == "micromessenger" && ua.indexOf('iphone') > 0) {
            return true;
        } else {
            return false;
        }
    }

    var lastAnimation = 0;

    var PageScroll = function (element, options) {

        this.elem = $(element);
        this.settings = $.extend({}, PageScroll.DEFAULTS, options);
        this.sections = $(this.settings.section, this.elem);
        this.total = this.sections.length;
        this.current = 0;
        this.paginationList = "";
        this.pagination = null;
        this.init();
        this.bindEvents();

    }

    PageScroll.DEFAULTS = {
        section: "section",
        animation: {
            easing: "ease",
            animationTime: 1000
        },
        waitingPeriod: 0,
        beforeMove: null,
        afterMove: null,
        direction: 'vertical',
        pagination: true
    };

    PageScroll.prototype = {

        init: function () {
            var me = this,
                el = this.elem,
                sections = me.sections,
                settings = me.settings,
                topPos = 0,
                leftPos = 0;
            el.addClass("section-wrapper").css({
                position: "relative",
                width: "100%",
                height: '100%',
                '-webkit-transform-style': 'preserve-3d',
                'transform-style': 'preserve-3d',
                display: 'block'
            });
            $.each(sections, function (i) {
                $(this).css({
                    position: "absolute",
                    top: topPos + "%"
                }).addClass("section").attr("data-index", i + 1);
                $(this).css({
                    width: '100%',
                    height: '100%',
                    position: "absolute",
                    left: ( settings.direction == 'horizontal' )
                        ? leftPos + "%"
                        : 0,
                    top: ( settings.direction == 'vertical' || settings.direction != 'horizontal' )
                        ? topPos + "%"
                        : 0
                });
                if (settings.direction == 'horizontal')
                    leftPos = leftPos + 100;
                else
                    topPos = topPos + 100;
                if (settings.pagination == true) {
                    var activeClass = i == 0 ? 'active' : '';
                    me.paginationList += '<li class="' + activeClass + '"></li>';
                }
            });

            if (settings.pagination == true) {
                this.pagination = $('ul.page-scroll-pagination');
                if (this.pagination.length < 1) this.pagination = $("<ul class='page-scroll-pagination'></ul>").appendTo('body');
                this.pagination.addClass(settings.direction).html(me.paginationList);
            }
        },

        bindEvents: function () {
            var me = this,
                settings = this.settings;
            // 依赖Hammer.js
            var hammer = new Hammer(this.elem.get(0));
            // 滚动方向
            hammer.on(settings.direction == 'vertical' ? 'panup' : 'panright', function (e) {
                me.movePage('next');
            });
            hammer.on(settings.direction == 'vertical' ? 'pandown' : 'panleft', function (e) {
                me.movePage('prev');
            });

        },

        movePage: function (direction) {

            // 滑动条件
            if (direction == 'next' && this.current == this.total - 1) return;
            if (direction == 'prev' && this.current == 0) return;

            var me = this,
                ele = this.elem,
                settings = this.settings;

            // 是否在动画中?
            var timeNow = new Date().getTime();
            if (timeNow - lastAnimation < settings.waitingPeriod + settings.animation.animationTime) {
                //console.log('animated');
                return;
            }
            lastAnimation = timeNow;

            // 执行动画
            direction == 'next' ? me.current++ : me.current--;
            var pos = me.current * 100 * -1;
            $.isFunction(settings.beforeMove) && settings.beforeMove(me.current + 1);

            function doneFun() {
                $.isFunction(settings.afterMove) && settings.afterMove(me.current + 1);
            }

            if (isIosWeixin()) {

                if (settings.direction == 'horizontal') {
                    var toppos = (ele.width() / 100) * pos;
                    ele.animate({left: toppos + 'px'}, settings.animation.animationTime, function () {
                        doneFun();
                    });
                } else {
                    var toppos = (ele.height() / 100) * pos;
                    ele.animate({top: toppos + 'px'}, settings.animation.animationTime, function () {
                        doneFun();
                    });
                }
            } else {
                ele.css({
                    "-webkit-transform": ( settings.direction == 'horizontal' ) ? "translate3d(" + pos + "%, 0, 0)" : "translate3d(0, " + pos + "%, 0)",
                    "-webkit-transition": "all " + settings.animation.animationTime + "ms " + settings.animation.easing,
                    "-moz-transform": ( settings.direction == 'horizontal' ) ? "translate3d(" + pos + "%, 0, 0)" : "translate3d(0, " + pos + "%, 0)",
                    "-moz-transition": "all " + settings.animation.animationTime + "ms " + settings.animation.easing,
                    "-ms-transform": ( settings.direction == 'horizontal' ) ? "translate3d(" + pos + "%, 0, 0)" : "translate3d(0, " + pos + "%, 0)",
                    "-ms-transition": "all " + settings.animation.animationTime + "ms " + settings.animation.easing,
                    "transform": ( settings.direction == 'horizontal' ) ? "translate3d(" + pos + "%, 0, 0)" : "translate3d(0, " + pos + "%, 0)",
                    "transition": "all " + settings.animation.animationTime + "ms " + settings.animation.easing
                });
                ele.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function (e) {
                    doneFun();
                });
            }

            this.pagination.find('li').eq(this.current).addClass('active').siblings().removeClass('active');

        },

        prev: function () {
            this.movePage('prev');
        },

        next: function () {
            this.movePage('next');
        }
    }

    // 插件
    $.fn.page_scroll = function (option, value) {
        return this.each(function () {
            var $this = $(this),
                data = $this.data('page_scroll'),
                options = $.extend({}, typeof option == 'object' ? option : {});
            if (!data) {
                $this.data('page_scroll', (data = new PageScroll(this, options)));
            }
            //调用方法
            if (typeof option == 'string') {
                data[option](value);
            }
        });
    }

}(window.jQuery || window.Zepto))// 无限滚动加载
;
(function () {

    function InfiniteScroll(elem, options) {
        this.$elem = $(elem);
        this.options = $.extend({},
            InfiniteScroll.DEFAULTS, options || {});

        this.bind();
    }

    // 初始值
    InfiniteScroll.DEFAULTS = {
        distance: 50,
        direction: 'bottom'
    };

    InfiniteScroll.prototype = {

        handleInfiniteScroll: function () {
            var inf = this.$elem,
                scrollTop = inf[0].scrollTop,
                scrollHeight = inf[0].scrollHeight,
                height = inf[0].offsetHeight,
                distance,
                dir;
            if (!inf.is($(window))) {
                distance = inf[0].getAttribute('data-distance');
                dir = inf[0].getAttribute('data-direction');
            }
            if (!distance) distance = this.options.distance;
            if (!dir) dir = this.options.direction;
            if (typeof distance === 'string' && distance.indexOf('%') >= 0) {
                distance = parseInt(distance, 10) / 100 * height;
            }
            if (distance > height) distance = height;
            if (dir == 'top') {
                if (scrollTop < distance) {
                    inf.trigger('infinite', [dir]);
                }
            }
            else {
                if (scrollTop + height >= scrollHeight - distance) {
                    inf.trigger('infinite', [dir]);
                }
            }
        },

        bind: function () {
            this.$elem.on('scroll.infinite', $.proxy(function () {
                this.handleInfiniteScroll();
            }, this));
        },

        unbind: function () {
            this.$elem.off('scroll.infinite');
        }
    }

    $.fn.infiniteScroll = function (option) {

        return this.each(function () {
            var $this = $(this);
            var data = $this.data('infiniteScroll');
            var options = $.extend({}, InfiniteScroll.DEFAULTS,
                typeof option == 'object' && option);

            if (!data) {
                $this.data('infiniteScroll', (data = new InfiniteScroll(this, options)));
            }

            if (typeof option == 'string') {
                data[option] && data[option]();
            }

        });
    }


})(jQuery);

/*!
Waypoints - 4.0.0
Copyright © 2011-2015 Caleb Troughton
Licensed under the MIT license.
https://github.com/imakewebthings/waypoints/blog/master/licenses.txt
*/
;(function() {
  'use strict'

  var keyCounter = 0
  var allWaypoints = {}

  /* http://imakewebthings.com/waypoints/api/waypoint */
  function Waypoint(options) {
    if (!options) {
      throw new Error('No options passed to Waypoint constructor')
    }
    if (!options.element) {
      throw new Error('No element option passed to Waypoint constructor')
    }
    if (!options.handler) {
      throw new Error('No handler option passed to Waypoint constructor')
    }

    this.key = 'waypoint-' + keyCounter
    this.options = Waypoint.Adapter.extend({}, Waypoint.defaults, options)
    this.element = this.options.element
    this.adapter = new Waypoint.Adapter(this.element)
    this.callback = options.handler
    this.axis = this.options.horizontal ? 'horizontal' : 'vertical'
    this.enabled = this.options.enabled
    this.triggerPoint = null
    this.group = Waypoint.Group.findOrCreate({
      name: this.options.group,
      axis: this.axis
    })
    this.context = Waypoint.Context.findOrCreateByElement(this.options.context)

    if (Waypoint.offsetAliases[this.options.offset]) {
      this.options.offset = Waypoint.offsetAliases[this.options.offset]
    }
    this.group.add(this)
    this.context.add(this)
    allWaypoints[this.key] = this
    keyCounter += 1
  }

  /* Private */
  Waypoint.prototype.queueTrigger = function(direction) {
    this.group.queueTrigger(this, direction)
  }

  /* Private */
  Waypoint.prototype.trigger = function(args) {
    if (!this.enabled) {
      return
    }
    if (this.callback) {
      this.callback.apply(this, args)
    }
  }

  /* Public */
  /* http://imakewebthings.com/waypoints/api/destroy */
  Waypoint.prototype.destroy = function() {
    this.context.remove(this)
    this.group.remove(this)
    delete allWaypoints[this.key]
  }

  /* Public */
  /* http://imakewebthings.com/waypoints/api/disable */
  Waypoint.prototype.disable = function() {
    this.enabled = false
    return this
  }

  /* Public */
  /* http://imakewebthings.com/waypoints/api/enable */
  Waypoint.prototype.enable = function() {
    this.context.refresh()
    this.enabled = true
    return this
  }

  /* Public */
  /* http://imakewebthings.com/waypoints/api/next */
  Waypoint.prototype.next = function() {
    return this.group.next(this)
  }

  /* Public */
  /* http://imakewebthings.com/waypoints/api/previous */
  Waypoint.prototype.previous = function() {
    return this.group.previous(this)
  }

  /* Private */
  Waypoint.invokeAll = function(method) {
    var allWaypointsArray = []
    for (var waypointKey in allWaypoints) {
      allWaypointsArray.push(allWaypoints[waypointKey])
    }
    for (var i = 0, end = allWaypointsArray.length; i < end; i++) {
      allWaypointsArray[i][method]()
    }
  }

  /* Public */
  /* http://imakewebthings.com/waypoints/api/destroy-all */
  Waypoint.destroyAll = function() {
    Waypoint.invokeAll('destroy')
  }

  /* Public */
  /* http://imakewebthings.com/waypoints/api/disable-all */
  Waypoint.disableAll = function() {
    Waypoint.invokeAll('disable')
  }

  /* Public */
  /* http://imakewebthings.com/waypoints/api/enable-all */
  Waypoint.enableAll = function() {
    Waypoint.invokeAll('enable')
  }

  /* Public */
  /* http://imakewebthings.com/waypoints/api/refresh-all */
  Waypoint.refreshAll = function() {
    Waypoint.Context.refreshAll()
  }

  /* Public */
  /* http://imakewebthings.com/waypoints/api/viewport-height */
  Waypoint.viewportHeight = function() {
    return window.innerHeight || document.documentElement.clientHeight
  }

  /* Public */
  /* http://imakewebthings.com/waypoints/api/viewport-width */
  Waypoint.viewportWidth = function() {
    return document.documentElement.clientWidth
  }

  Waypoint.adapters = []

  Waypoint.defaults = {
    context: window,
    continuous: true,
    enabled: true,
    group: 'default',
    horizontal: false,
    offset: 0
  }

  Waypoint.offsetAliases = {
    'bottom-in-view': function() {
      return this.context.innerHeight() - this.adapter.outerHeight()
    },
    'right-in-view': function() {
      return this.context.innerWidth() - this.adapter.outerWidth()
    }
  }

  window.Waypoint = Waypoint
}())
;(function() {
  'use strict'

  function requestAnimationFrameShim(callback) {
    window.setTimeout(callback, 1000 / 60)
  }

  var keyCounter = 0
  var contexts = {}
  var Waypoint = window.Waypoint
  var oldWindowLoad = window.onload

  /* http://imakewebthings.com/waypoints/api/context */
  function Context(element) {
    this.element = element
    this.Adapter = Waypoint.Adapter
    this.adapter = new this.Adapter(element)
    this.key = 'waypoint-context-' + keyCounter
    this.didScroll = false
    this.didResize = false
    this.oldScroll = {
      x: this.adapter.scrollLeft(),
      y: this.adapter.scrollTop()
    }
    this.waypoints = {
      vertical: {},
      horizontal: {}
    }

    element.waypointContextKey = this.key
    contexts[element.waypointContextKey] = this
    keyCounter += 1

    this.createThrottledScrollHandler()
    this.createThrottledResizeHandler()
  }

  /* Private */
  Context.prototype.add = function(waypoint) {
    var axis = waypoint.options.horizontal ? 'horizontal' : 'vertical'
    this.waypoints[axis][waypoint.key] = waypoint
    this.refresh()
  }

  /* Private */
  Context.prototype.checkEmpty = function() {
    var horizontalEmpty = this.Adapter.isEmptyObject(this.waypoints.horizontal)
    var verticalEmpty = this.Adapter.isEmptyObject(this.waypoints.vertical)
    if (horizontalEmpty && verticalEmpty) {
      this.adapter.off('.waypoints')
      delete contexts[this.key]
    }
  }

  /* Private */
  Context.prototype.createThrottledResizeHandler = function() {
    var self = this

    function resizeHandler() {
      self.handleResize()
      self.didResize = false
    }

    this.adapter.on('resize.waypoints', function() {
      if (!self.didResize) {
        self.didResize = true
        Waypoint.requestAnimationFrame(resizeHandler)
      }
    })
  }

  /* Private */
  Context.prototype.createThrottledScrollHandler = function() {
    var self = this
    function scrollHandler() {
      self.handleScroll()
      self.didScroll = false
    }

    this.adapter.on('scroll.waypoints', function() {
      if (!self.didScroll || Waypoint.isTouch) {
        self.didScroll = true
        Waypoint.requestAnimationFrame(scrollHandler)
      }
    })
  }

  /* Private */
  Context.prototype.handleResize = function() {
    Waypoint.Context.refreshAll()
  }

  /* Private */
  Context.prototype.handleScroll = function() {
    var triggeredGroups = {}
    var axes = {
      horizontal: {
        newScroll: this.adapter.scrollLeft(),
        oldScroll: this.oldScroll.x,
        forward: 'right',
        backward: 'left'
      },
      vertical: {
        newScroll: this.adapter.scrollTop(),
        oldScroll: this.oldScroll.y,
        forward: 'down',
        backward: 'up'
      }
    }

    for (var axisKey in axes) {
      var axis = axes[axisKey]
      var isForward = axis.newScroll > axis.oldScroll
      var direction = isForward ? axis.forward : axis.backward

      for (var waypointKey in this.waypoints[axisKey]) {
        var waypoint = this.waypoints[axisKey][waypointKey]
        var wasBeforeTriggerPoint = axis.oldScroll < waypoint.triggerPoint
        var nowAfterTriggerPoint = axis.newScroll >= waypoint.triggerPoint
        var crossedForward = wasBeforeTriggerPoint && nowAfterTriggerPoint
        var crossedBackward = !wasBeforeTriggerPoint && !nowAfterTriggerPoint
        if (crossedForward || crossedBackward) {
          waypoint.queueTrigger(direction)
          triggeredGroups[waypoint.group.id] = waypoint.group
        }
      }
    }

    for (var groupKey in triggeredGroups) {
      triggeredGroups[groupKey].flushTriggers()
    }

    this.oldScroll = {
      x: axes.horizontal.newScroll,
      y: axes.vertical.newScroll
    }
  }

  /* Private */
  Context.prototype.innerHeight = function() {
    /*eslint-disable eqeqeq */
    if (this.element == this.element.window) {
      return Waypoint.viewportHeight()
    }
    /*eslint-enable eqeqeq */
    return this.adapter.innerHeight()
  }

  /* Private */
  Context.prototype.remove = function(waypoint) {
    delete this.waypoints[waypoint.axis][waypoint.key]
    this.checkEmpty()
  }

  /* Private */
  Context.prototype.innerWidth = function() {
    /*eslint-disable eqeqeq */
    if (this.element == this.element.window) {
      return Waypoint.viewportWidth()
    }
    /*eslint-enable eqeqeq */
    return this.adapter.innerWidth()
  }

  /* Public */
  /* http://imakewebthings.com/waypoints/api/context-destroy */
  Context.prototype.destroy = function() {
    var allWaypoints = []
    for (var axis in this.waypoints) {
      for (var waypointKey in this.waypoints[axis]) {
        allWaypoints.push(this.waypoints[axis][waypointKey])
      }
    }
    for (var i = 0, end = allWaypoints.length; i < end; i++) {
      allWaypoints[i].destroy()
    }
  }

  /* Public */
  /* http://imakewebthings.com/waypoints/api/context-refresh */
  Context.prototype.refresh = function() {
    /*eslint-disable eqeqeq */
    var isWindow = this.element == this.element.window
    /*eslint-enable eqeqeq */
    var contextOffset = isWindow ? undefined : this.adapter.offset()
    var triggeredGroups = {}
    var axes

    this.handleScroll()
    axes = {
      horizontal: {
        contextOffset: isWindow ? 0 : contextOffset.left,
        contextScroll: isWindow ? 0 : this.oldScroll.x,
        contextDimension: this.innerWidth(),
        oldScroll: this.oldScroll.x,
        forward: 'right',
        backward: 'left',
        offsetProp: 'left'
      },
      vertical: {
        contextOffset: isWindow ? 0 : contextOffset.top,
        contextScroll: isWindow ? 0 : this.oldScroll.y,
        contextDimension: this.innerHeight(),
        oldScroll: this.oldScroll.y,
        forward: 'down',
        backward: 'up',
        offsetProp: 'top'
      }
    }

    for (var axisKey in axes) {
      var axis = axes[axisKey]
      for (var waypointKey in this.waypoints[axisKey]) {
        var waypoint = this.waypoints[axisKey][waypointKey]
        var adjustment = waypoint.options.offset
        var oldTriggerPoint = waypoint.triggerPoint
        var elementOffset = 0
        var freshWaypoint = oldTriggerPoint == null
        var contextModifier, wasBeforeScroll, nowAfterScroll
        var triggeredBackward, triggeredForward

        if (waypoint.element !== waypoint.element.window) {
          elementOffset = waypoint.adapter.offset()[axis.offsetProp]
        }

        if (typeof adjustment === 'function') {
          adjustment = adjustment.apply(waypoint)
        }
        else if (typeof adjustment === 'string') {
          adjustment = parseFloat(adjustment)
          if (waypoint.options.offset.indexOf('%') > - 1) {
            adjustment = Math.ceil(axis.contextDimension * adjustment / 100)
          }
        }

        contextModifier = axis.contextScroll - axis.contextOffset
        waypoint.triggerPoint = elementOffset + contextModifier - adjustment
        wasBeforeScroll = oldTriggerPoint < axis.oldScroll
        nowAfterScroll = waypoint.triggerPoint >= axis.oldScroll
        triggeredBackward = wasBeforeScroll && nowAfterScroll
        triggeredForward = !wasBeforeScroll && !nowAfterScroll

        if (!freshWaypoint && triggeredBackward) {
          waypoint.queueTrigger(axis.backward)
          triggeredGroups[waypoint.group.id] = waypoint.group
        }
        else if (!freshWaypoint && triggeredForward) {
          waypoint.queueTrigger(axis.forward)
          triggeredGroups[waypoint.group.id] = waypoint.group
        }
        else if (freshWaypoint && axis.oldScroll >= waypoint.triggerPoint) {
          waypoint.queueTrigger(axis.forward)
          triggeredGroups[waypoint.group.id] = waypoint.group
        }
      }
    }

    Waypoint.requestAnimationFrame(function() {
      for (var groupKey in triggeredGroups) {
        triggeredGroups[groupKey].flushTriggers()
      }
    })

    return this
  }

  /* Private */
  Context.findOrCreateByElement = function(element) {
    return Context.findByElement(element) || new Context(element)
  }

  /* Private */
  Context.refreshAll = function() {
    for (var contextId in contexts) {
      contexts[contextId].refresh()
    }
  }

  /* Public */
  /* http://imakewebthings.com/waypoints/api/context-find-by-element */
  Context.findByElement = function(element) {
    return contexts[element.waypointContextKey]
  }

  window.onload = function() {
    if (oldWindowLoad) {
      oldWindowLoad()
    }
    Context.refreshAll()
  }

  Waypoint.requestAnimationFrame = function(callback) {
    var requestFn = window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      requestAnimationFrameShim
    requestFn.call(window, callback)
  }
  Waypoint.Context = Context
}())
;(function() {
  'use strict'

  function byTriggerPoint(a, b) {
    return a.triggerPoint - b.triggerPoint
  }

  function byReverseTriggerPoint(a, b) {
    return b.triggerPoint - a.triggerPoint
  }

  var groups = {
    vertical: {},
    horizontal: {}
  }
  var Waypoint = window.Waypoint

  /* http://imakewebthings.com/waypoints/api/group */
  function Group(options) {
    this.name = options.name
    this.axis = options.axis
    this.id = this.name + '-' + this.axis
    this.waypoints = []
    this.clearTriggerQueues()
    groups[this.axis][this.name] = this
  }

  /* Private */
  Group.prototype.add = function(waypoint) {
    this.waypoints.push(waypoint)
  }

  /* Private */
  Group.prototype.clearTriggerQueues = function() {
    this.triggerQueues = {
      up: [],
      down: [],
      left: [],
      right: []
    }
  }

  /* Private */
  Group.prototype.flushTriggers = function() {
    for (var direction in this.triggerQueues) {
      var waypoints = this.triggerQueues[direction]
      var reverse = direction === 'up' || direction === 'left'
      waypoints.sort(reverse ? byReverseTriggerPoint : byTriggerPoint)
      for (var i = 0, end = waypoints.length; i < end; i += 1) {
        var waypoint = waypoints[i]
        if (waypoint.options.continuous || i === waypoints.length - 1) {
          waypoint.trigger([direction])
        }
      }
    }
    this.clearTriggerQueues()
  }

  /* Private */
  Group.prototype.next = function(waypoint) {
    this.waypoints.sort(byTriggerPoint)
    var index = Waypoint.Adapter.inArray(waypoint, this.waypoints)
    var isLast = index === this.waypoints.length - 1
    return isLast ? null : this.waypoints[index + 1]
  }

  /* Private */
  Group.prototype.previous = function(waypoint) {
    this.waypoints.sort(byTriggerPoint)
    var index = Waypoint.Adapter.inArray(waypoint, this.waypoints)
    return index ? this.waypoints[index - 1] : null
  }

  /* Private */
  Group.prototype.queueTrigger = function(waypoint, direction) {
    this.triggerQueues[direction].push(waypoint)
  }

  /* Private */
  Group.prototype.remove = function(waypoint) {
    var index = Waypoint.Adapter.inArray(waypoint, this.waypoints)
    if (index > -1) {
      this.waypoints.splice(index, 1)
    }
  }

  /* Public */
  /* http://imakewebthings.com/waypoints/api/first */
  Group.prototype.first = function() {
    return this.waypoints[0]
  }

  /* Public */
  /* http://imakewebthings.com/waypoints/api/last */
  Group.prototype.last = function() {
    return this.waypoints[this.waypoints.length - 1]
  }

  /* Private */
  Group.findOrCreate = function(options) {
    return groups[options.axis][options.name] || new Group(options)
  }

  Waypoint.Group = Group
}())
;(function() {
  'use strict'

  var $ = window.jQuery
  var Waypoint = window.Waypoint

  function JQueryAdapter(element) {
    this.$element = $(element)
  }

  $.each([
    'innerHeight',
    'innerWidth',
    'off',
    'offset',
    'on',
    'outerHeight',
    'outerWidth',
    'scrollLeft',
    'scrollTop'
  ], function(i, method) {
    JQueryAdapter.prototype[method] = function() {
      var args = Array.prototype.slice.call(arguments)
      return this.$element[method].apply(this.$element, args)
    }
  })

  $.each([
    'extend',
    'inArray',
    'isEmptyObject'
  ], function(i, method) {
    JQueryAdapter[method] = $[method]
  })

  Waypoint.adapters.push({
    name: 'jquery',
    Adapter: JQueryAdapter
  })
  Waypoint.Adapter = JQueryAdapter
}())
;(function() {
  'use strict'

  var Waypoint = window.Waypoint

  function createExtension(framework) {
    return function() {
      var waypoints = []
      var overrides = arguments[0]

      if (framework.isFunction(arguments[0])) {
        overrides = framework.extend({}, arguments[1])
        overrides.handler = arguments[0]
      }

      this.each(function() {
        var options = framework.extend({}, overrides, {
          element: this
        })
        if (typeof options.context === 'string') {
          options.context = framework(this).closest(options.context)[0]
        }
        waypoints.push(new Waypoint(options))
      })

      return waypoints
    }
  }

  if (window.jQuery) {
    window.jQuery.fn.waypoint = createExtension(window.jQuery)
  }
  if (window.Zepto) {
    window.Zepto.fn.waypoint = createExtension(window.Zepto)
  }
}())
;/*!
 Waypoints Infinite Scroll Shortcut - 4.0.0
 Copyright © 2011-2015 Caleb Troughton
 Licensed under the MIT license.
 https://github.com/imakewebthings/waypoints/blog/master/licenses.txt
 */
// edit by guo
(function ($) {
    'use strict'

    var Waypoint = window.Waypoint

    /* http://imakewebthings.com/waypoints/shortcuts/infinite-scroll */
    function Infinite(options) {
        this.options = $.extend({}, Infinite.defaults, options)
        this.container = this.options.element
        if (this.options.container !== 'auto') {
            this.container = this.options.container
        }
        this.$container = $(this.container)
        this.$more = $(this.options.more)

        if (this.$more.length) {
            this.setupHandler()
            this.waypoint = new Waypoint(this.options)
        }
    }

    /* Private */
    Infinite.prototype.setupHandler = function () {
        this.options.handler = $.proxy(function () {
            this.options.onBeforePageLoad()
            this.destroy()
            this.$container.addClass(this.options.loadingClass)
            $.ajax({
                url: $(this.options.more).attr('href'),
                beforeSend: function () {
                    $("#cc-loading").hide();
                },
                success: $.proxy(function (data) {

                    var $data = $($.parseHTML(data))
                    var $newMore = $data.find(this.options.more)

                    var $items = $data.find(this.options.items)

                    if (!$items.length) {
                        $items = $data.filter(this.options.items)
                    }
                    this.$container.append($items)
                    this.$container.removeClass(this.options.loadingClass)

                    if (!$newMore.length) {
                        $newMore = $data.filter(this.options.more)
                    }
                    if ($newMore.length) {
                        this.$more.replaceWith($newMore)
                        this.$more = $newMore
                        this.waypoint = new Waypoint(this.options)
                    }
                    else {
                        this.$more.remove()
                    }

                    this.options.onAfterPageLoad($items)
                }, this)
            })
        }, this)
    }

    /* Public */
    Infinite.prototype.destroy = function () {
        if (this.waypoint) {
            this.waypoint.destroy()
        }
    }

    Infinite.defaults = {
        container: 'auto',
        items: '.infinite-item',
        more: '.infinite-more-link',
        offset: 'bottom-in-view',
        loadingClass: 'infinite-loading',
        onBeforePageLoad: $.noop,
        onAfterPageLoad: $.noop
    }

    Waypoint.Infinite = Infinite

    // jquery plugin
    $.fn.infinite = function (option) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('infinite');
            var options = $.extend({element: $this[0]}, Infinite.defaults,
                typeof option == 'object' && option);

            if (!data) {
                $this.data('infinite', (data = new Waypoint.Infinite(options)));
            }

            if (typeof option == 'string') {
                data[option] && data[option]();
            }

        });
    }

}(jQuery))
;//! moment.js
//! version : 2.10.6
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com
!function(a,b){"object"==typeof exports&&"undefined"!=typeof module?module.exports=b():"function"==typeof define&&define.amd?define(b):a.moment=b()}(this,function(){"use strict";function a(){return Hc.apply(null,arguments)}function b(a){Hc=a}function c(a){return"[object Array]"===Object.prototype.toString.call(a)}function d(a){return a instanceof Date||"[object Date]"===Object.prototype.toString.call(a)}function e(a,b){var c,d=[];for(c=0;c<a.length;++c)d.push(b(a[c],c));return d}function f(a,b){return Object.prototype.hasOwnProperty.call(a,b)}function g(a,b){for(var c in b)f(b,c)&&(a[c]=b[c]);return f(b,"toString")&&(a.toString=b.toString),f(b,"valueOf")&&(a.valueOf=b.valueOf),a}function h(a,b,c,d){return Ca(a,b,c,d,!0).utc()}function i(){return{empty:!1,unusedTokens:[],unusedInput:[],overflow:-2,charsLeftOver:0,nullInput:!1,invalidMonth:null,invalidFormat:!1,userInvalidated:!1,iso:!1}}function j(a){return null==a._pf&&(a._pf=i()),a._pf}function k(a){if(null==a._isValid){var b=j(a);a._isValid=!(isNaN(a._d.getTime())||!(b.overflow<0)||b.empty||b.invalidMonth||b.invalidWeekday||b.nullInput||b.invalidFormat||b.userInvalidated),a._strict&&(a._isValid=a._isValid&&0===b.charsLeftOver&&0===b.unusedTokens.length&&void 0===b.bigHour)}return a._isValid}function l(a){var b=h(NaN);return null!=a?g(j(b),a):j(b).userInvalidated=!0,b}function m(a,b){var c,d,e;if("undefined"!=typeof b._isAMomentObject&&(a._isAMomentObject=b._isAMomentObject),"undefined"!=typeof b._i&&(a._i=b._i),"undefined"!=typeof b._f&&(a._f=b._f),"undefined"!=typeof b._l&&(a._l=b._l),"undefined"!=typeof b._strict&&(a._strict=b._strict),"undefined"!=typeof b._tzm&&(a._tzm=b._tzm),"undefined"!=typeof b._isUTC&&(a._isUTC=b._isUTC),"undefined"!=typeof b._offset&&(a._offset=b._offset),"undefined"!=typeof b._pf&&(a._pf=j(b)),"undefined"!=typeof b._locale&&(a._locale=b._locale),Jc.length>0)for(c in Jc)d=Jc[c],e=b[d],"undefined"!=typeof e&&(a[d]=e);return a}function n(b){m(this,b),this._d=new Date(null!=b._d?b._d.getTime():NaN),Kc===!1&&(Kc=!0,a.updateOffset(this),Kc=!1)}function o(a){return a instanceof n||null!=a&&null!=a._isAMomentObject}function p(a){return 0>a?Math.ceil(a):Math.floor(a)}function q(a){var b=+a,c=0;return 0!==b&&isFinite(b)&&(c=p(b)),c}function r(a,b,c){var d,e=Math.min(a.length,b.length),f=Math.abs(a.length-b.length),g=0;for(d=0;e>d;d++)(c&&a[d]!==b[d]||!c&&q(a[d])!==q(b[d]))&&g++;return g+f}function s(){}function t(a){return a?a.toLowerCase().replace("_","-"):a}function u(a){for(var b,c,d,e,f=0;f<a.length;){for(e=t(a[f]).split("-"),b=e.length,c=t(a[f+1]),c=c?c.split("-"):null;b>0;){if(d=v(e.slice(0,b).join("-")))return d;if(c&&c.length>=b&&r(e,c,!0)>=b-1)break;b--}f++}return null}function v(a){var b=null;if(!Lc[a]&&"undefined"!=typeof module&&module&&module.exports)try{b=Ic._abbr,require("./locale/"+a),w(b)}catch(c){}return Lc[a]}function w(a,b){var c;return a&&(c="undefined"==typeof b?y(a):x(a,b),c&&(Ic=c)),Ic._abbr}function x(a,b){return null!==b?(b.abbr=a,Lc[a]=Lc[a]||new s,Lc[a].set(b),w(a),Lc[a]):(delete Lc[a],null)}function y(a){var b;if(a&&a._locale&&a._locale._abbr&&(a=a._locale._abbr),!a)return Ic;if(!c(a)){if(b=v(a))return b;a=[a]}return u(a)}function z(a,b){var c=a.toLowerCase();Mc[c]=Mc[c+"s"]=Mc[b]=a}function A(a){return"string"==typeof a?Mc[a]||Mc[a.toLowerCase()]:void 0}function B(a){var b,c,d={};for(c in a)f(a,c)&&(b=A(c),b&&(d[b]=a[c]));return d}function C(b,c){return function(d){return null!=d?(E(this,b,d),a.updateOffset(this,c),this):D(this,b)}}function D(a,b){return a._d["get"+(a._isUTC?"UTC":"")+b]()}function E(a,b,c){return a._d["set"+(a._isUTC?"UTC":"")+b](c)}function F(a,b){var c;if("object"==typeof a)for(c in a)this.set(c,a[c]);else if(a=A(a),"function"==typeof this[a])return this[a](b);return this}function G(a,b,c){var d=""+Math.abs(a),e=b-d.length,f=a>=0;return(f?c?"+":"":"-")+Math.pow(10,Math.max(0,e)).toString().substr(1)+d}function H(a,b,c,d){var e=d;"string"==typeof d&&(e=function(){return this[d]()}),a&&(Qc[a]=e),b&&(Qc[b[0]]=function(){return G(e.apply(this,arguments),b[1],b[2])}),c&&(Qc[c]=function(){return this.localeData().ordinal(e.apply(this,arguments),a)})}function I(a){return a.match(/\[[\s\S]/)?a.replace(/^\[|\]$/g,""):a.replace(/\\/g,"")}function J(a){var b,c,d=a.match(Nc);for(b=0,c=d.length;c>b;b++)Qc[d[b]]?d[b]=Qc[d[b]]:d[b]=I(d[b]);return function(e){var f="";for(b=0;c>b;b++)f+=d[b]instanceof Function?d[b].call(e,a):d[b];return f}}function K(a,b){return a.isValid()?(b=L(b,a.localeData()),Pc[b]=Pc[b]||J(b),Pc[b](a)):a.localeData().invalidDate()}function L(a,b){function c(a){return b.longDateFormat(a)||a}var d=5;for(Oc.lastIndex=0;d>=0&&Oc.test(a);)a=a.replace(Oc,c),Oc.lastIndex=0,d-=1;return a}function M(a){return"function"==typeof a&&"[object Function]"===Object.prototype.toString.call(a)}function N(a,b,c){dd[a]=M(b)?b:function(a){return a&&c?c:b}}function O(a,b){return f(dd,a)?dd[a](b._strict,b._locale):new RegExp(P(a))}function P(a){return a.replace("\\","").replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,function(a,b,c,d,e){return b||c||d||e}).replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}function Q(a,b){var c,d=b;for("string"==typeof a&&(a=[a]),"number"==typeof b&&(d=function(a,c){c[b]=q(a)}),c=0;c<a.length;c++)ed[a[c]]=d}function R(a,b){Q(a,function(a,c,d,e){d._w=d._w||{},b(a,d._w,d,e)})}function S(a,b,c){null!=b&&f(ed,a)&&ed[a](b,c._a,c,a)}function T(a,b){return new Date(Date.UTC(a,b+1,0)).getUTCDate()}function U(a){return this._months[a.month()]}function V(a){return this._monthsShort[a.month()]}function W(a,b,c){var d,e,f;for(this._monthsParse||(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[]),d=0;12>d;d++){if(e=h([2e3,d]),c&&!this._longMonthsParse[d]&&(this._longMonthsParse[d]=new RegExp("^"+this.months(e,"").replace(".","")+"$","i"),this._shortMonthsParse[d]=new RegExp("^"+this.monthsShort(e,"").replace(".","")+"$","i")),c||this._monthsParse[d]||(f="^"+this.months(e,"")+"|^"+this.monthsShort(e,""),this._monthsParse[d]=new RegExp(f.replace(".",""),"i")),c&&"MMMM"===b&&this._longMonthsParse[d].test(a))return d;if(c&&"MMM"===b&&this._shortMonthsParse[d].test(a))return d;if(!c&&this._monthsParse[d].test(a))return d}}function X(a,b){var c;return"string"==typeof b&&(b=a.localeData().monthsParse(b),"number"!=typeof b)?a:(c=Math.min(a.date(),T(a.year(),b)),a._d["set"+(a._isUTC?"UTC":"")+"Month"](b,c),a)}function Y(b){return null!=b?(X(this,b),a.updateOffset(this,!0),this):D(this,"Month")}function Z(){return T(this.year(),this.month())}function $(a){var b,c=a._a;return c&&-2===j(a).overflow&&(b=c[gd]<0||c[gd]>11?gd:c[hd]<1||c[hd]>T(c[fd],c[gd])?hd:c[id]<0||c[id]>24||24===c[id]&&(0!==c[jd]||0!==c[kd]||0!==c[ld])?id:c[jd]<0||c[jd]>59?jd:c[kd]<0||c[kd]>59?kd:c[ld]<0||c[ld]>999?ld:-1,j(a)._overflowDayOfYear&&(fd>b||b>hd)&&(b=hd),j(a).overflow=b),a}function _(b){a.suppressDeprecationWarnings===!1&&"undefined"!=typeof console&&console.warn&&console.warn("Deprecation warning: "+b)}function aa(a,b){var c=!0;return g(function(){return c&&(_(a+"\n"+(new Error).stack),c=!1),b.apply(this,arguments)},b)}function ba(a,b){od[a]||(_(b),od[a]=!0)}function ca(a){var b,c,d=a._i,e=pd.exec(d);if(e){for(j(a).iso=!0,b=0,c=qd.length;c>b;b++)if(qd[b][1].exec(d)){a._f=qd[b][0];break}for(b=0,c=rd.length;c>b;b++)if(rd[b][1].exec(d)){a._f+=(e[6]||" ")+rd[b][0];break}d.match(ad)&&(a._f+="Z"),va(a)}else a._isValid=!1}function da(b){var c=sd.exec(b._i);return null!==c?void(b._d=new Date(+c[1])):(ca(b),void(b._isValid===!1&&(delete b._isValid,a.createFromInputFallback(b))))}function ea(a,b,c,d,e,f,g){var h=new Date(a,b,c,d,e,f,g);return 1970>a&&h.setFullYear(a),h}function fa(a){var b=new Date(Date.UTC.apply(null,arguments));return 1970>a&&b.setUTCFullYear(a),b}function ga(a){return ha(a)?366:365}function ha(a){return a%4===0&&a%100!==0||a%400===0}function ia(){return ha(this.year())}function ja(a,b,c){var d,e=c-b,f=c-a.day();return f>e&&(f-=7),e-7>f&&(f+=7),d=Da(a).add(f,"d"),{week:Math.ceil(d.dayOfYear()/7),year:d.year()}}function ka(a){return ja(a,this._week.dow,this._week.doy).week}function la(){return this._week.dow}function ma(){return this._week.doy}function na(a){var b=this.localeData().week(this);return null==a?b:this.add(7*(a-b),"d")}function oa(a){var b=ja(this,1,4).week;return null==a?b:this.add(7*(a-b),"d")}function pa(a,b,c,d,e){var f,g=6+e-d,h=fa(a,0,1+g),i=h.getUTCDay();return e>i&&(i+=7),c=null!=c?1*c:e,f=1+g+7*(b-1)-i+c,{year:f>0?a:a-1,dayOfYear:f>0?f:ga(a-1)+f}}function qa(a){var b=Math.round((this.clone().startOf("day")-this.clone().startOf("year"))/864e5)+1;return null==a?b:this.add(a-b,"d")}function ra(a,b,c){return null!=a?a:null!=b?b:c}function sa(a){var b=new Date;return a._useUTC?[b.getUTCFullYear(),b.getUTCMonth(),b.getUTCDate()]:[b.getFullYear(),b.getMonth(),b.getDate()]}function ta(a){var b,c,d,e,f=[];if(!a._d){for(d=sa(a),a._w&&null==a._a[hd]&&null==a._a[gd]&&ua(a),a._dayOfYear&&(e=ra(a._a[fd],d[fd]),a._dayOfYear>ga(e)&&(j(a)._overflowDayOfYear=!0),c=fa(e,0,a._dayOfYear),a._a[gd]=c.getUTCMonth(),a._a[hd]=c.getUTCDate()),b=0;3>b&&null==a._a[b];++b)a._a[b]=f[b]=d[b];for(;7>b;b++)a._a[b]=f[b]=null==a._a[b]?2===b?1:0:a._a[b];24===a._a[id]&&0===a._a[jd]&&0===a._a[kd]&&0===a._a[ld]&&(a._nextDay=!0,a._a[id]=0),a._d=(a._useUTC?fa:ea).apply(null,f),null!=a._tzm&&a._d.setUTCMinutes(a._d.getUTCMinutes()-a._tzm),a._nextDay&&(a._a[id]=24)}}function ua(a){var b,c,d,e,f,g,h;b=a._w,null!=b.GG||null!=b.W||null!=b.E?(f=1,g=4,c=ra(b.GG,a._a[fd],ja(Da(),1,4).year),d=ra(b.W,1),e=ra(b.E,1)):(f=a._locale._week.dow,g=a._locale._week.doy,c=ra(b.gg,a._a[fd],ja(Da(),f,g).year),d=ra(b.w,1),null!=b.d?(e=b.d,f>e&&++d):e=null!=b.e?b.e+f:f),h=pa(c,d,e,g,f),a._a[fd]=h.year,a._dayOfYear=h.dayOfYear}function va(b){if(b._f===a.ISO_8601)return void ca(b);b._a=[],j(b).empty=!0;var c,d,e,f,g,h=""+b._i,i=h.length,k=0;for(e=L(b._f,b._locale).match(Nc)||[],c=0;c<e.length;c++)f=e[c],d=(h.match(O(f,b))||[])[0],d&&(g=h.substr(0,h.indexOf(d)),g.length>0&&j(b).unusedInput.push(g),h=h.slice(h.indexOf(d)+d.length),k+=d.length),Qc[f]?(d?j(b).empty=!1:j(b).unusedTokens.push(f),S(f,d,b)):b._strict&&!d&&j(b).unusedTokens.push(f);j(b).charsLeftOver=i-k,h.length>0&&j(b).unusedInput.push(h),j(b).bigHour===!0&&b._a[id]<=12&&b._a[id]>0&&(j(b).bigHour=void 0),b._a[id]=wa(b._locale,b._a[id],b._meridiem),ta(b),$(b)}function wa(a,b,c){var d;return null==c?b:null!=a.meridiemHour?a.meridiemHour(b,c):null!=a.isPM?(d=a.isPM(c),d&&12>b&&(b+=12),d||12!==b||(b=0),b):b}function xa(a){var b,c,d,e,f;if(0===a._f.length)return j(a).invalidFormat=!0,void(a._d=new Date(NaN));for(e=0;e<a._f.length;e++)f=0,b=m({},a),null!=a._useUTC&&(b._useUTC=a._useUTC),b._f=a._f[e],va(b),k(b)&&(f+=j(b).charsLeftOver,f+=10*j(b).unusedTokens.length,j(b).score=f,(null==d||d>f)&&(d=f,c=b));g(a,c||b)}function ya(a){if(!a._d){var b=B(a._i);a._a=[b.year,b.month,b.day||b.date,b.hour,b.minute,b.second,b.millisecond],ta(a)}}function za(a){var b=new n($(Aa(a)));return b._nextDay&&(b.add(1,"d"),b._nextDay=void 0),b}function Aa(a){var b=a._i,e=a._f;return a._locale=a._locale||y(a._l),null===b||void 0===e&&""===b?l({nullInput:!0}):("string"==typeof b&&(a._i=b=a._locale.preparse(b)),o(b)?new n($(b)):(c(e)?xa(a):e?va(a):d(b)?a._d=b:Ba(a),a))}function Ba(b){var f=b._i;void 0===f?b._d=new Date:d(f)?b._d=new Date(+f):"string"==typeof f?da(b):c(f)?(b._a=e(f.slice(0),function(a){return parseInt(a,10)}),ta(b)):"object"==typeof f?ya(b):"number"==typeof f?b._d=new Date(f):a.createFromInputFallback(b)}function Ca(a,b,c,d,e){var f={};return"boolean"==typeof c&&(d=c,c=void 0),f._isAMomentObject=!0,f._useUTC=f._isUTC=e,f._l=c,f._i=a,f._f=b,f._strict=d,za(f)}function Da(a,b,c,d){return Ca(a,b,c,d,!1)}function Ea(a,b){var d,e;if(1===b.length&&c(b[0])&&(b=b[0]),!b.length)return Da();for(d=b[0],e=1;e<b.length;++e)(!b[e].isValid()||b[e][a](d))&&(d=b[e]);return d}function Fa(){var a=[].slice.call(arguments,0);return Ea("isBefore",a)}function Ga(){var a=[].slice.call(arguments,0);return Ea("isAfter",a)}function Ha(a){var b=B(a),c=b.year||0,d=b.quarter||0,e=b.month||0,f=b.week||0,g=b.day||0,h=b.hour||0,i=b.minute||0,j=b.second||0,k=b.millisecond||0;this._milliseconds=+k+1e3*j+6e4*i+36e5*h,this._days=+g+7*f,this._months=+e+3*d+12*c,this._data={},this._locale=y(),this._bubble()}function Ia(a){return a instanceof Ha}function Ja(a,b){H(a,0,0,function(){var a=this.utcOffset(),c="+";return 0>a&&(a=-a,c="-"),c+G(~~(a/60),2)+b+G(~~a%60,2)})}function Ka(a){var b=(a||"").match(ad)||[],c=b[b.length-1]||[],d=(c+"").match(xd)||["-",0,0],e=+(60*d[1])+q(d[2]);return"+"===d[0]?e:-e}function La(b,c){var e,f;return c._isUTC?(e=c.clone(),f=(o(b)||d(b)?+b:+Da(b))-+e,e._d.setTime(+e._d+f),a.updateOffset(e,!1),e):Da(b).local()}function Ma(a){return 15*-Math.round(a._d.getTimezoneOffset()/15)}function Na(b,c){var d,e=this._offset||0;return null!=b?("string"==typeof b&&(b=Ka(b)),Math.abs(b)<16&&(b=60*b),!this._isUTC&&c&&(d=Ma(this)),this._offset=b,this._isUTC=!0,null!=d&&this.add(d,"m"),e!==b&&(!c||this._changeInProgress?bb(this,Ya(b-e,"m"),1,!1):this._changeInProgress||(this._changeInProgress=!0,a.updateOffset(this,!0),this._changeInProgress=null)),this):this._isUTC?e:Ma(this)}function Oa(a,b){return null!=a?("string"!=typeof a&&(a=-a),this.utcOffset(a,b),this):-this.utcOffset()}function Pa(a){return this.utcOffset(0,a)}function Qa(a){return this._isUTC&&(this.utcOffset(0,a),this._isUTC=!1,a&&this.subtract(Ma(this),"m")),this}function Ra(){return this._tzm?this.utcOffset(this._tzm):"string"==typeof this._i&&this.utcOffset(Ka(this._i)),this}function Sa(a){return a=a?Da(a).utcOffset():0,(this.utcOffset()-a)%60===0}function Ta(){return this.utcOffset()>this.clone().month(0).utcOffset()||this.utcOffset()>this.clone().month(5).utcOffset()}function Ua(){if("undefined"!=typeof this._isDSTShifted)return this._isDSTShifted;var a={};if(m(a,this),a=Aa(a),a._a){var b=a._isUTC?h(a._a):Da(a._a);this._isDSTShifted=this.isValid()&&r(a._a,b.toArray())>0}else this._isDSTShifted=!1;return this._isDSTShifted}function Va(){return!this._isUTC}function Wa(){return this._isUTC}function Xa(){return this._isUTC&&0===this._offset}function Ya(a,b){var c,d,e,g=a,h=null;return Ia(a)?g={ms:a._milliseconds,d:a._days,M:a._months}:"number"==typeof a?(g={},b?g[b]=a:g.milliseconds=a):(h=yd.exec(a))?(c="-"===h[1]?-1:1,g={y:0,d:q(h[hd])*c,h:q(h[id])*c,m:q(h[jd])*c,s:q(h[kd])*c,ms:q(h[ld])*c}):(h=zd.exec(a))?(c="-"===h[1]?-1:1,g={y:Za(h[2],c),M:Za(h[3],c),d:Za(h[4],c),h:Za(h[5],c),m:Za(h[6],c),s:Za(h[7],c),w:Za(h[8],c)}):null==g?g={}:"object"==typeof g&&("from"in g||"to"in g)&&(e=_a(Da(g.from),Da(g.to)),g={},g.ms=e.milliseconds,g.M=e.months),d=new Ha(g),Ia(a)&&f(a,"_locale")&&(d._locale=a._locale),d}function Za(a,b){var c=a&&parseFloat(a.replace(",","."));return(isNaN(c)?0:c)*b}function $a(a,b){var c={milliseconds:0,months:0};return c.months=b.month()-a.month()+12*(b.year()-a.year()),a.clone().add(c.months,"M").isAfter(b)&&--c.months,c.milliseconds=+b-+a.clone().add(c.months,"M"),c}function _a(a,b){var c;return b=La(b,a),a.isBefore(b)?c=$a(a,b):(c=$a(b,a),c.milliseconds=-c.milliseconds,c.months=-c.months),c}function ab(a,b){return function(c,d){var e,f;return null===d||isNaN(+d)||(ba(b,"moment()."+b+"(period, number) is deprecated. Please use moment()."+b+"(number, period)."),f=c,c=d,d=f),c="string"==typeof c?+c:c,e=Ya(c,d),bb(this,e,a),this}}function bb(b,c,d,e){var f=c._milliseconds,g=c._days,h=c._months;e=null==e?!0:e,f&&b._d.setTime(+b._d+f*d),g&&E(b,"Date",D(b,"Date")+g*d),h&&X(b,D(b,"Month")+h*d),e&&a.updateOffset(b,g||h)}function cb(a,b){var c=a||Da(),d=La(c,this).startOf("day"),e=this.diff(d,"days",!0),f=-6>e?"sameElse":-1>e?"lastWeek":0>e?"lastDay":1>e?"sameDay":2>e?"nextDay":7>e?"nextWeek":"sameElse";return this.format(b&&b[f]||this.localeData().calendar(f,this,Da(c)))}function db(){return new n(this)}function eb(a,b){var c;return b=A("undefined"!=typeof b?b:"millisecond"),"millisecond"===b?(a=o(a)?a:Da(a),+this>+a):(c=o(a)?+a:+Da(a),c<+this.clone().startOf(b))}function fb(a,b){var c;return b=A("undefined"!=typeof b?b:"millisecond"),"millisecond"===b?(a=o(a)?a:Da(a),+a>+this):(c=o(a)?+a:+Da(a),+this.clone().endOf(b)<c)}function gb(a,b,c){return this.isAfter(a,c)&&this.isBefore(b,c)}function hb(a,b){var c;return b=A(b||"millisecond"),"millisecond"===b?(a=o(a)?a:Da(a),+this===+a):(c=+Da(a),+this.clone().startOf(b)<=c&&c<=+this.clone().endOf(b))}function ib(a,b,c){var d,e,f=La(a,this),g=6e4*(f.utcOffset()-this.utcOffset());return b=A(b),"year"===b||"month"===b||"quarter"===b?(e=jb(this,f),"quarter"===b?e/=3:"year"===b&&(e/=12)):(d=this-f,e="second"===b?d/1e3:"minute"===b?d/6e4:"hour"===b?d/36e5:"day"===b?(d-g)/864e5:"week"===b?(d-g)/6048e5:d),c?e:p(e)}function jb(a,b){var c,d,e=12*(b.year()-a.year())+(b.month()-a.month()),f=a.clone().add(e,"months");return 0>b-f?(c=a.clone().add(e-1,"months"),d=(b-f)/(f-c)):(c=a.clone().add(e+1,"months"),d=(b-f)/(c-f)),-(e+d)}function kb(){return this.clone().locale("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")}function lb(){var a=this.clone().utc();return 0<a.year()&&a.year()<=9999?"function"==typeof Date.prototype.toISOString?this.toDate().toISOString():K(a,"YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"):K(a,"YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]")}function mb(b){var c=K(this,b||a.defaultFormat);return this.localeData().postformat(c)}function nb(a,b){return this.isValid()?Ya({to:this,from:a}).locale(this.locale()).humanize(!b):this.localeData().invalidDate()}function ob(a){return this.from(Da(),a)}function pb(a,b){return this.isValid()?Ya({from:this,to:a}).locale(this.locale()).humanize(!b):this.localeData().invalidDate()}function qb(a){return this.to(Da(),a)}function rb(a){var b;return void 0===a?this._locale._abbr:(b=y(a),null!=b&&(this._locale=b),this)}function sb(){return this._locale}function tb(a){switch(a=A(a)){case"year":this.month(0);case"quarter":case"month":this.date(1);case"week":case"isoWeek":case"day":this.hours(0);case"hour":this.minutes(0);case"minute":this.seconds(0);case"second":this.milliseconds(0)}return"week"===a&&this.weekday(0),"isoWeek"===a&&this.isoWeekday(1),"quarter"===a&&this.month(3*Math.floor(this.month()/3)),this}function ub(a){return a=A(a),void 0===a||"millisecond"===a?this:this.startOf(a).add(1,"isoWeek"===a?"week":a).subtract(1,"ms")}function vb(){return+this._d-6e4*(this._offset||0)}function wb(){return Math.floor(+this/1e3)}function xb(){return this._offset?new Date(+this):this._d}function yb(){var a=this;return[a.year(),a.month(),a.date(),a.hour(),a.minute(),a.second(),a.millisecond()]}function zb(){var a=this;return{years:a.year(),months:a.month(),date:a.date(),hours:a.hours(),minutes:a.minutes(),seconds:a.seconds(),milliseconds:a.milliseconds()}}function Ab(){return k(this)}function Bb(){return g({},j(this))}function Cb(){return j(this).overflow}function Db(a,b){H(0,[a,a.length],0,b)}function Eb(a,b,c){return ja(Da([a,11,31+b-c]),b,c).week}function Fb(a){var b=ja(this,this.localeData()._week.dow,this.localeData()._week.doy).year;return null==a?b:this.add(a-b,"y")}function Gb(a){var b=ja(this,1,4).year;return null==a?b:this.add(a-b,"y")}function Hb(){return Eb(this.year(),1,4)}function Ib(){var a=this.localeData()._week;return Eb(this.year(),a.dow,a.doy)}function Jb(a){return null==a?Math.ceil((this.month()+1)/3):this.month(3*(a-1)+this.month()%3)}function Kb(a,b){return"string"!=typeof a?a:isNaN(a)?(a=b.weekdaysParse(a),"number"==typeof a?a:null):parseInt(a,10)}function Lb(a){return this._weekdays[a.day()]}function Mb(a){return this._weekdaysShort[a.day()]}function Nb(a){return this._weekdaysMin[a.day()]}function Ob(a){var b,c,d;for(this._weekdaysParse=this._weekdaysParse||[],b=0;7>b;b++)if(this._weekdaysParse[b]||(c=Da([2e3,1]).day(b),d="^"+this.weekdays(c,"")+"|^"+this.weekdaysShort(c,"")+"|^"+this.weekdaysMin(c,""),this._weekdaysParse[b]=new RegExp(d.replace(".",""),"i")),this._weekdaysParse[b].test(a))return b}function Pb(a){var b=this._isUTC?this._d.getUTCDay():this._d.getDay();return null!=a?(a=Kb(a,this.localeData()),this.add(a-b,"d")):b}function Qb(a){var b=(this.day()+7-this.localeData()._week.dow)%7;return null==a?b:this.add(a-b,"d")}function Rb(a){return null==a?this.day()||7:this.day(this.day()%7?a:a-7)}function Sb(a,b){H(a,0,0,function(){return this.localeData().meridiem(this.hours(),this.minutes(),b)})}function Tb(a,b){return b._meridiemParse}function Ub(a){return"p"===(a+"").toLowerCase().charAt(0)}function Vb(a,b,c){return a>11?c?"pm":"PM":c?"am":"AM"}function Wb(a,b){b[ld]=q(1e3*("0."+a))}function Xb(){return this._isUTC?"UTC":""}function Yb(){return this._isUTC?"Coordinated Universal Time":""}function Zb(a){return Da(1e3*a)}function $b(){return Da.apply(null,arguments).parseZone()}function _b(a,b,c){var d=this._calendar[a];return"function"==typeof d?d.call(b,c):d}function ac(a){var b=this._longDateFormat[a],c=this._longDateFormat[a.toUpperCase()];return b||!c?b:(this._longDateFormat[a]=c.replace(/MMMM|MM|DD|dddd/g,function(a){return a.slice(1)}),this._longDateFormat[a])}function bc(){return this._invalidDate}function cc(a){return this._ordinal.replace("%d",a)}function dc(a){return a}function ec(a,b,c,d){var e=this._relativeTime[c];return"function"==typeof e?e(a,b,c,d):e.replace(/%d/i,a)}function fc(a,b){var c=this._relativeTime[a>0?"future":"past"];return"function"==typeof c?c(b):c.replace(/%s/i,b)}function gc(a){var b,c;for(c in a)b=a[c],"function"==typeof b?this[c]=b:this["_"+c]=b;this._ordinalParseLenient=new RegExp(this._ordinalParse.source+"|"+/\d{1,2}/.source)}function hc(a,b,c,d){var e=y(),f=h().set(d,b);return e[c](f,a)}function ic(a,b,c,d,e){if("number"==typeof a&&(b=a,a=void 0),a=a||"",null!=b)return hc(a,b,c,e);var f,g=[];for(f=0;d>f;f++)g[f]=hc(a,f,c,e);return g}function jc(a,b){return ic(a,b,"months",12,"month")}function kc(a,b){return ic(a,b,"monthsShort",12,"month")}function lc(a,b){return ic(a,b,"weekdays",7,"day")}function mc(a,b){return ic(a,b,"weekdaysShort",7,"day")}function nc(a,b){return ic(a,b,"weekdaysMin",7,"day")}function oc(){var a=this._data;return this._milliseconds=Wd(this._milliseconds),this._days=Wd(this._days),this._months=Wd(this._months),a.milliseconds=Wd(a.milliseconds),a.seconds=Wd(a.seconds),a.minutes=Wd(a.minutes),a.hours=Wd(a.hours),a.months=Wd(a.months),a.years=Wd(a.years),this}function pc(a,b,c,d){var e=Ya(b,c);return a._milliseconds+=d*e._milliseconds,a._days+=d*e._days,a._months+=d*e._months,a._bubble()}function qc(a,b){return pc(this,a,b,1)}function rc(a,b){return pc(this,a,b,-1)}function sc(a){return 0>a?Math.floor(a):Math.ceil(a)}function tc(){var a,b,c,d,e,f=this._milliseconds,g=this._days,h=this._months,i=this._data;return f>=0&&g>=0&&h>=0||0>=f&&0>=g&&0>=h||(f+=864e5*sc(vc(h)+g),g=0,h=0),i.milliseconds=f%1e3,a=p(f/1e3),i.seconds=a%60,b=p(a/60),i.minutes=b%60,c=p(b/60),i.hours=c%24,g+=p(c/24),e=p(uc(g)),h+=e,g-=sc(vc(e)),d=p(h/12),h%=12,i.days=g,i.months=h,i.years=d,this}function uc(a){return 4800*a/146097}function vc(a){return 146097*a/4800}function wc(a){var b,c,d=this._milliseconds;if(a=A(a),"month"===a||"year"===a)return b=this._days+d/864e5,c=this._months+uc(b),"month"===a?c:c/12;switch(b=this._days+Math.round(vc(this._months)),a){case"week":return b/7+d/6048e5;case"day":return b+d/864e5;case"hour":return 24*b+d/36e5;case"minute":return 1440*b+d/6e4;case"second":return 86400*b+d/1e3;case"millisecond":return Math.floor(864e5*b)+d;default:throw new Error("Unknown unit "+a)}}function xc(){return this._milliseconds+864e5*this._days+this._months%12*2592e6+31536e6*q(this._months/12)}function yc(a){return function(){return this.as(a)}}function zc(a){return a=A(a),this[a+"s"]()}function Ac(a){return function(){return this._data[a]}}function Bc(){return p(this.days()/7)}function Cc(a,b,c,d,e){return e.relativeTime(b||1,!!c,a,d)}function Dc(a,b,c){var d=Ya(a).abs(),e=ke(d.as("s")),f=ke(d.as("m")),g=ke(d.as("h")),h=ke(d.as("d")),i=ke(d.as("M")),j=ke(d.as("y")),k=e<le.s&&["s",e]||1===f&&["m"]||f<le.m&&["mm",f]||1===g&&["h"]||g<le.h&&["hh",g]||1===h&&["d"]||h<le.d&&["dd",h]||1===i&&["M"]||i<le.M&&["MM",i]||1===j&&["y"]||["yy",j];return k[2]=b,k[3]=+a>0,k[4]=c,Cc.apply(null,k)}function Ec(a,b){return void 0===le[a]?!1:void 0===b?le[a]:(le[a]=b,!0)}function Fc(a){var b=this.localeData(),c=Dc(this,!a,b);return a&&(c=b.pastFuture(+this,c)),b.postformat(c)}function Gc(){var a,b,c,d=me(this._milliseconds)/1e3,e=me(this._days),f=me(this._months);a=p(d/60),b=p(a/60),d%=60,a%=60,c=p(f/12),f%=12;var g=c,h=f,i=e,j=b,k=a,l=d,m=this.asSeconds();return m?(0>m?"-":"")+"P"+(g?g+"Y":"")+(h?h+"M":"")+(i?i+"D":"")+(j||k||l?"T":"")+(j?j+"H":"")+(k?k+"M":"")+(l?l+"S":""):"P0D"}var Hc,Ic,Jc=a.momentProperties=[],Kc=!1,Lc={},Mc={},Nc=/(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,Oc=/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,Pc={},Qc={},Rc=/\d/,Sc=/\d\d/,Tc=/\d{3}/,Uc=/\d{4}/,Vc=/[+-]?\d{6}/,Wc=/\d\d?/,Xc=/\d{1,3}/,Yc=/\d{1,4}/,Zc=/[+-]?\d{1,6}/,$c=/\d+/,_c=/[+-]?\d+/,ad=/Z|[+-]\d\d:?\d\d/gi,bd=/[+-]?\d+(\.\d{1,3})?/,cd=/[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i,dd={},ed={},fd=0,gd=1,hd=2,id=3,jd=4,kd=5,ld=6;H("M",["MM",2],"Mo",function(){return this.month()+1}),H("MMM",0,0,function(a){return this.localeData().monthsShort(this,a)}),H("MMMM",0,0,function(a){return this.localeData().months(this,a)}),z("month","M"),N("M",Wc),N("MM",Wc,Sc),N("MMM",cd),N("MMMM",cd),Q(["M","MM"],function(a,b){b[gd]=q(a)-1}),Q(["MMM","MMMM"],function(a,b,c,d){var e=c._locale.monthsParse(a,d,c._strict);null!=e?b[gd]=e:j(c).invalidMonth=a});var md="January_February_March_April_May_June_July_August_September_October_November_December".split("_"),nd="Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),od={};a.suppressDeprecationWarnings=!1;var pd=/^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,qd=[["YYYYYY-MM-DD",/[+-]\d{6}-\d{2}-\d{2}/],["YYYY-MM-DD",/\d{4}-\d{2}-\d{2}/],["GGGG-[W]WW-E",/\d{4}-W\d{2}-\d/],["GGGG-[W]WW",/\d{4}-W\d{2}/],["YYYY-DDD",/\d{4}-\d{3}/]],rd=[["HH:mm:ss.SSSS",/(T| )\d\d:\d\d:\d\d\.\d+/],["HH:mm:ss",/(T| )\d\d:\d\d:\d\d/],["HH:mm",/(T| )\d\d:\d\d/],["HH",/(T| )\d\d/]],sd=/^\/?Date\((\-?\d+)/i;a.createFromInputFallback=aa("moment construction falls back to js Date. This is discouraged and will be removed in upcoming major release. Please refer to https://github.com/moment/moment/issues/1407 for more info.",function(a){a._d=new Date(a._i+(a._useUTC?" UTC":""))}),H(0,["YY",2],0,function(){return this.year()%100}),H(0,["YYYY",4],0,"year"),H(0,["YYYYY",5],0,"year"),H(0,["YYYYYY",6,!0],0,"year"),z("year","y"),N("Y",_c),N("YY",Wc,Sc),N("YYYY",Yc,Uc),N("YYYYY",Zc,Vc),N("YYYYYY",Zc,Vc),Q(["YYYYY","YYYYYY"],fd),Q("YYYY",function(b,c){c[fd]=2===b.length?a.parseTwoDigitYear(b):q(b)}),Q("YY",function(b,c){c[fd]=a.parseTwoDigitYear(b)}),a.parseTwoDigitYear=function(a){return q(a)+(q(a)>68?1900:2e3)};var td=C("FullYear",!1);H("w",["ww",2],"wo","week"),H("W",["WW",2],"Wo","isoWeek"),z("week","w"),z("isoWeek","W"),N("w",Wc),N("ww",Wc,Sc),N("W",Wc),N("WW",Wc,Sc),R(["w","ww","W","WW"],function(a,b,c,d){b[d.substr(0,1)]=q(a)});var ud={dow:0,doy:6};H("DDD",["DDDD",3],"DDDo","dayOfYear"),z("dayOfYear","DDD"),N("DDD",Xc),N("DDDD",Tc),Q(["DDD","DDDD"],function(a,b,c){c._dayOfYear=q(a)}),a.ISO_8601=function(){};var vd=aa("moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548",function(){var a=Da.apply(null,arguments);return this>a?this:a}),wd=aa("moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548",function(){var a=Da.apply(null,arguments);return a>this?this:a});Ja("Z",":"),Ja("ZZ",""),N("Z",ad),N("ZZ",ad),Q(["Z","ZZ"],function(a,b,c){c._useUTC=!0,c._tzm=Ka(a)});var xd=/([\+\-]|\d\d)/gi;a.updateOffset=function(){};var yd=/(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,zd=/^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/;Ya.fn=Ha.prototype;var Ad=ab(1,"add"),Bd=ab(-1,"subtract");a.defaultFormat="YYYY-MM-DDTHH:mm:ssZ";var Cd=aa("moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.",function(a){return void 0===a?this.localeData():this.locale(a)});H(0,["gg",2],0,function(){return this.weekYear()%100}),H(0,["GG",2],0,function(){return this.isoWeekYear()%100}),Db("gggg","weekYear"),Db("ggggg","weekYear"),Db("GGGG","isoWeekYear"),Db("GGGGG","isoWeekYear"),z("weekYear","gg"),z("isoWeekYear","GG"),N("G",_c),N("g",_c),N("GG",Wc,Sc),N("gg",Wc,Sc),N("GGGG",Yc,Uc),N("gggg",Yc,Uc),N("GGGGG",Zc,Vc),N("ggggg",Zc,Vc),R(["gggg","ggggg","GGGG","GGGGG"],function(a,b,c,d){b[d.substr(0,2)]=q(a)}),R(["gg","GG"],function(b,c,d,e){c[e]=a.parseTwoDigitYear(b)}),H("Q",0,0,"quarter"),z("quarter","Q"),N("Q",Rc),Q("Q",function(a,b){b[gd]=3*(q(a)-1)}),H("D",["DD",2],"Do","date"),z("date","D"),N("D",Wc),N("DD",Wc,Sc),N("Do",function(a,b){return a?b._ordinalParse:b._ordinalParseLenient}),Q(["D","DD"],hd),Q("Do",function(a,b){b[hd]=q(a.match(Wc)[0],10)});var Dd=C("Date",!0);H("d",0,"do","day"),H("dd",0,0,function(a){return this.localeData().weekdaysMin(this,a)}),H("ddd",0,0,function(a){return this.localeData().weekdaysShort(this,a)}),H("dddd",0,0,function(a){return this.localeData().weekdays(this,a)}),H("e",0,0,"weekday"),H("E",0,0,"isoWeekday"),z("day","d"),z("weekday","e"),z("isoWeekday","E"),N("d",Wc),N("e",Wc),N("E",Wc),N("dd",cd),N("ddd",cd),N("dddd",cd),R(["dd","ddd","dddd"],function(a,b,c){var d=c._locale.weekdaysParse(a);null!=d?b.d=d:j(c).invalidWeekday=a}),R(["d","e","E"],function(a,b,c,d){b[d]=q(a)});var Ed="Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),Fd="Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),Gd="Su_Mo_Tu_We_Th_Fr_Sa".split("_");H("H",["HH",2],0,"hour"),H("h",["hh",2],0,function(){return this.hours()%12||12}),Sb("a",!0),Sb("A",!1),z("hour","h"),N("a",Tb),N("A",Tb),N("H",Wc),N("h",Wc),N("HH",Wc,Sc),N("hh",Wc,Sc),Q(["H","HH"],id),Q(["a","A"],function(a,b,c){c._isPm=c._locale.isPM(a),c._meridiem=a}),Q(["h","hh"],function(a,b,c){b[id]=q(a),j(c).bigHour=!0});var Hd=/[ap]\.?m?\.?/i,Id=C("Hours",!0);H("m",["mm",2],0,"minute"),z("minute","m"),N("m",Wc),N("mm",Wc,Sc),Q(["m","mm"],jd);var Jd=C("Minutes",!1);H("s",["ss",2],0,"second"),z("second","s"),N("s",Wc),N("ss",Wc,Sc),Q(["s","ss"],kd);var Kd=C("Seconds",!1);H("S",0,0,function(){return~~(this.millisecond()/100)}),H(0,["SS",2],0,function(){return~~(this.millisecond()/10)}),H(0,["SSS",3],0,"millisecond"),H(0,["SSSS",4],0,function(){return 10*this.millisecond()}),H(0,["SSSSS",5],0,function(){return 100*this.millisecond()}),H(0,["SSSSSS",6],0,function(){return 1e3*this.millisecond()}),H(0,["SSSSSSS",7],0,function(){return 1e4*this.millisecond()}),H(0,["SSSSSSSS",8],0,function(){return 1e5*this.millisecond()}),H(0,["SSSSSSSSS",9],0,function(){return 1e6*this.millisecond()}),z("millisecond","ms"),N("S",Xc,Rc),N("SS",Xc,Sc),N("SSS",Xc,Tc);var Ld;for(Ld="SSSS";Ld.length<=9;Ld+="S")N(Ld,$c);for(Ld="S";Ld.length<=9;Ld+="S")Q(Ld,Wb);var Md=C("Milliseconds",!1);H("z",0,0,"zoneAbbr"),H("zz",0,0,"zoneName");var Nd=n.prototype;Nd.add=Ad,Nd.calendar=cb,Nd.clone=db,Nd.diff=ib,Nd.endOf=ub,Nd.format=mb,Nd.from=nb,Nd.fromNow=ob,Nd.to=pb,Nd.toNow=qb,Nd.get=F,Nd.invalidAt=Cb,Nd.isAfter=eb,Nd.isBefore=fb,Nd.isBetween=gb,Nd.isSame=hb,Nd.isValid=Ab,Nd.lang=Cd,Nd.locale=rb,Nd.localeData=sb,Nd.max=wd,Nd.min=vd,Nd.parsingFlags=Bb,Nd.set=F,Nd.startOf=tb,Nd.subtract=Bd,Nd.toArray=yb,Nd.toObject=zb,Nd.toDate=xb,Nd.toISOString=lb,Nd.toJSON=lb,Nd.toString=kb,Nd.unix=wb,Nd.valueOf=vb,Nd.year=td,Nd.isLeapYear=ia,Nd.weekYear=Fb,Nd.isoWeekYear=Gb,Nd.quarter=Nd.quarters=Jb,Nd.month=Y,Nd.daysInMonth=Z,Nd.week=Nd.weeks=na,Nd.isoWeek=Nd.isoWeeks=oa,Nd.weeksInYear=Ib,Nd.isoWeeksInYear=Hb,Nd.date=Dd,Nd.day=Nd.days=Pb,Nd.weekday=Qb,Nd.isoWeekday=Rb,Nd.dayOfYear=qa,Nd.hour=Nd.hours=Id,Nd.minute=Nd.minutes=Jd,Nd.second=Nd.seconds=Kd,
    Nd.millisecond=Nd.milliseconds=Md,Nd.utcOffset=Na,Nd.utc=Pa,Nd.local=Qa,Nd.parseZone=Ra,Nd.hasAlignedHourOffset=Sa,Nd.isDST=Ta,Nd.isDSTShifted=Ua,Nd.isLocal=Va,Nd.isUtcOffset=Wa,Nd.isUtc=Xa,Nd.isUTC=Xa,Nd.zoneAbbr=Xb,Nd.zoneName=Yb,Nd.dates=aa("dates accessor is deprecated. Use date instead.",Dd),Nd.months=aa("months accessor is deprecated. Use month instead",Y),Nd.years=aa("years accessor is deprecated. Use year instead",td),Nd.zone=aa("moment().zone is deprecated, use moment().utcOffset instead. https://github.com/moment/moment/issues/1779",Oa);var Od=Nd,Pd={sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},Qd={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},Rd="Invalid date",Sd="%d",Td=/\d{1,2}/,Ud={future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},Vd=s.prototype;Vd._calendar=Pd,Vd.calendar=_b,Vd._longDateFormat=Qd,Vd.longDateFormat=ac,Vd._invalidDate=Rd,Vd.invalidDate=bc,Vd._ordinal=Sd,Vd.ordinal=cc,Vd._ordinalParse=Td,Vd.preparse=dc,Vd.postformat=dc,Vd._relativeTime=Ud,Vd.relativeTime=ec,Vd.pastFuture=fc,Vd.set=gc,Vd.months=U,Vd._months=md,Vd.monthsShort=V,Vd._monthsShort=nd,Vd.monthsParse=W,Vd.week=ka,Vd._week=ud,Vd.firstDayOfYear=ma,Vd.firstDayOfWeek=la,Vd.weekdays=Lb,Vd._weekdays=Ed,Vd.weekdaysMin=Nb,Vd._weekdaysMin=Gd,Vd.weekdaysShort=Mb,Vd._weekdaysShort=Fd,Vd.weekdaysParse=Ob,Vd.isPM=Ub,Vd._meridiemParse=Hd,Vd.meridiem=Vb,w("en",{ordinalParse:/\d{1,2}(th|st|nd|rd)/,ordinal:function(a){var b=a%10,c=1===q(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th";return a+c}}),a.lang=aa("moment.lang is deprecated. Use moment.locale instead.",w),a.langData=aa("moment.langData is deprecated. Use moment.localeData instead.",y);var Wd=Math.abs,Xd=yc("ms"),Yd=yc("s"),Zd=yc("m"),$d=yc("h"),_d=yc("d"),ae=yc("w"),be=yc("M"),ce=yc("y"),de=Ac("milliseconds"),ee=Ac("seconds"),fe=Ac("minutes"),ge=Ac("hours"),he=Ac("days"),ie=Ac("months"),je=Ac("years"),ke=Math.round,le={s:45,m:45,h:22,d:26,M:11},me=Math.abs,ne=Ha.prototype;ne.abs=oc,ne.add=qc,ne.subtract=rc,ne.as=wc,ne.asMilliseconds=Xd,ne.asSeconds=Yd,ne.asMinutes=Zd,ne.asHours=$d,ne.asDays=_d,ne.asWeeks=ae,ne.asMonths=be,ne.asYears=ce,ne.valueOf=xc,ne._bubble=tc,ne.get=zc,ne.milliseconds=de,ne.seconds=ee,ne.minutes=fe,ne.hours=ge,ne.days=he,ne.weeks=Bc,ne.months=ie,ne.years=je,ne.humanize=Fc,ne.toISOString=Gc,ne.toString=Gc,ne.toJSON=Gc,ne.locale=rb,ne.localeData=sb,ne.toIsoString=aa("toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)",Gc),ne.lang=Cd,H("X",0,0,"unix"),H("x",0,0,"valueOf"),N("x",_c),N("X",bd),Q("X",function(a,b,c){c._d=new Date(1e3*parseFloat(a,10))}),Q("x",function(a,b,c){c._d=new Date(q(a))}),a.version="2.10.6",b(Da),a.fn=Od,a.min=Fa,a.max=Ga,a.utc=h,a.unix=Zb,a.months=jc,a.isDate=d,a.locale=w,a.invalid=l,a.duration=Ya,a.isMoment=o,a.weekdays=lc,a.parseZone=$b,a.localeData=y,a.isDuration=Ia,a.monthsShort=kc,a.weekdaysMin=nc,a.defineLocale=x,a.weekdaysShort=mc,a.normalizeUnits=A,a.relativeTimeThreshold=Ec;var oe=a;return oe});/**
 *
 * js错误收集
 *
 */

window.onerror = function (message, url, line) {
    if (!url) return;
    var msg = {},
        msgStr,
        msgArr = [];

    //组装错误信息
    msg.ua = window.navigator.userAgent;
    msg.message = message.message;
    msg.url = url;
    msg.line = line;
    msg.page = window.location.href;

    //将错误信息转换成字符串
    for (var key in msg) {
        msgArr.push(key + '=' + msg[key]);
    }
    msgStr = msgArr.join('\n');

    //alert(msgStr);
    // 后台写放日志
    //$.get('', {'error': msgStr});

};

window.onload = function () {
    setTimeout(function () {
        window.scrollTo(0, 1)
    }, 0);
}

$(function () {

    //FastClick.attach(document.body);

    var $loading = $("#cc-loading");
    $(window).load(function () {
        $loading.delay(100).fadeOut("slow");
    });

    $(document).on('ajaxStart', function () {
        $loading.show();
    });
    $(document).on('ajaxComplete', function () {
        $loading.fadeOut();
    });

    $('[data-back]').on('click', function () {
        window.history.go(-1);
        return false;
    });

    echo.init({
        offset: 100,
        throttle: 250,
        unload: false,
        callback: function (element, op) {

        }
    });

    // 无限加载
    $('.infinite-container').infinite({
        onAfterPageLoad: function ($items) {
            echo.refresh();
            if ($items.find('[data-role="pureview"]').length || $items.is('[data-role="pureview"]')) {
                $('[data-role="pureview"]').pureview();
            }
        }
    });

    var topElement = $('[data-role="gotop"]'),
        offTop = 50,
        gotTopTpl = ['<div class="cc-top" data-role="gotop">',
            '<span class="arrow"></span>',
            '顶部',
            '</div>'].join("");

    if (!topElement.length) {
        topElement = $(gotTopTpl).appendTo('body');
    }

    $(window).on('scroll', $.debounce(function () {
        var me = $(this),
            scrollTop = me.scrollTop();
        scrollTop > offTop ? topElement.addClass('cc-active') : topElement.removeClass('cc-active');
    }, 50)).trigger('scroll');

});