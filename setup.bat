@echo off
echo AI Knowledge Inbox - Setup
echo --------------------------
echo 1. Installing Server Dependencies...
cd server && npm install
echo 2. Installing Client Dependencies...
cd ../client && npm install
echo --------------------------
echo SETUP COMPLETE!
echo.
echo IMPORTANT: Please update server/.env with your OPENAI_API_KEY.
echo.
echo To start the app:
echo - Open a terminal and run: cd server && node index.js
echo - Open another terminal and run: cd client && npm run dev
pause
