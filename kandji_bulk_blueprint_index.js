var axios = require("axios");
var request = require("request");
var prompt = require("prompt-sync")();
var keys = require("./keys/keys");

/* VARIABLES */

// API call URL
var BASE_URL = "https://voxmedia.clients.us-1.kandji.io/api/v1";

// Blueprint to be selected
var blueprint = "";

/* MAIN PROCESS */

// Select the bulk action to run
var actionname = "";
var loop = true;
while (loop) {
  console.log("Select the bulk action would you like to run:");
  console.log("(1) Blank Push\n(2) Device Lock\n(q) Quit");
  action = prompt(": ");
  switch (action) {
    case "1":
      console.log("BLANK PUSH selected");
      actionname = "BLANK PUSH";
      loop = false;
      break;
    case "2":
      console.log("DEVICE LOCK selected");
      actionname = "DEVICE LOCK";
      loop = false;
      break;
    case "q":
      console.log("Quitting");
      process.exit(0);
    default:
      console.log(
        "Please select a valid action by typing the associated number"
      );
      break;
  }
}
// API call to get Blueprints and prompt to select one
axios({
  method: "get",
  url: BASE_URL + "/blueprints",
  headers: {
    Authorization: "Bearer " + keys.TOKEN,
  },
})
  .then(async function (res) {
    // console.log(res.data.results);
    res.data.results.forEach((result) =>
      console.log(`${result.name} \n\t ${result.id}`)
    );
    blueprint = prompt(
      "Enter the ID of the Blueprint you would like to run the bulk action on (copy+paste): "
    );
    if (blueprint.length != 36) {
      console.log("Invalid Blueprint ID. Try again.");
      process.exit(1);
    }
    console.log(`Selected ID: ${blueprint}`);
    console.log("Getting Blueprint devices...");

    // API call to get devices in Blueprint
    await axios({
      method: "get",
      url: BASE_URL + "/devices",
      headers: {
        Authorization: "Bearer " + keys.TOKEN,
      },
      params: {
        blueprint_id: blueprint,
      },
    })
      .then(async function (res) {
        res.data.forEach((result) => console.log(`${result.device_name}`));
        confirm = prompt(
          "Are you sure you want to run the " +
            actionname +
            " bulk action? (y/n): "
        );
        if (confirm == "y") {
          switch (action) {
            // MAIN DEVICE ACTION HERE - add cases as device actions are added
            case "1":
              res.data.forEach(async (result) => {
                console.log(
                  `BLANK PUSHING ${result.device_name} : ${result.serial_number}`
                );

                await axios({
                  method: "post",
                  url:
                    BASE_URL +
                    "/devices/" +
                    result.device_id +
                    "/action/blankpush",
                  headers: {
                    Authorization: "Bearer " + keys.TOKEN,
                  },
                })
                  .then(function (res) {
                    console.log(res.data);
                  })
                  .catch(function (err) {
                    console.log(err);
                  });
              });
              break;
            case "2":
              res.data.forEach(async (result) => {
                console.log(
                  `LOCKING ${result.device_name} : ${result.serial_number}`
                );

                await request(
                  {
                    method: "POST",
                    url:
                      BASE_URL +
                      "/devices/" +
                      result.device_id +
                      "/action/lock",
                    headers: {
                      Authorization: "Bearer " + keys.TOKEN,
                    },
                  },
                  function (err, res) {
                    if (err) {
                      throw new Error(err);
                    }
                    console.log(res.body);
                  }
                );
              });
              break;
            default:
              console.log("Unrecognized action selected. Try again.");
            // END MAIN DEVICE ACTION
          }
        } else if (confirm == "n") {
          console.log("Canceled. Goodbye.");
        } else {
          console.log("Unrecognized response. Try again.");
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  })
  .catch(function (err) {
    console.log(err);
  });
