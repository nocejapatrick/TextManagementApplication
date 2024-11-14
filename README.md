## Requirements
node v22.9.0<br>
npm 10.8.3

## Setup Server
1. Change directory from root to server folder
2. Then npm install
3. Run script: npm run dev
4. Server runs localhost:3000

## Server API
There is a temporary API token for temporary security, kindly add it on the header authorization first for requesting on the api. Check env.

| url            |method    |parameters      | 
|---------------:|----------|----------------|
| api/v1/text-sms|POST      |number&message  |