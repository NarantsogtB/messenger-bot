# Cloudflare Workers Messenger Bot - Step 1

This project implements the core webhook handling, routing, session management, and queue production for a Messenger Bot on Cloudflare Workers.

## Prerequisites

- Node.js
- `npm` or `yarn`
- Wrangler (`npm install -g wrangler`)

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

### Paid Mode (Step 4)
- **Assets**: Serve from R2 via `/assets/*`.
- **Manual Entitlement**:
  ```bash
  # Grant paid access to a user
  wrangler kv:key put --binding=BOT_KV "paid:<USER_ID>" "1"
  ```
- **Debug Mode**: Set `DEBUG_AUTO_PAID=true` in `.dev.vars` to treat all users as paid locally.

### Palettes & Selection
- **Source**: `src/palette/palettes.ts` contains the 16 seasonal type definitions.
- **Selection**: `src/palette/selectBalanced.ts` handles diverse color selection (Hue-based buckets) to ensure users see a balanced mix of neutrals, cores, and accents.
- **Free Mode**: Shows only human-readable Mongolian names (No HEX codes).

### Tests

Run unit tests locally:
```bash
npm test
```

Run tests in CI mode (single pass):
```bash
npm run test:ci
```

Tests use [Vitest](https://vitest.dev/) and mock external dependencies (Google Vision, Messenger API, KV).

2.  **Configuration**
    The `wrangler.toml` is configured with placeholder bindings. For local development with `wrangler dev`, these will simulate local storage.

    - `BOT_KV`: Stores session data.
    - `MESSENGER_QUEUE`: Queue for processing jobs (not consumed in this worker).

    **Secrets**:
    You need to set secrets for webhook verification.
    ```bash
    wrangler secret put MESSENGER_VERIFY_TOKEN
    wrangler secret put MESSENGER_APP_SECRET
    # Or for local dev, create a .dev.vars file:
    # MESSENGER_VERIFY_TOKEN="my-test-token"
    # MESSENGER_APP_SECRET="my-test-secret-123"
    ```

## Running Locally

Start the local development server:

```bash
wrangler dev
```

The worker will listen on `http://localhost:8787` (default).

## Testing

### 1. Webhook Verification (GET)

Verify that the webhook handshake works.

```bash
curl -X GET "http://localhost:8787/webhook?hub.mode=subscribe&hub.verify_token=my-test-token&hub.challenge=12345"
```
**Expected Output**: `12345` (HTTP 200)

### 2. Incoming Event (POST)

Simulate a Messenger event. Note: You need to generate a valid `X-Hub-Signature-256` if you enforce it locally.

**Mock Payload (text message):**
```json
{
  "object": "page",
  "entry": [
    {
      "messaging": [
        {
          "sender": { "id": "user-1" },
          "recipient": { "id": "page-1" },
          "timestamp": 1678900000,
          "message": {
             "mid": "mid-1",
             "text": "MENU_FREE"
          }
        }
      ]
    }
  ]
}
```

**Testing with Signature:**
For strictly local testing without generating signatures, you might need to temporarily bypass the signature check in `src/worker.ts` or use a tool to generate the HMAC SHA-256 signature of the payload using your `MESSENGER_APP_SECRET`.

**Check Logs:**
Look at the terminal where `wrangler dev` is running. You should see:
- `[GREETING] Sending greeting to user user-1` (First time only)
- `EVENT_RECEIVED` response.

## Queue & KV

- **KV**: Sessions are stored in `BOT_KV` under `session:{userId}`.
- **Queue**: Jobs are sent to `MESSENGER_QUEUE`. In local dev, Wrangler will log when a message is sent to the queue.

## Step 2: Queue Consumer Testing

To test the queue consumer logic without a live Facebook connection:

1. **Unit Test Harness**:
   Run the provided test script to check basic flow (Text Reply, Idempotency).
   ```bash
   npx ts-node test-consumer.ts
   ```

2. **Integration Test (Wrangler)**:
   You cannot easily trigger the queue consumer locally from the producer in `wrangler dev` without a bound queue.
   However, you can unit test the logic by importing `processQueue`.


## Deployment

### 1. Prerequisites (Cloudflare Resources)
Run the following commands to create necessary resources:

```bash
# KV Namespaces
wrangler kv:namespace create KV_MAIN
wrangler kv:namespace create KV_MAIN --preview

# R2 Buckets
wrangler r2 bucket create bot-assets
wrangler r2 bucket create bot-images

# Queues
wrangler queues create messenger-job-queue
wrangler queues create messenger-job-queue-dlq
```

### 2. Secrets Setup
Set the following secrets in Cloudflare (for both dev/staging/prod environments as needed):
```bash
wrangler secret put FB_PAGE_ACCESS_TOKEN
wrangler secret put FB_APP_SECRET
wrangler secret put MESSENGER_VERIFY_TOKEN
wrangler secret put GOOGLE_VISION_API_KEY
```

### 3. GitHub Actions Setup
1. Create Environments in GitHub Settings: `staging` and `production`.
2. Add Repository Secret: `CLOUDFLARE_API_TOKEN` (logic: Read/Write Workers, KV, R2, Queues).
3. Push to `develop` to deploy to Staging.
4. Push to `main` to deploy to Production.

### 4. Rollback
To rollback a deployment:
```bash
# List deployments
wrangler deployments list --env production

# Rollback to ID
wrangler rollback [deployment-id] --env production
```

