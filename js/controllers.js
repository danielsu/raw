'use strict';

/* Controllers */

angular.module('raw.controllers', [])

    .controller('RawCtrl', function ($scope, dataService) {

        $scope.samples = [
            {title: 'Cars (multivariate)', url: 'data/multivariate.csv'},
            {title: 'Movies (dispersions)', url: 'data/dispersions.csv'},
            {title: 'Music (flows)', url: 'data/flows.csv'},
            {title: 'Cocktails (correlations)', url: 'data/correlations.csv'}
        ];

        $scope.$watch('sample', function (sample) {
            if (!sample) return;
            if (sample.url.endsWith(".json")) {
                $scope.jsonUrl = sample.url;
                $scope.loadJsonData();
            } else {
                dataService.loadSample(sample.url).then(
                    function (data) {
                        $scope.text = data;
                    },
                    function (error) {
                        $scope.error = error;
                    }
                );
            }
        });

        // init
        $scope.raw = raw;
        $scope.datasource = "table";
        function initData(keepUrl){
            $scope.data = [];
            $scope.metadata = [];
            $scope.error = false;
            $scope.loading = false;
            $scope.text = "";

            $scope.jsonAvailableMetadata = [];
            $scope.jsonSelectedMetadata = [];
            $scope.JSON_WORKFLOW_STAGES = {
                "DATA_FROM_URL_LOADED": false,
                "METADATA_EXTRACTED": false,
                "CONVERTED_3D_TO_2D": false,
                "DATA_PREPARED": false
            };
            if(!keepUrl){
                $scope.jsonUrl = null;
            }
        }
        initData();
        $scope.resetData = initData;

        $scope.categories = ['Correlations', 'Distributions', 'Time Series', 'Hierarchies', 'Others'];

        $scope.parse = function (text) {

            if ($scope.model) $scope.model.clear();

            $scope.data = [];
            $scope.metadata = [];
            $scope.error = false;
            $scope.$apply();

            try {
                var parser = raw.parser();
                $scope.data = parser(text);
                $scope.metadata = parser.metadata(text);
                console.log('metadata', $scope.metadata);
                $scope.error = false;
            } catch (e) {
                $scope.data = [];
                $scope.metadata = [];
                $scope.error = e.name == "ParseError" ? +e.message : false;
            }
            if (!$scope.data.length && $scope.model) $scope.model.clear();
            $scope.loading = false;
        };

        $scope.delayParse = dataService.debounce($scope.parse, 500, false);

        $scope.loading = true;

        function extractMetadataFromJson(obj) {
            const parsed = angular.isString(obj) ? JSON.parse(obj) : obj;
            //$scope.data = parsed;
            $scope.jsonAvailableMetadata = dataService.getMetaDataFromJson(parsed);
            console.log('$scope.metadata', $scope.jsonAvailableMetadata);
            $scope.loading = false;
        }

        $scope.loadJsonData = function () {
            console.log("loadJsonData");
            dataService.loadExternalData($scope.jsonUrl).then(
                function (data) {
                    $scope.JSON_WORKFLOW_STAGES.DATA_FROM_URL_LOADED = true;
                    // parse to get metadata
                    extractMetadataFromJson(data);
                    $scope.JSON_WORKFLOW_STAGES.METADATA_EXTRACTED = true;

                    // 3d to ORM
                    dataService.transformNestedDataToORM(data);
                    $scope.JSON_WORKFLOW_STAGES.CONVERTED_3D_TO_2D = true;
                },
                function (error) {
                    $scope.error = error;
                }
            );
        };

        $scope.fetchJsonDataAllowed = function () {
            return $scope.JSON_WORKFLOW_STAGES.DATA_FROM_URL_LOADED
                && $scope.JSON_WORKFLOW_STAGES.METADATA_EXTRACTED
                && $scope.JSON_WORKFLOW_STAGES.CONVERTED_3D_TO_2D
                && $scope.jsonSelectedMetadata.length > 0;
        };
        $scope.fetchJsonData = function () {
            // combine data sets for selected fields
            var selectedProperties = [];
            $scope.jsonSelectedMetadata.forEach(function(val){selectedProperties.push(val.key)});
            var result = dataService.getItemsWithSelectedProperties(dataService.getStorageObject(),
                selectedProperties);
            $scope.JSON_WORKFLOW_STAGES.DATA_PREPARED = true;
            $scope.metadata = $scope.jsonSelectedMetadata;
            console.log('fetched json', result);
            $scope.data = result;

            // switch view to preview data set
            $scope.dataView = 'table';
        };

        $scope.$watch('text', function (text) {
            if($scope.JSON_WORKFLOW_STAGES.DATA_PREPARED){
                return;
            }

            if (text && text.length > 0
                && (text[0] === "[" || text[0] === "{")) {
                console.log("Found Array/JSON, no parsing needed");
                extractMetadataFromJson(text);
            } else {
                console.log("Parse CSV to JSON");
                $scope.delayParse(text);
            }
        });

        $scope.charts = raw.charts.values().sort(function (a, b) {
            return a.title() < b.title() ? -1 : a.title() > b.title() ? 1 : 0;
        });
        $scope.chart = $scope.charts[0];
        $scope.model = $scope.chart ? $scope.chart.model() : null;

        $scope.$watch('error', function (error) {
            if (!$('.CodeMirror')[0]) return;
            var cm = $('.CodeMirror')[0].CodeMirror;
            if (!error) {
                cm.removeLineClass($scope.lastError, 'wrap', 'line-error');
                return;
            }
            cm.addLineClass(error, 'wrap', 'line-error');
            cm.scrollIntoView(error);
            $scope.lastError = error;

        })

        $('body').mousedown(function (e, ui) {
            if ($(e.target).hasClass("dimension-info-toggle")) return;
            $('.dimensions-wrapper').each(function (e) {
                angular.element(this).scope().open = false;
                angular.element(this).scope().$apply();
            })
        })

        $scope.codeMirrorOptions = {
            lineNumbers: true,
            lineWrapping: true,
            placeholder: 'Paste your text or drop a file here. No data on hand? Try one of our sample datasets!'
        }

        $scope.selectChart = function (chart) {
            if (chart == $scope.chart) return;
            $scope.model.clear();
            $scope.chart = chart;
            $scope.model = $scope.chart.model();
        }

        function refreshScroll() {
            $('[data-spy="scroll"]').each(function () {
                $(this).scrollspy('refresh');
            });
        }

        $(window).scroll(function () {

            // check for mobile
            if ($(window).width() < 760 || $('#mapping').height() < 300) return;

            var scrollTop = $(window).scrollTop() + 0,
                mappingTop = $('#mapping').offset().top + 10,
                mappingHeight = $('#mapping').height(),
                isBetween = scrollTop > mappingTop + 50 && scrollTop <= mappingTop + mappingHeight - $(".sticky").height() - 20,
                isOver = scrollTop > mappingTop + mappingHeight - $(".sticky").height() - 20,
                mappingWidth = mappingWidth ? mappingWidth : $('.col-lg-9').width();

            if (mappingHeight - $('.dimensions-list').height() > 90) return;
            //console.log(mappingHeight-$('.dimensions-list').height())
            if (isBetween) {
                $(".sticky")
                    .css("position", "fixed")
                    .css("width", mappingWidth + "px")
                    .css("top", "20px")
            }

            if (isOver) {
                $(".sticky")
                    .css("position", "fixed")
                    .css("width", mappingWidth + "px")
                    .css("top", (mappingHeight - $(".sticky").height() + 0 - scrollTop + mappingTop) + "px");
                return;
            }

            if (isBetween) return;

            $(".sticky")
                .css("position", "relative")
                .css("top", "")
                .css("width", "");

        })

        $(document).ready(refreshScroll);


    })