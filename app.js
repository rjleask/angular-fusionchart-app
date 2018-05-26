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
        let closeAmountObj = {
          months: {},
          averages: {}
        };

        for (let i = 0; i < data.length; i++) {
          formatCloseAmount(
            data[i].gsx$closeamount.$t,
            data[i].gsx$airlinename.$t
          );
        }
        // calls checkObj to update closeAmountObj close $amounts
        function formatCloseAmount(close, airline, date) {
          // tempNum replaces all the dollar sign characters and converts it to float num
          let closeNum = parseFloat(close.replace(/\$|,/g, ""));
          let tempDate = matchDate(date);
          let obj = closeAmountObj;
          let objMonths = closeAmountObj.months;
          if (closeNum !== NaN && closeNum > 0) {
            closeCheckObj(obj, airline, closeNum);
            fillMonthsCloseObj(objMonths, tempDate, airline, closeNum);
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
        // helper function for calculating average monthly values
        // fills closeAmtObj.months with values for each month
        function fillMonthsCloseObj(obj, date, airline, closeNum) {
          if (obj.hasOwnProperty(airline)) {
            if (obj[airline].hasOwnProperty(date)) {
              obj[airline][date] += closeNum;
            } else {
              obj[airline][date] = closeNum;
            }
          } else {
            let filter = /^[a-zA-Z]/g.test(airline);
            if (filter) {
              obj[airline] = {};
              obj[airline][date] = closeNum;
            }
          }
        }
      });
  }
]);
