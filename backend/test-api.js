const axios = require('axios');

async function test() {
  try {
    // We don't have a token, so we can't easily test the protected routes without logging in.
    console.log("Need token to test");
  } catch (e) {
    console.error(e);
  }
}
test();
