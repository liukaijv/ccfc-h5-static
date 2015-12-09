;
(function ($) {

    $.fn.unveil = function (options) {

        var defaults = {
            threshold: 0,
            container: null,
            callback: function () {
            }
        }

        var settings = $.extend(defaults, options || {});

        var $w = settings.container ? $(settings.container) : $(window),
            th = settings.threshold,
            retina = window.devicePixelRatio > 1,
            attrib = retina ? "data-echo-retina" : "data-echo",
            images = this,
            loaded;

        this.one("unveil", function () {
            var source = this.getAttribute(attrib);
            source = source || this.getAttribute("data-echo");
            if (source) {
                this.setAttribute("src", source);
                if (typeof callback === "function") callback.call(this);
            }
        });

        function unveil() {
            var inview = images.filter(function () {
                var $e = $(this);
                if ($e.is(":hidden")) return;

                var wt = $w.scrollTop(),
                    wb = wt + $w.height(),
                    et = $e.offset().top,
                    eb = et + $e.height();

                return eb >= wt - th && et <= wb + th;
            });

            loaded = inview.trigger("unveil");
            images = images.not(loaded);
        }

        $w.on("scroll.unveil resize.unveil lookup.unveil", unveil);

        unveil();

        return this;

    };

})(window.jQuery || window.Zepto);
