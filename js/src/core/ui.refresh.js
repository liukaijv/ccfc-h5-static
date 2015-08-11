// 上拉下拉刷新插件
// bug 图片加载慢会导致计算不正确，上拉加载会出现问题

// 修改自gmu版本
// 基于iscroll[iScroll 4.2.2](http://cubiq.org/iscroll-4);
;
(function ($) {

    var Refresh = function (element, options) {
        this.$el = $(element);
        this._options = $.extend({}, Refresh.DEFAULTS, options);
        this.iScroll = null;
        this._init();
    }

    Refresh.DEFAULTS = {
        useTransition: true,
        speedScale: 1,
        topOffset: 0,
        threshold: 5,
        statechange: null,
        wrapElem: '.ui-iscroller',
        upElem: '.ui-refresh-up',
        downElem: '.ui-refresh-down',
        autoTrigger: false,
        loadData: function () {
        }
    }

    Refresh.prototype = {

        _init: function () {
            var me = this,
                opts = me._options,
                $el = this.$el;

            var $wrapper = $(opts.wrapElem);
            if (!$wrapper.length) {
                $wrapper = $el.wrapAll($('<div class="ui-iscroller"></div>'));
            }

            $.each(['up', 'down'], function (i, dir) {
                var $elem = $(opts[dir + 'Elem']);

                if (!$elem.length) {
                    $elem = $('<div class="ui-refresh-' + dir + '"></div>');
                    $el[dir == 'up' ? 'prepend' : 'append']($elem);
                }

                var elem = $elem.get(0);

                if ($elem.length) {
                    me._status(dir, true);
                    if (!elem.childNodes.length || ($elem.find('.refresh-icon').length && $elem.find('.refresh-label').length)) {
                        !elem.childNodes.length && me._createBtn(dir);
                        opts.refreshInfo || (opts.refreshInfo = {});
                        opts.refreshInfo[dir] = {
                            $icon: $elem.find('.refresh-icon'),
                            $label: $elem.find('.refresh-label'),
                            text: $elem.find('.refresh-label').html()
                        }
                    }
                    $elem.on('click', function () {
                        if (!me._status(dir) || opts._actDir) return;
                        me._setStyle(dir, 'loading');
                        me._loadingAction(dir, 'click');
                    }).trigger('click');

                    opts.autoTrigger && $elem.trigger('click');
                }
            });

            me._options.topOffset = $(opts['upElem']) ? $(opts['upElem']).outerHeight() : 0;

            if (!this.iScroll) {
                me._loadIscroll();
            }
        },

        // 创建按钮
        _createBtn: function (dir) {
            var dirText = dir == 'up' ? '下拉' : '上拉';
            $(this._options[dir + 'Elem']).html('<span class="refresh-icon"></span><span class="refresh-label">' + dirText + '加载更多</span>');
            return this;
        },

        _setStyle: function (dir, state) {
            var me = this,
                stateChange = $.Event('statechange');

            me.$el.trigger(stateChange, $(me._options[dir + 'Elem']), state, dir);
            if (stateChange.defaultPrevented) {
                return me;
            }

            return me._changeStyle(dir, state);
        },

        // 改变样式
        _changeStyle: function (dir, state) {
            var me = this,
                opts = me._options,
                refreshInfo = opts.refreshInfo[dir];

            switch (state) {
                case 'loaded':
                    refreshInfo['$icon'].removeClass().addClass('refresh-icon');
                    refreshInfo['$label'].html(refreshInfo['text']);
                    opts._actDir = '';
                    break;
                case 'beforeload':
                    refreshInfo['$label'].html('松开立即加载');
                    refreshInfo['$icon'].addClass('refresh-flip');
                    break;
                case 'loading':
                    refreshInfo['$icon'].addClass('refresh-loading');
                    refreshInfo['$label'].html('数据加载中...');
                    opts._actDir = dir;
                    break;
                case 'disable':
                    refreshInfo['$icon'].removeClass();
                    refreshInfo['$label'].html('没有更多内容了');
                    break;
            }
            return me;
        },

        // 加载iscroll
        _loadIscroll: function () {
            var me = this,
                opts = me._options,
                threshold = opts.threshold;

            me.iScroll = new iScroll(me.$el.parent().get(0), opts.iScrollOpts = $.extend({
                useTransition: opts.useTransition,
                speedScale: opts.speedScale,
                topOffset: opts.topOffset
            }, opts.iScrollOpts, {
                onScrollStart: function (e) {
                    me.$el.trigger('scrollstart', e);
                },
                onScrollMove: (function () {
                    var up = $(opts.upElem) && $(opts.upElem).length,
                        down = $(opts.downElem) && $(opts.downElem).length;

                    return function (e) {
                        var upRefreshed = opts['_upRefreshed'],
                            downRefreshed = opts['_downRefreshed'],
                            upStatus = me._status('up'),
                            downStatus = me._status('down');

                        if (up && !upStatus || down && !downStatus || this.maxScrollY >= 0) return;
                        //下边按钮，上拉加载
                        if (downStatus && down && !downRefreshed && this.y < (this.maxScrollY - threshold)) {
                            me._setMoveState('down', 'beforeload', 'pull');
                            //上边按钮，下拉加载
                        } else if (upStatus && up && !upRefreshed && this.y > threshold) {
                            me._setMoveState('up', 'beforeload', 'pull');
                            this.minScrollY = 0;
                            //下边按钮，上拉恢复
                        } else if (downStatus && downRefreshed && this.y > (this.maxScrollY + threshold)) {
                            me._setMoveState('down', 'loaded', 'restore');
                            //上边按钮，下拉恢复
                        } else if (upStatus && upRefreshed && this.y < threshold) {
                            me._setMoveState('up', 'loaded', 'restore');
                            this.minScrollY = -opts.topOffset;
                        }

                        me.$el.trigger('scrollmove', e);
                    };
                })(),
                onScrollEnd: function (e) {
                    var actDir = opts._actDir;
                    if (actDir && me._status(actDir)) {

                        me._setStyle(actDir, 'loading');
                        me._loadingAction(actDir, 'pull');
                    }
                    me.$el.trigger('scrollend', e);
                }
            }));
        },

        _status: function (dir, status) {
            var opts = this._options;
            return status === undefined ? opts['_' + dir + 'Open'] : opts['_' + dir + 'Open'] = !!status;
        },

        _setable: function (able, dir, hide) {
            var me = this,
                opts = me._options,
                dirArr = dir ? [dir] : ['up', 'down'];

            $.each(dirArr, function (i, dir) {
                var $elem = $(opts[dir + 'Elem']);
                if (!$elem.length) return;
                //若是enable操作，直接显示，disable则根据text是否是true来确定是否隐藏
                able ? $elem.show() : (hide ? $elem.hide() : me._setStyle(dir, 'disable'));
                me._status(dir, able);
            });

            return me;
        },

        disable: function (dir, hide) {
            return this._setable(false, dir, hide);
        },

        enable: function (dir) {
            return this._setable(true, dir);
        },

        _setMoveState: function (dir, state, actType) {
            var me = this,
                opts = me._options;

            me._setStyle(dir, state);
            opts['_' + dir + 'Refreshed'] = actType == 'pull';
            opts['_actDir'] = actType == 'pull' ? dir : '';

            return me;
        },

        _loadingAction: function (dir, type) {
            var me = this,
                opts = me._options,
                loadFn = opts.loadData;

            $.isFunction(loadFn) && loadFn(dir, type);
            me._status(dir, false);

            return me;
        },

        // 加载完成后
        afterDataLoading: function (dir) {
            var me = this,
                opts = me._options,
                dir = dir || opts._actDir;

            me.iScroll.refresh();
            opts['_' + dir + 'Refreshed'] = false;
            me._setStyle(dir, 'loaded');
            me._status(dir, true);
        },

        update: function () {
            this.iScroll.refresh();
        }

    }

    // jquery 插件
    $.fn.refresh = function (options, value) {
        return this.each(function () {

            var $this = $(this),
                data = $this.data('refresh');

            if (!data) {
                $this.data('refresh', (data = new Refresh(this, $.extend({}, options))));
            }
            if (typeof options == 'string') {

                data[options] && data[options](value);
            }
        });
    }

})(jQuery)