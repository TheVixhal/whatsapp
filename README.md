# WhatsApp Group Bot Setup Guide

This guide will help you set up and run the WhatsApp Group Bot by following a few simple steps.

---

## 📚 Prerequisites

- Node.js installed on your system.
- WhatsApp account.

---

## 🚀 Getting Started

### 1. Run `group_id_finder.js`

```bash
node group_id_finder.js
```

### 2. Scan QR Code Using WhatsApp Linked Devices

- Open WhatsApp on your mobile device.
- Go to **Settings** > **Linked Devices** > **Link a Device**.
- Scan the QR code displayed on your terminal.

### 3. Send `!groupid` in Any Group

- Once the QR code is scanned successfully, send the following message in the desired group:
```
!groupid
```
- The bot will reply with the group ID.

### 4. Copy Group ID and Paste It in `whatsapp_bot.js`

- Open `whatsapp_bot.js` in any text editor.
- Locate the section where the `group_id` is defined.
- Replace the existing group ID with the new one you copied.

```javascript
const group_id = 'PASTE_YOUR_GROUP_ID_HERE';
```

### 5. Stop `group_id_finder.js`

- Stop the `group_id_finder.js` process by pressing:
```
CTRL + C
```

### 6. Run `whatsapp_bot.js`

```bash
node whatsapp_bot.js
```

---

## ✅ Important Notes
- Make sure the QR code is scanned correctly to establish a connection.
- Use the correct group ID to avoid errors when sending messages.

---

## 📝 Troubleshooting
- If the bot is not responding:
  - Check the QR code connection.
  - Verify the group ID is correctly pasted in `whatsapp_bot.js`.
  - Restart the script.

---

## 🎉 You're All Set!

The bot is now successfully configured and running! 🚀

---

If you encounter any issues, feel free to reach out! 😊
