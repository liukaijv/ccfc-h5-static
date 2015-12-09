// 无限滚动加载
;
(function () {

    function InfiniteScroll(elem, options) {
        this.$elem = $(elem);
        this.options = $.extend({},
            InfiniteScroll.DEFAULTS, options || {});

        this.bind();
    }

    // 初始值
    InfiniteScroll.DEFAULTS = {
        distance: 50,
        direction: 'bottom'
    };

    InfiniteScroll.prototype = {

        handleInfiniteScroll: function () {
            var inf = this.$elem,
                scrollTop = inf[0].scrollTop,
                scrollHeight = inf[0].scrollHeight,
                height = inf[0].offsetHeight,
                distance,
                dir;
            if (!inf.is($(window))) {
                distance = inf[0].getAttribute('data-distance');
                dir = inf[0].getAttribute('data-direction');
            }
            if (!distance) distance = this.options.distance;
            if (!dir) dir = this.options.direction;
            if (typeof distance === 'string' && distance.indexOf('%') >= 0) {
                distance = parseInt(distance, 10) / 100 * height;
            }
            if (distance > height) distance = height;
            if (dir == 'top') {
                if (scrollTop < distance) {
                    inf.trigger('infinite', [dir]);
                }
            }
            else {
                if (scrollTop + height >= scrollHeight - distance) {
                    inf.trigger('infinite', [dir]);
                }
            }
        },

        bind: function () {
            this.$elem.on('scroll.infinite', $.proxy(function () {
                this.handleInfiniteScroll();
            }, this));
        },

        unbind: function () {
            this.$elem.off('scroll.infinite');
        }
    }

    $.fn.infiniteScroll = function (option) {

        return this.each(function () {
            var $this = $(this);
            var data = $this.data('infiniteScroll');
            var options = $.extend({}, InfiniteScroll.DEFAULTS,
                typeof option == 'object' && option);

            if (!data) {
                $this.data('infiniteScroll', (data = new InfiniteScroll(this, options)));
            }

            if (typeof option == 'string') {
                data[option] && data[option]();
            }

        });
    }


})(jQuery);

