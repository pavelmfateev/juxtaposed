const express = require("express"),
  router = express.Router(),
  spotifyApiImport = require("../utils/spotifyApi");

let spotifyApi = spotifyApiImport.spotifyApi;
let scopes = spotifyApiImport.scopes;

// **********************************
// SPOTIFY ROUTES
// **********************************

//Provider/service provider
//object/factory provides service

//SINGLETON?!

router.get("/login", (req, res) => {
  console.log(scopes);
  console.log(spotifyApi);
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

router.get("/spotify", (req, res) => {
  const error = req.query.error;
  const code = req.query.code;
  const state = req.query.state;

  if (error) {
    console.error("Callback Error:", error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  spotifyApi
    .authorizationCodeGrant(code)
    .then((data) => {
      const access_token = data.body["access_token"];
      const refresh_token = data.body["refresh_token"];
      const expires_in = data.body["expires_in"];

      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      console.log("access_token:", access_token);
      console.log("refresh_token:", refresh_token);

      console.log(
        `Sucessfully retreived access token. Expires in ${expires_in} s.`
      );
      // res.send("Success! You can now close the window.");
      res.redirect("reviews/new");

      setInterval(async () => {
        const data = await spotifyApi.refreshAccessToken();
        const access_token = data.body["access_token"];

        console.log("The access token has been refreshed!");
        console.log("access_token:", access_token);
        spotifyApi.setAccessToken(access_token);
      }, (expires_in / 2) * 1000);
    })
    .catch((error) => {
      console.error("Error getting Tokens:", error);
      res.send(`Error getting Tokens: ${error}`);
    });
});

// **********************************
// SEARCH
// **********************************
router.post("/spotify/search", (req, res) => {
  const { searchString, searchBy } = req.body;
  let searchResults = [];
  spotifyApi
    .searchAlbums(searchString)
    .then(
      (data) => {
        for (const element of data.body.albums.items) {
          // console.log(element);
        }
        searchResults = data.body.albums.items;
      },
      (err) => {
        console.error(err);
      }
    )
    .then(() => {
      // console.log(searchResults);
      res.render("reviews/searchResults", { searchResults });
    });
});

module.exports = router;
