// 倒计时
;
(function ($) {

    var formatNumber = function (val, len) {
        var num = "" + val;
        while (num.length < len) {
            num = "0" + num;
        }
        return num;
    }

    $.fn.countdown = function (options) {

        var defaults = {
            diffTime: 0,
            attr: 'data-time',
            finishText: '已结束'
        }

        var opts = $.extend(defaults, options || {});

        return this.each(function () {

            var me = $(this),
                timestamp = parseInt(me.attr(opts.attr) * 1000),
                endTime = new Date(timestamp),
                nowTime,
                TS,
                D,
                H,
                M,
                S,
                MS;

            setInterval(function () {

                nowTime = new Date();
                TS = endTime.getTime() - nowTime.getTime()  + opts.diffTime;
                D = Math.floor(TS / (1000 * 60 * 60 * 24)); //天
                H = Math.floor(TS / (1000 * 60 * 60)) % 24; //小时
                M = Math.floor(TS / (1000 * 60)) % 60; //分钟
                S = Math.floor(TS / 1000) % 60; //秒
                MS = Math.floor(TS / 100) % 10; //拆分秒
                if (D >= 0) {
                    D = D == 0 ? '' : formatNumber(D, 2) + "天";
                    H = H == 0 ? '' : formatNumber(H, 2) + "小时";
                    M = M == 0 ? '' : formatNumber(M, 2) + "分";
                    S = S == 0 ? '' : formatNumber(S, 2) + "秒";
                    // var timeStr = D + "天" + H + "小时" + M + "分" + S + "." + MS +  "秒";
                    var timeStr = D + H + M + S;
                } else {
                    var timeStr = opts.finishText;
                }
                me.html(timeStr);

            }, 1000);

        });

    }

})(jQuery);

$(function () {
    $('[data-role="countdown"]').countdown();
});