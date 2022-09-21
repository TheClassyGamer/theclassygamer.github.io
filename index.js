const latestVersion = "2022-09-10";
const latestDBVersion = 1;
const dbName = "MTGCommanderRandomizer";
let db;

// Update page version text
document.getElementById("latestVersion").innerText = ("Latest Version: " + latestVersion);

// Open and initialize DB
initializeDB(); // We want to do this on page load
async function initializeDB() {
    db = await idb.openDb(dbName, latestDBVersion, db => {
        db.createObjectStore("meta");
        const objectStore = db.createObjectStore("commander", { keyPath: "name" });
        objectStore.createIndex("colorIdentityIndex", "colorIdentity", { multiEntry: true });
    });
    checkVersion();
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

        await transaction.objectStore("meta").put(latestVersion, "version");

        const objectStore = transaction.objectStore("commander");
        cards.forEach((card) => {
            objectStore.put(card);
        });

        await checkVersion();
    });
}

async function createDeck() {
    // const transaction = db.transaction("commander");
    // const index = transaction.objectStore("commander").index("colorIdentityIndex");
    // const cursor = index.openCursor();
    // const colorDeck = await db.getFromIndex("commander", "colorIdentityIndex", ["U"]);
    alert("Not quite there yet...");
}