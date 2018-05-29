var myApp = angular.module("myApp", ["ng-fusioncharts"]);
myApp.directive("barGraph", function() {
  return {
    template:
      '<fusioncharts id="myChartContainer" width="100%" height="100%" type="errorbar2d" datasource="{{barGraph}}" showDataLoadingMessage="true"></fusioncharts>'
  };
});
myApp.directive("lineGraph", function() {
  return {
    template:
      '<fusioncharts id="myChartContainer" width="100%" height="100%" max-height="800" type="mscombi2d" datasource="{{lineGraph}}" showDataLoadingMessage="true"></fusioncharts>'
  };
});

myApp.controller("mainController", [
  "$scope",
  "$http",
  ($scope, $http) => {
    $scope.tab = "line";
    $scope.setNewTab = function(newTab) {
      $scope.tab = newTab;
    };
    $scope.pressedTab = function(name) {
      return $scope.tab === name;
    };
    $scope.dataLoaded = false;
    $scope.barGraph = {
      chart: {
        caption: "Avg Number Claims Per Month For Each Airport Code 2010-2013",
        subcaption: "means & stdev's",
        xaxisname: "Airport Codes",
        yaxisname: "Avg Claims Per Month",
        theme: "fint"
      },
      categories: [
        {
          category: []
        }
      ],
      dataset: [
        {
          seriesname: "Daly City Serramonte",
          data: []
        }
      ]
    };
    $scope.lineGraph = {
      chart: {
        caption: "Net Loss per month for each airline",
        subcaption: "2010-2013",
        xaxisname: "Airlines",
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
    // line graph object
    let monthlyClaimsObj = {
      months: {},
      averages: {}
    };
    // bar graph object
    let closeAmountObj = {
      months: {},
      averages: {}
    };
    let sortedListBar, sortedListLine;
    //// update data dynamically
    $scope.claim = {};
    // get data from spreadsheet
    $http
      .get(
        "https://spreadsheets.google.com/feeds/list/1t6LE3IqHXOsHUvsoZQagETjMjABzVGaC_nRRjEgqh8s/1/public/values?alt=json"
      )
      .success(function(response) {
        console.log(response);
        let data = response.feed.entry;
        //  loops through response data
        for (let i = 0; i < data.length; i++) {
          formatCloseAmount(
            data[i].gsx$closeamount.$t,
            data[i].gsx$airlinename.$t,
            data[i].gsx$datereceived.$t
          );
          countMonthlyClaims(
            data[i].gsx$airportcode.$t,
            data[i].gsx$datereceived.$t
          );
        }
        console.log(monthlyClaimsObj);
        $scope.dataLoaded = true;
        //
        getAverageMonthlyVal(
          monthlyClaimsObj.months,
          monthlyClaimsObj.averages,
          "aircode"
        );
        getAverageMonthlyVal(
          closeAmountObj.months,
          closeAmountObj.averages,
          "airline"
        );
        // formats data and sends it to graph ready objects
        let barList = monthlyClaimsObj.averages;
        let lineList = closeAmountObj;
        sortedListLine = sortObject(lineList, "line");
        sortedListBar = sortObject(barList, "bar");
        enterDataSets(sortedListLine, $scope.lineGraph);
        enterDataSets(sortedListBar, $scope.barGraph);

        console.log(monthlyClaimsObj, closeAmountObj);
      });
    // /////////////////////
    // function declarations
    ////////////////////////
    // enters graph data takes in sorted chart data
    function enterDataSets(graph, dataSheet) {
      for (let i = 0; i < graph.length; i++) {
        dataSheet.categories[0].category.push({
          label: graph[i].label
        });
        if (graph === sortedListBar) {
          dataSheet.dataset[0].data.push({
            value: graph[i].value,
            errorvalue: getStandardDev(graph[i].label, graph[i].value)
          });
        } else {
          dataSheet.dataset[0].data.push({
            value: graph[i].value
          });
        }
      }
    }
    // fills claims object with avg monthly values per aircode
    // first iteration grabs the aircodes, second grabs month values
    function getAverageMonthlyVal(objMonths, objAverages, airprop) {
      for (let airprop in objMonths) {
        let tempSampleSize = 0;
        let tempTotal = 0;
        for (let month in objMonths[airprop]) {
          tempSampleSize++;
          tempTotal += objMonths[airprop][month];
        }
        let tempAvg = Math.round(tempTotal / tempSampleSize * 100) / 100;
        if (tempAvg >= 1) {
          objAverages[airprop] = tempAvg;
        }
      }
    }
    // sorts the object and formats the data to be graph ready
    function sortObject(obj, filter) {
      let arr = [];
      for (const prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          if (filter === "line") {
            arr.push({
              label: prop,
              value: obj[prop] / 36
            });
          } else {
            arr.push({
              label: prop,
              value: obj[prop]
            });
          }
        }
      }
      arr.sort(function(a, b) {
        return a.value - b.value;
      });
      return arr;
    }
    // takes in current aircode and mean uses helper function to get stdev
    function getStandardDev(aircode, avgValue) {
      let tempObj = monthlyClaimsObj.months;
      let tempDataset;
      if (tempObj.hasOwnProperty(aircode)) {
        tempDataset = tempObj[aircode];
      }
      return calculateStandardDev(tempDataset, avgValue);
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
    function closeCheckObj(data, airline, num) {
      if (data.hasOwnProperty(airline)) {
        data[airline] += num;
      } else {
        // checks for alphanumeric characters only
        let filter = /^[a-zA-Z]/g.test(airline);
        if (filter) {
          data[airline] = num;
        }
      }
    }
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
          obj[airprop][date] = 1;
        }
      }
    }
    // recieves airport code and date then calls fillMOnthsObj
    function countMonthlyClaims(aircode, date) {
      let tempDate = matchDate(date);
      let x = monthlyClaimsObj;
      let y = monthlyClaimsObj.months;
      fillMonthsClaimsObj(y, tempDate, aircode);
    }
    // standard deviation function receives inputs from getStandardDev
    function calculateStandardDev(dataset, mean) {
      let totMeanArr = [];
      let sumMeanArr = 0;
      let totSampleSize = 0;
      for (const month in dataset) {
        let x = Math.pow(dataset[month] - mean, 2);
        totMeanArr.push(x);
      }
      totMeanArr.forEach(function(index) {
        sumMeanArr += index;
        totSampleSize++;
      });
      return Math.sqrt(sumMeanArr / totSampleSize);
    }
  }
]);
