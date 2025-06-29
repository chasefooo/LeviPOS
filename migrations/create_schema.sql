-- Ensure the POS database exists and switch to it
CREATE DATABASE IF NOT EXISTS `POS`;
USE `POS`;

-- 1. Locations
CREATE TABLE IF NOT EXISTS Locations (
    LocationID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Address VARCHAR(255),
    Phone VARCHAR(50),
    Active TINYINT DEFAULT 1,
    SquareLocation VARCHAR(255),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Customers
CREATE TABLE IF NOT EXISTS Customers (
    CustomerID VARCHAR(64) PRIMARY KEY,
    Name VARCHAR(255),
    Email VARCHAR(255),
    Phone VARCHAR(50),
    Balance DECIMAL(10,2) DEFAULT 0.00,
    QR VARCHAR(255),
    Active TINYINT DEFAULT 1,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Items (Inventory Catalog)
CREATE TABLE IF NOT EXISTS Items (
    ItemID INT AUTO_INCREMENT PRIMARY KEY,
    SKU VARCHAR(64) UNIQUE,
    Name VARCHAR(255) NOT NULL,
    Description TEXT,
    Price DECIMAL(10,2) NOT NULL,
    Cost DECIMAL(10,2),
    Active TINYINT DEFAULT 1,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Inventory Levels
CREATE TABLE IF NOT EXISTS InventoryLevels (
    LocationID INT NOT NULL,
    ItemID INT NOT NULL,
    Quantity INT DEFAULT 0,
    PRIMARY KEY (LocationID, ItemID),
    CONSTRAINT fk_InventoryLocations FOREIGN KEY (LocationID) REFERENCES Locations(LocationID),
    CONSTRAINT fk_InventoryItems FOREIGN KEY (ItemID) REFERENCES Items(ItemID)
);

-- 5. Transactions
CREATE TABLE IF NOT EXISTS Transactions (
    TransactionID INT AUTO_INCREMENT PRIMARY KEY,
    LocationID INT NOT NULL,
    CustomerID VARCHAR(64),
    Total DECIMAL(10,2) NOT NULL,
    TransactionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PaymentType VARCHAR(50),
    CONSTRAINT fk_TransactionsLocations FOREIGN KEY (LocationID) REFERENCES Locations(LocationID),
    CONSTRAINT fk_TransactionsCustomers FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);

-- 6. Transaction Items
CREATE TABLE IF NOT EXISTS TransactionItems (
    TransactionID INT NOT NULL,
    ItemID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    LineTotal DECIMAL(10,2) AS (Quantity * UnitPrice) STORED,
    PRIMARY KEY (TransactionID, ItemID),
    CONSTRAINT fk_TransItemsTransaction FOREIGN KEY (TransactionID) REFERENCES Transactions(TransactionID),
    CONSTRAINT fk_TransItemsItem FOREIGN KEY (ItemID) REFERENCES Items(ItemID)
);

# -- 7. Users (Admin/Employees)
# CREATE TABLE IF NOT EXISTS Users (
#     UserID INT AUTO_INCREMENT PRIMARY KEY,
#     Username VARCHAR(100) UNIQUE NOT NULL,
#     PasswordHash VARCHAR(255) NOT NULL,
#     Role VARCHAR(50) NOT NULL,
#     Active TINYINT DEFAULT 1,
#     CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#     UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
# );

-- 8. Payments
CREATE TABLE IF NOT EXISTS Payments (
    PaymentID INT AUTO_INCREMENT PRIMARY KEY,
    TransactionID INT NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    PaymentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PaymentMethod VARCHAR(50),
    CONSTRAINT fk_PaymentsTransaction FOREIGN KEY (TransactionID) REFERENCES Transactions(TransactionID)
);


-- 9. Discounts
CREATE TABLE IF NOT EXISTS Discounts (
    DiscountID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    DiscountType ENUM('PERCENT','FIXED','BUY_ONE_GET_ONE','BUY_X_GET_Y') NOT NULL,
    PercentOff DECIMAL(5,2),
    AmountOff DECIMAL(10,2),
    BuyQuantity INT,
    GetQuantity INT,
    AppliesToAll TINYINT DEFAULT 0,
    Active TINYINT DEFAULT 1,
    StartDate DATE,
    EndDate DATE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 10. DiscountItems (association between Discounts and specific Items)
CREATE TABLE IF NOT EXISTS DiscountItems (
    DiscountID INT NOT NULL,
    ItemID INT NOT NULL,
    PRIMARY KEY (DiscountID, ItemID),
    CONSTRAINT fk_DiscountItems_Discounts FOREIGN KEY (DiscountID) REFERENCES Discounts(DiscountID),
    CONSTRAINT fk_DiscountItems_Items FOREIGN KEY (ItemID) REFERENCES Items(ItemID)
);


-- 11. Categories
CREATE TABLE IF NOT EXISTS Categories (
    CategoryID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Description TEXT,
    Active TINYINT DEFAULT 1,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 12. CategoryItems (associate Items with Categories)
CREATE TABLE IF NOT EXISTS CategoryItems (
    CategoryID INT NOT NULL,
    ItemID INT NOT NULL,
    PRIMARY KEY (CategoryID, ItemID),
    CONSTRAINT fk_CategoryItems_Categories FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
    CONSTRAINT fk_CategoryItems_Items FOREIGN KEY (ItemID) REFERENCES Items(ItemID)
);

-- 13. DiscountCategories (associate Discounts with whole Categories)
CREATE TABLE IF NOT EXISTS DiscountCategories (
    DiscountID INT NOT NULL,
    CategoryID INT NOT NULL,
    PRIMARY KEY (DiscountID, CategoryID),
    CONSTRAINT fk_DiscountCategories_Discounts FOREIGN KEY (DiscountID) REFERENCES Discounts(DiscountID),
    CONSTRAINT fk_DiscountCategories_Categories FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);

-- 14. DiscountDays (restrict Discounts to specific days of week)
CREATE TABLE IF NOT EXISTS DiscountDays (
    DiscountID INT NOT NULL,
    DayOfWeek ENUM('SUN','MON','TUE','WED','THU','FRI','SAT') NOT NULL,
    PRIMARY KEY (DiscountID, DayOfWeek),
    CONSTRAINT fk_DiscountDays_Discounts FOREIGN KEY (DiscountID) REFERENCES Discounts(DiscountID)
);