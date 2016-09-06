// Generates a random number between 2 values
// With only 1 argument, generates a number between 1 and a inclusive
function randomBetween (a, b = 1) {
    if (a - b > 1000 || b - a > 1000) return a // this is why we can't have nice things
    if      (a < b) return Math.floor(Math.random() * (b - a + 1)) + a
    else if (a > b) return Math.floor(Math.random() * (a - b + 1)) + b
    /* else a=b  */ return a
}

// Takes a string, parses it for space-separated rolls in the AdX format, and returns an array of rolls to perform
function parseRolls (string) {
    // The expression used to find each roll
    let adxRegExp = /(\s|^)((\d*)d(\d+|%))(?=\s|$)/gi

    // Seatch the string for rolls and store them in an array
    var matches = string.match(adxRegExp)
    // If there were no matches, return
    if (!matches) return

    // Get the properties of each roll and map into the return value
    return matches.map(match => {
        let number = match.replace(adxRegExp, '$3') || 1 // If no number is set, assume a single roll (i.e. d6 is valid for 1d6)
        var sides = match.replace(adxRegExp, '$4')
        return {
            number: parseInt(number, 10),
            sides: sides === '%' ? 100 : parseInt(sides, 10), //
            string: `${number === 1 ? '' : number}d${sides === '100' ? '%' : sides}` // Uses d6 over 1d6, and d% over d100
        }
    })
}

// Takes a roll string and executes it, returning an object containing result details
function performRoll (roll) {
    roll.number = parseInt(roll.number, 10)
    roll.sides = roll.sides === '%' ? 100 : parseInt(roll.sides, 10)
    var individuals = []

    // Roll each die
    for (var i = 0; i < roll.number; i++) {
        var thisRoll = randomBetween(roll.sides)
        individuals.push(thisRoll)
    }

    // Compute stats and return the results
    return {
        roll: roll,
        total: individuals.reduce((a, b) => a + b, 0),
        average: individuals.reduce((a, b) => a + b, 0) / individuals.length,
        individuals: individuals,
        min: roll.number,
        max: roll.number * roll.sides
    }
}

// Takes a string, parses any rolls it contains, and executes each, returning an array of results
function rollFromString (string) {
    var rolls = parseRolls(string)
    if (!rolls) return

    var results = []
    for (let roll of rolls) {
        var result = performRoll(roll)
        results.push(result)
    }
    return results
}

module.exports = rollFromString
