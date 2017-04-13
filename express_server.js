const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const generateRandomString = require("./helperCode");


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

//middleware tracking all GET requests beginning with root
app.use("/", (req, res, next) => {
  console.log("Request made to " + req.url);
  next();
})


app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const usersDatabase = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}



// when user submits url, we use function to generate random 6-character string
// store the longURL in database with the random string as a key
// redirect user a page displaying their info (equivalent to "/urls/:id")
app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = `http://${req.body.longURL}`;
  let templateVars = {
    urls: urlDatabase,
    user: usersDatabase
  };
  console.log(req.body, urlDatabase);
  res.render("urls_index", templateVars);
});

// when user clicks delete button, the key and value are deleted from the database
// render the index page with the updates values
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  let templateVars = {
    urls: urlDatabase,
    // users: req.cookies["username"]
    user: usersDatabase
  };
  console.log(req.body, urlDatabase);
  res.render("urls_index", templateVars);
});

// allow the user to set a new value for a key stored in the DB
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = `http://${req.body.longURL}`;
  let templateVars = {
    urls: urlDatabase,
    user: usersDatabase
  };
  console.log(req.body, urlDatabase);
  res.render("urls_index", templateVars);
});

// when user submits login button, we create a cookie
// with key 'username' and value of their submission
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  console.log(req.body.username);
  res.redirect(301, "/urls");
})

// when logout button is clicked, user's cookie is deleted
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  // console.log("Cookie is all gone!");
  res.redirect(301, "/urls");
});

app.post("/register", (req, res) => {
  let randomID = generateRandomString();
  if (!(req.body.email && req.body.password)) {
    res.send(400, "<h1>You had one job.</h1><br /> Please go back and make sure you provide both a username and password.");
  }
  for (let key in usersDatabase) {
    console.log(usersDatabase[key].email);
    if (usersDatabase[key]["email"] === req.body.email) {
      res.send(400, "That e-mail has already been registered. Please try again.");
    }
  }
  usersDatabase[randomID] = {id: randomID};
  usersDatabase[randomID]["email"] = req.body.email;
  usersDatabase[randomID]["password"] = req.body.password;
  res.cookie("user_id", randomID);
  console.log("User info: " + JSON.stringify(usersDatabase[randomID]));
  console.log("All users: " + JSON.stringify(usersDatabase));
  res.redirect(301, "/");
});


// get root directory
app.get("/", (req, res) => {
  // console.log("Cookies: ", req.cookies);
  res.end(`Please log in to begin!`);
});

// get info in json
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// allow user to submit new URL to be shortened
app.get("/urls/new", (req, res) => {
  let thisUser = null;
  if (usersDatabase.hasOwnProperty(req.cookies["user_id"])) {
    for (let key in usersDatabase) {
      if (usersDatabase[key] === req.cookies["user_id"]) {
        thisUser = usersDatabase[key];
      }
    }
  }
  let templateVars = {
    urls: urlDatabase
  };
  if (thisUser) {
    templateVars["user"] = usersDatabase[thisUser];
  } else {
    templateVars["user"] = null;
  }
  res.render("urls_new", templateVars);
});

// show all urls
app.get("/urls", (req, res) => {
  let thisUser = null;
  if (usersDatabase.hasOwnProperty(req.cookies["user_id"])) {
    for (key in usersDatabase) {
      if (key === req.cookies["user_id"]) {
        thisUser = key;
      }
    }
  }
  let templateVars = {
    urls: urlDatabase
  };
  if (thisUser) {
    templateVars["user"] = usersDatabase[thisUser];
  } else {
    templateVars["user"] = null;
  }
  res.render("urls_index", templateVars);
});

// get page according to short ID
app.get("/urls/:id", (req, res) => {
  let thisUser = null;
  if (usersDatabase.hasOwnProperty(req.cookies["user_id"])) {
    for (key in usersDatabase) {
      if (key === req.cookies["user_id"]) {
        thisUser = key;
      }
    }
  }
  let templateVars = {
    urls: urlDatabase,
    shortURL: req.params.id
  };
  if (thisUser) {
    templateVars["user"] = usersDatabase[thisUser];
  } else {
    templateVars["user"] = null;
  }
  res.render("urls_show", templateVars);
});

// allow user to redirect to long URL when imputing short URL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
  // console.log(longURL, urlDatabase[req.params.shortURL])
})

app.get("/register", (req, res) => {
  res.render("urls_register");
});




// have server listen on the defined port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


