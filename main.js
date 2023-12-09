const fs = require("fs");
const axios = require("axios");
const express = require("express");
const path = require("path");

const FILE_NAME = "text.txt";

function setup(images) {
    const app = express();
    const port = 8000;

    app.set("views", __dirname);
    app.set("view engine", "ejs");

    app.get("/", (req, res) => {
        res.render("index", { images, FILE_NAME });
    });

    app.listen(port, () => {
        console.log(`Running on localhost:${port}`)
    });
}

function readFile() {
    let lines = fs.readFileSync(FILE_NAME, { flag: "r" }).toString().split("\r\n");
    lines = lines.map(line => line === "" || !line.includes("reddit.com") ? line : line.charAt(line.length - 1) !== "/" ? line + "/.json" : line + ".json");

    let images = [];
    let count = 0;

    lines.forEach(line => {
        if (line.includes("reddit.com")) {
            count += 1;
            axios.get(line)
                .then(response => {
                    const jsonData = response.data;
                    let data = jsonData[0].data.children[0].data;
                    
                    if (data.url === "" || data.removed_by_category !== null) {
                        console.log("Post likely deleted:", line);
                    } else if (data.url.includes("reddit.com/gallery")) {
                        for (let j = 0; j < data.gallery_data.items.length; j++) {
                            images.push({
                                url: `https://i.redd.it/${data.gallery_data.items[j].media_id}.jpg`,
                                title: data.title,
                                type: 1,
                                reddit_url: data.url
                            });
                        }
                    } else {
                        if (data.url.includes("redgifs.com")) {
                            images.push({
                                url: data.url.replace("watch", "ifr"),
                                title: data.title,
                                type: 0,
                                reddit_url: data.permalink,
                                redgifs: 1
                            });
                        } else {
                            images.push({
                                url: data.url.includes("v.redd.it") ? data.media.reddit_video.fallback_url : data.url,
                                title: data.title,
                                type: data.url.includes("v.redd.it") ? 0 : 1,
                                reddit_url: data.url
                            });
                        }
                    }

                    count -= 1;
                    if (count === 0) {
                        setup(images);
                    }
                })
                .catch(error => {
                    console.error(`Error making the request (${line}):`, error.message);
                });
        } else {
            if (line.length > 0) console.log("Not a reddit post:", line);
        }
    });
}

readFile();