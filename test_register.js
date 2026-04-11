import("node-fetch").then(({default: fetch}) => {
  fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      name: 'Test Student',
      email: 'test_student' + Date.now() + '@example.com',
      password: 'password123',
      usn: '1RL24SCS99',
      class: '1st Year',
      section: 'A'
    })
  }).then(r => r.json()).then(console.log).catch(console.error);
});
