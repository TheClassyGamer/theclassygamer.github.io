const latestVersion = "2022-09-10";
const latestDBVersion = 1;
const dbName = "MTGCommanderRandomizer";
let db;

// Update page version text
document.getElementById("latestVersion").innerText = ("Latest Version: " + latestVersion);

// Open and initialize DB
initializeDB(); // We want to do this on page load
async function initializeDB() {
    try {
        db = await idb.openDB(dbName, latestDBVersion, {
            upgrade(db) {
                db.createObjectStore("meta");
                const objectStore = db.createObjectStore("commander", { keyPath: "name" });
                objectStore.createIndex("colorIdentityIndex", "colorIdentity", { multiEntry: false });
            }
        });
        checkVersion();
    } catch {
        document.getElementById("currentVersion").innerText = ("Your browser doesn't support IndexedDB :(");
        document.getElementById("loadDeck").disabled = true;
        document.getElementById("createDeck").disabled = true;
    }
}

// Update the "Current Version" text
async function checkVersion() {
    let transaction = db.transaction("meta");
    let objectStore = transaction.objectStore("meta");

    let version = await objectStore.get("version");
    document.getElementById("currentVersion").innerText = "Current Version: " + (version === undefined ? "Not loaded" : version);
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

        // Store each card and track unique "stringified" color identities
        const colorIdentitiesStrings = [];
        const objectStore = transaction.objectStore("commander");
        cards.forEach((card) => {
            objectStore.put(card);
            const ci = card.colorIdentity.join();
            if (colorIdentitiesStrings.indexOf(ci) === -1) {
                colorIdentitiesStrings.push(ci);
            }
        });

        // "Destringify" the color identites
        const colorIdentities = [];
        colorIdentitiesStrings.forEach((colorIdentitiesString) => {
            colorIdentities.push(colorIdentitiesString.split(','));
        });

        // Store the color identities and deck version
        await transaction.objectStore("meta").put(colorIdentities, "colorIdentities");
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

    // choose X valid cards and display them as hyperlinks
    alert(validCards.length + " valid cards");
}

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