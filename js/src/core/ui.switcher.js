// 显隐控制
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
});