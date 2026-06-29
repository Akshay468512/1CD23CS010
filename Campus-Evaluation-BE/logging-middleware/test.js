require("dotenv").config();

const Log = require("./logger");

async function test() {
    try {
        const response = await Log(
            "backend",
            "info",
            "middleware",
            "Logging middleware initialized successfully"
        );

        console.log(response);
    } catch (err) {
        if (err.response) {
            console.log(err.response.status);
            console.log(err.response.data);
        } else {
            console.log(err.message);
        }
    }
}

test();