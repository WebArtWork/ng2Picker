'use strict';

crop.directive('imgCrop', ['$timeout', 'cropHost', 'cropPubSub', function ($timeout, CropHost, CropPubSub) {
    return {
        restrict: 'E',
        scope: {
            image: '=',
            resultImage: '=',
            resultArrayImage: '=?',
            resultBlob: '=?',
            urlBlob: '=?',
            chargement: '=?',
            cropject: '=?',

            changeOnFly: '=?',
            liveView: '=?',
            initMaxArea: '=?',
            areaCoords: '=?',
            areaType: '@',
            areaMinSize: '=?',
            areaInitSize: '=?',
            areaMinRelativeSize: '=?',
            resultImageSize: '=?',
            resultImageFormat: '=?',
            resultImageQuality: '=?',

            aspectRatio: '=?',
            allowCropResizeOnCorners: '=?',

            dominantColor: '=?',
            paletteColor: '=?',
            paletteColorLength: '=?',

            onChange: '&',
            onLoadBegin: '&',
            onLoadDone: '&',
            onLoadError: '&'
        },
        template: '<canvas></canvas>',
        controller: ['$scope', function ($scope) {
            $scope.events = new CropPubSub();
        }],
        link: function (scope, element) {

            if (scope.liveView && typeof scope.liveView.block == 'boolean') {
                scope.liveView.render = function (callback) {
                    updateResultImage(scope, true, callback);
                }
            } else scope.liveView = {block: false};

            // Init Events Manager
            var events = scope.events;

            // Init Crop Host
            var cropHost = new CropHost(element.find('canvas'), {}, events);

            // Store Result Image to check if it's changed
            var storedResultImage;

            var updateResultImage = function (scope, force, callback) {
                if (scope.image !== '' && (!scope.liveView.block || force)) {
                    var resultImageObj = cropHost.getResultImage();
                    if (angular.isArray(resultImageObj)) {
                        resultImage = resultImageObj[0].dataURI;
                        scope.resultArrayImage = resultImageObj;
                        console.log(scope.resultArrayImage);
                    } else var resultImage = resultImageObj.dataURI;

                    var urlCreator = window.URL || window.webkitURL;
                    if (storedResultImage !== resultImage) {
                        storedResultImage = resultImage;
                        scope.resultImage = resultImage;
                        if (scope.liveView.callback) scope.liveView.callback(resultImage);
                        if (callback) callback(resultImage);
                        cropHost.getResultImageDataBlob().then(function (blob) {
                            scope.resultBlob = blob;
                            scope.urlBlob = urlCreator.createObjectURL(blob);
                        });

                        if (scope.resultImage) {
                            cropHost.getDominantColor(scope.resultImage).then(function (dominantColor) {
                                scope.dominantColor = dominantColor;
                            });
                            cropHost.getPalette(scope.resultImage).then(function (palette) {
                                scope.paletteColor = palette;
                            });
                        }

                        updateAreaCoords(scope);
                        scope.onChange({
                            $dataURI: scope.resultImage
                        });
                    }
                }
            };

            var updateAreaCoords = function (scope) {
                var areaCoords = cropHost.getAreaCoords();
                scope.areaCoords = areaCoords;
            };

            var updateCropject = function (scope) {
                var areaCoords = cropHost.getAreaCoords();

                var dimRatio = {
                  x: cropHost.getArea().getImage().width / cropHost.getArea().getCanvasSize().w,
                  y: cropHost.getArea().getImage().height / cropHost.getArea().getCanvasSize().h
                };

                scope.cropject = {
                    areaCoords: areaCoords,
                    cropWidth: areaCoords.w,
                    cropHeight: areaCoords.h,
                    cropTop: areaCoords.y,
                    cropLeft: areaCoords.x,
                    cropImageWidth: Math.round(areaCoords.w * dimRatio.x),
                    cropImageHeight: Math.round(areaCoords.h * dimRatio.y),
                    cropImageTop: Math.round(areaCoords.y * dimRatio.y),
                    cropImageLeft: Math.round(areaCoords.x * dimRatio.x)
                };
            };

            // Wrapper to safely exec functions within $apply on a running $digest cycle
            var fnSafeApply = function (fn) {
                return function () {
                    $timeout(function () {
                        scope.$apply(function (scope) {
                            fn(scope);
                        });
                    });
                };
            };

            if (scope.chargement == null) scope.chargement = 'Chargement';
            var displayLoading = function () {
                element.append('<div class="loading"><span>' + scope.chargement + '...</span></div>')
            };

            // Setup CropHost Event Handlers
            events
                .on('load-start', fnSafeApply(function (scope) {
                    scope.onLoadBegin({});
                }))
                .on('load-done', fnSafeApply(function (scope) {
                    angular.element(element.children()[element.children().length - 1]).remove();
                    cropHost.setAreaMinRelativeSize(scope.areaMinRelativeSize);
                    scope.onLoadDone({});
                }))
                .on('load-error', fnSafeApply(function (scope) {
                    scope.onLoadError({});
                }))
                .on('area-move area-resize', fnSafeApply(function (scope) {
                    if (!!scope.changeOnFly) {
                        updateResultImage(scope);
                    }
                    updateCropject(scope);
                }))
                .on('area-move-end area-resize-end image-updated', fnSafeApply(function (scope) {
                    updateResultImage(scope);
                    updateCropject(scope);
                }));


            // Sync CropHost with Directive's options
            scope.$watch('image', function (newVal) {
                if (newVal) {
                    displayLoading();
                }
                $timeout(function () {
                    cropHost.setInitMax(scope.initMaxArea);
                    cropHost.setNewImageSource(scope.image);
                }, 100);
            });
            scope.$watch('areaType', function () {
                cropHost.setAreaType(scope.areaType);
                updateResultImage(scope);
            });
            scope.$watch('areaMinSize', function () {
                cropHost.setAreaMinSize(scope.areaMinSize);
                updateResultImage(scope);
            });
            scope.$watch('areaMinRelativeSize', function () {
                if (scope.image !== '') {
                    cropHost.setAreaMinRelativeSize(scope.areaMinRelativeSize);
                    updateResultImage(scope);
                }
            });
            scope.$watch('areaInitSize', function () {
                cropHost.setAreaInitSize(scope.areaInitSize);
                updateResultImage(scope);
            });
            scope.$watch('resultImageFormat', function () {
                cropHost.setResultImageFormat(scope.resultImageFormat);
                updateResultImage(scope);
            });
            scope.$watch('resultImageQuality', function () {
                cropHost.setResultImageQuality(scope.resultImageQuality);
                updateResultImage(scope);
            });
            scope.$watch('resultImageSize', function () {
                cropHost.setResultImageSize(scope.resultImageSize);
                updateResultImage(scope);
            });
            scope.$watch('paletteColorLength', function () {
                cropHost.setPaletteColorLength(scope.paletteColorLength);
            });
            scope.$watch('aspectRatio', function () {
                if (typeof scope.aspectRatio == 'string' && scope.aspectRatio != '') {
                    scope.aspectRatio = parseInt(scope.aspectRatio);
                }
                if (scope.aspectRatio) cropHost.setAspect(scope.aspectRatio);
            });
            scope.$watch('allowCropResizeOnCorners', function () {
                if (scope.allowCropResizeOnCorners) cropHost.setAllowCropResizeOnCorners(scope.allowCropResizeOnCorners);
            });

            // Update CropHost dimensions when the directive element is resized
            scope.$watch(
                function () {
                    return [element[0].clientWidth, element[0].clientHeight];
                },
                function (value) {
                    cropHost.setMaxDimensions(value[0], value[1]);
                    updateResultImage(scope);
                },
                true
            );

            // Destroy CropHost Instance when the directive is destroying
            scope.$on('$destroy', function () {
                cropHost.destroy();
            });
        }
    };
}]);








