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
        let data = response.feed.entry;
        let closeAmountObj = {};

        for (let i = 0; i < data.length; i++) {
          let tempArr = [];
          let tempObj = {};

          formatCloseAmount(
            data[i].gsx$closeamount.$t,
            data[i].gsx$airlinename.$t
          );
        }
        // calls checkObj to update closeAmountObj close $amounts
        function formatCloseAmount(close, airline) {
          // tempNum replaces all the dollar sign characters and converts it to float num
          let tempNum = parseFloat(close.replace(/\$|,/g, ""));
          let tempAirline = closeAmountObj;
          if (tempNum !== NaN && tempNum > 0) {
            closeCheckObj(tempAirline, airline, tempNum);
          }
        }
        // checks to see if objProp exists, if it does increment
        // else make sure it's a normal character and initialize
        function closeCheckObj(data, property, num) {
          if (data.hasOwnProperty(property)) {
            data[property] += num;
          } else {
            // checks for alphanumeric characters only
            let filter = /^[a-zA-Z]/g.test(property);
            if (filter) {
              data[property] = num;
            }
          }
        }
      });
  }
]);
