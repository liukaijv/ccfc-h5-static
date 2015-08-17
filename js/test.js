$(function () {

    // if ('addEventListener' in document) {
    //     document.addEventListener('DOMContentLoaded', function() {
    //         FastClick.attach(document.body);
    //     }, false);
    // }

    $(window).load(function() {
        //$("#cc-preloader").delay(100).fadeOut("slow");
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