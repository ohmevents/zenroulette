// Variables to store numbers and bets
var currentStatus = null;
var currentLimit = null;
var recentNumbers = null;
var favoriteNumbers = null;
var hotNumbers = null;
var betFavorites = null;
var betNumbers = [];
var highStakeNumbers = null;
var playRound = 0;
var currentDealer = null;
let REPEAT_ROUND = 4;

let numbersOnBoard = [
  "0", "32", "15", "19", "4", "21", "2", "25", "17", "34", "6", "27", "13", "36", "11", "30", "8", "23", "10", "5", "24", "16", "33", "1", "20", "14", "31", "9", "22", "18", "29", "7", "28", "12", "35", "3", "26"
];

/**
 * Get game status
 *
 * @returns current game status
 */
function getStatus() {
  if (document.querySelectorAll('[data-role="status-bar"]').length > 0) {
    let statusText = document.querySelectorAll('[data-role="status-text"]')[0].innerText;
    if (statusText.startsWith("PLACE YOUR BET")) {
      return "PLACE YOUR BET";
    } else if (statusText.startsWith("BET CLOSING")) {
      return "BET CLOSING";
    }
    return statusText;
  }
  return null;
}

/**
 * Get game dealer's name
 * 
 * @returns the name of dealer
 */
function getDealer() {
  if (document.querySelectorAll('[data-role="dealerName"]').length > 0) {
    return document.querySelectorAll('[data-role="dealerName"]')[0].innerText;
  }
  return null;
}

/**
 * Get recent winners
 *
 * @returns recent winners (array of number)
 */
function getRecentNumbers() {
  var returnNumbers = [];
  var _recentNumbers = null;
  while (true) {
    _recentNumbers = document.querySelectorAll('[data-role="recent-number"]');
    if (_recentNumbers.length > 0) {
      break;
    }
    $("div[data-role='paginator-left']").click();
  }
  _recentNumbers.forEach((recentNumber) => {
    returnNumbers.push(recentNumber.children[0].children[0].innerText);
  });

  return returnNumbers;
}

/**
 * Get hot/favorite numbers
 *
 * @returns hot/favorite winners (array of number)
 */
function getHotNumbers() {
  var returnNumbers = [];
  var _hotNumbers = null;
  while (true) {
    _hotNumbers = document.querySelectorAll('[data-role="hot-numbers"]');
    if (_hotNumbers.length > 0) {
      break;
    }
    $("div[data-role='paginator-left']").click();
  }
  _hotNumbers = _hotNumbers[0];
  for (var i = 1; i < _hotNumbers.children.length; i++) {
    returnNumbers.push(_hotNumbers.children[i].innerText);
  }
  return returnNumbers;
}

/**
 * Get next index from a specified index
 *
 * @param {*} index
 * @returns
 */
function getNextIndex(index) {
  if (index == 36) {
    return 0;
  } else {
    return index + 1;
  }
}

/**
 * Get before index from a specified index
 *
 * @param {*} index
 * @returns
 */
function getBeforeIndex(index) {
  if (index == 0) {
    return 36;
  } else {
    return index - 1;
  }
}

/**
 * Get index in roulette order from a specified number
 *
 * @param {*} n
 * @returns
 */
function getIndexFromNumber(n) {
  return numbersOnBoard.indexOf(n);
}

/**
 * Get 3 neighbohood of a specified number
 *
 * @param {*} n
 * @returns
 */
function get3Neighborhood(n) {
  var neighborhood = [];
  var index0 = getIndexFromNumber(n);
  for (var i = 0, index = index0; i < 3; i++) {
    index = getNextIndex(index);
    neighborhood.push(numbersOnBoard[index]);
  }
  for (var i = 0, index = index0; i < 3; i++) {
    index = getBeforeIndex(index);
    neighborhood.push(numbersOnBoard[index]);
  }

  return neighborhood;
}

function includesRecent(n, recent) {
  let allNumbers = [n].concat(get3Neighborhood(n));
  for (var i = 0; i < 4; i++) {
    if (allNumbers.includes(recent[i])) {
      return true;
    }
  }
  return false;
}

function getHighStakeNumbers(recentNums, hotNums) {
  var _highStakeNumbers = [];
  for (var i = 0; i < hotNums.length; i++) {
    let n = hotNums[i];
    if (includesRecent(n, recentNums)) {
      _highStakeNumbers.push(n);
    }
  }
  if (_highStakeNumbers.length == 0) {
    return null;
  }
  else {
    return _highStakeNumbers;
  }
}

