'use strict';

const ADJECTIVES = [
  'Abrasive', 'Brash', 'Callous', 'Daft', 'Eccentric', 'Fiesty', 'Golden',
  'Holy', 'Ignominious', 'Joltin', 'Killer', 'Luscious', 'Mushy', 'Nasty',
  'OldSchool', 'Pompous', 'Quiet', 'Rowdy', 'Sneaky', 'Tawdry',
  'Unique', 'Vivacious', 'Wicked', 'Xenophobic', 'Yawning', 'Zesty'
];

const FIRST_NAMES = [
  'Anna', 'Bobby', 'Cameron', 'Danny', 'Emmett', 'Frida', 'Gracie', 'Hannah',
  'Isaac', 'Jenova', 'Kendra', 'Lando', 'Mufasa', 'Nate', 'Owen', 'Penny',
  'Quincy', 'Roddy', 'Samantha', 'Tammy', 'Ulysses', 'Victoria', 'Wendy',
  'Xander', 'Yolanda', 'Zelda'
];

const LAST_NAMES = [
  'Anchorage', 'Berlin', 'Cucamonga', 'Davenport', 'Essex', 'Fresno',
  'Gunsight', 'Hanover', 'Indianapolis', 'Jamestown', 'Kane', 'Liberty',
  'Minneapolis', 'Nevis', 'Oakland', 'Portland', 'Quantico', 'Raleigh',
  'SaintPaul', 'Tulsa', 'Utica', 'Vail', 'Warsaw', 'XiaoJin', 'Yale',
  'Zimmerman'
];

function randomItem(array) {
  var randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

function randomName() {
  return [ADJECTIVES, FIRST_NAMES, LAST_NAMES]
    .map(randomItem)
    .join(' ');
}

/**
 * Get the Room credentials from the server.
 * @param {string} [identity] identitiy to use, if not specified use random name.
 * @returns {Promise<{identity: string, token: string}>}
 */
async function getRoomCredentials(identity = randomName()) {
  const response = await fetch(`/token?identity=${identity}`);
  const token = await response.text();
  return { identity, token };
}

module.exports = getRoomCredentials;
