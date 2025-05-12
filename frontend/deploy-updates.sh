#!/bin/bash

# Script to deploy the ViberChat frontend updates

echo "Deploying ViberChat frontend updates..."

# Move new files into place
echo "Updating component files..."
mv -f src/components/Message/Message.jsx.new src/components/Message/Message.jsx
mv -f src/components/MessageInput/MessageInput.jsx.new src/components/MessageInput/MessageInput.jsx
mv -f src/components/Contact/Contact.jsx.new src/components/Contact/Contact.jsx
mv -f src/components/ChatWindow/ChatWindow.jsx.new src/components/ChatWindow/ChatWindow.jsx
mv -f src/components/Sidebar/Sidebar.jsx.new src/components/Sidebar/Sidebar.jsx

# Update context files
echo "Updating context files..."
mv -f src/contexts/AuthContext.js.new src/contexts/AuthContext.js
mv -f src/contexts/ChatContext.js.new src/contexts/ChatContext.js
mv -f src/contexts/NotificationContext.js.new src/contexts/NotificationContext.js

# Update page files
echo "Updating page files..."
mv -f src/pages/Chat/Chat.jsx.new src/pages/Chat/Chat.jsx
mv -f src/pages/Settings/Settings.jsx.new src/pages/Settings/Settings.jsx

echo "All updates deployed successfully!"
echo "Run 'npm start' to start the development server"
