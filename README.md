# Atlas Account Vault

A secure web application for managing and storing account credentials with features like file attachments and favicon display.

## Features

- 🔐 Secure account credential storage
- 👤 User authentication and authorization
- 🔑 Password visibility toggle in all forms
- 🎲 Strong password generator
- 📎 File attachment support
- 🖼️ Automatic favicon fetching for websites
- 🎨 Beautiful and responsive UI
- 📱 Mobile-friendly design
- 🔍 Search and filter capabilities
- 🔄 Real-time database status monitoring

## Project Structure

```plaintext
Atlas-Account-Vault-04.04.25/
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── ui.js
│   │   ├── auth.js
│   │   ├── account-manager.js
│   │   └── main.js
│   └── index.html
├── models/
│   └── Account.js
├── routes/
│   ├── accounts.js
│   └── auth.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── views/
│   └── index.html
├── images/
├── node_modules/
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MongoDB with GridFS for file storage
- Authentication: JWT (JSON Web Tokens)
- Icons: Font Awesome for UI elements

## Installation

1. Clone the repository:

```bash
git clone https://github.com/jayakumar9/Atlas-Account-Vault-04.04.25-V0.git
cd Atlas-Account-Vault-04.04.25-V0
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:

```properties
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=3000
```

4. Start the application:

```bash
npm start
```

## Usage

1. Register a new account:
   - Fill in your username and email
   - Create a strong password or use the "Generate Strong Password" button
   - Toggle password visibility using the eye icon
   
2. Login to your account:
   - Enter your email and password
   - Use the eye icon to toggle password visibility

3. Manage your accounts:
   - Add new accounts with website, username, and password
   - Generate strong passwords for new accounts
   - Toggle password visibility when viewing or editing
   - Optionally attach files to account entries
   - View, edit, or delete stored accounts

4. Monitor system status through the status indicator

## Security Features

- Password encryption
- JWT-based authentication
- Secure password visibility toggle
- Strong password generation
- Secure file storage with GridFS
- Session management
- Input validation and sanitization

## Development

To run in development mode:

```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Latest Updates

- Added password visibility toggle in all forms
- Implemented strong password generator
- Enhanced login and registration forms
- Improved error handling
- Enhanced UI/UX with responsive design
- Added file attachment capabilities
- Implemented real-time database status monitoring

## Contact

Jayakumar - [@jayakumar9](https://github.com/jayakumar9)

Project Link: [https://github.com/jayakumar9/Atlas-Account-Vault-04.04.25-V0](https://github.com/jayakumar9/Atlas-Account-Vault-04.04.25-V0)
