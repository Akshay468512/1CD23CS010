const axios = require("axios");
require("dotenv").config();

async function Log(stack, level, packageName, message) {
    try {
        const response = await axios.post(
            process.env.LOG_API_URL,
            {
                stack,
                level,
                package: packageName,
                message
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.LOG_API_TOKEN}`,
                    "Content-Type": "application/json"
                },
                timeout: 5000 // Set a 5-second timeout
            }
        );
        return response.data;
    } catch (error) {
        // Log locally if the remote service fails to prevent app crash
        console.error("Failed to send log to remote server:", error.message);
        return null; 
    }
}

module.exports = Log;