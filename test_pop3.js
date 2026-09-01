const net = require('net');

const client = new net.Socket();
client.connect(110, 'john.petra.ac.id', () => {
    console.log('Connected to POP3 server');
});

client.on('data', (data) => {
    console.log('Received: ' + data.toString());
    client.end();
});

client.on('error', (err) => {
    console.error('Error:', err.message);
});

client.on('timeout', () => {
    console.error('Timeout');
    client.end();
});
