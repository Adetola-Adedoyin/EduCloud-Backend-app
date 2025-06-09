const express = require('express');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise'); // Using promise-based API
const AWS = require('aws-sdk'); // AWS SDK for S3

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = process.env.APP_PORT || 3000; // Use port from .env or default to 3000

// Configure AWS SDK (it will automatically pick up IAM role credentials on EC2)
const s3 = new AWS.S3();

// Middleware
app.use(express.json());

// Basic API endpoint for status
app.get('/api/status', async (req, res) => {
    let dbStatus = 'Disconnected';
    let s3Status = 'Unavailable';
    let s3BucketName = process.env.S3_BUCKET_NAME || 'Not Configured';

    // Check Database connection
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });
        await connection.query('SELECT 1'); // Simple query to check connection
        dbStatus = 'Connected';
        await connection.end();
    } catch (error) {
        console.error('Database connection failed:', error.message);
        dbStatus = `Failed: ${error.message}`;
    }

    // Check S3 bucket access
    try {
        if (s3BucketName !== 'Not Configured') {
            await s3.headBucket({ Bucket: s3BucketName }).promise();
            s3Status = 'Accessible';
        }
    } catch (error) {
        console.error('S3 bucket access failed:', error.message);
        s3Status = `Failed: ${error.message}`;
    }

    res.json({
        status: 'Backend is running!',
        database_status: dbStatus,
        s3_bucket_status: s3Status,
        database_ip: process.env.DB_HOST,
        s3_bucket: s3BucketName
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Backend server listening at http://0.0.0.0:${port}`);
});