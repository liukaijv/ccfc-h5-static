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

})(jQuery);