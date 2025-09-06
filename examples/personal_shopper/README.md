# Personal Shopper

A personal shopping agent that helps customers with making sales and refunding orders using a multi-agent system.

## Overview

This example demonstrates a customer service system with specialized agents for different tasks:

- **Triage Agent**: Routes customers to the appropriate specialist agent
- **Sales Agent**: Handles product orders and purchases
- **Refunds Agent**: Manages refunds and returns

The system uses an SQLite database to track users, products, and purchase history.

## Features

- **Agent Handoffs**: Seamless transfer between specialized agents
- **Database Integration**: Persistent storage using SQLite with better-sqlite3
- **Customer Notifications**: Email and phone notifications
- **Order Management**: Place orders with user and product validation
- **Refund Processing**: Handle refunds with purchase history lookup

## Database Schema

### Users Table
- `id`: Primary key (auto-increment)
- `user_id`: Unique user identifier
- `first_name`: User's first name
- `last_name`: User's last name
- `email`: Email address (unique)
- `phone`: Phone number

### Products Table
- `product_id`: Primary key
- `product_name`: Product name
- `price`: Product price

### PurchaseHistory Table
- `id`: Primary key (auto-increment)
- `user_id`: Reference to Users table
- `date_of_purchase`: Purchase timestamp
- `item_id`: Unique item identifier
- `amount`: Purchase amount

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your OpenAI API key:
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

3. Run the example:
   ```bash
   node examples/personal_shopper/main.js
   ```

## Usage

The system will initialize with sample data:

**Sample Users:**
- User ID 1: Alice Smith (alice@test.com, 123-456-7890)
- User ID 2: Bob Johnson (bob@test.com, 234-567-8901)
- User ID 3: Sarah Brown (sarah@test.com, 555-567-8901)

**Sample Products:**
- Product ID 7: Hat ($19.99)
- Product ID 8: Wool socks ($29.99)
- Product ID 9: Shoes ($39.99)

### Example Interactions

**Placing an Order:**
```
User: I want to buy shoes
Sales Agent: I can help you place an order! To proceed, I need both your user ID and the product ID. What is your user ID and which product ID would you like to order?
User: My user ID is 1 and I want product ID 9
Sales Agent: Ordering product Shoes for user ID 1. The price is $39.99. Your order has been successfully placed!
```

**Processing a Refund:**
```
User: I need a refund
Refunds Agent: I can help you with a refund. To initiate the refund process, I need both your user ID and the item ID from your purchase. Can you please provide both your user_id and item_id?
User: User ID 1 and item ID 101
Refunds Agent: Refunding $99.99 to user ID 1 for item ID 101. Refund initiated successfully.
```

**Customer Notifications:**
```
User: Please notify me by email
Agent: I can send you a notification. What is your user ID and what method would you prefer - email or phone?
User: User ID 1 and email please
Agent: Emailed customer alice@test.com a notification.
```

## Functions

### Sales Agent Functions
- `orderItem(user_id, product_id)`: Places an order for a user
- `notifyCustomer(user_id, method)`: Sends notifications to customers

### Refunds Agent Functions  
- `refundItem(user_id, item_id)`: Processes refunds for returned items
- `notifyCustomer(user_id, method)`: Sends notifications to customers

### Triage Agent Functions
- `transferToSalesAgent()`: Routes to sales agent for purchases
- `transferToRefundsAgent()`: Routes to refunds agent for returns

## Database Operations

The database module (`database.js`) provides:
- Automatic table creation and initialization
- User, product, and purchase management
- Connection pooling and error handling
- Data seeding with sample records

## Error Handling

- Database errors are logged but don't crash the application
- Missing users/products are handled gracefully with informative messages
- Duplicate records are prevented automatically

## Testing

The example can be tested interactively through the command line interface or by importing the functions in a test script:

```javascript
const { orderItem, refundItem, notifyCustomer } = require('./main.js');

// Test placing an order
const result = orderItem(1, 9);
console.log(result);
```