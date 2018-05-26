var myApp = angular.module("myApp", ["ng-fusioncharts"]);
myApp.controller("mainController", [
  "$scope",
  "$http",
  ($scope, $http) => {
    $http
      .get(
        "https://spreadsheets.google.com/feeds/list/1t6LE3IqHXOsHUvsoZQagETjMjABzVGaC_nRRjEgqh8s/1/public/values?alt=json"
      )
      .success(function(response) {
        console.log(response);
      });
  }
]);
