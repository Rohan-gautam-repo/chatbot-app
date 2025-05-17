# Start the MECON Chatbot Application
# This script starts both the backend and frontend servers

Write-Host "Starting MECON Chatbot Application..." -ForegroundColor Green

# Start the backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList "-Command cd $PSScriptRoot\backend; uvicorn app.main:app --reload"

# Wait a moment for the backend to initialize
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start the frontend server
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList "-Command cd $PSScriptRoot\frontend; npm run dev"

Write-Host "Servers started successfully!" -ForegroundColor Green
Write-Host "Backend is running at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend is running at: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Press Ctrl+C in each terminal window to stop the servers." -ForegroundColor Yellow
