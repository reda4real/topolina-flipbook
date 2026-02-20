# Deployment Guide - Flipbook Website

## Prerequisites
1.  **Node.js**: Ensure Node.js (v14 or higher) is installed.
2.  **MySQL Database**: You need a running MySQL server.

## Installation Steps
1.  **Unzip the package**: Extract the contents of `flipbook-deployment.zip` to your server.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment**:
    - Rename `.env.example` to `.env`.
    - Edit `.env` and fill in your MySQL database credentials and desired Admin Password.
    ```ini
    DB_HOST=localhost
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=flipbook_db
    ```
4.  **Database Setup**:
    - The application will automatically attempt to create the necessary tables (`products`, `patterns`, `fabrics`, `orders`, `uploads`) upon first run.
    - Ensure the database setup in `.env` exists (create the empty DB first if needed: `CREATE DATABASE flipbook_db;`).

## Running the Application

### Development / Simple Run
```bash
npm start
```
The application will start on **port 3000** by default (http://localhost:3000).


### Production (using PM2)
It is recommended to use a process manager like PM2 for production.
```bash
npm install -g pm2
pm2 start server.js --name "flipbook-app"
pm2 save
pm2 startup
```

## Data Migration
The application will automatically create the necessary database structure (tables) when it starts. However, you need to migrate your data (products, fabrics, etc.).

Since you have a local MySQL database, use your preferred database tool (e.g., Workbench, HeidiSQL, phpMyAdmin, or command line) to:
1.  **Export** your local `flipbook_db` to a `.sql` file.
2.  **Import** that `.sql` file into your production server's database.

*Note: If `mysqldump` is available in your terminal, you can use:*
```bash
mysqldump -u root -p flipbook_db > flipbook_data.sql
```


## Folder Structure
- `uploads/`: Stores uploaded images. Ensure this folder has write permissions.
- `public/`: Static assets (if separated, currently served from root).
