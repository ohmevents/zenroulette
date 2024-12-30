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

// Utility functions for numbers
function getNextIndex(index) {
    if (index == 36) {
        return 0;
    } else {
        return index + 1;
    }
}

function getBeforeIndex(index) {
    if (index == 0) {
        return 36;
    } else {
        return index - 1;
    }
}

function getIndexFromNumber(n) {
    return numbersOnBoard.indexOf(n);
}

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

// Main logic
async function sendDashboardData(sendPlayData = true) {
    console.log("Inside sendDashboardData...");
    try {
        if (sendPlayData && (currentDealer == null || currentDealer != getDealer())) {
            if (playRound > 0) {
                highlightBetNumbers(false);

                let lastNumber = getRecentNumbers()[0];
                let favorite = favoriteNumbers.includes(lastNumber);

                // Send play data to background
                try {
                    await chrome.runtime.sendMessage({
                        type: "update-play",
                        playTime: formatDate(new Date(), "HH:mm:ss dd MMM yyyy"),
                        dealer: currentDealer,
                        playRound: playRound,
                        betOn: betFavorites.join("-"),
                        winner: lastNumber,
                        win: getWon(),
                        favorite: favorite,
                    });
                } catch (e) {
                    console.error("Error sending play data to background script:", e);
                }
            }

            playRound = 0;
            betFavorites = null;
            betNumbers = [];
            currentDealer = getDealer();

            recentNumbers = getRecentNumbers();
            favoriteNumbers = getHotNumbers();

            // Send recommendation request
            try {
                let msg = await chrome.runtime.sendMessage({
                    type: "api",
                    data: {
                        action: "zrr",
                        recentNumbers: recentNumbers,
                        favoriteNumbers: favoriteNumbers,
                    },
                });

                console.log("Recommendation from server:", msg);

                if (msg.success) {
                    betFavorites = msg.betFavorites;
                    highStakeNumbers = msg.highStakeNumbers;
                    betNumbers = msg.betNumbers;
                    playRound = 1;
                    highlightBetNumbers(true);
                } else {
                    if (msg.token === undefined) {
                        await chrome.runtime.sendMessage({ type: "logout" });
                    } else {
                        console.log("BET - stay");
                    }
                }

                // Update dashboard
                try {
                    await chrome.runtime.sendMessage({
                        type: "update-dashboard",
                        recentNumbers: recentNumbers,
                        favoriteNumbers: favoriteNumbers,
                        betFavorites: betFavorites,
                        betNumbers: betNumbers,
                        highStakeNumbers: getHighStakeNumbers(
                            recentNumbers,
                            favoriteNumbers
                        ),
                        dealer: currentDealer,
                    });
                } catch (e) {
                    console.error("Error sending dashboard update:", e);
                }
            } catch (e) {
                console.error("Error sending recommendation request:", e);
            }
        }
    } catch (e) {
        console.error("Critical error in sendDashboardData:", e);
    }
}

// Helper functions
function highlightBetNumbers(highlight) {
    betNumbers.forEach(function (value) {
        let rect = document.querySelector(`[data-bet-spot-id="${value}"]`);
        if (rect != undefined) {
            rect.style.fill = highlight ? "orange" : "";
        }
    });
}

function getRecentNumbers() {
    // Replace with logic to fetch recent numbers from the game
    return [];
}

function getHotNumbers() {
    // Replace with logic to fetch hot numbers from the game
    return [];
}

function getDealer() {
    // Replace with logic to fetch the current dealer from the game
    return "Dealer Name";
}

function getWon() {
    let lastNumber = getRecentNumbers()[0];
    return betNumbers.includes(lastNumber);
}

function formatDate(date, format) {
    // Replace with logic to format the date as required
    return date.toISOString();
}

console.log("App.js loaded.");
