var myApp = angular.module("myApp", ["ng-fusioncharts"]);
myApp.controller("mainController", [
  "$scope",
  "$http",
  ($scope, $http) => {
    $scope.dataLoaded = false;
    $http
      .get(
        "https://spreadsheets.google.com/feeds/list/1t6LE3IqHXOsHUvsoZQagETjMjABzVGaC_nRRjEgqh8s/1/public/values?alt=json"
      )
      .success(function(response) {
        console.log(response);
        let data = response.feed.entry;
        let closeAmountObj = {};

        for (let i = 0; i < data.length; i++) {
          formatCloseAmount(
            data[i].gsx$closeamount.$t,
            data[i].gsx$airlinename.$t
          );
        }
        $scope.lineGraph = {
          chart: {
            caption: "Net Loss per month for each airline",
            subcaption: "2010-2013",
            xaxisname: "Airlines",
            labelDisplay: "rotate",
            yaxisname: "Net Loss Per Month $",
            numDivLines: "8",
            yAxisMinValue: "800",
            theme: "fint",
            showDataLoadingMessage: true
          },
          categories: [
            {
              category: []
            }
          ],

          dataset: [
            {
              seriesname: "Monthly losses",
              renderas: "line",
              showvalues: "0",
              data: []
            }
          ]
        };
        // formats data and sends it to graph ready objects
        let lineList = closeAmountObj;
        let sortedListLine = sortObject(lineList);
        enterDataSets(sortedListLine, $scope.lineGraph);
        // calls checkObj to update closeAmountObj close $amounts
        function formatCloseAmount(close, airline) {
          // tempNum replaces all the dollar sign characters and converts it to float num
          let closeNum = parseFloat(close.replace(/\$|,/g, ""));
          let tempDate = matchDate(date);
          let obj = closeAmountObj;
          let objMonths = closeAmountObj.months;
          if (closeNum !== NaN && closeNum > 0) {
            closeCheckObj(obj, airline, closeNum);
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
        // sorts the object and formats the data to be graph ready
        function sortObject(obj) {
          let arr = [];
          for (const prop in obj) {
            if (obj.hasOwnProperty(prop)) {
              arr.push({
                label: prop,
                value: obj[prop] / 36
              });
            }
          }
          // enters graph data takes in sorted chart data
          function enterDataSets(graph, dataSheet) {
            for (let i = 0; i < graph.length; i++) {
              dataSheet.categories[0].category.push({
                label: graph[i].label
              });
              dataSheet.dataset[0].data.push({
                value: graph[i].value
              });
            }
          }
          arr.sort(function(a, b) {
            return a.value - b.value;
          });
          return arr;
        }
        $scope.dataLoaded = true;
      });
  }
]);
