// 日历组件

;
(function ($) {

    var monthNames = ["01月", "02月", "03月", "04月", "05月", "06月",
            "07月", "08月", "09月", "10月", "11月", "12月"],

        dayNames = ["日", "一", "二", "三", "四", "五", "六"],
        offsetRE = /^(\+|\-)?(\d+)(M|Y)$/i,

    //获取月份的天数
        getDaysInMonth = function (year, month) {
            return 32 - new Date(year, month, 32).getDate();
        },

    //获取月份中的第一天是所在星期的第几天
        getFirstDayOfMonth = function (year, month) {
            return new Date(year, month, 1).getDay();
        },

    //格式化数字，不足补零.
        formatNumber = function (val, len) {
            var num = "" + val;
            while (num.length < len) {
                num = "0" + num;
            }
            return num;
        },

        parseDate = function (obj) {
            var dateRE = /^(\d{4})(?:\-|\/)(\d{1,2})(?:\-|\/)(\d{1,2})$/;
            return Object.prototype.toString.call(obj) === '[object Date]' ? obj : dateRE.test(obj) ? new Date(parseInt(RegExp.$1, 10), parseInt(RegExp.$2, 10) - 1, parseInt(RegExp.$3, 10)) : null;
        },

        formatDate = function (date) {
            return date.getFullYear() + '-' + formatNumber(date.getMonth() + 1, 2) + '-' + formatNumber(date.getDate(), 2);
        };


    var Calendar = function (element, options) {
        this.$el = $(element);
        this._options = $.extend({}, Calendar.DEFAULTS, options);
        this.minDate = this._options.minDate;
        this.maxDate = this._options.maxDate;
        this.date = this._options.date || new Date();
        this.iscroll = null;
        this.init();
    }

    Calendar.DEFAULTS = {
        date: null, // 初始化日期
        firstDay: 1, // 一周从星期几开始
        minDate: null, // 最小日期
        maxDate: null, // 最大日期
        canSwipe: true,// 是否可滑动加载一个月
        perPage: 5,
        datePrice: null
    }

    Calendar.prototype = {

        init: function () {

            var el = this.$el,
                opts = this._options;

            this.renderHtml(new Date(), opts.perPage);
            this.bindEvents();

        },

        // 绑定事件
        bindEvents: function () {

            var el = this.$el,
                cell,
                date;

            $(document).on('click', '.cc-calendar-calendar tbody a', function (e) {
                var me = $(this);
                var ev = $.Event('select.calendar', {'relatedTarget': this});
                e.preventDefault();
                // if(me.hasClass('cc-active')) return;
                cell = me.parent();
                date = cell.attr('data-year') + formatNumber(cell.attr('data-month'), 2) + formatNumber(me.attr('data-date'), 2);
                el.trigger(ev, date);
                el.find('.cc-calendar-current-day').removeClass('cc-calendar-current-day')
                el.find('.cc-calendar-calendar tbody a').removeClass('cc-active');
                me.addClass('cc-active');
            });

            // this.iscroll = new iScroll(el.find('.cc-calendar-content').get(0));                              

        },

        // 输出日期
        renderHtml: function (date, amount) {
            var opts = this._options,
                tempDate = date,
                nowYear = tempDate.getFullYear(),
                nowMonth = tempDate.getMonth(),
                today = new Date(tempDate.getFullYear(), tempDate.getMonth(),
                    tempDate.getDate()),

                minDate = this.minDate,
                maxDate = this.maxDate,
                selectedDate = this.date,
                html = '',
                i,
                j,
                firstDay,
                day,
                leadDays,
                daysInMonth,
                rows,
                printDate,
                k;

            firstDay = (isNaN(firstDay = parseInt(opts.firstDay, 10)) ? 0 : firstDay);

            html += '<ul class="cc-calendar-week">';

            for (i = 0; i < 7; i++) {
                day = (i + firstDay) % 7;

                html += '<li' + ((i + firstDay + 6) % 7 >= 5 ?

                        //如果是周末则加上cc-calendar-week-end的class给th
                        ' class="cc-calendar-week-end"' : '') + '>' +
                    '<span>' + dayNames[day] + '</span></li>';
            }

            html += '</ul><div class="cc-calendar-content"><div><table  class="cc-calendar-calendar"><tbody>';


            // 一次显示多少个月？
            for (k = 0; k < amount; k++) {

                renderDate = new Date(nowYear, nowMonth + k, 1);

                drawYear = renderDate.getFullYear();
                drawMonth = renderDate.getMonth();

                html += '<tr>' +
                    '<td colspan="7">' + this._renderHead(drawYear, drawMonth) + '</td></tr>';

                daysInMonth = getDaysInMonth(drawYear, drawMonth);
                leadDays = (getFirstDayOfMonth(drawYear, drawMonth) - firstDay + 7) % 7;
                rows = Math.ceil((leadDays + daysInMonth) / 7);
                printDate = new Date(drawYear, drawMonth, 1 - leadDays);

                for (i = 0; i < rows; i++) {
                    html += '<tr>';

                    for (j = 0; j < 7; j++) {
                        html += this._renderDay(j, printDate, firstDay, drawMonth, selectedDate, today, minDate, maxDate);
                        printDate.setDate(printDate.getDate() + 1);
                    }
                    html += '</tr>';
                }

            }

            html += '</tbody></table></div></div>';

            this.$el.append(html);

        },

        // 显示价格
        _renderPrice: function (printDate) {

            var opts = this._options,
                datePrice = opts.datePrice,
                date,
                output = '';

            if ($.isPlainObject(datePrice)) {
                $.each(datePrice, function (k, v) {
                    date = parseDate(k);
                    if (printDate.getTime() === date.getTime()) {
                        if (v.price != '') {
                            output = '&yen;' + v.price;
                        }
                        return false;
                    }
                });
            }

            return output;

        },

        // 年月
        _renderHead: function (drawYear, drawMonth) {
            var html = '<div class="cc-calendar-header">';

            html += '<span class="cc-calendar-year" data-value="' + drawYear + '">' + drawYear + '年' + '</span>';

            html += '<span class="cc-calendar-month" data-value="' + drawMonth + '">' + monthNames[drawMonth] + '</span>';

            return html;
        },

        // 每天
        _renderDay: function (j, printDate, firstDay, drawMonth, selectedDate, today, minDate, maxDate) {

            var otherMonth = (printDate.getMonth() !== drawMonth),
                unSelectable, priceDisplay;

            // 是否有价格
            priceDisplay = this._renderPrice(printDate);
            unSelectable = otherMonth || (minDate && printDate < minDate) || (maxDate && printDate > maxDate) || !priceDisplay;

            return "<td class='" + ((j + firstDay + 6) % 7 >= 5 ? "cc-calendar-week-end" : "") + // 标记周末

                (unSelectable ? " cc-calendar-unSelectable cc-state-disabled" : "") + //标记不可点的天

                (otherMonth || unSelectable ? '' : (printDate.getTime() === selectedDate.getTime() ? " cc-calendar-current-day" : "") + //标记当前选择
                    (printDate.getTime() === today.getTime() ? " cc-calendar-today" : "") //标记今天
                ) + "'" +

                (unSelectable ? "" : " data-month='" + (printDate.getMonth() + 1) + "' data-year='" + printDate.getFullYear() + "'") + ">" +

                (otherMonth ? "&#xa0;" : (unSelectable ? "<span class='cc-state-default'>" + (printDate.getTime() === today.getTime() ? "今天" : printDate.getDate()) + "</span>" :
                "<a class='cc-state-default" + (printDate.getTime() === today.getTime() ? " cc-state-highlight" : "") + (printDate.getTime() === selectedDate.getTime() ? " cc-state-active" : "") +
                "' href='#' data-date='" + printDate.getDate() + "'>" + (printDate.getTime() === today.getTime() ? "今天" : printDate.getDate()) + "<span class='cc-calendar-price'>" + priceDisplay + "</span></a>")) + "</td>";
        }

    }

    // 插件
    $.fn.calendar = function (option) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('calendar');
            var options = $.extend({},
                Calendar.DEFAULTS, typeof option == 'object' && option);

            if (!data) {
                $this.data('calendar', (data = new Calendar(this, options)));
            }

        });
    }


})(jQuery);

$(function () {
    $('[data-role="calendar"]').calendar();
});
