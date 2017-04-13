const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const generateRandomString = require("./helperCode");

// function generateRandomString() {
//   let allChars = "";
//   let randomString = "";
//   for (let i = 0; i <= 122; i++) {
//     if (i < 10) {
//       allChars += i.toString();
//     }
//     if (i > 64 && i < 91 || i > 96) {
//       allChars += String.fromCharCode(i);
//     }
//   }
//   for (let j = 0; j < 6; j++) {
//     let index = Math.floor(Math.random() * allChars.length);
//     let randomChar = allChars[index];
//     randomString += randomChar;
//   }
//   return randomString;
// }

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};



// when user submits url, we use function to generate random 6-character string
// store the longURL in database with the random string as a key
// redirect user a page displaying their info (equivalent to "/urls/:id")
app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = `http://${req.body.longURL}`;
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  console.log(req.body, urlDatabase);
  res.render("urls_index", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  console.log(req.body, urlDatabase);
  res.render("urls_index", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = `http://${req.body.longURL}`;
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  console.log(req.body, urlDatabase);
  res.render("urls_index", templateVars);
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  console.log(res.cookie.username);
  res.redirect(301, "/urls");
})

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  console.log("Cookie is all gone!");
  res.redirect(301, "/urls");
});


// get root directory
app.get("/", (req, res) => {
  console.log("Cookies: ", req.cookies);
  res.end(`Please log in to begin!`);
});

// get info in json
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// allow user to submit new URL to be shortened
app.get("/urls/new", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

// show all urls
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

// get page according to short ID
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

// allow user to redirect to long URL when imputing short URL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
  console.log(longURL, urlDatabase[req.params.shortURL])
})


// have server listen on the defined port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


