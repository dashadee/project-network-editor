module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bowercopy: {
            options: {
                srcPrefix: 'bower_components',
                destPrefix: 'build'
            },
            scripts: {
                files: {
                    'js/d3.min.js': 'd3/d3.min.js',
                    'js/FileSaver.min.js': 'FileSaver/FileSaver.min.js'
                }
            }
        },
        copy: {
            main: {
                files: [{
                    expand: true,
                    cwd: 'src/web',
                    src: '**',
                    dest: 'build'
                }]
            }
        },
        concat: {
            dist: {
                src: ['src/js/**/*.js'],
                dest: 'build/js/project-network-editor.js'
            }
        },
        watch: {
            sources: {
                files: ['src/js/**'],
                tasks: ['concat'],
                options: {
                    nospawn: true
                }
            },
            static: {
                files: ['src/web/**'],
                tasks: ['newer:copy'],
                options: {
                    nospawn: true
                }
            },
        },
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-bowercopy');
    grunt.loadNpmTasks('grunt-newer');

    grunt.registerTask('build', ['bowercopy', 'copy', 'concat']);
    grunt.registerTask('default', ['watch']);
}; 
