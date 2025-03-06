const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins
app.use(cors());
app.use(express.static("public")); // Serve frontend files

// Folder paths
const datasetsFolder = path.join(__dirname, "datasets");
const modelsFolder = "/tmp/models"; // Use `/tmp` for Render compatibility
const publicFolder = path.join(__dirname, "public");

// Ensure `/tmp/models` exists
if (!fs.existsSync(modelsFolder)) fs.mkdirSync(modelsFolder, { recursive: true });

// Track which dataset to send next
let datasetIndex = 0;

// 📌 Serve Frontend Page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 📌 Send dataset CSV file sequentially
app.get("/get-dataset", (req, res) => {
    fs.readdir(datasetsFolder, (err, files) => {
        if (err || files.length === 0) {
            return res.status(500).json({ error: "No datasets available." });
        }

        const datasetFile = files[datasetIndex % files.length];
        datasetIndex++;

        const datasetPath = path.join(datasetsFolder, datasetFile);
        res.download(datasetPath, datasetFile, (err) => {
            if (err) {
                console.error("Dataset Download Error:", err);
                res.status(500).json({ error: "Failed to send dataset." });
            }
        });
    });
});

// Configure Multer for model uploads (Store in `/tmp/models`)
const storage = multer.diskStorage({
    destination: modelsFolder,
    filename: (req, file, cb) => {
        cb(null, `worker_${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// 📌 Upload trained model (H5 file)
app.post("/upload-model", upload.single("model"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    console.log(`✅ Model uploaded: ${req.file.filename}`);
    res.json({ message: "Model uploaded successfully.", filename: req.file.filename });
});
app.get("/list-models", (req, res) => {
    fs.readdir("/tmp/models", (err, files) => {
        if (err) return res.status(500).json({ error: "Cannot read models folder" });
        res.json({ models: files });
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
