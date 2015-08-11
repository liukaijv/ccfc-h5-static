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

    // $('.wishlist-label').on('click', function(){
    // 	$(this).toggleClass('cc-active');
    // });

});