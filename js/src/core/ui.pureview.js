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

})(jQuery);