// var authenticated = false;
// var securityToken = null;

/**
 * Message handler for the type of 'update-dashboard'
 * @param {*} request 
 * @param {*} sendResponse 
 */
async function handleUpdateDashboard(request, sendResponse) {
  // send message to top frame
  let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tabs != undefined && tabs[0] != undefined) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      request
    );
  }
}

/**
 * Build a line of csv file
 * @param {*} row 
 * @returns 
 */
function buildRow(row) {
  return [row.playTime, row.dealer, row.playRound, row.betOn, row.winner, row.win ? 'WIN' : 'LOSS', row.favorite ? 'YES' : 'NO'].join(",");
}

/**
 * Message handler for the type of 'save-stats'
 *     Export playing data to csv file
 * 
 * @param {*} playData 
 */
function handleSaveStats(playData) {
  let csvContent = "Time,Dealer,Round,Bet On 3-Neighborhood,Winner,Win/Loss,Favorite?\n" + playData.map(buildRow).join("\n");
  let csvBlob = new Blob([csvContent], { type: 'text/csv' });
  let csvUrl = URL.createObjectURL(csvBlob);
  chrome.downloads.download({
    url: csvUrl,
    filename: 'roulette_stats.csv'
  });
}

async function handleApi(data, sendResponse) {
  if (data.action == 'auth') {
    try {
      let response = 
        await fetch("https://www.zenroulette.com/api/index.php",
           { method: "POST",
             mode: "cors",
             cache: "no-cache",
             headers: { "Content-Type": "application/x-www-form-urlencoded", },
             body: new URLSearchParams(data).toString(),
           });
      let msg = await response.json();
      console.log("Authentication successful!");
      chrome.storage.session.set({ authenticated: true
                                , securityToken: msg.token });
      sendResponse(msg);
      return true;
    } catch(err) {
      console.log(err);
    }
  } else {
    let globalState = await chrome.storage.session.get(["authenticated","securityToken"]);
    let authenticated = globalState["authenticated"];
    let securityToken = globalState["securityToken"];
    if (!authenticated) {
      console.log("Not authenticated!");
      sendResponse({ success: false });
    } else {
      try {
        data.token = securityToken;
        let response = await fetch("https://www.zenroulette.com/api/index.php",
                                  { method: "POST"
                                  , mode: "cors"
                                  , cache: "no-cache"
                                  , headers: { "Content-Type": "application/x-www-form-urlencoded", }
                                  , body: new URLSearchParams(data).toString(),
                                  });
        let msg = await response.json();
        sendResponse(msg);
        if (msg.token != undefined) {
          chrome.storage.session.set({ securityToken: msg.token });
        } else {
          chrome.storage.session.remove("securityToken");
          chrome.storage.session.set({ authenticated: false });
        }
      } catch (e) {
        console.log(e);
        sendResponse({ success: false });
      }
    }
  }
}

// Add message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received request:", request);

    if (request.type === "api") {
        handleApi(request.data, sendResponse);
    } else if (request.type === "logout") {
        console.log("Logout request received.");
        sendResponse({ success: true });
    } else {
        console.warn("Unknown request type:", request.type);
        sendResponse({ success: false, msg: "Unknown request type." });
    }

    return true; // Keeps the message channel open for async operations
});

function handleApi(data, sendResponse) {
    console.log("Handling API request with data:", data);

    // Simulate a successful API response for testing
    sendResponse({
        success: true,
        msg: "API request processed successfully!",
    });
}



/**
 * Add click handler of browserAction
 */
chrome.action.onClicked.addListener(function (tab) {
  /*
  if (tab.url.indexOf("https://bc.game/game/casino-malta-roulette-by-evolution-gaming") != -1) { 
  }
  */
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { type: 'toggle' }
    );
  });
});
