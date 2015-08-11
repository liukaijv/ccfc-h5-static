// 信息提示插件

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

})(jQuery);