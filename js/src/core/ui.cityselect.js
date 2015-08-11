// 省份联动 配合ui.select.js有问题，需要处理一下
// 有时间重写下这个js

;
(function ($) {
    $.fn.citySelect = function (settings) {

        if (this.length < 1) {
            return
        }
        ;
        settings = $.extend({
            url: "js/city.js",
            prov: null,
            city: null,
            dist: null,
            nodata: null,
            required: true
        }, settings);
        var box_obj = this,
            $this = $(this),
            prov_obj = box_obj.find(".prov"),
            city_obj = box_obj.find(".city"),
            dist_obj = box_obj.find(".dist"),
            prov_val = settings.prov,
            city_val = settings.city,
            dist_val = settings.dist,
            select_prehtml = (settings.required) ? "" : "<option value=''>请选择</option>",
            city_json;

        var cityStart = function () {
            var prov_id = prov_obj.get(0).selectedIndex;
            if (!settings.required) {
                prov_id--
            }
            ;
            city_obj.empty().attr("disabled", true);
            dist_obj.empty().attr("disabled", true);
            if (prov_id < 0 || typeof(city_json[prov_id].items) == "undefined") {
                if (settings.nodata == "none") {
                    city_obj.css("display", "none");
                    dist_obj.css("display", "none")
                } else if (settings.nodata == "hidden") {
                    city_obj.css("visibility", "hidden");
                    dist_obj.css("visibility", "hidden")
                }
                ;
                return
            }
            ;
            temp_html = select_prehtml;
            $.each(city_json[prov_id].items, function (i, city) {
                if (i == 0) {
                    city_obj.prev('span').html(city.Name);
                }
                temp_html += "<option value='" + city.Code + "'>" + city.Name + "</option>"
            });
            city_obj.html(temp_html).attr("disabled", false).css({
                "display": "",
                "visibility": ""
            });
            distStart()
        };
        var distStart = function () {
            var prov_id = prov_obj.get(0).selectedIndex;
            var city_id = city_obj.get(0).selectedIndex;
            if (!settings.required) {
                prov_id--;
                city_id--
            }
            ;
            dist_obj.empty().attr("disabled", true);
            if (prov_id < 0 || city_id < 0 || typeof(city_json[prov_id].items[city_id].items) == "undefined") {
                if (settings.nodata == "none") {
                    dist_obj.css("display", "none")
                } else if (settings.nodata == "hidden") {
                    dist_obj.css("visibility", "hidden")
                }
                ;
                return
            }
            ;
            temp_html = select_prehtml;
            $.each(city_json[prov_id].items[city_id].items, function (i, dist) {
                if (i == 0) {
                    dist_obj.prev('span').html(dist.Name);
                }
                temp_html += "<option value='" + dist.Code + "'>" + dist.Name + "</option>"
            });
            dist_obj.html(temp_html).attr("disabled", false).css({
                "display": "",
                "visibility": ""
            })
        };
        var init = function () {
            temp_html = select_prehtml;
            $.each(city_json, function (i, prov) {
                temp_html += "<option value='" + prov.Code + "'>" + prov.Name + "</option>"
            });
            prov_obj.html(temp_html);
            setTimeout(function () {
                if (settings.prov != null) {
                    prov_obj.val(settings.prov).change();
                    setTimeout(function () {
                        if (settings.city != null) {
                            city_obj.val(settings.city).change();
                            setTimeout(function () {
                                if (settings.dist != null) {
                                    dist_obj.val(settings.dist).change();
                                }
                            }, 1)
                        }
                    }, 1)
                }
            }, 1);
            prov_obj.bind("change", function () {
                cityStart();
                // city_obj.trigger('change');
            });
            city_obj.bind("change", function () {
                distStart();
                // dist_obj.trigger('change');
            });
            dist_obj.bind("change", function () {
                $this.trigger('changed');
            });

            if (!settings.prov && !settings.city && !settings.dist) {
                prov_obj.trigger('change');
            }
        };
        if (typeof(settings.url) == "string") {
            $.getJSON(settings.url, function (json) {
                city_json = json;
                init()
            })
        } else {
            city_json = settings.url;
            init()
        }

        return this;
    }
})(jQuery);