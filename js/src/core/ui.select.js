// select 插件
// bug $([]).val('foo')时需要手动触发一下change事件

// <div class="form-select">
// 	<span></span>
// 	<select>					
// 		<option></option>						
// 	</select>
// </div>

;
(function ($) {

    "use strict";

    var FormSelect = function ($element, settings) {
        this.settings = $.extend({},
            FormSelect.DEFAULTS, settings || {});
        this.element = $element;
        this.init();
        return this;
    }

    // 初始值
    FormSelect.DEFAULTS = {
        'target': '>span:first'
    };

    FormSelect.prototype = {

        init: function () {

            var $this = this;
            // debugger;

            this.target = this.element.find(this.settings.target);
            this.select = this.element.find('select');

            // init + on change event
            this.select.on("change", (function () {

                var select = $this.select[0], fn = function () {
                    try {
                        $this.target.text(select.options[select.selectedIndex].text);
                    } catch (e) {
                    }

                    return fn;
                };

                return fn();
            })());

            this.element.data("formSelect", this);
        }
    }

    //  插件
    $.fn.formSelect = function (settings) {
        return this.each(function () {
            var that = $(this);
            var plugin = that.data('formSelect');
            if (!plugin) {
                plugin = new FormSelect(that, settings);
                that.data('formSelect', plugin);
            }
        });
    }

})(jQuery);
$(function () {
    $('.form-select').formSelect();
});