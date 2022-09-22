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
                objectStore.createIndex("colorIdentityIndex", "colorIdentity", { multiEntry: true });
                objectStore.createIndex("colorlessIdentityIndex", "colorIdentity", { multiEntry: false }); // does this actually get colorless?
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

        await transaction.objectStore("meta").put(latestVersion, "version");

        const objectStore = transaction.objectStore("commander");
        cards.forEach((card) => {
            objectStore.put(card);
        });

        await checkVersion();
    });
}

async function createDeck() {
    const colorlessDeck = await db.getAllFromIndex("commander", "colorlessIdentityIndex", []); // this kinda works?
    console.log("Colorless: " + colorlessDeck.length);
    let colorDeck = await db.getAllFromIndex("commander", "colorIdentityIndex", "B"); // do this for each requested colour
    console.log("Black: " + colorTwoDeck.length);
    let colorTwoDeck = await db.getAllFromIndex("commander", "colorIdentityIndex", "W"); // do this for each requested colour
    console.log("White: " + colorTwoDeck.length);
    // why do these searches have so many results? colorless/lands aren't in them but they're only like 500 short

    // for (let i = 0; i < colorDeck.length; i++) {
    //     if (colorDeck[i].colorIdentity.includes("W") && colorDeck[i].colorIdentity.includes("B")) {
    //         console.log(colorDeck[i]);
    //     }
    // }

    const deck = arrayUnique(colorlessDeck.concat(colorDeck).concat(colorTwoDeck));
    console.log("Combined: " + deck.length);

    // take the combined results, choose X, and display them as hyperlinks
    alert("Not quite there yet...");
}

// https://stackoverflow.com/questions/1584370/how-to-merge-two-arrays-in-javascript-and-de-duplicate-items
function arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i].name === a[j].name)
                a.splice(j--, 1);
        }
    }
    return a;
}