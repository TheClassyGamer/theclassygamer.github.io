// This file is intended to be run locally using Node
// It does not need to be accessible via the webpage
//
// Generates Commander.json, a pared down version of AtomicCards.json with only the relevant fields.
// Commander.json is small enough to be served to clients so the randomizer can be run in the browser.
//
// Get AtomicCards.json from https://mtgjson.com/downloads/all-files/
// File format: https://mtgjson.com/data-models/card-atomic/

var fs = require('fs');
var cards = JSON.parse(fs.readFileSync('AtomicCards.json', 'utf8'));

var cardNames = Object.keys(cards.data);
var validCards = [];

for (var i = 0; i < cardNames.length; i++) {
    var cardName = cardNames[i];

    if (cards.data[cardName][0].legalities !== undefined && cards.data[cardName][0].legalities.commander === "Legal") {
        var card = cards.data[cardName][0]; // do we really need to handle double sided cards?
        validCards.push({
            colorIdentity: card.colorIdentity, // mandatory
            colors: card.colors, // ~0.3MB
            // convertedManaCost: card.convertedManaCost, // duplicate data
            // edhrecRank: card.edhrecRank, // unnecessary
            // foreignData: card.foreignData, // unnecessary
            identifiers: card.identifiers, // ~1.7MB
            // keywords: card.keywords, // unnecessary
            // layout: card.layout, // unnecessary
            // legalities: card.legalities, // unnecessary
            manaCost: card.manaCost, // ~0.4MB
            // manaValue: card.manaValue, // duplicate data
            name: card.name, // duplicate data
            printings: card.printings, // ~0.6MB
            purchaseUrls: card.purchaseUrls, // ~5.0MB
            // rulings: card.rulings, // unnecessary
            // subtypes: card.subtypes, // duplicate data
            // supertypes: card.supertypes, // duplicate data
            text: card.text, // ~3.6MB
            type: card.type, // ~0.6MB
            // types: card.types // duplicate data
        });
    }
}

// console.log(Object.keys(validCards).length);
console.log(validCards.length);
fs.writeFileSync('Commander.json', JSON.stringify(validCards), 'utf8');