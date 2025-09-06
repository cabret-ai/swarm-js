const Database = require('better-sqlite3');

// Global connection
let conn = null;

function getConnection() {
    if (!conn) {
        conn = new Database('application.db');
    }
    return conn;
}

function createDatabase() {
    const db = getConnection();
    
    // Create Users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            first_name TEXT,
            last_name TEXT,
            email TEXT UNIQUE,
            phone TEXT
        )
    `);
    
    // Create PurchaseHistory table
    db.exec(`
        CREATE TABLE IF NOT EXISTS PurchaseHistory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            date_of_purchase TEXT,
            item_id INTEGER,
            amount REAL,
            FOREIGN KEY (user_id) REFERENCES Users(user_id)
        )
    `);
    
    // Create Products table
    db.exec(`
        CREATE TABLE IF NOT EXISTS Products (
            product_id INTEGER PRIMARY KEY,
            product_name TEXT NOT NULL,
            price REAL NOT NULL
        )
    `);
}

function addUser(userId, firstName, lastName, email, phone) {
    const db = getConnection();
    
    // Check if the user already exists
    const existingUser = db.prepare('SELECT * FROM Users WHERE user_id = ?').get(userId);
    if (existingUser) {
        return;
    }
    
    try {
        const stmt = db.prepare(`
            INSERT INTO Users (user_id, first_name, last_name, email, phone)
            VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(userId, firstName, lastName, email, phone);
    } catch (error) {
        console.error(`Database Error: ${error.message}`);
    }
}

function addPurchase(userId, dateOfPurchase, itemId, amount) {
    const db = getConnection();
    
    // Check if the user exists
    const existingUser = db.prepare('SELECT * FROM Users WHERE user_id = ?').get(userId);
    if (!existingUser) {
        console.error(`Database Error: User ${userId} not found`);
        return;
    }
    
    // Check if the purchase already exists
    const existingPurchase = db.prepare(`
        SELECT * FROM PurchaseHistory
        WHERE user_id = ? AND item_id = ? AND date_of_purchase = ?
    `).get(userId, itemId, dateOfPurchase);
    
    if (existingPurchase) {
        return;
    }
    
    try {
        const stmt = db.prepare(`
            INSERT INTO PurchaseHistory (user_id, date_of_purchase, item_id, amount)
            VALUES (?, ?, ?, ?)
        `);
        stmt.run(userId, dateOfPurchase, itemId, amount);
    } catch (error) {
        console.error(`Database Error: ${error.message}`);
    }
}

function addProduct(productId, productName, price) {
    const db = getConnection();
    
    // Check if the product already exists
    const existingProduct = db.prepare('SELECT * FROM Products WHERE product_id = ?').get(productId);
    if (existingProduct) {
        return;
    }
    
    try {
        const stmt = db.prepare(`
            INSERT INTO Products (product_id, product_name, price)
            VALUES (?, ?, ?)
        `);
        stmt.run(productId, productName, price);
    } catch (error) {
        console.error(`Database Error: ${error.message}`);
    }
}

function closeConnection() {
    if (conn) {
        conn.close();
        conn = null;
    }
}

function previewTable(tableName) {
    const db = new Database('application.db');
    
    try {
        const rows = db.prepare(`SELECT * FROM ${tableName} LIMIT 5`).all();
        console.log(`Preview of ${tableName}:`);
        rows.forEach(row => {
            console.log(row);
        });
    } catch (error) {
        console.error(`Error previewing table ${tableName}: ${error.message}`);
    } finally {
        db.close();
    }
}

function initializeDatabase() {
    // Initialize the database tables
    createDatabase();
    
    // Add some initial users
    const initialUsers = [
        [1, "Alice", "Smith", "alice@test.com", "123-456-7890"],
        [2, "Bob", "Johnson", "bob@test.com", "234-567-8901"],
        [3, "Sarah", "Brown", "sarah@test.com", "555-567-8901"]
    ];
    
    initialUsers.forEach(user => {
        addUser(...user);
    });
    
    // Add some initial products first
    const initialProducts = [
        [7, "Hat", 19.99],
        [8, "Wool socks", 29.99],
        [9, "Shoes", 39.99]
    ];
    
    initialProducts.forEach(product => {
        addProduct(...product);
    });
    
    // Add some initial purchases - using valid user_ids and reasonable item_ids
    const initialPurchases = [
        [1, "2024-01-01", 101, 99.99],
        [2, "2023-12-25", 100, 39.99],
        [3, "2023-11-14", 307, 49.99]
    ];
    
    initialPurchases.forEach(purchase => {
        addPurchase(...purchase);
    });
}

module.exports = {
    getConnection,
    createDatabase,
    addUser,
    addPurchase,
    addProduct,
    closeConnection,
    previewTable,
    initializeDatabase
};