const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
// const helperCode = require("helperCode.js");


app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

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


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  console.log(req.body, urlDatabase);
  res.redirect(303, `/urls/${randomString}`);
});


app.get("/", (req, res) => {
  res.end(`Hello!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, urls: urlDatabase };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
})


app.get("/hello", (req, res) => {
  res.end("<html><body>Hellooooo <b>World</b></body></html>\n");
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


