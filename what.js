const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { Groq } = require('groq-sdk');


const groq = new Groq({
    apiKey: 'api-key-daalo-idhar-groq-ki'  // Replace with your actual Groq API key
});


const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});


const TARGET_GROUP_ID = "120363332619273755@g.us"; 


const BOT_START_TIME = Date.now();


client.on('qr', (qr) => {
    console.log('Scan this QR code with your WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('✅ Authenticated successfully!');
});

client.on('ready', () => {
    console.log('✅ Bot is ready!');
    console.log(`Monitoring group with ID: ${TARGET_GROUP_ID}`);
    console.log(`Your WhatsApp ID: ${client.info.wid._serialized}`);
    console.log(`Bot start time: ${new Date(BOT_START_TIME).toLocaleString()}`);
    console.log('Old messages will be ignored to prevent duplicate processing');
    
    client.sendMessage(TARGET_GROUP_ID, 
        '🤖 *Anti-Promotion Bot Activated*\n\n' +
        'This bot will automatically delete ALL promotional messages, including from the bot owner.\n\n' +
        'Available commands:\n' +
        '!ping - Test if bot is active\n' +
        '!groupid - Show this group\'s ID\n' +
        '!summary - Get a summary of the last 50 messages\n' +
        '!roast - Generate a brutal dark humor roast of recent chat\n' +
        '!roast @user - Roast a specific tagged user based on their messages'
    ).then(() => {
        console.log('Sent activation message to group');
    }).catch(err => {
        console.error('Failed to send activation message:', err);
    });
});


function isPromotional(text) {
    
    const lowerText = text.toLowerCase();
    
   
    const promotionalKeywords = [
        'offer', 'discount', 'sale', 'buy now', 'limited time', 
        'best price', 'click here', 'order now', 'promotion',
        'subscribe', 'free', 'win', 'deal', 'cash back', 'earn money',
        '% off', 'investment', 'buy', 'selling', 'opportunity'
    ];
    
    // Check for promotional keywords
    const hasPromotionalKeyword = promotionalKeywords.some(keyword => 
        lowerText.includes(keyword)
    );
    
    // Check for URLs
    const hasURL = /https?:\/\//.test(lowerText);
    
    // Check for excessive use of special characters (often used in promotions)
    const excessiveSpecialChars = (lowerText.match(/[!$*]/g) || []).length > 3;
    
    // Check for promotional patterns (numbers with symbols like ₹, $, etc.)
    const hasPricePattern = /[\₹\$\€\£\¥]\s*\d+|\d+\s*[\₹\$\€\£\¥]/.test(lowerText);
    
    // Return true if any promotional indicator is found
    return hasPromotionalKeyword || hasURL || excessiveSpecialChars || hasPricePattern;
}


async function generateSummary(messages) {
    try {
        
        const formattedMessages = messages.map(msg => {
            
            let sender = "Unknown";
            if (msg._data && msg._data.notifyName) {
                sender = msg._data.notifyName;
            } else if (msg.author) {
                sender = msg.author;
            }
            
            // Get message content
            const content = msg.body || "(media or non-text content)";
            
            return `${sender}: ${content}`;
        }).join('\n');
        
       
        const prompt = `Below are the last ${messages.length} messages from a WhatsApp group chat. 
Please provide a concise summary of the main topics discussed, key points, and any decisions made.
Focus on the most important information and ignore irrelevant chatter.

MESSAGES:
${formattedMessages}

SUMMARY:`;

        // Call Groq API
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "gemma2-9b-it",
            temperature: 0.7,
            max_tokens: 512,
            top_p: 0.9
        });

        
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error generating summary with Groq:', error);
        return "Sorry, I couldn't generate a summary at this time. Please try again later.";
    }
}


