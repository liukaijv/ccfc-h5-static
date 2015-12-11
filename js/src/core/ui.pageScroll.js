/*
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

}(window.jQuery || window.Zepto))