'use strict';

pic.directive('wawDatepicker', ['$parse',
    function($parse) {
        return {
            restrict: "AE",
            templateUrl: "datePicker.tmpl",
            // templateUrl: "datePicker.html",
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
                    console.log(day.day)
                    $scope.dateValue = day.day;
                    $scope.selecting = !$scope.selecting;
                };
                $scope.days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                $scope.months = ['1', '2', '3', '4', '5', '6',
                    '7', '8', '9', '10', '11', '12'
                ];
                $scope.weeks = [];
                $scope.years = [];
                $scope.yearsAll = (function() {
                    if ($scope.years.length > 0) {
                        $scope.years = [];
                    } else {
                        for (var i = 1950; i < 2030; i++) {
                            $scope.years.push(i)
                        }
                    };
                })();
                $scope.YearIAndMonthSwith = "";
                console.log($scope.style)
            },
            scope: {
                opts: '=',
                style: '='
            },
            link: function(scope, element, attrs) {
                var modelAccessor = $parse(attrs.dateValue);
                if (!scope.dateValue) {
                    scope.dateValue = new Date()
                };
                var calculateCalendar = function(date) {
                    var date = new Date(date || new Date());
                    var date2 = new Date(date || new Date());
                    scope.currentDate = date.getDate() + '/' + Math.abs(date.getMonth() + 1) + '/' + date.getFullYear(); //Value that will be binded to the input
                    scope.currentDateObj = {
                        day: date.getDate(),
                        month: Math.abs(date.getMonth() + 1),
                        year: date.getFullYear(),
                        date: scope.currentDate
                    } //Value that will be binded to the input
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
                    scope.dayInMonth = [];
                    scope.showDays = function() {
                        if (scope.dayInMonth.length > 0) {
                            scope.dayInMonth = [];
                        } else {
                            for (var i = 1; i <= 31; i++) {
                                scope.dayInMonth.push(i);
                            }
                        };
                    };
                    scope.showMonth = function() {
                        if (scope.monthShow == true) {
                            scope.monthShow = false;
                        } else {
                            scope.monthShow = true;
                        }
                    };
                    scope.showYear = function() {
                        if (scope.yearsShow == true) {
                            scope.yearsShow = false;
                        } else {
                            scope.yearsShow = true;
                        }
                    };
                    scope.setDayAuto = function(obj) {
                        scope.date = new Date(scope.dateValue)
                        if (obj > 0 && obj < 32) {
                            scope.date.setDate(obj)
                            scope.dateValue = scope.date
                        }
                    }
                    scope.setMonthAuto = function(obj) {
                        scope.date = new Date(scope.dateValue)
                        if (obj > 0 && obj < 13) {
                            scope.date.setMonth(obj - 1)
                            scope.dateValue = scope.date
                        }
                    }
                    scope.setYearAuto = function(obj) {
                        scope.date = new Date(scope.dateValue)
                        if (obj > 1900 && obj < 2300) {
                            scope.date.setFullYear(obj)
                            scope.dateValue = scope.date
                        }
                    }
                    scope.setDay = function(day) {
                        scope.date = new Date(scope.dateValue)
                        scope.date.setDate(day)
                        scope.dateValue = scope.date
                    }
                    scope.setMonth = function(month) {
                        scope.monthShow = false;
                        scope.YearIAndMonthSwith = "";
                        scope.date = new Date(scope.dateValue);
                        scope.date.setMonth(month - 1);
                        scope.dateValue = scope.date;
                    }
                    scope.setYear = function(year) {
                        scope.yearsShow = false;
                        scope.YearIAndMonthSwith = ""
                        scope.date = new Date(scope.dateValue)
                        scope.date.setFullYear(year);
                        scope.dateValue = scope.date;
                    }
                    scope.setYearIAndMonth = function(obj) {
                        if (scope.YearIAndMonthSwith == obj) {
                            scope.YearIAndMonthSwith = "";
                        } else {
                            scope.YearIAndMonthSwith = obj;
                        }
                    }
                    scope.displayDate = new Date(date.getFullYear(), date.getMonth() - 1, date.getDate()).toDateString().split(' ');
                };
                scope.$watch('dateValue', function(val) {
                    calculateCalendar(scope.dateValue);
                });
            }
        };
    }
]);





// function exampleController($scope) {
//     $scope.newDate = new Date();
// }