async function generateRoast(messages) {
    try {
        
        const formattedMessages = messages.map(msg => {
            
            let sender = "Unknown";
            if (msg._data && msg._data.notifyName) {
                sender = msg._data.notifyName;
            } else if (msg.author) {
                sender = msg.author;
            }
            
           
            const content = msg.body || "(media or non-text content)";
            
            return `${sender}: ${content}`;
        }).join('\n');
        
      
        const prompt = `Below are the last ${messages.length} messages from a WhatsApp group chat. 
Create a brutal, dark humor roast of this conversation and the participants. Be creative, savage, and hilarious.
Focus on the content, conversation style, and any embarrassing or cringeworthy moments.
Make it truly brutal - like a comedy roast show..
Keep it edgy - dark humor that people can laugh at. Roast should be under only 50-80 words short but hilarious.

MESSAGES:
${formattedMessages}

BRUTAL DARK HUMOR ROAST:`;

        
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "gemma2-9b-it",
            temperature: 0.85,
            max_tokens: 512,
            top_p: 0.95
        });

        // Return the generated roast
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error generating roast with Groq:', error);
        return "Sorry, I couldn't generate a roast at this time. Maybe the chat was too boring to roast? Try again later.";
    }
}

// Function to generate a user-specific roast
async function generateUserRoast(userMessages, userName) {
    try {
        // Format messages for the LLM
        const formattedMessages = userMessages.map(msg => {
            return `${userName}: ${msg.body || "(media or non-text content)"}`;
        }).join('\n');
        
        // Create prompt for the LLM
        const prompt = `Below are ${userMessages.length} messages from a WhatsApp user named "${userName}".
Create a brutal, savage, dark humor roast specifically targeting this user based on their messages.
Focus on their writing style, word choices, conversation patterns, interests, and any embarrassing or cringeworthy things they've said.
Make it truly brutal - like a comedy roast show..
Keep it edgy - dark humor that people can laugh at. Roast should be under only 50-80 words short but hilarious.

USER MESSAGES:
${formattedMessages}

BRUTAL PERSONALIZED ROAST OF ${userName}:`;

       
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "gemma2-9b-it",
            temperature: 0.8,
            max_tokens: 512,
            top_p: 0.95
        });

        
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error generating user roast with Groq:', error);
        return `Sorry, I couldn't generate a roast for ${userName} at this time. Maybe they're too boring to roast? Try again later.`;
    }
}


const processingCommands = new Set();

