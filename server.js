const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require("cors");
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2; 


dotenv.config();
const app = express();
const PORT = 5000;

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.cloud_name,  
    api_key: process.env.api_key,       
    api_secret: process.env.api_secret,
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.mongo_url)
    .then(() => {
      console.log("MongoDB connected successfully");
    })
    .catch((err) => {
      console.log("Error connecting to MongoDB:", err);
    });
  

const emailSchema = new mongoose.Schema({
    title: String,
    content: String,
    footer: String,
    imageUrl: String,
});
const EmailTemplate = mongoose.model('EmailTemplate', emailSchema);




// Routes
app.get('/getEmailLayout', (req, res) => {
    const layout = fs.readFileSync(path.join(__dirname, 'layout.html'), 'utf8');
    res.send({ layout });
});



const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/uploadImage', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ error: 'No image file uploaded' });
  }

  cloudinary.uploader.upload_stream(
    {
      resource_type: 'auto', // Let Cloudinary auto-detect the file type
    },
    (error, result) => {
      if (error) {
        return res.status(500).send({ error: 'Image upload failed', details: error });
      }
      res.send({ imageUrl: result.secure_url });
    }
  ).end(req.file.buffer); 
});
app.post('/uploadEmailConfig', async (req, res) => {
    const emailConfig = req.body;
    await EmailTemplate.create(emailConfig);
    res.send({ success: true });
});

// Fetch all email templates
app.get('/getAllEmailTemplates', async (req, res) => {
    const templates = await EmailTemplate.find();
    res.send({ templates });
});

// Fetch a single email template by ID
app.get('/getEmailTemplate/:id', async (req, res) => {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) {
        return res.status(404).send({ error: 'Template not found' });
    }
    res.send({ template });
});

// Update an email template by ID
app.put('/updateEmailTemplate/:id', async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    const updatedTemplate = await EmailTemplate.findByIdAndUpdate(id, updatedData, { new: true });
    if (!updatedTemplate) {
        return res.status(404).send({ error: 'Template not found' });
    }
    res.send({ updatedTemplate });
});

// Delete an email template by ID
app.delete('/deleteEmailTemplate/:id', async (req, res) => {
    const { id } = req.params;
    const deletedTemplate = await EmailTemplate.findByIdAndDelete(id);
    if (!deletedTemplate) {
        return res.status(404).send({ error: 'Template not found' });
    }
    res.send({ success: true });
});

app.post('/renderAndDownloadTemplate', (req, res) => {
    const { title, content, footer, imageUrl } = req.body;
    let html = fs.readFileSync(path.join(__dirname, 'layout.html'), 'utf8');
    html = html
        .replace('{{title}}', title)
        .replace('{{content}}', content)
        .replace('{{footer}}', footer)
        .replace('{{imageUrl}}', imageUrl); 

    res.attachment('email-template.html').send(html);
});

app.use(express.static(path.join(__dirname, './frontend/build')));


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './frontend/build', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
