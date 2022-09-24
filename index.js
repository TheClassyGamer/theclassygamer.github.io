const latestVersion = "2022-09-10";
const latestDBVersion = 1;
const dbName = "MTGCommanderRandomizer";
let db;

// Update page version text
document.getElementById("latestVersion").innerText = ("Latest Version: " + latestVersion);

// Open and initialize DB
initializeDB(); // We want to do this on page load
async function initializeDB() {
    document.getElementById("loadDeck").disabled = true;
    document.getElementById("createDeck").disabled = true;
    try {
        db = await idb.openDB(dbName, latestDBVersion, {
            upgrade(db) {
                db.createObjectStore("meta");
                const objectStore = db.createObjectStore("commander", { keyPath: "name" });
                objectStore.createIndex("colorIdentityIndex", "colorIdentity", { multiEntry: false });
            }
        });
        document.getElementById("loadDeck").disabled = false;
        checkVersion();
    } catch {
        document.getElementById("currentVersion").innerText = ("Your browser doesn't support IndexedDB :(");
    }
}

// Update the "Current Version" text
async function checkVersion() {
    let transaction = db.transaction("meta");
    let objectStore = transaction.objectStore("meta");

    let version = await objectStore.get("version");

    if (version === undefined) {
        document.getElementById("currentVersion").innerText = "Current Version: Not loaded";
    } else {
        document.getElementById("currentVersion").innerText = "Current Version: " + version;
        document.getElementById("createDeck").disabled = false;
    }
}

// Load the newest deck into the db and update the version
async function loadDeck() {
    fetch("Commander.json")
    .then(response => {
        if (!response.ok) {
            throw new Error(response.status);
        }
        return response.json();
    })
    .then(async cards => {
        const transaction = db.transaction(["meta", "commander"], "readwrite");

        // Store card data
        const colorIdentitiesStrings = [];
        const purchaseOptions = [];
        const objectStore = transaction.objectStore("commander");
        cards.forEach((card) => {
            // Store the card
            objectStore.put(card);

            // Track unique "stringified" color identities
            const ci = card.colorIdentity.join();
            if (colorIdentitiesStrings.indexOf(ci) === -1) {
                colorIdentitiesStrings.push(ci);
            }

            // Track purchase options
            Object.keys(card.purchaseUrls).forEach((purchaseOption) => {
                if (purchaseOptions.indexOf(purchaseOption) === -1) {
                    purchaseOptions.push(purchaseOption);
                }
            });
        });

        // "Destringify" the color identities
        const colorIdentities = [];
        colorIdentitiesStrings.forEach((colorIdentitiesString) => {
            colorIdentities.push(colorIdentitiesString.split(','));
        });

        // Store the collected metadata
        await transaction.objectStore("meta").put(colorIdentities, "colorIdentities");
        await transaction.objectStore("meta").put(purchaseOptions, "purchaseOptions");
        await transaction.objectStore("meta").put(latestVersion, "version");

        await checkVersion();
    });
}

async function createDeck() {
    const selectedColors = getSelectedColors();
    const colorIdentities = await db.get("meta", "colorIdentities");
    const selectedColorIdentities = [];

    // Find all color identities which only contain the selected colors
    colorIdentities.forEach((colorIdentity) => {
        if (colorIdentity.every(color => selectedColors.includes(color))) {
            selectedColorIdentities.push(colorIdentity);
        }
    });

    // Find all cards which have the selected color identities
    let validCards = await db.getAllFromIndex("commander", "colorIdentityIndex", []); // Start with all colorless cards
    for (let i = 0; i < selectedColorIdentities.length; i++) {
        validCards = validCards.concat(await db.getAllFromIndex("commander", "colorIdentityIndex", selectedColorIdentities[i]));
    }

    // Choose 70 valid cards and display them as hyperlinks
    document.getElementById("deck").innerHTML = "";
    for (let i = 0; i < 70; i++) {
        const randomCard = validCards[getRandomInt(validCards.length)];

        let cardUrl = getCardUrl(randomCard.purchaseUrls);
        cardUrl = cardUrl !== undefined ? `href="${cardUrl}"` : "";
        const manaCost = randomCard.manaCost === undefined ? "" : randomCard.manaCost;

        document.getElementById("deck").innerHTML += `<br><a ${cardUrl}>${manaCost} ${randomCard.name}</a>`;
    }
}

// Returns an array of the selected colours as their letter shorthands
function getSelectedColors() {
    const selectedColors = [];
    const checkboxes = document.getElementsByClassName("colors");
    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            selectedColors.push(checkboxes[i].value);
        }
    }
    return selectedColors;
}

// Returns the first applicable purchase URL (allow setting specific or preference?)
function getCardUrl(purchaseUrls) {
    return purchaseUrls[Object.keys(purchaseUrls)[0]];
}

// Gets a random int [0, max)
function getRandomInt(max) {
    return Math.random() * max | 0;
}