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
});