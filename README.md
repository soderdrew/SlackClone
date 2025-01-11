# ChatGenius

A modern real-time chat application inspired by Slack, built with React, TypeScript, and Supabase.

## Features

- 💬 Real-time messaging (with threads coming soon, hopefully)
- 🔒 Secure authentication with email
- 📂 File sharing (preview coming soon, hopefully)
- 🔍 Full-text search capabilities
- 👥 User presence and status (soon to be real time)
- 😊 Emoji reactions and custom emojis (coming soon)
- 📱 Responsive design for all devices (only tested on computer)

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **State Management**: Redux Toolkit
- **Backend & Database**: Supabase
- **Real-time**: Supabase Realtime
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- Git

### Installation

1. Clone the repository
```bash
git clone [your-repo-url]
cd chatgenius
```

2. Install frontend dependencies
```bash
cd client
npm install
```

3. Install backend dependencies
```bash
cd ../server
npm install
```

4. Set up environment variables
```bash
cp .env.example .env
```

5. Start the development server
```bash
# In the client directory
npm run dev

# In the server directory
npm run dev
```

## Project Structure

```
chatgenius/
├── client/              # Frontend React application
├── server/              # Backend Express server
├── docs/                # Documentation
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
