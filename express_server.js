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


function getVars(cookieID) {
  let thisUser = null;
  if (usersDatabase.hasOwnProperty(cookieID)) {
    for (key in usersDatabase) {
      if (key === cookieID) {
        thisUser = key;
      }
    }
  }
  let templateVars = {};
  if (thisUser) {
    let userURLS = {};
    for (key in urlDatabase) {
      if (urlDatabase[key]["userID"] === usersDatabase[thisUser]["id"]) {
        userURLS[key] = {long: urlDatabase[key]["long"], userID: thisUser};
      }
    }
    templateVars["user"] = usersDatabase[thisUser];
    templateVars["urls"] = userURLS;
  } else {
    templateVars["user"] = null;
    templateVars["urls"] = null;
  }
  return templateVars;
}



app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {long: "http://www.lighthouselabs.ca", userID: "userRandomID"},
  "9sm5xK": {long: "http://www.google.com", userID: "user2RandomID"}
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
  urlDatabase[randomString] = {long: `http://${req.body.longURL}`, userID: req.cookies["user_id"]};
  let templateVars = getVars(req.cookies["user_id"]);
  console.log(req.body, urlDatabase);
  res.render("urls_index", templateVars);
});

// when user clicks delete button, the key and value are deleted from the database
// render the index page with the updates values
app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL]["userID"] !== req.cookies["user_id"]) {
    res.send(403, "<h1>GET OUT</h1>");
  } else {
    delete urlDatabase[req.params.shortURL];
    let templateVars = getVars(req.cookies["user_id"]);
    console.log(req.body, urlDatabase);
    res.render("urls_index", templateVars);
  }
});

// allow the user to set a new value for a key stored in the DB
app.post("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]["userID"] !== req.cookies["user_id"]) {
    res.send(403, "<h1>GET OUT</h1>");
  } else {
    urlDatabase[req.params.shortURL] = {long: `http://${req.body.longURL}`, userID: req.cookies["user_id"]};
    let templateVars = getVars(req.cookies["user_id"]);
    console.log(req.body, urlDatabase);
    res.render("urls_index", templateVars);
  }
});

// when user submits login button, we create a cookie
// with key 'username' and value of their submission
app.post("/login", (req, res) => {
  let userEmail = req.body.email;
  let userPass = req.body.password;
  for (key in usersDatabase) {
    if (userEmail === usersDatabase[key]["email"] && userPass === usersDatabase[key]["password"]) {
      res.cookie("user_id", key);
      res.redirect(301, "/urls");
    }
    if (userEmail === usersDatabase[key]["email"]) {
      res.send(403, "<h1>Stop trying to break into other people's accounts.</h1>");
    }
  }
  res.send(403, "<h1>That e-mail doesn't exist.</h1>");
});

// when logout button is clicked, user's cookie is deleted
app.post("/logout", (req, res) => {
  res.clearCookie("user-id");
  // console.log("Cookie is all gone!");
  res.redirect(301, "/");
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
  res.redirect(301, "/urls");
});


// get root directory
app.get("/", (req, res) => {
  res.redirect(301, "/login");
});

// get info in json
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});



// show all urls
app.get("/urls", (req, res) => {
  let templateVars = getVars(req.cookies["user_id"]);
  if (! templateVars["user"]) {
    res.redirect(301, "/login")
  }
  let userURLS = {};
  // for (key in urlDatabase) {
  //   if urlDatabase[key]["userID"] === req.cookies["user"]

  // }
  res.render("urls_index", templateVars);
});

// allow user to submit new URL to be shortened
app.get("/urls/new", (req, res) => {
  let templateVars = getVars(req.cookies["user_id"]);
  res.render("urls_new", templateVars);
});

// get page according to short ID
app.get("/urls/:id", (req, res) => {
  let templateVars = getVars(req.cookies["user_id"]);
  if (! templateVars["user"]) {
    res.redirect(301, "/login")
  }
  templateVars["shortURL"] = req.params.id;
  res.render("urls_show", templateVars);
});

// allow user to redirect to long URL when imputing short URL
app.get("/u/:shortURL", (req, res) => {
  console.log("URL DATABASE: ", urlDatabase);
  let longURL = urlDatabase[req.params.shortURL]["long"];
  res.redirect(longURL);
})

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.get("/login", (req, res) => {
  res.render("urls_login");
})




// have server listen on the defined port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function stringToObject(user){
  for (let key in urlDatabase) {
    let objToInsert = {};
    objToInsert["long"] = urlDatabase[key];
    objToInsert["userID"] = user;
    urlDatabase[key] = objToInsert;
  }
}
