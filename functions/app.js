const serverless = require('serverless-http');
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const limit = process.env.BODY_PARSER_LIMIT || '100mb';


const corsOptions = {
  origin: ['http://api.greenovate.in', 'https://marvelous-paletas-956aab.netlify.app'] ,
  origin: ['https://api.greenovate.in'] ,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

const app = express();
// Apply CORS middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: limit }));
app.use(bodyParser.urlencoded({ limit: limit, extended: true }));
const router = express.Router();


app.get('/',(req,res)=>{
  res.send("This is the server third deployed on the elastic beanstalk service provided by awazon web service");
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
 
  // Custom middleware to handle file uploads
  const handleFileUpload = (req, res, next) => {
    let body = '';
    let file = null;
    let fileName = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('multipart/form-data')) {
            // If it's not a multipart form, just pass it on
            next();
            return;
        }
        const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
        if (!boundaryMatch) {
            res.status(400).send('Invalid Content-Type header');
            return;
        }
        const boundary = boundaryMatch[1] || boundaryMatch[2];
        const parts = body.split(`--${boundary}`);
        
        const formData = {};
        parts.forEach(part => {
            if (part.includes('filename')) {
                const fileNameMatch = part.match(/filename="(.+)"/);
                if (fileNameMatch) {
                    fileName = fileNameMatch[1];
                    const fileContent = part.split('\r\n\r\n')[1].trim();
                    file = Buffer.from(fileContent, 'binary');
                }
            } else if (part.includes('name=')) {
                const nameMatch = part.match(/name="(.+)"/);
                if (nameMatch) {
                    const name = nameMatch[1];
                    const value = part.split('\r\n\r\n')[1].trim();
                    formData[name] = value;
                }
            }
        });
        req.body = formData;
        req.file = file ? { buffer: file, originalname: fileName } : null;
        next();
    });
};
  
  app.use(handleFileUpload);
  
  
  app.post('/submit-form-job-application', async (req, res) => {
      try {
          const formData = req.body;
          const cv = req.file;
  
          let mailOptions = {
              from: '"Greenovate Job Application" <Greenovate@gmail.com>',
              to: process.env.EMAIL_USER,
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
          res.status(500).json({ message: 'An error occurred while processing your application' });
      }
  });
  
app.use('/.netlify/functions/app', router);
module.exports.handler = serverless(app);
