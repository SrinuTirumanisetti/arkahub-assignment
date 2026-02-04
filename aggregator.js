const axios = require('axios');
const crypto = require('crypto');

const API_URL = 'http://localhost:3000/device/real/query';
const TOKEN = 'interview_token_123';
const BATCH_SIZE = 10;
const TOTAL_DEVICES = 500;

/**
 * Generates a list of 500 dummy Serial Numbers (SN-000 to SN-499).
 */
const generateSerialNumbers = () => {
    return Array.from({ length: TOTAL_DEVICES }, (_, i) => `SN-${i.toString().padStart(3, '0')}`);
};

/**
 * Generates the MD5 signature for the request.
 * Signature = MD5(URL + Token + Timestamp)
 */
const generateSignature = (url, token, timestamp) => {
    const data = `${url}${token}${timestamp}`;
    return crypto.createHash('md5').update(data).digest('hex');
};

/**
 * Delays execution for the given number of milliseconds.
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches data for a single batch of serial numbers.
 */
const fetchBatch = async (batch) => {
    const timestamp = Date.now();
    const path = '/device/real/query'; // server uses req.originalUrl
    const signature = generateSignature(path, TOKEN, timestamp);

    try {
        const response = await axios.post(API_URL, {
            sn_list: batch
        }, {
            headers: {
                'Content-Type': 'application/json',
                'timestamp': timestamp.toString(),
                'signature': signature
            }
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 429) {
            console.warn('Rate limit exceeded (429). Waiting 2 seconds before retry...');
            await delay(2000);
            return fetchBatch(batch);
        }
        if (error.response && error.response.status === 401) {
            console.error(`Invalid Signature or Unauthorized: ${JSON.stringify(error.response.data)}`);
            throw new Error('Authentication failed');
        }
        console.error(`Error fetching batch: ${error.message}`);
        throw error;
    }
};

const main = async () => {
    const serialNumbers = generateSerialNumbers();
    console.log(`Generated ${serialNumbers.length} serial numbers.`);

    const allData = [];
    const batches = [];

    for (let i = 0; i < serialNumbers.length; i += BATCH_SIZE) {
        batches.push(serialNumbers.slice(i, i + BATCH_SIZE));
    }

    console.log(`Processing ${batches.length} batches...`);

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`[${i + 1}/${batches.length}] Fetching batch of ${batch.length} devices...`);

        const startTime = Date.now();
        const result = await fetchBatch(batch);
        allData.push(...result.data);

        // Ensure we respect the 1 request per second limit
        const elapsedTime = Date.now() - startTime;
        const waitTime = Math.max(0, 1000 - elapsedTime);

        if (i < batches.length - 1 && waitTime > 0) {
            await delay(waitTime);
        }
    }

    console.log(`\nSuccessfully fetched data for ${allData.length} devices.`);

    // Aggregation report
    const report = {
        totalDevices: allData.length,
        timestamp: new Date().toISOString(),
        devices: allData
    };

    console.log('Final Report Summary:');
    console.log(JSON.stringify({
        total: report.totalDevices,
        firstDevice: report.devices[0],
        lastDevice: report.devices[report.devices.length - 1]
    }, null, 2));
};

if (require.main === module) {
    main().catch(console.error);
}
