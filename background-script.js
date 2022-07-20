/* chrome.browserAction.onClicked.addListener(function () {
    console.log("Test");

    // let title = browser.i18n.getMessage("notificationTitle");
    // let content = browser.i18n.getMessage("notificationContent", message.url);
}) */

chrome.runtime.onInstalled.addListener(function(details) {

    if(details.reason == "install"){
        chrome.storage.sync.set({
            'hiddenItemsList': '{}'
        })

        console.log('Successfully initialised new install');
    } else if ( details.reason == "update" ) {
        console.log('Extension updated');
    }
})

chrome.action.onClicked.addListener(async tab => {
    var hiddenItemsList;
    
    chrome.storage.sync.get(['hiddenItemsList'], function(result) {
        hiddenItemsList = JSON.parse(result.hiddenItemsList);
        hiddenItemsList = Object.values(hiddenItemsList);
        console.log(hiddenItemsList);
    });

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
            args: [ hiddenItemsList ],
            func: (hiddenItemsList) => {
                document.querySelectorAll('.s-item a.s-item__link').forEach(element => {
                    let href = element.getAttribute('href');
                    href = href.split('/');
                    let itemID = href[href.length-1].split('?')[0];

                    if(hiddenItemsList.includes(parseInt(itemID))) {
                        console.log("Item " + itemID + " is in removelist!");
                        console.log(element.closest('.s-item'));
                        element.closest('.s-item').innerHTML = 'REMOVED BY EBAY ITEM REMOVER';
                    } else {
                        let parent = element.closest('.s-item');

                        console.log(itemID);
                        console.log(element.closest('.s-item'));

                        parent.insertAdjacentHTML('beforeend', '<span class="s-item__watchheart at-corner s-item__watchheart--watch" style="right: 30px; bottom: 10px;"><a aria-label="remove item" href="#"><span class="s-item__watchheart-icon"><svg class="icon icon--save-small" focusable="false" aria-hidden="true"><circle cx="10" cy="9" r="6.5" stroke="black" stroke-width="2" fill="none"></circle></svg><svg class="icon icon--save-selected-small" focusable="false" aria-hidden="true"><use xlink:href="#icon-save-selected-small"></use></svg></span></a></span>')
                    }
                });

                console.log(hiddenItemsList);
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