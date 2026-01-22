const fetch = require('node-fetch');

async function testPriceAPI() {
    try {
        console.log("Testing /api/price...");
        const response = await fetch('http://localhost:3000/api/price?coins=bitcoin,ethereum,solana');

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            return;
        }

        const data = await response.json();
        console.log("Response Data:", JSON.stringify(data, null, 2));

        if (data.bitcoin && data.bitcoin.usd > 0) {
            console.log("SUCCESS: Bitcoin price received.");
        } else {
            console.error("FAILURE: Invalid Bitcoin price data.");
        }
    } catch (error) {
        console.error("Test Failed:", error.message);
    }
}

testPriceAPI();
