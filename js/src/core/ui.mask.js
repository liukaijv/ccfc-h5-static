// 遮罩插件 

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

})(jQuery);