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
}(jQuery));