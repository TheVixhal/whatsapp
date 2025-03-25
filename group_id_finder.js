const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Initialize the client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Generate QR code for authentication
client.on('qr', (qr) => {
    console.log('Scan this QR code with your WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('✅ Authenticated successfully!');
});

client.on('ready', () => {
    console.log('✅ Bot is ready!');
    console.log('Send "!groupid" in any group chat to get its ID.');
    
    // Get your own number for reference
    const myNumber = client.info.wid.user;
    console.log(`Your WhatsApp number: ${myNumber}`);
});

// Message handler for group ID retrieval
client.on('message_create', async message => {
    // Command to get group ID
    if (message.body === '!groupid') {
        try {
            const chat = await message.getChat();
            
            // Only respond in group chats
            
            console.log(`Group ID request in: "${chat.name}"`);
            console.log(`Group ID: ${chat.id._serialized}`);
                
            await message.reply(`Group ID: ${chat.id._serialized}`);
            
        } catch (error) {
            console.error('Error getting group ID:', error);
        }
    }
    
    // Regular ping command
    else if (message.body === '!ping') {
        try {
            await client.sendMessage(message.from, 'pong');
            console.log('Sent pong response');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }
});

client.on('disconnected', (reason) => {
    console.log('⚠️ WhatsApp disconnected:', reason);
});

// Start the client
console.log('Starting WhatsApp bot...');
console.log('Waiting for QR code...');
client.initialize();
