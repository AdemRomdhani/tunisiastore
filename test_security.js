const API_URL = 'http://localhost:3000/api';

async function testRateLimiting() {
  console.log('--- TESTING RATE LIMITING ON /api/auth/login ---');
  let successCount = 0;
  let blockedCount = 0;
  
  for (let i = 0; i < 205; i++) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      });
      
      if (response.status === 429) {
        blockedCount++;
      } else if (response.status === 401) {
        successCount++; // 401 means the request reached the controller (rate limit didn't block it)
      } else {
        console.log(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.log(`Unexpected error: ${error.message}`);
    }
  }
  
  console.log(`Requests allowed (reached controller): ${successCount}`);
  console.log(`Requests blocked by Rate Limiter (429): ${blockedCount}`);
  if (successCount >= 200) {
    console.log('❌ VULNERABILITY CONFIRMED: Rate limiter allows too many requests (200/min), vulnerable to brute-force.');
  } else {
    console.log('✅ Rate limiter is working effectively.');
  }
}

async function runTests() {
  await testRateLimiting();
}

runTests();
