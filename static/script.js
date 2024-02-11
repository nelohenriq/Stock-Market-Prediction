var tickers = JSON.parse(localStorage.getItem("tickers")) || [];
var latestPrice = {};
var counter = 15;

function startUpdateCycle() {
  updatePrices();
  setInterval(function () {
    counter--;
    $("#counter").text(counter);
    if (counter <= 0) {
      updatePrices();
      counter = 15;
    }
  }, 1000);
}

$(document).ready(function () {
  tickers.forEach(function (ticker) {
    addTickerToGrid(ticker);
  });
  updatePrices();

  $("#add-ticker-form").submit(function (e) {
    e.preventDefault();
    var newTicker = $("#new-ticker").val().toUpperCase();
    if (!tickers.includes(newTicker)) {
      tickers.push(newTicker);
      localStorage.setItem("tickers", JSON.stringify(tickers));
      addTickerToGrid(newTicker);
    }
    $("#new-ticker").val("");
    updatePrices();
  });

  $("#tickers-grid").on("click", ".remove-btn", function () {
    var tickerToRemove = $(this).data("ticker");
    tickers = tickers.filter((ticker) => ticker !== tickerToRemove);
    localStorage.setItem("tickers", JSON.stringify(tickers));
    $(`#${tickerToRemove}`).remove();
  });

  startUpdateCycle();
});

function addTickerToGrid(ticker) {
  $("#tickers-grid").append(`
    <div id="${ticker}" class="stock-box">
      <h2>${ticker}</h2>
      <p id="${ticker}-price">${latestPrice[ticker]}</p>
      <p id="${ticker}-pct"></p>
      <button class="remove-btn" data-ticker="${ticker}">Remove</button>
    </div>
  `);
}

function updatePrices() {
  tickers.forEach(function (ticker) {
    $.ajax({
      url: "/get_stock_data",
      type: "POST",
      data: JSON.stringify({ ticker: ticker }),
      contentType: "application/json",
      dataType: "json",
      success: function (data) {
        console.log("Fetched data:", data);
        console.log("Ticker:", data.ticker);
        console.log("Current price:", data.currentPrice);

        var priceElement = $(`#${ticker}-price`);
        console.log("Price element before update:", priceElement.text());

        $(`#${ticker}-price`).text(data.currentPrice.toFixed(2));
        console.log("Price element after update:", priceElement.text());

        var changePercent =
          ((data.currentPrice - data.openPrice) / data.openPrice) * 100;
        var colorClass;
        if (changePercent <= -2) {
          colorClass = "dark-red";
        } else if (changePercent < 0) {
          colorClass = "red";
        } else if (changePercent == 0) {
          colorClass = "gray";
        } else if (changePercent <= 2) {
          colorClass = "green";
        } else if (changePercent > 2) {
          colorClass = "dark-green";
        }
        $(`#${ticker}-price`).text(data.currentPrice.toFixed(2));
        $(`#${ticker}-pct`).text(`(${(changePercent * 100).toFixed(2)}%)`);
        $(`#${ticker}-price`)
          .removeClass("dark-red red gray green dark-green")
          .addClass(colorClass);
        $(`#${ticker}-pct`)
          .removeClass("dark-red red gray green dark-green")
          .addClass(colorClass);

        var flashClass;
        if (latestPrice[ticker] > data.currentPrice) {
          flashClass = "red-flash";
        } else if (latestPrice[ticker] < data.currentPrice) {
          flashClass = "green-flash";
        } else {
          flashClass = "gray-flash";
        }

        latestPrice[ticker] = data.currentPrice;

        $(`#${ticker}`)
          .removeClass("red-flash green-flash")
          .addClass(flashClass);

        $(`#${ticker}`).addClass(flashClass);
        setTimeout(function () {
          $(`#${ticker}`).removeClass(flashClass);
        }, 1000);
      },
    });
  });
}
