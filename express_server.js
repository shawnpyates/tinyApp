const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
// const cookieParser = require("cookie-parser");
const generateRandomString = require("./helperCode");
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['tyrannosaurus', 'triceratops', 'pterodactyl', 'velociraptor']
}))

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
    console.log("TEMPLATE VARS FROM INSIDE FUNCTION: ", templateVars);
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


// get root directory
app.get("/", (req, res) => {
  console.log("HI");
  let templateVars = getVars(req.session.user_id);
  console.log("TEMPLATE VARS FROM OUTSIDE FUNCTION: ", templateVars);
  if (! templateVars["user"]) {
    res.redirect("/login");
    return;
  } else {
  res.redirect("/urls");
  }
});

// when user submits url, we use function to generate random 6-character string
// store the longURL in database with the random string as a key
// redirect user a page displaying their info (equivalent to "/urls/:id")
app.post("/urls", (req, res) => {
  let templateVars = getVars(req.session.user_id);
  let randomString = generateRandomString();
  urlDatabase[randomString] = {long: `http://${req.body.longURL}`, userID: req.session.user_id};
  res.redirect(`/urls/${randomString}`);
});

// when user clicks delete button, the key and value are deleted from the database
// render the index page with the updates values
app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL]["userID"] !== req.session.user_id) {
    res.send(403, "<h1>GET OUT</h1>");
    return;
  } else {
    delete urlDatabase[req.params.shortURL];
    let templateVars = getVars(req.session.user_id);
    console.log(req.body, urlDatabase);
    res.render("urls_index", templateVars);
  }
});

// allow the user to set a new value for a key stored in the DB
app.post("/urls/:shortURL", (req, res) => {
  if (!req.session.user_id) {
    res.send(401, "You need to be logged in to view this page. Please log in <a href='/login'>here</a>.");
    return;
  }
  if (!(urlDatabase.hasOwnProperty(req.params.shortURL))) {
    res.send(404, "This short URL does not exist. See a list of your available pages <a href='/urls'>here.</a>");
    return;
  }
  if (urlDatabase[req.params.shortURL]["userID"] !== req.session.user_id) {
    res.send(403, "You are not authorized to edit this Short URL. See a list of your available pages <a href='/urls'>here.</a>");
    return;
  }
  urlDatabase[req.params.shortURL] = {long: `http://${req.body.longURL}`, userID: req.session.user_id};
  let templateVars = getVars(req.session.user_id);
  console.log(req.body, urlDatabase);
  res.redirect(`/urls/${req.params.shortURL}`);
});

// when user submits login button, we create a cookie
// with key 'username' and value of their submission
app.post("/login", (req, res) => {
  let userEmail = req.body.email;
  let userPass = req.body.password;
  for (key in usersDatabase) {
    console.log("USERS DATABASE: ", usersDatabase);
    if (userEmail === usersDatabase[key]["email"] && bcrypt.compareSync(userPass, usersDatabase[key]["password"])) {
      req.session.user_id = key;
      res.redirect("/");
      return;
    }
    if (userEmail === usersDatabase[key]["email"]) {
      res.send(401, "Invalid password.");
      return;
    }
  }
  res.send(401, "That e-mail address doesn't exist.");
});

// when logout button is clicked, user's cookie is deleted
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

app.post("/register", (req, res) => {
  let randomID = generateRandomString();
  if (!(req.body.email && req.body.password)) {
    res.send(400, "You must submit both a username and a password. Go <a href='/register'>back</a>.");
    return;
  }
  for (let key in usersDatabase) {
    console.log(usersDatabase[key].email);
    if (usersDatabase[key]["email"] === req.body.email) {
      res.send(400, "That e-mail has already been registered. Go <a href='/register'>back</a>.");
      return;
    }
  }
  usersDatabase[randomID] = {id: randomID};
  usersDatabase[randomID]["email"] = req.body.email;
  let hashedPass = bcrypt.hashSync(req.body.password, 10);
  usersDatabase[randomID]["password"] = hashedPass;
  req.session.user_id = randomID;
  res.redirect("/urls");
});





// get info in json
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});



// show all urls
app.get("/urls", (req, res) => {
  let templateVars = getVars(req.session.user_id);
  if (! templateVars["user"]) {
    res.send(401, "You need to be logged in to view this page. Please log in <a href='/login'>here</a>.");
    return;
  }
  let userURLS = {};
  console.log("TEMPLATE VARS INSIDE /urls", templateVars);
  res.render("urls_index", templateVars);
});

// allow user to submit new URL to be shortened
app.get("/urls/new", (req, res) => {
  let templateVars = getVars(req.session.user_id);
  console.log("TEMPLATE VARS INSIDE /URLS/NEW: ", templateVars);
  if (! templateVars["user"]) {
    res.send(401, "You need to be logged in to view this page. Please log in <a href='/login'>here</a>.");
    return;
  }
  res.render("urls_new", templateVars);
});

// get page according to short ID
app.get("/urls/:id", (req, res) => {
  let templateVars = getVars(req.session.user_id);
  if (! templateVars["user"]) {
    res.send(401, "You are not currently logged in. Please log in <a href='/login'>here</a>.");
    return;
  }
  if (!(urlDatabase.hasOwnProperty(req.params.id))) {
    res.send(404, "This page does not exist. See a list of your available pages <a href='/urls'>here.</a>");
    return;
  }
  if (urlDatabase[req.params.id]["userID"] !== req.session.user_id) {
    res.send(403, "You are not authorized to view this page. See a list of your own available pages <a href='/urls'>here.</a>");
    return;
  }
  templateVars["shortURL"] = req.params.id;
  res.render("urls_show", templateVars);
});

// allow user to redirect to long URL when imputing short URL
app.get("/u/:shortURL", (req, res) => {
  if (!(urlDatabase.hasOwnProperty(req.params.shortURL))) {
    res.send(404, "This Short URL does not exist. See a list of your available pages <a href='/urls'>here.</a>")
  }
  let longURL = urlDatabase[req.params.shortURL]["long"];
  res.redirect(longURL);
})

app.get("/register", (req, res) => {
  let templateVars = getVars(req.session.user_id)
  if (templateVars["user"]) {
    res.redirect("/");
    return;
  }
  res.render("urls_register");
});

app.get("/login", (req, res) => {
  let templateVars = getVars(req.session.user_id)
  if (templateVars["user"]) {
    res.redirect("/");
    return;
  }
  res.render("urls_login");
});



// have server listen on the defined port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