function exampleController($scope) {
    $scope.newDate = new Date();
}
var datePicker = angular.module("example", []) // Example module
var datePickerTemplate = [ // Template for the date picker, no CSS, pure HTML. The date-picker tag will be replaced by this
    '<div class="datePicker">',
    '<label ng-click="selectDate()">',
    '<input type="text" ng-model="currentDate" disabled>',
    '</label>',
    '<div ng-show="selecting">',
    '<table>',
    '<thead><tr>',
    '<td class="currentDate" colspan="7" ng-bind="displayDate"></td>',
    '</tr><tr class="navigation">',
    '<td ng-click="prevYear()">&lt;&lt;</td>',
    '<td ng-click="prev()">&lt;</td>',
    '<td colspan="3" ng-click="today()">Today</td>',
    '<td ng-click="next()">&gt;</td>',
    '<td ng-click="nextYear()">&gt;&gt;</td></tr><tr>',
    '<td  ng-repeat="day in days" ng-bind="day"></td>',
    '</tr></thead>',
    '<tbody><tr ng-repeat="week in weeks" class="week">',
    '<td  ng-repeat="d in week" ng-click="selectDay(d)" ng-class="{active: d.selected, otherMonth: d.notCurrentMonth}">{{ d.day | date: &#39;d&#39;}}</td>',
    '</tr></tbody>',
    '</table>',
    '</div>',
    '</div>'
].join('\n');
datePicker.directive('crDatepicker', function($parse) {
    return {
        restrict: "AE",
        templateUrl: "datePicker.tmpl",
        transclude: true,
        controller: function($scope) {
            $scope.prev = function() {
                $scope.dateValue = new Date($scope.dateValue).setMonth(new Date($scope.dateValue).getMonth() - 1);
            };
            $scope.prevYear = function() {
                $scope.dateValue = new Date($scope.dateValue).setYear(new Date($scope.dateValue).getFullYear() - 1);
            };
            $scope.next = function() {
                $scope.dateValue = new Date($scope.dateValue).setMonth(new Date($scope.dateValue).getMonth() + 1);
            };
            $scope.nextYear = function() {
                $scope.dateValue = new Date($scope.dateValue).setYear(new Date($scope.dateValue).getFullYear() + 1);
            };
            $scope.today = function() {
                $scope.dateValue = new Date();
            };
            $scope.selectDate = function() {
                $scope.selecting = !$scope.selecting;
            };
            $scope.selectDay = function(day) {
                $scope.dateValue = day.day;
                $scope.selecting = !$scope.selecting;
            };
            $scope.days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            $scope.weeks = [];
        },
        scope: {
            dateValue: '='
        },
        link: function(scope, element, attrs) {
            var modelAccessor = $parse(attrs.dateValue);
            if(!scope.dateValue){ scope.dateValue = new Date() };
            var calculateCalendar = function(date) {
                var date = new Date(date || new Date());
                scope.currentDate = date.getDate() + '/' + Math.abs(date.getMonth() + 1) + '/' + date.getFullYear(); //Value that will be binded to the input
                var startMonth = date.getMonth(),
                    startYear = date.getYear();
                date.setDate(1);
                if (date.getDay() === 0) {
                    date.setDate(-6);
                } else {
                    date.setDate(date.getDate() - date.getDay());
                }
                if (date.getDate() === 1) {
                    date.setDate(-6);
                }
                var weeks = [];
                while (weeks.length < 6) { // creates weeks and each day
                    if (date.getYear() === startYear && date.getMonth() > startMonth) break;
                    var week = [];
                    for (var i = 0; i < 7; i++) {
                        week.push({
                            day: new Date(date),
                            selected: new Date(date).setHours(0) == new Date(scope.dateValue).setHours(0) ? true : false,
                            notCurrentMonth: new Date(date).getMonth() != new Date(scope.dateValue).getMonth() ? true : false
                        });
                        date.setDate(date.getDate() + 1);
                    }
                    weeks.push(week);
                }
                scope.weeks = weeks; // Week Array
                scope.displayDate = new Date(date.getFullYear(), date.getMonth() - 1, date.getDate()).toDateString().split(' ')[1] + ' ' + date.getFullYear(); // Current Month / Year
            }
            scope.$watch('dateValue', function(val) {
                calculateCalendar(scope.dateValue);
            });
        }
    };
});
datePicker.run([
    '$templateCache',
    function($templateCache) {
        $templateCache.put('datePicker.tmpl', datePickerTemplate); // This saves the html template we declared before in the $templateCache
    }
]);