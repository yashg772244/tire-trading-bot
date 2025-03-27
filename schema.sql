CREATE TABLE vehicle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    make VARCHAR NOT NULL,
    model VARCHAR,
    year INTEGER,
    trim VARCHAR,
    body_type VARCHAR,
    wheel_size INTEGER,
    tire_size VARCHAR(20),
    created_at DATETIME
);

CREATE TABLE tire_size (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    width INTEGER,
    aspect_ratio INTEGER,
    rim_size INTEGER,
    load_rating VARCHAR,
    speed_rating VARCHAR,
    construction VARCHAR,
    full_size VARCHAR UNIQUE
);

CREATE TABLE tire_product (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand VARCHAR NOT NULL,
    model VARCHAR NOT NULL,
    size_id INTEGER,
    base_price FLOAT NOT NULL,
    offer_price FLOAT,  -- 10% discount
    bulk_price FLOAT,   -- 15% discount for 4+ tires
    category VARCHAR,
    performance_rating INTEGER,
    tread_life INTEGER,
    wet_performance INTEGER,
    dry_performance INTEGER,
    noise_level INTEGER,
    run_flat BOOLEAN,
    description VARCHAR,
    stock INTEGER,
    features VARCHAR,
    created_at DATETIME,
    FOREIGN KEY(size_id) REFERENCES tire_size (id)
);

CREATE TABLE tire_vehicle_compatibility (
    tire_id INTEGER,
    vehicle_id INTEGER,
    is_original_equipment BOOLEAN DEFAULT 0,
    FOREIGN KEY(tire_id) REFERENCES tire_product (id),
    FOREIGN KEY(vehicle_id) REFERENCES vehicle (id)
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR,
    address TEXT,
    total_amount FLOAT NOT NULL,
    discount_applied FLOAT,
    quantity INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    tire_id INTEGER,
    quantity INTEGER NOT NULL,
    price_per_unit FLOAT NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders (id),
    FOREIGN KEY(tire_id) REFERENCES tire_product (id)
); 