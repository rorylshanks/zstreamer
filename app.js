const express = require('express');
const AWS = require('aws-sdk');
const zlib = require('node:zlib');
const {ZSTDCompress} = require('simple-zstd');

function log(message) {
    console.log(`[${new Date().toISOString()}] - ${message}`);
}

// Set up AWS S3 configuration
const s3 = new AWS.S3();

const app = express();
const PORT = process.env.PORT || 3000;

const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME;
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;

const ZSTD_COMPRESSION_LEVEL = parseInt(process.env.ZSTD_COMPRESSION_LEVEL || 3)
log(`Will use ZSTD Compression level ${ZSTD_COMPRESSION_LEVEL}`)


// Middleware for basic authentication
app.use((req, res, next) => {
    if (!BASIC_AUTH_USERNAME || !BASIC_AUTH_PASSWORD) {
        next();
        return;
    }
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        log("Request denied due to missing or malformed credentials.")
        return res.status(401).send('Unauthorized');
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [user, pass] = credentials.split(':');

    if (user !== BASIC_AUTH_USERNAME || pass !== BASIC_AUTH_PASSWORD) {
        log("Request denied due to invalid credentials.")
        return res.status(401).send('Unauthorized');
    }

    next();
});

app.get('/download', (req, res) => {
    try {
        const { bucket, key } = req.query;

        let s3BytesRead = 0;
        let clientBytesWritten = 0;

        log(`Request to download key ${key} from bucket ${bucket}`)
        if (key.endsWith('.gz')) {
            log("File probably a gzip file due to file extention. WIll recompress with zstd")
            // Set the response headers
            res.setHeader('Content-Type', 'application/zstd');
            res.setHeader('Content-Disposition', `attachment; filename="${key.replace('.gz', '.zst')}"`);
    
            // Create the S3 stream, gunzip stream, and zstd transform stream
            const s3Stream = s3.getObject({ Bucket: bucket, Key: key }).createReadStream();

            const gunzip = zlib.createGunzip();
    
            // Chain the streams together and pipe to response
            s3Stream
            .on('data', chunk => {
                s3BytesRead += chunk.length;
            })
            .on('error', (error) => {
                log(`Error while streaming from S3: ${error.message}`);
                res.status(500).send('File not found or error during streaming');
            })
            .pipe(gunzip)
            .pipe(ZSTDCompress(ZSTD_COMPRESSION_LEVEL))
            .on('data', chunk => {
                clientBytesWritten += chunk.length;
            })
            .pipe(res)
            .on('finish', () => log(`key ${key} from bucket ${bucket} sent to client. Bytes read ${s3BytesRead} Bytes sent ${clientBytesWritten} Bytes Saved ${s3BytesRead - clientBytesWritten} Ratio ${clientBytesWritten / s3BytesRead}`));
        } else {
            log("File not a gzip file, not decompressing before...")
            // Stream the file directly if not gzipped
            const s3Stream = s3.getObject({ Bucket: bucket, Key: key }).createReadStream();
            s3Stream
            .on('data', chunk => {
                s3BytesRead += chunk.length;
            })
            .on('error', (error) => {
                log(`Error while streaming from S3: ${error.message}`);
                res.status(500).send('File not found or error during streaming');
            })
            .pipe(ZSTDCompress(ZSTD_COMPRESSION_LEVEL))
            .on('data', chunk => {
                clientBytesWritten += chunk.length;
            })
            .pipe(res)
            .on('finish', () => log(`key ${key} from bucket ${bucket} sent to client. Bytes read ${s3BytesRead} Bytes sent ${clientBytesWritten} Bytes Saved ${s3BytesRead - clientBytesWritten} Ratio ${clientBytesWritten / s3BytesRead}`));
        }
        
    } catch (error) {
        log(`Unexpected error while downloading file`)
        console.error(error)
        res.status(500).send()
    }

});

app.listen(PORT, () => {
    log(`Server is running on port ${PORT}`);
});