function getNextRecommendation() {
  var _betFavorites = [];
  var _highStakeNumbers = [];

  for (var i = 0; i < 4; i++) {
    _betFavorites.push(recentNumbers[i]);
  }

  _betFavorites = _betFavorites.unique();

  var _betNumbers = [];
  for (var i = 0; i < _betFavorites.length; i++) {
    _betNumbers.push(_betFavorites[i]);
    let favorite3Neighborhood = get3Neighborhood(_betFavorites[i]);
    _betNumbers = _betNumbers.concat(favorite3Neighborhood).unique();
  }

  return [_betFavorites, _highStakeNumbers, _betNumbers];
}

/**
 * Determine if gets won
 *
 * @returns true if won, else false
 */
function getWon() {
  let lastNumber = getRecentNumbers()[0];
  if (betNumbers.includes(lastNumber)) {
    return true;
  }
  return false;
}

/**
 * Highlight/De-highlight numbers on table
 * 
 * @param {*} highlight 
 *     true: highlight
 *     false: de-highlight
 */
function highlightBetNumbers(highlight) {
  betNumbers.forEach(function (value, index) {
    let rect = document.querySelectorAll(`[data-bet-spot-id="${value}"]`)[0];

    // Sometimes the server sends a null rectangle, causing `rect` to become
    // undefined.
    if (rect != undefined) {
      if (highlight) {
        rect.style.fill = "orange";
      } else {
        rect.style.fill = "";
      }
    }
  });
}

/**
 * Format date/time string
 * 
 * @param {*} date 
 * @param {*} format 
 * @param {*} utc 
 * @returns formatted date/time string
 */
