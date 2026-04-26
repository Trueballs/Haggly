module.exports = (req, res) => {
  if (req.method === 'POST') {
    const { email } = req.body;
    console.log(`New signup: ${email}`);
    
    // Her kan du legge til logikk for å lagre i en database senere
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #F5621E; color: white; min-height: 100vh;">
        <h1>Thanks for signing up!</h1>
        <p>We'll let you know when we launch.</p>
        <br>
        <a href="/" style="color: white; text-decoration: underline;">Back to home</a>
      </div>
    `);
  } else {
    res.status(405).send('Method Not Allowed');
  }
};
