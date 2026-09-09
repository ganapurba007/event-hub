# 🎫 EventHub — Modern Event Management & Ticketing Platform

EventHub is a full-featured, responsive web application for event discovery, ticket purchasing, and event creation powered by **Node.js**, **Express**, **EJS**, **Sequelize (MySQL)**, and integrated with **Xendit Payment Gateway**.

---

## ✨ Features

- 🔐 **Authentication & Authorization**: Secure User Registration & Login with `bcryptjs` encryption, Session Management, and Role-Based Access Control (`user` and `creator`).
- 🎪 **Event Management**: Creators can create, edit, publish/unpublish, and manage their events, complete with image uploads via `multer`.
- 🔍 **Event Discovery & Filtering**: Filter events seamlessly by **Categories** (Music, Technology, Sports, Exhibition, Community, Others) or **Cities** (Jakarta, Bandung, Surabaya, Yogyakarta, Bali, etc.), with real-time keyword search.
- 💳 **Xendit Payment Integration**: Integrated checkout process generating real Xendit payment invoices with instant callback webhook support.
- 🎟️ **E-Ticket Generation**: Automatic unique ticket code creation upon successful payment confirmation.
- 📊 **User & Creator Dashboards**: Dedicated pages for tracking purchased tickets (`/orders/my-orders`) and managing published events (`/events/my-events`).
- 🚀 **Serverless & Cloud-Ready**: Pre-configured for deployment on **Vercel Serverless Functions** with **Aiven Cloud MySQL**.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend Framework** | Node.js, Express.js (v5) |
| **Database & ORM** | MySQL, Sequelize ORM (`mysql2`) |
| **Frontend Templates** | EJS (Embedded JavaScript), Tailwind CSS, Bootstrap Icons, FontAwesome |
| **Authentication** | `express-session`, `bcryptjs` |
| **File Storage** | Multer (`/tmp` fallback on Vercel) |
| **Payment Gateway** | Xendit Node SDK (`xendit-node`) |
| **Deployment** | Vercel Serverless Functions + Aiven Cloud MySQL |

---

## 📂 Project Structure

```
event-hub/
├── api/
│   └── index.js              # Serverless entrypoint for Vercel
├── partials/                 # Reusable EJS partial views
│   ├── alert.ejs             # Success/Error alert banner
│   ├── footer.ejs            # Shared footer component
│   └── header.ejs            # Shared navbar & header component
├── public/                   # Static assets (CSS, JS, uploads)
├── views/                    # EJS Application Views
│   ├── auth/                 # Login & Register views
│   ├── events/               # Event create, edit, detail, list views
│   ├── orders/               # Checkout, success, failure, list views
│   ├── users/                # Profile management views
│   ├── home.ejs              # Landing & Discovery Home page
│   ├── privacy.ejs           # Privacy policy view
│   └── terms.ejs             # Terms of service view
├── .env.example              # Environment variables template
├── app.js                    # Main Express Application logic & DB Models
├── package.json              # Project dependencies & scripts
├── tailwind.config.js        # Custom Tailwind CSS configuration
└── vercel.json               # Vercel serverless deployment config
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root directory based on `.env.example`:

```env
PORT=3000

# DATABASE CONFIGURATION
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=event-management

# SESSION & SECURITY
SESSION_SECRET=eventhub-secret-key-2026
BASE_URL=http://localhost:3000

# XENDIT PAYMENT GATEWAY
XENDIT_SECRET_KEY=xnd_development_your_xendit_key_here
NGROK_URL=http://localhost:3000/
DEPLOY_URL=http://yourdomain.com/
```

---

## 🚀 Local Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ganapurba007/event-hub.git
   cd event-hub
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and adjust your MySQL connection details.

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🌐 Deploying to Vercel & Aiven MySQL

### 1. Aiven Cloud MySQL Setup
1. Create a MySQL database instance on [Aiven Cloud](https://aiven.io/).
2. Note your Host, Port, Username, Password, and Database Name.

### 2. Vercel Deployment
1. Import your repository on [Vercel](https://vercel.com).
2. Configure **Environment Variables** in Vercel project settings:
   - `DB_HOST`: Your Aiven host (e.g., `event-hub-gana.g.aivencloud.com`)
   - `DB_PORT`: Your Aiven port (e.g., `16631`)
   - `DB_USERNAME`: `avnadmin`
   - `DB_PASSWORD`: `your_aiven_password`
   - `DB_NAME`: `defaultdb`
   - `SESSION_SECRET`: `your_random_secret`
   - `XENDIT_SECRET_KEY`: `your_xendit_secret_key`
3. Click **Deploy**. Vercel will automatically build and deploy the app.

---

## 📄 License

This project is open-source and available under the [ISC License](LICENSE).
