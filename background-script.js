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

    hiddenItemsList = await getHiddenItemsList();
    
    await removeItems();

    addButton();

    // try {
    //     await chrome.scripting.insertCSS({
    //         target: {
    //             tabId: tab.id,
    //         },
    //         css: `.s-item a.s-item__link { border-style: solid; }`
    //     });
    // } catch (error) {
    //     console.error('CSS insert failed! ' + error);
    // }
});

// document.getElementsByClassName('ebayitemremover-extension_removeitem').forEach(element => {
//     element.addEventListener('click', (elm) => {
//         console.log(elm.getAttribute('ebayitemremover-extension_itemid') + ' clicked');
//     });
// })

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

const getHiddenItemsList = async () => {
    var hiddenItemsList;

    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['hiddenItemsList'], async (result) => {
            hiddenItemsList = JSON.parse(result.hiddenItemsList);
            hiddenItemsList = Object.values(hiddenItemsList);

            resolve(hiddenItemsList);
        });
    });
}

async function removeItems() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);

    let hiddenItemsList = await getHiddenItemsList();

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

                        parent.insertAdjacentHTML('beforeend', '<span class="s-item__watchheart at-corner s-item__watchheart--watch ebayitemremover-extension_removeitem" ebayitemremover-extension_itemid=' + itemID + ' style="right: 30px; bottom: 10px;"><a aria-label="remove item" href="#"><span class="s-item__watchheart-icon"><svg class="icon icon--save-small" focusable="false" aria-hidden="true"><circle cx="10" cy="9" r="6.5" stroke="black" stroke-width="2" fill="none"></circle></svg><svg class="icon icon--save-selected-small" focusable="false" aria-hidden="true"><use xlink:href="#icon-save-selected-small"></use></svg></span></a></span>')
                    }
                });

                console.log(hiddenItemsList);
            }
        });
    } catch (error) {
        console.error('Get HREFs failed! ' + error);
    }
}

async function addButton() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);

    let hiddenItemsList = await getHiddenItemsList();

    try {
        await chrome.scripting.executeScript({
            target: {
                tabId: tab.id,
            },
            args: [ hiddenItemsList ],
            func: (hiddenItemsList) => {
                Array.from(document.getElementsByClassName('ebayitemremover-extension_removeitem')).forEach(element => {
                    element.addEventListener('click', (event) => {
                        let parent = event.target.closest('.ebayitemremover-extension_removeitem');
                        let itemID = parseInt(parent.getAttribute('ebayitemremover-extension_itemid'));

                        console.log(itemID + ' clicked');

                        let sureRemove = confirm('Sure you want to remove this item?');

                        if(sureRemove) {
                            hiddenItemsList[hiddenItemsList.length] = itemID;
                        } else {
                            event.preventDefault();
                            return;
                        }

                        chrome.storage.sync.set( {'hiddenItemsList': JSON.stringify(hiddenItemsList)}, function() {
                            // parent.innerHTML = "REMOVED BY EBAY ITEM REMOVER";
                            alert("Done\nYou need to click the extension icon for this to take effect")
                        } );

                        event.preventDefault();
                    });
                })
            }
        }
        );
    } catch (error) {
        console.log("Error adding removal button! " + error);
    }
}