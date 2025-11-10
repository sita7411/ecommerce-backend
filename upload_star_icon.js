const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

// Exact path to your image
const filePath = "D:/e-commerce-website/frontend/public/images/star_icon.png";

// Check if file exists
if (!fs.existsSync(filePath)) {
    console.error("Error: File does not exist at", filePath);
    process.exit(1);
}

// Create FormData
const form = new FormData();
form.append("product", fs.createReadStream(filePath));

// Send POST request
axios.post("http://localhost:4000/upload", form, {
    headers: form.getHeaders()
})
.then(res => {
    console.log("Upload successful!");
    console.log(res.data);
})
.catch(err => {
    if (err.response) {
        console.error("Server Error:", err.response.data);
    } else {
        console.error("Error:", err.message);
    }
});