// Message handler
client.on('message_create', async message => {
    try {
        // Only process messages from the target group
        if (message.from === TARGET_GROUP_ID) {
            // Get message timestamp
            const messageTime = message.timestamp * 1000; // Convert to milliseconds
            
            // Skip old messages (received before bot start)
            if (messageTime < BOT_START_TIME) {
                console.log(`Ignoring old message from ${new Date(messageTime).toLocaleString()}`);
                return;
            }
            
            // Generate a unique ID for this message command (if it is one)
            const isCommand = message.body.startsWith('!');
            const commandId = isCommand ? `${message.body}_${message.id._serialized}` : null;
            
            // Check if this command is already being processed (prevents double processing)
            if (isCommand && processingCommands.has(commandId)) {
                console.log(`Command ${message.body} is already being processed, skipping duplicate`);
                return;
            }
            
           
            console.log(`Message in target group: ${message.body.substring(0, 30)}${message.body.length > 30 ? '...' : ''}`);
            console.log(`Is your message: ${message.fromMe ? 'Yes' : 'No'}`);
            console.log(`Message time: ${new Date(messageTime).toLocaleString()}`);
            
            
            if (message.body === '!groupid') {
                try {
                    
                    if (commandId) processingCommands.add(commandId);
                    
                    console.log(`Processing !groupid command from ${message.fromMe ? 'you' : 'someone else'}`);
                    await message.reply(`Group ID: ${message.from}`);
                    console.log('Sent group ID');
                    
                    
                    if (commandId) processingCommands.delete(commandId);
                    return; // Exit after handling command
                } catch (error) {
                    console.error('Error sending group ID:', error);
                    if (commandId) processingCommands.delete(commandId);
                }
            }
            else if (message.body === '!ping') {
                try {
                    // Mark this command as being processed
                    if (commandId) processingCommands.add(commandId);
                    
                    console.log(`Processing !ping command from ${message.fromMe ? 'you' : 'someone else'}`);
                    await message.reply('pong');
                    console.log('Sent pong response');
                    
                    // Remove from processing set when done
                    if (commandId) processingCommands.delete(commandId);
                    return; // Exit after handling command
                } catch (error) {
                    console.error('Error sending message:', error);
                    if (commandId) processingCommands.delete(commandId);
                }
            }
            // Summary command
            else if (message.body === '!summary') {
                try {
                    // Mark this command as being processed
                    if (commandId) processingCommands.add(commandId);
                    
                    console.log(`Processing !summary command from ${message.fromMe ? 'you' : 'someone else'}`);
                    // Inform the user that we're working on the summary
                    await message.reply('Generating summary of recent messages... This may take a moment.');
                    
                    // Get the chat
                    const chat = await message.getChat();
                    
                    // Fetch message history (up to 50 messages)
                    console.log('Fetching message history...');
                    const fetchedMessages = await chat.fetchMessages({limit: 50});
                    console.log(`Successfully fetched ${fetchedMessages.length} messages`);
                    
                    if (fetchedMessages.length === 0) {
                        await message.reply('No messages found to summarize.');
                        if (commandId) processingCommands.delete(commandId);
                        return;
                    }
                    
                    // Generate the summary
                    console.log('Generating summary...');
                    const summary = await generateSummary(fetchedMessages);
                    
                    // Send the summary
                    await client.sendMessage(message.from, `*Chat Summary*\n\n${summary}`);
                    console.log('Sent chat summary');
                    
                    // Remove from processing set when done
                    if (commandId) processingCommands.delete(commandId);
                    return; // Exit after handling command
                    
                } catch (error) {
                    console.error('Error generating summary:', error);
                    console.error(error.stack);
                    await message.reply('Sorry, I encountered an error while generating the summary. Please try again later.');
                    if (commandId) processingCommands.delete(commandId);
                }
            }
            // Roast command (general chat roast)
            else if (message.body === '!roast') {
                try {
                    // Mark this command as being processed
                    if (commandId) processingCommands.add(commandId);
                    
                    console.log(`Processing !roast command from ${message.fromMe ? 'you' : 'someone else'}`);
                    // Inform the user that we're working on the roast
                    await message.reply('Preparing a brutal dark humor roast based on recent messages... This may take a moment. 🔥');
                    
                    // Get the chat
                    const chat = await message.getChat();
                    
                    // Fetch message history (up to 20 messages for the roast)
                    console.log('Fetching messages for roast...');
                    const fetchedMessages = await chat.fetchMessages({limit: 20});
                    console.log(`Successfully fetched ${fetchedMessages.length} messages for roasting`);
                    
                    if (fetchedMessages.length < 5) {
                        await message.reply('Not enough messages to roast. Need at least 5 messages of conversation.');
                        if (commandId) processingCommands.delete(commandId);
                        return;
                    }
                    
                    // Generate the roast
                    console.log('Generating brutal roast...');
                    const roast = await generateRoast(fetchedMessages);
                    
                    // Send the roast with fire emojis for effect
                    await client.sendMessage(message.from, `*🔥 BRUTAL CHAT ROAST 🔥*\n\n${roast}\n\n💀💀💀`);
                    console.log('Sent brutal roast');
                    
                    // Remove from processing set when done
                    if (commandId) processingCommands.delete(commandId);
                    return; 
                    
                } catch (error) {
                    console.error('Error generating roast:', error);
                    console.error(error.stack);
                    await message.reply('Sorry, I encountered an error while generating the roast. Maybe your chat was too boring to roast? Try again later.');
                    if (commandId) processingCommands.delete(commandId);
                }
            }
            // User-specific roast command
            else if (message.body.startsWith('!roast @') || message.body.startsWith('!roast @')) {
                try {
                    // Mark this command as being processed
                    if (commandId) processingCommands.add(commandId);
                    
                    console.log(`Processing user-specific roast command from ${message.fromMe ? 'you' : 'someone else'}`);
                    
                    // Check if the message mentions any users
                    if (message.mentionedIds && message.mentionedIds.length > 0) {
                        // Get the first mentioned user ID
                        const targetUserId = message.mentionedIds[0];
                        console.log(`Target user ID for roast: ${targetUserId}`);
                        
                        // Inform that we're working on the roast
                        await message.reply(`Preparing a personalized brutal roast for the tagged user... This may take a moment. 🔥`);
                        
                        // Get the chat
                        const chat = await message.getChat();
                        
                        // Fetch recent messages (we'll filter for the target user)
                        console.log('Fetching recent messages...');
                        const allMessages = await chat.fetchMessages({limit: 100});
                        
                        // Filter messages from the target user
                        const userMessages = allMessages.filter(msg => 
                            msg.author === targetUserId || 
                            (msg._data && msg._data.author === targetUserId)
                        );
                        
                        console.log(`Found ${userMessages.length} messages from the target user`);
                        
                        // Take the last 10 messages from this user (or all if less than 10)
                        const messagesToRoast = userMessages.slice(-10);
                        
                        if (messagesToRoast.length < 3) {
                            await message.reply('Not enough messages from this user to generate a good roast. They need to talk more!');
                            if (commandId) processingCommands.delete(commandId);
                            return;
                        }
                        
                        // Get the user's name
                        let userName = "User";
                        try {
                            // Try to get contact info
                            const contact = await client.getContactById(targetUserId);
                            userName = contact.pushname || contact.name || "User";
                        } catch (contactError) {
                            console.error('Error getting contact info:', contactError);
                            // Try to get name from chat participants
                            const participant = chat.participants.find(p => p.id._serialized === targetUserId);
                            if (participant && participant.name) {
                                userName = participant.name;
                            }
                        }
                        
                        console.log(`Generating personalized roast for ${userName}...`);
                        
                        // Generate the user-specific roast
                        const userRoast = await generateUserRoast(messagesToRoast, userName);
                        
                        // Create the message with mention
                        let roastMessage = `*🔥 BRUTAL PERSONALIZED ROAST 🔥*\n\n`;
                        
                        // Add the mention by adding an @ symbol and the user's ID
                        roastMessage += `@${targetUserId.split('@')[0]}, here's your roast:\n\n`;
                        roastMessage += `${userRoast}\n\n💀💀💀`;
                        
                        // Send the roast with the mention
                        await client.sendMessage(message.from, roastMessage, {
                            mentions: [await client.getContactById(targetUserId)]
                        });
                        
                        console.log(`Sent personalized roast for ${userName}`);
                        
                    } else {
                        await message.reply('Error: No user was tagged. Use the format: !roast @user');
                    }
                    
                    // Remove from processing set when done
                    if (commandId) processingCommands.delete(commandId);
                    return; // Exit after handling command
                    
                } catch (error) {
                    console.error('Error generating user-specific roast:', error);
                    console.error(error.stack);
                    await message.reply('Sorry, I encountered an error while generating the personalized roast. Please try again later.');
                    if (commandId) processingCommands.delete(commandId);
                }
            }
            
            // Check if message appears promotional
            if (isPromotional(message.body)) {
                console.log(`Detected promotional message from ${message.fromMe ? 'yourself' : 'someone else'}, attempting to delete...`);
                
                try {
                    // Get the chat to check if you're an admin
                    const chat = await message.getChat();
                    
                    // Get your participant info
                    const yourParticipant = chat.participants.find(
                        p => p.id._serialized === client.info.wid._serialized
                    );
                    
                    // Check if you're an admin
                    if (yourParticipant && yourParticipant.isAdmin) {
                        // Delete the message for everyone
                        await message.delete(true); // true means "delete for everyone"
                        console.log('✅ Promotional message deleted successfully');
                        
                        // Send a notification about deletion
                        await client.sendMessage(
                            TARGET_GROUP_ID,
                            '⚠️ A promotional message was detected and removed.'
                        );
                    } else {
                        console.log('❌ Cannot delete message: Bot is not an admin in this group');
                        
                        // Just warn without deleting
                        await message.reply(
                            '⚠️ This appears to be promotional content, which is not allowed in this group.\n' +
                            'Please refrain from posting such content.'
                        );
                    }
                } catch (error) {
                    console.error('Error handling promotional message:', error);
                    
                    // If deletion fails, at least warn about it
                    try {
                        await message.reply('⚠️ Promotional content detected. Please avoid posting such content.');
                    } catch (replyError) {
                        console.error('Failed to send warning message:', replyError);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Unexpected error in message handler:', error);
    }
});

client.on('disconnected', (reason) => {
    console.log('⚠️ WhatsApp disconnected:', reason);
});

// Handle unexpected errors to prevent crashes
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Keep the bot running despite errors
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
    // Keep the bot running despite errors
});

// Start the client
console.log('Starting WhatsApp bot...');
console.log('Waiting for QR code...');
client.initialize();
