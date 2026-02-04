# EnergyGrid Data Aggregator

A robust Node.js client to fetch real-time telemetry from 500 solar inverters while navigating strict rate limits and security protocols.

## Features
- **Rate Limiting**: Strictly respects the 1 request per second limit.
- **Batching**: Optimizes throughput by grouping up to 10 devices per request.
- **Security**: Implements MD5 signature generation (`MD5(URL_Path + Token + Timestamp)`).
- **Error Handling**: Gracefully handles `429 Too Many Requests` with automatic retries.

## Setup & Run

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start the Mock API Server**:
    (If not already running)
    ```bash
    npm start
    ```

3.  **Run the Aggregator**:
    ```bash
    node aggregator.js
    ```

## Implementation Details

### Rate Limiting
The aggregator uses a `delay` mechanism to ensure at least 1000ms passes between consecutive requests. It also calculates the elapsed time of each request to subtract from the wait time, ensuring maximum efficiency without violating the limit.

### Security
The `signature` header is generated using the built-in `crypto` module. It follows the format `MD5(path + token + timestamp)`, where `path` is the endpoint's absolute path (`/device/real/query`).

### Error Handling
If a `429` error is encountered, the client waits for 2 seconds and retries the batch. Other errors are logged and handled to ensure the process continues or halts gracefully depending on the severity.
