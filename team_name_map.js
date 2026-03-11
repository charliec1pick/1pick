// COMPLETE TEAM NAME MAP: Odds API → ESPN
// Manually verified and corrected — March 2026
//
// Usage: const espnName = toESPN(oddsApiName)
// Only contains entries where the names DIFFER between Odds API and ESPN.
// If a name isn't in this map, it's the same on both APIs.

const TEAM_NAME_MAP = {

  // ─── NFL ───────────────────────────────────────────────
  // All 32 NFL teams match exactly — no mappings needed

  // ─── CFB ───────────────────────────────────────────────
  "Appalachian State Mountaineers": "App State Mountaineers",
  "Citadel Bulldogs": "The Citadel Bulldogs",
  "Grambling State Tigers": "Grambling Tigers",
  "Hawaii Rainbow Warriors": "Hawai'i Rainbow Warriors",
  "Houston Baptist Huskies": "Houston Christian Huskies",  // Renamed in 2022
  "Louisiana Ragin Cajuns": "Louisiana Ragin' Cajuns",
  "Nicholls State Colonels": "Nicholls Colonels",
  "Sam Houston State Bearkats": "Sam Houston Bearkats",    // Dropped "State" when joining FBS
  "San Jose State Spartans": "San José State Spartans",
  "Southern Mississippi Golden Eagles": "Southern Miss Golden Eagles",
  "Texas A&M-Commerce Lions": "East Texas A&M Lions",      // Renamed 2024

  // ─── NBA ───────────────────────────────────────────────
  "Los Angeles Clippers": "LA Clippers",

  // ─── CBB ───────────────────────────────────────────────
  "Alabama St Hornets": "Alabama State Hornets",
  "Albany Great Danes": "UAlbany Great Danes",
  "Alcorn St Braves": "Alcorn State Braves",
  "American Eagles": "American University Eagles",
  "Appalachian St Mountaineers": "App State Mountaineers",
  "Arizona St Sun Devils": "Arizona State Sun Devils",
  "Arkansas St Red Wolves": "Arkansas State Red Wolves",
  "Arkansas-Little Rock Trojans": "Little Rock Trojans",
  "Army Knights": "Army Black Knights",
  "Boston Univ. Terriers": "Boston University Terriers",
  "CSU Bakersfield Roadrunners": "Cal State Bakersfield Roadrunners",
  "CSU Fullerton Titans": "Cal State Fullerton Titans",
  "CSU Northridge Matadors": "Cal State Northridge Matadors",
  "Cal Baptist Lancers": "California Baptist Lancers",
  "Central Connecticut St Blue Devils": "Central Connecticut Blue Devils",
  "Chicago St Cougars": "Chicago State Cougars",
  "Cleveland St Vikings": "Cleveland State Vikings",
  "Colorado St Rams": "Colorado State Rams",
  "Coppin St Eagles": "Coppin State Eagles",
  "Delaware St Hornets": "Delaware State Hornets",
  "East Tennessee St Buccaneers": "East Tennessee State Buccaneers",
  "Florida Int'l Golden Panthers": "Florida International Panthers",
  "Florida St Seminoles": "Florida State Seminoles",
  "Fort Wayne Mastodons": "Purdue Fort Wayne Mastodons",
  "Fresno St Bulldogs": "Fresno State Bulldogs",
  "GW Revolutionaries": "George Washington Revolutionaries",
  "Gardner-Webb Bulldogs": "Gardner-Webb Runnin' Bulldogs",
  "Georgia St Panthers": "Georgia State Panthers",
  "Grambling St Tigers": "Grambling Tigers",
  "Grand Canyon Antelopes": "Grand Canyon Lopes",
  "IUPUI Jaguars": "IU Indianapolis Jaguars",
  "Illinois St Redbirds": "Illinois State Redbirds",
  "Indiana St Sycamores": "Indiana State Sycamores",
  "Jackson St Tigers": "Jackson State Tigers",
  "Jacksonville St Gamecocks": "Jacksonville State Gamecocks",
  "Kansas St Wildcats": "Kansas State Wildcats",
  "Kennesaw St Owls": "Kennesaw State Owls",
  "LIU Sharks": "Long Island University Sharks",
  "Long Beach St 49ers": "Long Beach State Beach",
  "Loyola (Chi) Ramblers": "Loyola Chicago Ramblers",
  "Loyola (MD) Greyhounds": "Loyola Maryland Greyhounds",
  "Maryland-Eastern Shore Hawks": "Maryland-Eastern Shore Hawks",
  "Michigan St Spartans": "Michigan State Spartans",
  "Miss Valley St Delta Devils": "Mississippi Valley State Delta Devils",
  "Mississippi St Bulldogs": "Mississippi State Bulldogs",
  "Missouri St Bears": "Missouri State Bears",
  "Montana St Bobcats": "Montana State Bobcats",
  "Morehead St Eagles": "Morehead State Eagles",
  "Morgan St Bears": "Morgan State Bears",
  "Mt. St. Mary's Mountaineers": "Mount St. Mary's Mountaineers",
  "Murray St Racers": "Murray State Racers",
  "N Colorado Bears": "Northern Colorado Bears",
  "New Mexico St Aggies": "New Mexico State Aggies",
  "Nicholls St Colonels": "Nicholls Colonels",
  "Norfolk St Spartans": "Norfolk State Spartans",
  "North Dakota St Bison": "North Dakota State Bison",
  "Northwestern St Demons": "Northwestern State Demons",
  "Oklahoma St Cowboys": "Oklahoma State Cowboys",
  "Oregon St Beavers": "Oregon State Beavers",
  "Portland St Vikings": "Portland State Vikings",
  "Prairie View Panthers": "Prairie View A&M Panthers",
  "SE Missouri St Redhawks": "Southeast Missouri State Redhawks",
  "SIU-Edwardsville Cougars": "SIU Edwardsville Cougars",
  "Sacramento St Hornets": "Sacramento State Hornets",
  "Sam Houston St Bearkats": "Sam Houston Bearkats",
  "San Diego St Aztecs": "San Diego State Aztecs",
  "San José St Spartans": "San José State Spartans",
  "Seattle Redhawks": "Seattle U Redhawks",
  "South Carolina St Bulldogs": "South Carolina State Bulldogs",
  "South Dakota St Jackrabbits": "South Dakota State Jackrabbits",
  "St. Francis (PA) Red Flash": "Saint Francis Red Flash",
  "St. Thomas (MN) Tommies": "St. Thomas-Minnesota Tommies",
  "Tenn-Martin Skyhawks": "UT Martin Skyhawks",
  "Tennessee St Tigers": "Tennessee State Tigers",
  "Texas A&M-CC Islanders": "Texas A&M-Corpus Christi Islanders",
  "Texas A&M-Commerce Lions": "East Texas A&M Lions",
  "UMKC Kangaroos": "Kansas City Roos",
  "UT-Arlington Mavericks": "UT Arlington Mavericks",
  "Washington St Cougars": "Washington State Cougars",
  "Wichita St Shockers": "Wichita State Shockers",
  "Wright St Raiders": "Wright State Raiders",
  "Youngstown St Penguins": "Youngstown State Penguins",

  // ─── MLB ───────────────────────────────────────────────
  "Oakland Athletics": "Athletics",

  // ─── NHL ───────────────────────────────────────────────
  "Montréal Canadiens": "Montreal Canadiens",
  "St Louis Blues": "St. Louis Blues",
  "Utah Hockey Club": "Utah Mammoth",
}

function toESPN(name) {
  return TEAM_NAME_MAP[name] || name
}

// For use in Node.js (scores.js serverless function)
if (typeof module !== 'undefined') {
  module.exports = { TEAM_NAME_MAP, toESPN }
}