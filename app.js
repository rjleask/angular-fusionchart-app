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
        // holds data for the bar graph
        let closeAmountObj = {};
        // holds data for line graph
        let monthlyClaimsObj = {
          months: {},
          averages: {}
        };

        for (let i = 0; i < data.length; i++) {
          formatCloseAmount(
            data[i].gsx$closeamount.$t,
            data[i].gsx$airlinename.$t
          );
          countMonthlyClaims(
            data[i].gsx$airportcode.$t,
            data[i].gsx$datereceived.$t
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
        // takes in two monthly claims objs and aircodes then fills averages obj with avg vals
        getAverageMonthlyVal(
          monthlyClaimsObj.months,
          monthlyClaimsObj.averages,
          "aircode"
        );
        // formats data and sends it to graph ready objects
        let lineList = closeAmountObj;
        let sortedListLine = sortObject(lineList);
        enterDataSets(sortedListLine, $scope.lineGraph);
        // ////////////////
        // function Declarations
        ///////////////////
        // recieves input each interation then calls fillMOnthsObj
        function countMonthlyClaims(aircode, date) {
          let tempDate = matchDate(date);
          let x = monthlyClaimsObj;
          let y = monthlyClaimsObj.months;
          fillMonthsClaimsObj(y, tempDate, aircode);
        }
        function matchDate(date) {
          // checks date for matching string and returns it in an array
          let res = date.match(
            /(Jan)|(Feb)|(Mar)|(Apr)|(May)|(Jun)|(Jul)|(Aug)|(Sep)|(Oct)|(Nov)|(Dec)/g
          );
          if (res !== null) {
            return res[0];
          }
        }
        // makes two layer object with incrementing month values
        // for each airport code
        function fillMonthsClaimsObj(obj, date, airprop) {
          if (obj.hasOwnProperty(airprop)) {
            if (obj[airprop].hasOwnProperty(date)) {
              obj[airprop][date] += 1;
            } else {
              obj[airprop][date] = 1;
            }
          } else {
            let filter = /^[a-zA-Z]/g.test(airprop);
            if (filter) {
              obj[airprop] = {};
            }
          }
        }
        // calls checkObj to update closeAmountObj close $amounts
        function formatCloseAmount(close, airline) {
          // closeNum replaces all the dollar sign characters and converts it to float num
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
          arr.sort(function(a, b) {
            return a.value - b.value;
          });
          return arr;
        }
        // fills claims object with avg monthly values per aircode
        // first iteration grabs the aircodes, second grabs month values
        function getAverageMonthlyVal(objMonths, objAverages, aircode) {
          for (let aircode in objMonths) {
            let tempSampleSize = 0;
            let tempTotal = 0;
            for (let month in objMonths[aircode]) {
              tempSampleSize++;
              tempTotal += objMonths[aircode][month];
            }
            let tempAvg = Math.round(tempTotal / tempSampleSize * 100) / 100;
            if (tempAvg >= 1) {
              objAverages[aircode] = tempAvg;
            }
          }
        }
        // enters graph data into the fusion tempates takes in sorted chart data
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

        // data is loaded, tell the dom
        $scope.dataLoaded = true;
      });
  }
]);
