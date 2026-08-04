# 🚀 CityMind Cloud Deployment Playbook ($0 Free Tier)

This guide provides step-by-step instructions to host the **CityMind Urban Event Monitoring System** on the cloud for **100% free** using Vercel, Render, and MongoDB Atlas.

---

## 📂 Architecture overview

```mermaid
graph TD
    User[Browser Client] -->|HTTPS| Vercel[Vercel Static Frontend CDN]
    Vercel -->|REST / WebSockets| Render[Render Web Service Backend]
    Render -->|TCP Connection| Atlas[(MongoDB Atlas Free Cloud DB)]
```

---

## 🛠️ Step 1: Set up MongoDB Atlas (Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign up for a free account.
2. Create a new project (e.g. `CityMind`).
3. Click **Create a Deployment** and select the **M0 FREE** tier cluster. Pick any cloud provider (AWS/GCP/Azure) and region closest to you.
4. **Security Configuration**:
   - **Username**: Create a user (e.g. `citymind_admin`).
   - **Password**: Generate a secure password and copy it down.
5. **Network Access**:
   - Under **IP Access List**, add IP Address `0.0.0.0/0` (Allows Render backend containers to connect securely from dynamic cloud IPs).
6. Under Database Deployments, click **Connect** -> **Drivers**.
7. Copy the standard connection string. It will look like this:
   ```text
   mongodb+srv://citymind_admin:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   *(Be sure to replace `<password>` with your database password!)*

---

## 🐍 Step 2: Host Backend on Render

1. Push your updated code repository to **GitHub**.
2. Sign up / Log in to [Render](https://render.com).
3. Click **New +** -> **Web Service**.
4. Choose **Build and deploy from a Git repository** and connect your repository.
5. In the configuration settings:
   - **Name**: `citymind-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Instance Type**: `Free`
6. Click **Advanced** and add the following **Environment Variables**:
   
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `MONGODB_URL` | `mongodb+srv://citymind_admin:YOUR_PASSWORD@cluster...` | Your MongoDB Atlas connection string |
   | `MONGODB_DATABASE` | `citymind` | Database name |
   | `JWT_SECRET` | *(Click "Generate" or type a secure random string)* | Secret for auth tokens |
   | `ENABLE_AI_MODELS` | `false` | Keeps container lightweight for the free tier |
   | `CORS_ORIGINS` | `*` | *(We will restrict this to your exact Vercel URL once deployed)* |

7. Click **Deploy Web Service**.
8. Once successfully deployed, copy the generated URL (e.g. `https://citymind-backend.onrender.com`).

---

## ⚛️ Step 3: Host Frontend on Vercel

1. Sign up / Log in to [Vercel](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. In the Project Configuration:
   - **Framework Preset**: `Other` or `Vite` (Vercel auto-detects Vite).
   - **Root Directory**: Click *Edit* and select **`frontend`**.
5. Expand **Environment Variables** and add:
   
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://citymind-backend.onrender.com` | **Your Render backend URL** from Step 2 |

6. Click **Deploy**. Vercel will build and assign you a secure HTTPS production URL (e.g. `https://citymind.vercel.app`)!

---

## 🔒 Step 4: Lock Down Security (Final Touch)

To prevent third-party access to your backend API, go back to your **Render Dashboard** -> **Environment** and update:
* `CORS_ORIGINS` = `https://your-app-name.vercel.app` (Your actual Vercel frontend URL)

---

### 🎉 Your full-stack platform is now live on the cloud!
* **Frontend**: `https://your-app-name.vercel.app`
* **API Docs**: `https://citymind-backend.onrender.com/docs`
