/**
 * Message handler for the type of 'update-dashboard'
 * @param {*} request 
 * @param {*} sendResponse 
 */
async function handleUpdateDashboard(request, sendResponse) {
    try {
        let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs && tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, request);
        }
        sendResponse({ success: true });
    } catch (error) {
        console.error("Error in handleUpdateDashboard:", error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Build a line of csv file
 * @param {*} row 
 * @returns 
 */
function buildRow(row) {
    return [
        row.playTime,
        row.dealer,
        row.playRound,
        row.betOn,
        row.winner,
        row.win ? 'WIN' : 'LOSS',
        row.favorite ? 'YES' : 'NO',
    ].join(",");
}

/**
 * Message handler for the type of 'save-stats'
 * Export playing data to csv file
 * @param {*} playData 
 */
function handleSaveStats(playData) {
    try {
        let csvContent =
            "Time,Dealer,Round,Bet On 3-Neighborhood,Winner,Win/Loss,Favorite?\n" +
            playData.map(buildRow).join("\n");
        let csvBlob = new Blob([csvContent], { type: 'text/csv' });
        let csvUrl = URL.createObjectURL(csvBlob);
        chrome.downloads.download({
            url: csvUrl,
            filename: 'roulette_stats.csv',
        });
    } catch (error) {
        console.error("Error in handleSaveStats:", error);
    }
}

async function handleApi(data, sendResponse) {
    try {
        if (data.action === 'auth') {
            let response = await fetch("https://www.zenroulette.com/api/index.php", {
                method: "POST",
                mode: "cors",
                cache: "no-cache",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams(data).toString(),
            });
            let msg = await response.json();
            chrome.storage.session.set({
                authenticated: true,
                securityToken: msg.token,
            });
            sendResponse(msg);
        } else {
            let { authenticated, securityToken } = await chrome.storage.session.get([
                "authenticated",
                "securityToken",
            ]);

            if (!authenticated) {
                console.log("Not authenticated!");
                sendResponse({ success: false });
            } else {
                data.token = securityToken;
                let response = await fetch("https://www.zenroulette.com/api/index.php", {
                    method: "POST",
                    mode: "cors",
                    cache: "no-cache",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams(data).toString(),
                });
                let msg = await response.json();
                sendResponse(msg);

                if (msg.token) {
                    chrome.storage.session.set({ securityToken: msg.token });
                } else {
                    chrome.storage.session.set({ authenticated: false });
                }
            }
        }
    } catch (error) {
        console.error("Error in handleApi:", error);
        sendResponse({ success: false, error: error.message });
    }
}

// Add message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "update-dashboard") {
        handleUpdateDashboard(request, sendResponse);
    } else if (request.type === "save-stats") {
        handleSaveStats(request.playData);
    } else if (request.type === "api") {
        handleApi(request.data, sendResponse);
    } else if (request.type === "reset-auth") {
        chrome.storage.session.set({ authenticated: false });
    }
    return true; // Keeps the message channel open for async responses
});

// Add click handler for the browser action
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'toggle' });
    });
});
