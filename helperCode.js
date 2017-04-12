function generateRandomString() {
  let allChars = "";
  let randomString = "";
  for (let i = 0; i <= 122; i++) {
    if (i < 10) {
      allChars += i.toString();
    }
    if (i > 64 && i < 91 || i > 96) {
      allChars += String.fromCharCode(i);
    }
  }
  for (let j = 0; j < 6; j++) {
    let index = Math.floor(Math.random() * allChars.length);
    let randomChar = allChars[index];
    randomString += randomChar;
  }
  return randomString;
}

module.exports = generateRandomString;