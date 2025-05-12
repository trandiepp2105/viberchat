@echo off
REM Script to deploy the ViberChat frontend updates

echo Deploying ViberChat frontend updates...

REM Move new files into place
echo Updating component files...
move /y src\components\Message\Message.jsx.new src\components\Message\Message.jsx
move /y src\components\MessageInput\MessageInput.jsx.new src\components\MessageInput\MessageInput.jsx
move /y src\components\Contact\Contact.jsx.new src\components\Contact\Contact.jsx
move /y src\components\ChatWindow\ChatWindow.jsx.new src\components\ChatWindow\ChatWindow.jsx
move /y src\components\Sidebar\Sidebar.jsx.new src\components\Sidebar\Sidebar.jsx

REM Update context files
echo Updating context files...
move /y src\contexts\AuthContext.js.new src\contexts\AuthContext.js
move /y src\contexts\ChatContext.js.new src\contexts\ChatContext.js
move /y src\contexts\NotificationContext.js.new src\contexts\NotificationContext.js

REM Update page files
echo Updating page files...
move /y src\pages\Chat\Chat.jsx.new src\pages\Chat\Chat.jsx
move /y src\pages\Settings\Settings.jsx.new src\pages\Settings\Settings.jsx

echo All updates deployed successfully!
echo Run 'npm start' to start the development server
