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
// 选项卡插件

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
            .on('click.spinner', "[data-spin='up'],[data-spin='down']", $.proxy(this.spin, this))
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

    Spinner.delay = 500;

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

            this.active = false;

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
    $doc.on('click.modal', '[data-role="modal"]', function () {
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
    var $swipe = $('[data-role="swipe"]');
    var showDots = $swipe.data('dots');
    var swipeItemLen = $swipe.find('.swipe-wrap li').length;
    var counts = $swipe.find('.counts');
    if (swipeItemLen > 1 && showDots) {
        var html = '<ol class="dots">';
        for (var i = 0; i < swipeItemLen; i++) {
            html += '<li class="dot">' + i + '</li>';
        }
        html += '</ol>';
        $swipe.append(html);
        $swipe.find('.dot').on('click', function () {
            appSwipe.slide($(this).text());
            $(this).addClass('active').siblings().removeClass('active');
        }).first().addClass('active');
    }
    if (counts.length < 1) {
        counts = $('<div class="counts"><span class="current-index"></span>/<span class="total-index"></span></div>').appendTo($swipe);
        counts.find('.current-index').html('1');
        counts.find('.total-index').html(swipeItemLen);
    }
    window.appSwipe = Swipe($swipe.get(0), {
        callback: function (pos) {
            pos = pos % 2;
            counts.find('.current-index').html(pos + 1);
            $swipe.find('.dot').eq(pos).addClass('active').siblings().removeClass('active');
        }
    });
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
// 图片查看
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
            $(this).data('amui.pinchzoom', new PinchZoom($(this), {}));
            $(this).on('pz_doubletap', function (e) {
                //
            });
        });

        $images.on('click.pureview.amui', function (e) {
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
            on('click.direction.pureview.amui', function (e) {
                e.preventDefault();
                var $clicked = $(e.target).parent('li');

                if ($clicked.is('.cc-pureview-prev')) {
                    me.prevSlide();
                } else {
                    me.nextSlide();
                }
            });

        // Nav Contorl
        this.$navItems.on('click.nav.pureview.amui', function () {
            var index = me.$navItems.index($(this));
            me.activate(me.$slides.eq(index));
        });

        // Close Icon
        $pureview.find(options.selector.close).
            on('click.close.pureview.amui', function (e) {
                e.preventDefault();
                me.close();
            });

        $slider.hammer().on('click.pureview.amui', function (e) {
            e.preventDefault();
            me.toggleToolBar();
        }).on('swipeleft.pureview.amui', function (e) {
            e.preventDefault();
            me.nextSlide();
        }).on('swiperight.pureview.amui', function (e) {
            e.preventDefault();
            me.prevSlide();
        });

        $slider.data('hammer').get('swipe').set({
            direction: Hammer.DIRECTION_HORIZONTAL,
            velocity: 0.35
        });

        // $(document).on('keydown.pureview.amui', $.proxy(function(e) {
        //   var keyCode = e.keyCode;
        //   if (keyCode == 37) {
        //     this.prevSlide();
        //   } else if (keyCode == 39) {
        //     this.nextSlide();
        //   } else if (keyCode == 27) {
        //     this.close();
        //   }
        // }, this));

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
            var data = $this.data('am.pureview');
            var options = $.extend({},
                UI.utils.options($this.data('amPureview')),
                typeof option == 'object' && option);

            if (!data) {
                $this.data('am.pureview', (data = new PureView(this, options)));
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

})(jQuery);// 显隐控制
(function ($) {

    "use strict";

    var Switcher = function (elem, options) {
        this.options = $.extend({}, Switcher.DEFAULTS, options || {});
        this.$element = $(elem);
        this.init();
    }

    Switcher.DEFAULTS = {
        connect: false,
        toggle: ">*",
        active: null,
        animation: false,
        duration: 200
    };

    Switcher.prototype = {

        init: function () {

            var me = this,
                $this = this.$element;

            $this.on("click", this.options.toggle, function (e) {
                e.preventDefault();
                me.show(this);
            });

            if (this.options.connect) {

                this.connect = $(this.options.connect).find(".cc-active").removeClass(".cc-active").end();

                if (this.connect.length) {

                    this.connect.on("click", '[data-switcher-item]', function (e) {

                        e.preventDefault();

                        var item = $(this).attr('data-switcher-item');

                        if (me.index == item || !item) return;

                        switch (item) {
                            case 'next':
                            case 'previous':
                                me.show(me.index + (item == 'next' ? 1 : -1));
                                break;
                            case 'reset':
                                me.reset();
                                break;
                            // default:
                            // me.show(item);
                        }

                    });

                }

                var toggles = $this.find(this.options.toggle),
                    active = toggles.filter(".cc-active");

                if (active.length) {
                    me.show(active, false);

                } else {
                    if (me.options.active) {
                        active = toggles.eq(this.options.active);
                        active && me.show(active);
                    }
                }
            }

        },

        show: function (tab) {

            var me = this,
                $this = $this = this.$element;

            tab = isNaN(tab) ? $(tab) : $this.find(this.options.toggle).eq(tab);

            var active = tab;


            if (active.hasClass("cc-disabled")) return;

            $this.find(this.options.toggle).filter(".cc-active").removeClass("cc-active");
            active.addClass("cc-active");

            if (this.options.connect && this.connect.length) {

                me.index = $this.find(this.options.toggle).index(active);

                if (me.index == -1) {
                    me.index = 0;
                }

                this.connect.each(function () {

                    var container = $(this),
                        children = container.children(),
                        current = children.filter('.cc-active'),
                        next = children.eq(me.index);

                    current.hide().removeClass("cc-active");
                    next.show().addClass("cc-active");

                });

            }

            $this.trigger("cc.switcher.show", [active]);

        },

        reset: function () {
            var me = this,
                $this = $this = this.$element;

            $this.find(this.options.toggle).removeClass("cc-active");
            this.connect.each(function () {

                var container = $(this),
                    children = container.children();

                children.hide().removeClass("cc-active");

            });
        }

    }

    $.fn.switcher = function (option) {

        return this.each(function () {

            var $this = $(this);

            var data = $this.data('switcher.cc');
            var options = $.extend(option, UI.utils.options($this.attr("data-switcher")) || {});

            if (!data) {

                $this.data('switcher.cc', (data = new Switcher(this, options)));
            }

        });
    }


})(jQuery);

$(function () {
    $('[data-switcher]').switcher();
});(function (window, doc) {
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
        this.pageIndex = 0;
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

            var opts = this._options;
            this.renderHtml(new Date(), opts.perPage);
            this.bindEvents();

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
                el.trigger(ev, date);
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
            //console.log(me.loading);
            if (me.loading && this.pageIndex < opts.totalPage) {
                $.isFunction(loadFn) && loadFn(formatDate(me.lastDate));
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
            this.pageIndex += opts.perPage;

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
            this.pageIndex += amount;

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
                        html += this._renderDay(j, printDate, firstDay, drawMonth, selectedDate, today, minDate, maxDate);
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
                if ($.isPlainObject(priceData)) {
                    $.each(priceData, function (k, v) {
                        date = parseDate(k);
                        if (printDate.getTime() === date.getTime()) {
                            if (v.price != '') {
                                output = '&yen;' + v.price;
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
        "showText": '<i class="icon icon-eye f16"></i>',
        "hideText": '<i class="icon icon-eye-slash f16"></i>'
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
            finishText: '已结束'
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
                TS = endTime.getTime() - nowTime.getTime()  + opts.diffTime;
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
                }
                me.html(timeStr);

            }, 1000);

        });

    }

})(jQuery);

$(function () {
    $('[data-role="countdown"]').countdown();
});$(function () {

    // if ('addEventListener' in document) {
    //     document.addEventListener('DOMContentLoaded', function() {
    //         FastClick.attach(document.body);
    //     }, false);
    // }

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

    // $('.wishlist-label').on('click', function(){
    // 	$(this).toggleClass('cc-active');
    // });

});