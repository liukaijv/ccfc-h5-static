$(function () {

    // if ('addEventListener' in document) {
    //     document.addEventListener('DOMContentLoaded', function() {
    //         FastClick.attach(document.body);
    //     }, false);
    // }

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

    // $('.wishlist-label').on('click', function(){
    // 	$(this).toggleClass('cc-active');
    // });

});