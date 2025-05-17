# Chatbot Application Frontend

This document provides instructions for setting up and running the chatbot application frontend on a new PC.

## Prerequisites

Before getting started, ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (v18+ recommended)
- npm (comes with Node.js)
- A modern web browser (Chrome, Firefox, Edge, etc.)

## Setup Instructions

Follow these steps to set up the frontend environment:

### 1. Clone the Repository (if applicable)

```powershell
git clone <repository-url>
cd path/to/chatbot-app/frontend
```

### 2. Install Dependencies

```powershell
npm install
```

This will install all the dependencies listed in the package.json file.

### 3. Configure Environment Variables

Create a `.env` file in the frontend directory with the following content:

```
VITE_API_URL=http://localhost:8000
```

Adjust the API URL if your backend is running on a different host or port.

### 4. Start the Development Server

```powershell
npm run dev
```

The frontend development server will start, and you can access the application at http://localhost:5173 (or another port if 5173 is already in use).

### 5. Building for Production

When you're ready to deploy the application, create a production build:

```powershell
npm run build
```

This will generate optimized files in the `dist` directory that can be served by any static file server.

## Features

- User authentication and registration
- Chat interface with session management
- File uploads (images and documents)
- Extracted text display from uploaded files
- Markdown rendering for AI responses

## Folder Structure

- `src/components/` - React components
- `src/pages/` - Page components for different routes
- `src/context/` - React context providers
- `src/services/` - API service functions
- `src/utils/` - Utility functions
- `public/` - Static assets

## Customization

### Styling

This project uses Tailwind CSS for styling. You can customize the appearance by editing the Tailwind configuration in `tailwind.config.js`.

### API Endpoints

API endpoints are configured in the service files located in `src/services/`. Update these files if your backend endpoints change.

## Troubleshooting

### Common Issues

#### 1. Connection to Backend Failed
Ensure the backend server is running and accessible at the URL specified in your `.env` file.

#### 2. Login or Registration Issues
Check browser console for error messages related to authentication requests.

#### 3. File Upload Problems
Verify that the backend is configured correctly to accept file uploads and that the frontend is sending the correct file format.

## Browser Compatibility

The application is designed to work with modern browsers. For best experience, use the latest versions of:
- Chrome
- Firefox
- Safari
- Edge

## License

[Your License Information]
