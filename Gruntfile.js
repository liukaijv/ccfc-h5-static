module.exports = function (grunt) {    

    grunt.initConfig({
        meta: {
            basePath: './',
            lessPath: 'less/src',
            cssPath: 'css/',
            targetPath: 'D:/wamp/www/fontend/public/wechat'
        },
        less: {
            development: {
                options: {
                    paths: ["<%= meta.lessPath %>"]
                },
                files: {
                    "css/main.css": "less/main.less"
                }
            }
        },
        copy: {
            js: {
                files: [
                    {
                        expand: true,
                        src: ['js/vendors/**', 'js/main.js', 'js/main.min.js'],
                        dest: 'dist/',
                        filter: 'isFile'
                    }
                ]
            },
            css: {
                files: [
                    {expand: true, src: ['css/**'], dest: 'dist/', filter: 'isFile'}                   
                ]
            },
            fonts: {
                files: [
                    {expand: true, src: ['fonts/**'], dest: 'dist/', filter: 'isFile'}                   
                ]
            },
            images: {
                files: [
                    {expand: true, src: ['images/**'], dest: 'dist/', filter: 'isFile'}                   
                ]
            },
            html: {
                files: [
                    {expand: true, src: ['*.html'], dest: 'dist/', filter: 'isFile'}                   
                ]
            },
            // copy2pro: {
            //     files: [
            //         {
            //             expand: true,
            //             src: ['css/main.min.css', 'js/main.min.js', 'css/main.css'],
            //             dest: '<%= meta.targetPath %>',
            //             filter: 'isFile'
            //         }
            //     ]
            // },
        },
        concat: {
            options: {
                separator: ''
            },
            basic: {
                files: {
                    'js/main.js': [
                        // 'js/src/core/ui.cookie.js',
                        // 'js/src/core/ui.store.js',
                        //'js/src/core/ui.fastclick.js',
                        // 'js/src/core/ui.url.js',
                        'js/src/core/ui.touch.js',
                        'js/src/core/ui.hammer.js',
                        'js/src/core/ui.pinchzoom.js',
                        'js/src/core/ui.core.js',
                        'js/src/core/ui.panel.js',
                         'js/src/core/ui.button.js',
                        'js/src/core/ui.tabs.js',
                        'js/src/core/ui.spinner.js',
                        // 'js/src/core/ui.select.js',
                        'js/src/core/ui.mask.js',
                        'js/src/core/ui.modal.js',
                        'js/src/core/ui.notify.js',
                        'js/src/core/ui.lazyEcho.js',
                        'js/src/core/ui.smoothScroll.js',
                        // 'js/src/core/ui.slider.js',
                        'js/src/core/ui.swipe.js',
                        // 'js/src/core/ui.refresh.js',
                        // 'js/src/core/ui.cityselect.js',
                        'js/src/core/ui.form_params.js',
                        'js/src/core/ui.input_mask.js',
                        'js/src/core/ui.pureview.js',
                        //'js/src/core/ui.switcher.js',
                        'js/src/core/ui.iscroll.js',
                        'js/src/core/ui.calendar.js',
                        'js/src/core/ui.password.js',
                        'js/src/core/ui.countdown.js',
                        'js/src/core/ui.pageScroll.js',
                        'js/src/core/ui.infiniteScroll.js',
                        'js/vendors/waypoints/jquery.waypoints.js',
                        'js/vendors/waypoints/shortcuts/infinite.js',
                        'js/vendors/moment/moment.min.js',
                        'js/init.js',
                    ]
                },
            }
        },
        compress: {
            main: {
                options: {
                    archive: 'html.zip'
                },
                files: [
                    {src: ['dist/**'], dest: '', filter: 'isFile'}
                ]
            }
        },
        uglify: {
            options: {
                mangle: false
            },
            my_target: {
                files: {
                    'js/main.min.js': ['js/main.js']
                }
            }
        },
        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            target: {
                files: {
                    'css/main.min.css': ['css/main.css']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');


    grunt.registerTask('default', ['less', 'concat', 'cssmin', 'uglify']);
    grunt.registerTask('build', ['less', 'concat', 'cssmin', 'uglify', 'copy', 'compress']);

} 