console.log('Server starting...');
const serverless = require('serverless-http');
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');

const serverlessMysql = require('serverless-mysql');
const router = express.Router();

const corsOptions = {
  origin: ['https://greenovate.in'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};


const app = express();
app.use(cors(corsOptions));




app.use(express.json());


app.use(express.urlencoded({ extended: true }));

const upload = multer({
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});


let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
 
  
  app.post('/submit-form', async (req, res) => {
    try {
      const formData = req.body;
    
      let mailOptions = {
        from: '"Greenovate Carbon Calculator" <greenovate40@gmail.com>',
        to: process.env.RECIPENT,
        subject: "New Carbon Calculator Registration",
        html: `
          <h1>New Registration for Carbon Calculator</h1>
          <p><strong>Name:</strong> ${formData.name}</p>
          <p><strong>Contact:</strong> ${formData.contact}</p>
          <p><strong>Email:</strong> ${formData.email}</p>
          <p><strong>Industry:</strong> ${formData.industry}</p>
          <p><strong>Position:</strong> ${formData.position}</p>
          <p><strong>Comment:</strong> ${formData.comment || 'No comment provided'}</p>
        `
      };
  
      await transporter.sendMail(mailOptions);
  
      res.status(200).json({ message: 'Form submitted successfully and email sent' });
    } catch (error) {
      console.error('Error processing form submission or sending email:', error);
      res.status(500).json({ message: 'An error occurred while processing your submission' });
    }
  });


app.post('/submit-form-job-application', upload.single('cv'), async (req, res) => {
   console.log('Received job application submission');
  try {
    const formData = req.body;
    const cv = req.file;

    let mailOptions = {
      from: '"Greenovate Job Application" <Greenovate@gmail.com>',
      to: process.env.RECIPENT,
      subject: "New Job Application",
      html: `
        <h1>New Job Application</h1>
        <p><strong>Name:</strong> ${formData.name}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Role Applying for:</strong> ${formData.role}</p>
        <p><strong>Qualification:</strong> ${formData.qualification}</p>
        <p><strong>Location:</strong> ${formData.location}</p>
        <p><strong>Cover Letter:</strong> ${formData.coverLetter}</p>
      `,
      attachments: []
    };

    if (cv) {
      mailOptions.attachments.push({
        filename: cv.originalname,
        content: cv.buffer
      });
    }
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Application submitted successfully and email sent' });
  } catch (error) {
    console.error('Error processing application or sending email:', error);
    res.status(500).json({ message: 'An error occurred while processing your application', error: error.message });
  }
});



app.use('/.netlify/functions/app', router);

module.exports = app;
module.exports.handler = serverless(app);
