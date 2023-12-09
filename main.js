const fs = require("fs");
const axios = require("axios");
const express = require("express");
const path = require("path");

function setup(images) {
    const app = express();
    const port = 8000;

    app.set("views", __dirname);
    app.set("view engine", "ejs");

    app.get("/", (req, res) => {
        res.render("index", { images });
    });

    app.listen(port, () => {
        console.log(`Running on localhost:${port}`)
    });
}

// This is what happens when asynchronous js terrifies you...
// I would like to appoligise to whoever tries to understand this
function readFile() {
    let lines = fs.readFileSync("text.txt", { flag: "r" }).toString().split("\r\n");
    lines = lines.map(line => line === "" || !line.includes("reddit.com") ? line : line.charAt(line.length - 1) !== "/" ? line + "/.json" : line + ".json");

    let count = 0;
    lines.forEach(line => {
        if (line.includes("reddit.com")) {
            count += 1;
        }
    })

    let images = [];

    lines.every((line, i) => {
        // console.log(line);
        if (line.includes("reddit.com")) {
            axios.get(line)
                .then(response => {
                    const jsonData = response.data;
                    let data = jsonData[0].data.children[0].data;
                    images.push({ url: data.url, title: data.title });

                    if (images.length == count)
                        setup(images);
                })
                .catch(error => {
                    console.error('Error making the request:', error.message);
                });
        } else {
            if (line.length > 0) console.log(line);
        }
        return true;
    });
}

readFile();