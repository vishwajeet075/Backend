const serverless = require('serverless-http');
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const serverlessMysql = require('serverless-mysql');


const app = express();
const router = express.Router();

const corsOptions = {
  origin: ['https://api.greenovate.in'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};


app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));




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


const mysql = serverlessMysql({
  config: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: true,
    }
  }
});

async function createTable() {
  try {
    await mysql.query(`
      CREATE TABLE IF NOT EXISTS contact_mini (
        email VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        message TEXT NOT NULL
      )
    `);
    console.log('Table created or already exists');
  } catch (error) {
    console.error('Error creating table:', error);
  }
}

app.post('/submit-form-1', async (req, res) => {
  const { name, email, message } = req.body;
  try {
    await createTable(); // Ensure table exists
    
    await mysql.query(
      'INSERT INTO contact_mini (email, name, message) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, message = ?',
      [email, name, message, name, message]
    );

    await mysql.end();

    res.json({ success: true, message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});


app.use('/.netlify/functions/app', router);

module.exports = app;
module.exports.handler = serverless(app);