function formatDate(date, format, utc) {
  var MMMM = ["\x00", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var MMM = ["\x01", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var dddd = ["\x02", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var ddd = ["\x03", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function ii(i, len) {
    var s = i + "";
    len = len || 2;
    while (s.length < len) s = "0" + s;
    return s;
  }

  var y = utc ? date.getUTCFullYear() : date.getFullYear();
  format = format.replace(/(^|[^\\])yyyy+/g, "$1" + y);
  format = format.replace(/(^|[^\\])yy/g, "$1" + y.toString().substr(2, 2));
  format = format.replace(/(^|[^\\])y/g, "$1" + y);

  var M = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
  format = format.replace(/(^|[^\\])MMMM+/g, "$1" + MMMM[0]);
  format = format.replace(/(^|[^\\])MMM/g, "$1" + MMM[0]);
  format = format.replace(/(^|[^\\])MM/g, "$1" + ii(M));
  format = format.replace(/(^|[^\\])M/g, "$1" + M);

  var d = utc ? date.getUTCDate() : date.getDate();
  format = format.replace(/(^|[^\\])dddd+/g, "$1" + dddd[0]);
  format = format.replace(/(^|[^\\])ddd/g, "$1" + ddd[0]);
  format = format.replace(/(^|[^\\])dd/g, "$1" + ii(d));
  format = format.replace(/(^|[^\\])d/g, "$1" + d);

  var H = utc ? date.getUTCHours() : date.getHours();
  format = format.replace(/(^|[^\\])HH+/g, "$1" + ii(H));
  format = format.replace(/(^|[^\\])H/g, "$1" + H);

  var h = H > 12 ? H - 12 : H == 0 ? 12 : H;
  format = format.replace(/(^|[^\\])hh+/g, "$1" + ii(h));
  format = format.replace(/(^|[^\\])h/g, "$1" + h);

  var m = utc ? date.getUTCMinutes() : date.getMinutes();
  format = format.replace(/(^|[^\\])mm+/g, "$1" + ii(m));
  format = format.replace(/(^|[^\\])m/g, "$1" + m);

  var s = utc ? date.getUTCSeconds() : date.getSeconds();
  format = format.replace(/(^|[^\\])ss+/g, "$1" + ii(s));
  format = format.replace(/(^|[^\\])s/g, "$1" + s);

  var f = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
  format = format.replace(/(^|[^\\])fff+/g, "$1" + ii(f, 3));
  f = Math.round(f / 10);
  format = format.replace(/(^|[^\\])ff/g, "$1" + ii(f));
  f = Math.round(f / 10);
  format = format.replace(/(^|[^\\])f/g, "$1" + f);

  var T = H < 12 ? "AM" : "PM";
  format = format.replace(/(^|[^\\])TT+/g, "$1" + T);
  format = format.replace(/(^|[^\\])T/g, "$1" + T.charAt(0));

  var t = T.toLowerCase();
  format = format.replace(/(^|[^\\])tt+/g, "$1" + t);
  format = format.replace(/(^|[^\\])t/g, "$1" + t.charAt(0));

  var tz = -date.getTimezoneOffset();
  var K = utc || !tz ? "Z" : tz > 0 ? "+" : "-";
  if (!utc) {
    tz = Math.abs(tz);
    var tzHrs = Math.floor(tz / 60);
    var tzMin = tz % 60;
    K += ii(tzHrs) + ":" + ii(tzMin);
  }
  format = format.replace(/(^|[^\\])K/g, "$1" + K);

  var day = (utc ? date.getUTCDay() : date.getDay()) + 1;
  format = format.replace(new RegExp(dddd[0], "g"), dddd[day]);
  format = format.replace(new RegExp(ddd[0], "g"), ddd[day]);

  format = format.replace(new RegExp(MMMM[0], "g"), MMMM[M]);
  format = format.replace(new RegExp(MMM[0], "g"), MMM[M]);

  format = format.replace(/\\(.)/g, "$1");

  return format;
};

/**
 * Sends data to dashboard
 */
// this is not called after a win.
async function sendDashboardData(sendPlayData = true) {

  console.log("Inside sendDashboardData..");
  if (sendPlayData && (currentDealer == null || currentDealer != getDealer())) {
    if (playRound > 0) {
      highlightBetNumbers(false);

      let lastNumber = getRecentNumbers()[0];
      let favorite = favoriteNumbers.includes(lastNumber);

      // send play data to background
      chrome.runtime.sendMessage({
        type: "update-play",
        playTime: formatDate(new Date(), "HH:mm:ss dd MMM yyyy"),
        dealer: currentDealer,
        playRound: playRound,
        betOn: betFavorites.join("-"),
        winner: lastNumber,
        win: getWon(),
        favorite: favorite
      });
    }

    // reset round
    playRound = 0;
    betFavorites = null;
    betNumbers = [];

    // update dealer
    console.log('New dealer session started');

    currentDealer = getDealer();

    // get all numbers
    recentNumbers = getRecentNumbers();
    favoriteNumbers = getHotNumbers();

    try {
      let msg = await chrome.runtime.sendMessage({
        type: "api",
        data: {
          action: "zrr",
          recentNumbers: recentNumbers,
          favoriteNumbers: favoriteNumbers,
        }
      });

      console.log('recommendation from server');
      console.log(msg);

      if (msg.success == true) {
        betFavorites = msg.betFavorites;
        highStakeNumbers = msg.highStakeNumbers;
        betNumbers = msg.betNumbers;

        playRound = 1;
        highlightBetNumbers(true);
      } else {
        if (msg.token == undefined) {
          chrome.runtime.sendMessage({ type: "logout" });
        }
        else {
          betFavorites = null;
          highStakeNumbers = null;
          betNumbers = [];
          console.log("BET - stay ");
        }
      }

      // send recommendation
      console.log("update dashboard from play");
      chrome.runtime.sendMessage({
          type: "update-dashboard",
          recentNumbers: recentNumbers,
          favoriteNumbers: favoriteNumbers,
          betFavorites: betFavorites,
          betNumbers: betNumbers,
          highStakeNumbers: getHighStakeNumbers(recentNumbers, favoriteNumbers),
          dealer: currentDealer
        });
      } catch (e) {
        console.log("ERROR: " + e);
      }
  } else {
    if (playRound > 0) {
      highlightBetNumbers(false);
      if (sendPlayData) {
        let lastNumber = getRecentNumbers()[0];
        let favorite = favoriteNumbers.includes(lastNumber);

        // send play data to background
        chrome.runtime.sendMessage({
          type: "update-play",
          playTime: formatDate(new Date(), "HH:mm:ss dd MMM yyyy"),
          dealer: getDealer(),
          playRound: playRound,
          betOn: betFavorites.join("-"),
          winner: lastNumber,
          win: getWon(),
          favorite: favorite
        });
      }

      playRound++;
      if (playRound <= REPEAT_ROUND) {

        // get all numbers
        recentNumbers = getRecentNumbers();
        favoriteNumbers = getHotNumbers();

        // get recommendation
        [betFavorites, highStakeNumbers, betNumbers] = getNextRecommendation();
        highStakeNumbers = getHighStakeNumbers(recentNumbers, favoriteNumbers);

        // send data to background
        console.log("update dashboard from play / no dealer");
        chrome.runtime.sendMessage({
          type: "update-dashboard",
          recentNumbers: recentNumbers,
          favoriteNumbers: favoriteNumbers,
          betFavorites: betFavorites,
          betNumbers: betNumbers,
          highStakeNumbers: highStakeNumbers,
          dealer: getDealer()
        });
        highlightBetNumbers(true);

        return;
      } else {
        playRound = 0;
        betFavorites = null;
        betNumbers = [];
      }
    }

    console.log('new ZRR session started');

    // get all numbers
    recentNumbers = getRecentNumbers();
    favoriteNumbers = getHotNumbers();

    let msg = await chrome.runtime.sendMessage({
      type: "api",
      data: {
        action: "zrr",
        recentNumbers: recentNumbers,
        favoriteNumbers: favoriteNumbers,
      }
    });

    console.log('recommendation from server')
    console.log(msg);

    if (msg.success == true) {
      betFavorites = msg.betFavorites;
      highStakeNumbers = msg.highStakeNumbers;
      betNumbers = msg.betNumbers;

      playRound = 1;
      highlightBetNumbers(true);
    } else {
      if (msg.token == undefined) {
        chrome.runtime.sendMessage({ type: "logout" });
      } else {
        betFavorites = null;
        highStakeNumbers = null;
        betNumbers = [];
        console.log("BET - stay ");
      }
    }

    try {
    console.log("Before sending update-dasbnoard message");
    // send recommendation
    chrome.runtime.sendMessage({
      type: "update-dashboard",
      recentNumbers: recentNumbers,
      favoriteNumbers: favoriteNumbers,
      betFavorites: betFavorites,
      betNumbers: betNumbers,
      highStakeNumbers: getHighStakeNumbers(recentNumbers, favoriteNumbers),
      dealer: currentDealer
    });
    console.log("Sent update-dashboard message");
    } catch (e) {
      console.log("update dashboard error: " + e);
    }
  }
}

/**
 * Handler that fired before changes status
 *
 * @param {*} oldStatus
 * @param {*} newStatus
 */
function handleStatusChanging(oldStatus, newStatus) {
  /*
    if (oldStatus == null) {
      sendDashboardData();
    }*/
}

/**
 * Handler that fired after changed status
 *
 * @param {*} newStatus
 */
function handleStatusChanged(newStatus) {
  console.log("New status: " + newStatus);
  if (newStatus == "PLACE YOUR BET") {
    sendDashboardData();
  }
}

/**
 * Get history limit
 *
 * @returns current history limit
 */
function getLimit() {
  if (document.querySelectorAll('[data-role="knob"]').length > 0) {
    let limit = document
      .querySelectorAll('[data-role="knob"]')[0]
      .getAttribute("data-role-value");
    return limit;
  }
  return null;
}

/**
 * Main timer to monitor events
 */
function mainTimer() {
  let status = getStatus();
  if (status != null) {
    var updatedDashboard = false;
    if (currentStatus != status) {
      console.log("Status change detected");
      handleStatusChanging(currentStatus, status);
      currentStatus = status;
      handleStatusChanged(currentStatus);
      updatedDashboard = true;
    }

    let limit = getLimit();
    if (currentLimit != limit) {
      if (!updatedDashboard) {
        sendDashboardData(false);
        updatedDashboard = true;
      }
      currentLimit = limit;
    }
  }
}

/**
 * Unique function of Array object
 * 
 * @returns Array object that removed duplicated elements
 */
Array.prototype.unique = function () {
  var a = this.concat();
  for (var i = 0; i < a.length; ++i) {
    for (var j = i + 1; j < a.length; ++j) {
      if (a[i] === a[j]) a.splice(j--, 1);
    }
  }

  return a;
};

$(document).ready(function () {
  console.log("Live Roulette game window is loaded");

  window.setInterval(mainTimer, 200);
});
