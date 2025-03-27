import sqlite3
from datetime import datetime

def connect_db():
    conn = sqlite3.connect('tires.db')
    return conn

def insert_tire_sizes():
    # Common tire sizes with their specifications
    tire_sizes = [
        # Passenger Car Sizes
        (205, 55, 16, '91', 'V', 'R', '205/55R16'),
        (215, 55, 17, '94', 'V', 'R', '215/55R17'),
        (225, 45, 17, '91', 'Y', 'R', '225/45R17'),
        (235, 45, 18, '94', 'Y', 'R', '235/45R18'),
        (245, 40, 18, '93', 'Y', 'R', '245/40R18'),
        (255, 35, 19, '96', 'Y', 'R', '255/35R19'),
        
        # SUV Sizes
        (225, 65, 17, '102', 'H', 'R', '225/65R17'),
        (235, 65, 17, '104', 'H', 'R', '235/65R17'),
        (245, 65, 17, '107', 'H', 'R', '245/65R17'),
        (255, 65, 17, '109', 'H', 'R', '255/65R17'),
        (265, 65, 17, '112', 'H', 'R', '265/65R17'),
        
        # Light Truck Sizes
        (265, 70, 17, '115', 'S', 'R', '265/70R17'),
        (275, 70, 17, '117', 'S', 'R', '275/70R17'),
        (285, 70, 17, '121', 'S', 'R', '285/70R17'),
        (295, 70, 17, '121', 'S', 'R', '295/70R17'),
        (305, 70, 17, '121', 'S', 'R', '305/70R17')
    ]
    
    conn = connect_db()
    cursor = conn.cursor()
    
    for size in tire_sizes:
        cursor.execute('''
            INSERT OR IGNORE INTO tire_size 
            (width, aspect_ratio, rim_size, load_rating, speed_rating, construction, full_size)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', size)
    
    conn.commit()
    conn.close()

def insert_tire_models():
    # Tire models with their specifications
    tire_models = [
        # Michelin Models
        ("Michelin", "Pilot Sport 4S", "245/40R18", 220.0, "Ultra High Performance", 9, 30000, 9, 9, 7, True, "Premium summer tire", 100, "Run-flat, Low rolling resistance"),
        ("Michelin", "Primacy MXM4", "215/55R17", 180.0, "All-Season", 8, 45000, 8, 8, 8, False, "All-season touring tire", 150, "All-season traction, Comfort ride"),
        
        # Continental Models
        ("Continental", "ExtremeContact DWS06", "225/45R17", 190.0, "All-Season", 9, 40000, 9, 9, 7, False, "All-season performance tire", 120, "Dry, Wet, Snow traction"),
        ("Continental", "PureContact LS", "205/55R16", 160.0, "All-Season", 8, 70000, 8, 8, 8, False, "All-season touring tire", 200, "Long tread life, Fuel efficient"),
        
        # Bridgestone Models
        ("Bridgestone", "Potenza RE980AS", "235/45R18", 200.0, "All-Season", 9, 50000, 9, 9, 7, False, "All-season performance tire", 180, "All-season traction, Sport handling"),
        ("Bridgestone", "Dueler H/L Alenza", "265/65R17", 180.0, "All-Season", 8, 65000, 8, 8, 8, False, "SUV touring tire", 150, "SUV optimized, All-season traction"),
        
        # Goodyear Models
        ("Goodyear", "Eagle F1 Asymmetric", "255/35R19", 210.0, "Ultra High Performance", 9, 30000, 9, 9, 6, True, "Summer performance tire", 100, "Sport handling, Wet traction"),
        ("Goodyear", "Assurance WeatherReady", "225/60R16", 170.0, "All-Season", 8, 60000, 8, 8, 8, False, "All-season touring tire", 200, "All-weather traction, Comfort ride"),
        
        # Pirelli Models
        ("Pirelli", "P Zero", "245/40R18", 230.0, "Ultra High Performance", 9, 30000, 9, 9, 6, True, "Summer performance tire", 80, "Sport handling, Wet traction"),
        ("Pirelli", "Cinturato P7", "225/45R17", 190.0, "All-Season", 8, 50000, 8, 8, 8, False, "All-season touring tire", 150, "All-season traction, Fuel efficient")
    ]
    
    conn = connect_db()
    cursor = conn.cursor()
    
    for model in tire_models:
        # Get size_id
        cursor.execute('SELECT id FROM tire_size WHERE full_size = ?', (model[2],))
        size_id = cursor.fetchone()
        
        if size_id:
            # Calculate prices
            base_price = model[3]
            offer_price = base_price * 0.9
            bulk_price = base_price * 0.85
            
            cursor.execute('''
                INSERT INTO tire_product 
                (brand, model, size_id, base_price, offer_price, bulk_price, category, 
                performance_rating, tread_life, wet_performance, dry_performance, 
                noise_level, run_flat, description, stock, features, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (model[0], model[1], size_id[0], base_price, offer_price, bulk_price,
                 model[4], model[5], model[6], model[7], model[8], model[9],
                 model[10], model[11], model[12], model[13], datetime.now()))
    
    conn.commit()
    conn.close()

def insert_vehicle_compatibility():
    # Sample vehicle-tire compatibility data
    compatibility_data = [
        # BMW Models
        ("BMW", "3 Series", 2020, "225/45R17", True),
        ("BMW", "5 Series", 2020, "245/40R18", True),
        ("BMW", "X5", 2020, "265/65R17", True),
        
        # Mercedes Models
        ("Mercedes", "C-Class", 2020, "225/45R17", True),
        ("Mercedes", "E-Class", 2020, "245/40R18", True),
        ("Mercedes", "GLE", 2020, "265/65R17", True),
        
        # Audi Models
        ("Audi", "A4", 2020, "225/45R17", True),
        ("Audi", "A6", 2020, "245/40R18", True),
        ("Audi", "Q5", 2020, "235/65R17", True),
        
        # Toyota Models
        ("Toyota", "Camry", 2020, "215/55R17", True),
        ("Toyota", "RAV4", 2020, "225/65R17", True),
        ("Toyota", "Highlander", 2020, "245/65R17", True)
    ]
    
    conn = connect_db()
    cursor = conn.cursor()
    
    for comp in compatibility_data:
        # Insert vehicle if not exists
        cursor.execute('''
            INSERT OR IGNORE INTO vehicle (make, model, year, tire_size, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (comp[0], comp[1], comp[2], comp[3], datetime.now()))
        
        # Get vehicle_id
        cursor.execute('SELECT id FROM vehicle WHERE make = ? AND model = ? AND year = ?',
                      (comp[0], comp[1], comp[2]))
        vehicle_id = cursor.fetchone()
        
        if vehicle_id:
            # Get tire_id
            cursor.execute('''
                SELECT tp.id 
                FROM tire_product tp
                JOIN tire_size ts ON tp.size_id = ts.id
                WHERE ts.full_size = ?
            ''', (comp[3],))
            tire_ids = cursor.fetchall()
            
            # Create compatibility relationships
            for tire_id in tire_ids:
                cursor.execute('''
                    INSERT OR IGNORE INTO tire_vehicle_compatibility 
                    (tire_id, vehicle_id, is_original_equipment)
                    VALUES (?, ?, ?)
                ''', (tire_id[0], vehicle_id[0], comp[4]))
    
    conn.commit()
    conn.close()

def calculate_savings(tire_id, quantity):
    """Calculate total savings for different purchase quantities"""
    conn = connect_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT base_price, offer_price, bulk_price
        FROM tire_product
        WHERE id = ?
    ''', (tire_id,))
    
    prices = cursor.fetchone()
    conn.close()
    
    if not prices:
        return None
    
    base_price, offer_price, bulk_price = prices
    
    if quantity >= 4:
        total_savings = (base_price - bulk_price) * quantity
        discount_type = "Bulk (15%)"
    else:
        total_savings = (base_price - offer_price) * quantity
        discount_type = "Regular (10%)"
    
    return {
        "original_total": base_price * quantity,
        "discounted_total": (bulk_price if quantity >= 4 else offer_price) * quantity,
        "total_savings": total_savings,
        "discount_type": discount_type
    }

if __name__ == "__main__":
    print("Inserting tire sizes...")
    insert_tire_sizes()
    
    print("Inserting tire models...")
    insert_tire_models()
    
    print("Inserting vehicle compatibility...")
    insert_vehicle_compatibility()
    
    print("Data insertion completed successfully") 