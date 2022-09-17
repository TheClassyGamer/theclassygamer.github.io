// This file is intended to be run locally using Node
// It does not need to be accessible via the webpage
//
// Generates RandomDeckList.json and RandomDeck.json, a random selection of Commander format legal cards
//
// This functionality will be included via the actual webpage, at which point this file can be removed

let fs = require('fs');

// Have a button to load the Commander.json into a variable, then replace this line with a reference to that variable
let cards = JSON.parse(fs.readFileSync('Commander.json', 'utf8'));


let cardNames = Object.keys(cards);
let colorIdentityCheck = (commanderColorIdentity, cardColorIdentity) => cardColorIdentity.every(i => commanderColorIdentity.includes(i));

// Have this variable be set by checkboxes on the page
let commanderColorIdentity = [ "U", "W" ];

// Get an array of valid card names for the provided commander color identity
let validCards = [];
for (let i = 0; i < cardNames.length; i++) {
    let cardName = cardNames[i];
    if (colorIdentityCheck(commanderColorIdentity, cards[cardName].colorIdentity)) {
        validCards.push(cardName);
    }
}

// Choose 70 cards
let chosenCards = {};
for (let i = 0; i < 70; i++) {
    let randomCardNumber = Math.floor(Math.random() * validCards.length);
    let randomCard = validCards[randomCardNumber];
    chosenCards[randomCard] = cards[randomCard];
    validCards.splice(randomCardNumber, 1);
}


console.log(Object.keys(chosenCards).length);

// Replace these outputs with writes to variables that will then be displayed on the page
fs.writeFileSync('RandomDeckList.json', JSON.stringify(Object.keys(chosenCards)), 'utf8');
fs.writeFileSync('RandomDeck.json', JSON.stringify(chosenCards), 'utf8');