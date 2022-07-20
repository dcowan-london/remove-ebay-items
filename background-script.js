/* chrome.browserAction.onClicked.addListener(function () {
    console.log("Test");

    // let title = browser.i18n.getMessage("notificationTitle");
    // let content = browser.i18n.getMessage("notificationContent", message.url);
}) */

chrome.action.onClicked.addListener(async tab => {
    try {
        await chrome.scripting.insertCSS({
            target: {
                tabId: tab.id,
            },
            css: `.s-item a.s-item__link { border-style: solid; }`
        });
    } catch (error) {
        console.error('CSS insert failed! ' + error);
    }

    try {
        await chrome.scripting.executeScript({
            target: {
                tabId: tab.id,
            },
            func: () => {
                document.querySelectorAll('.s-item a.s-item__link').forEach(element => {
                    let href = element.getAttribute('href');
                    href = href.split('/');
                    let itemID = href[href.length-1].split('?')[0];
                    console.log(itemID);
                });
            }
        });
    } catch (error) {
        console.error('Get HREFs failed! ' + error);
    }
});

chrome.webNavigation.onCompleted.addListener(function() {
    chrome.notifications.create({
        "type": "basic",
        "iconUrl": "icons/ebay-48.png",
        "title": 'eBay Item Remover',
        "message": "eBay Item Remover is running - and you've just loaded an eBay page!"
    });
}, {
    url: [{
        urlMatches : 'https://www.ebay.co.uk/'
    }]
});