/**
 *
 * js错误收集
 *
 */

window.onerror = function (message, url, line) {
    if (!url) return;
    var msg = {},
        msgStr,
        msgArr = [];

    //组装错误信息
    msg.ua = window.navigator.userAgent;
    msg.message = message.message;
    msg.url = url;
    msg.line = line;
    msg.page = window.location.href;

    //将错误信息转换成字符串
    for (var key in msg) {
        msgArr.push(key + '=' + msg[key]);
    }
    msgStr = msgArr.join('\n');

    //alert(msgStr);
    // 后台写放日志
    //$.get('', {'error': msgStr});

};

$(function () {

    // if ('addEventListener' in document) {
    //     document.addEventListener('DOMContentLoaded', function() {
    //         FastClick.attach(document.body);
    //     }, false);
    // }

    var $loading = $("#cc-loading");
    $(window).load(function () {
        $loading.delay(100).fadeOut("slow");
    });

    $(document).on('ajaxStart', function () {
        $loading.show();
    });
    $(document).on('ajaxComplete', function () {
        $loading.fadeOut();
    });

    $('[data-back]').on('click', function () {
        window.history.go(-1);
        return false;
    });

    echo.init({
        offset: 100,
        throttle: 250,
        unload: false,
        callback: function (element, op) {

        }
    });

    var topElement = $('[data-role="gotop"]'),
        offTop = 50,
        gotTopTpl = ['<div class="cc-top" data-role="gotop">',
            '<span class="arrow"></span>',
            '顶部',
            '</div>'].join("");

    if (!topElement.length) {
        topElement = $(gotTopTpl).appendTo('body');
    }

    $(window).on('scroll', $.debounce(function () {
        var me = $(this),
            scrollTop = me.scrollTop();
        scrollTop > offTop ? topElement.addClass('cc-active') : topElement.removeClass('cc-active');
    }, 50)).trigger('scroll');

    // $('.wishlist-label').on('click', function(){
    // 	$(this).toggleClass('cc-active');
    // });

});