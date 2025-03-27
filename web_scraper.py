from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
import sqlite3
import re
from datetime import datetime
import time

def connect_db():
    conn = sqlite3.connect('tires.db')
    return conn

def setup_driver():
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=chrome_options)

def wait_for_element(driver, by, value, timeout=10):
    try:
        element = WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((by, value))
        )
        return element
    except Exception as e:
        print(f"Timeout waiting for element {value}: {str(e)}")
        return None

def scrape_tyremarket_main(url):
    driver = setup_driver()
    try:
        print("Accessing website...")
        driver.get(url)
        
        # Wait for initial page load
        time.sleep(10)
        
        # Wait for and click any popup/overlay if present
        try:
            overlay = wait_for_element(driver, By.CSS_SELECTOR, '.modal-content, .popup-overlay, .cookie-banner')
            if overlay:
                close_button = overlay.find_element(By.CSS_SELECTOR, 'button[aria-label="Close"], .close-button')
                close_button.click()
                time.sleep(2)
        except Exception as e:
            print(f"No overlay found or couldn't close it: {str(e)}")
        
        # Scroll to load more content
        print("Scrolling page...")
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(5)
        
        # Extract car brands
        print("Extracting car brands...")
        car_brand_elements = driver.find_elements(By.CSS_SELECTOR, 'a[href*="tyre-prices"], a[href*="tyres"]')
        car_brands = [elem.text.strip() for elem in car_brand_elements if elem.text.strip()]
        print(f"Found {len(car_brands)} car brands")
        
        # Extract tire brands
        print("Extracting tire brands...")
        tire_brand_elements = driver.find_elements(By.CSS_SELECTOR, 'a[href*="Car-Tyres"], a[href*="tyre-brand"]')
        tire_brands = [elem.text.strip() for elem in tire_brand_elements if elem.text.strip()]
        print(f"Found {len(tire_brands)} tire brands")
        
        # Store car brands in database
        conn = connect_db()
        cursor = conn.cursor()
        
        for brand in car_brands:
            if brand and len(brand) > 1:  # Filter out empty or single-character brands
                cursor.execute('''
                    INSERT OR IGNORE INTO vehicle (make, created_at)
                    VALUES (?, ?)
                ''', (brand, datetime.now()))
        
        # Store tire brands in database
        for brand in tire_brands:
            if brand and len(brand) > 1:  # Filter out empty or single-character brands
                cursor.execute('''
                    INSERT OR IGNORE INTO tire_product (brand, category, created_at)
                    VALUES (?, ?, ?)
                ''', (brand, 'All-Season', datetime.now()))
        
        conn.commit()
        conn.close()
        
        print("Data extraction completed successfully")
        
    except Exception as e:
        print(f"Error scraping data: {str(e)}")
    finally:
        driver.quit()

def calculate_prices(base_price):
    """Calculate offer price (10% off) and bulk price (15% off)"""
    offer_price = base_price * 0.9  # 10% discount
    bulk_price = base_price * 0.85  # 15% discount
    return offer_price, bulk_price

def insert_known_data():
    # Known tire brands with sample base prices (in USD)
    tire_brands = [
        ("Apollo", 150.0),
        ("Arivo", 120.0),
        ("BF-Goodrich", 180.0),
        ("Bridgestone", 200.0),
        ("CEAT", 130.0),
        ("Comforser", 110.0),
        ("Continental", 190.0),
        ("Dunlop", 170.0),
        ("Falken", 160.0),
        ("Firestone", 140.0),
        ("Goodyear", 210.0),
        ("Hankook", 145.0),
        ("JK-Tyre", 125.0),
        ("Kelly", 115.0),
        ("Kenda", 105.0),
        ("Kumho", 155.0),
        ("LEAO", 100.0),
        ("Maxxis", 135.0),
        ("Michelin", 220.0),
        ("MRF", 140.0),
        ("Pirelli", 230.0),
        ("Radar", 110.0),
        ("UltraMile", 100.0),
        ("Vredestein", 165.0)
    ]
    
    # Known car brands from the website
    car_brands = [
        "Ambassador",
        "Ashok Leyland",
        "Aston Martin",
        "Audi",
        "Bentley",
        "BMW",
        "Bugatti",
        "Chevrolet",
        "Datsun",
        "Ferrari",
        "Fiat",
        "Force",
        "Ford",
        "Honda",
        "Hyundai",
        "ICML",
        "ISUZU",
        "Jaguar",
        "Koenigsegg",
        "Lamborghini",
        "Land Rover",
        "Mahindra",
        "Maruti",
        "Maruti Suzuki Nexa",
        "Maserati",
        "Maybach",
        "Mercedes",
        "Mini Cooper",
        "Mitsubishi",
        "Nissan",
        "Porsche",
        "Premier",
        "Renault",
        "Reva",
        "Rolls Royce",
        "Skoda",
        "Storm",
        "Tata",
        "Toyota",
        "Volkswagen",
        "Volvo"
    ]
    
    try:
        # First, clear existing data
        conn = connect_db()
        cursor = conn.cursor()
        
        print("Clearing existing data...")
        cursor.execute('DELETE FROM tire_vehicle_compatibility')
        cursor.execute('DELETE FROM tire_product')
        cursor.execute('DELETE FROM tire_size')
        cursor.execute('DELETE FROM vehicle')
        
        # Insert car brands
        print("Inserting car brands...")
        for brand in car_brands:
            cursor.execute('''
                INSERT INTO vehicle (make, created_at)
                VALUES (?, ?)
            ''', (brand, datetime.now()))
        
        # Insert tire brands with prices
        print("Inserting tire brands with prices...")
        for brand, base_price in tire_brands:
            offer_price, bulk_price = calculate_prices(base_price)
            cursor.execute('''
                INSERT INTO tire_product (brand, base_price, offer_price, bulk_price, category, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (brand, base_price, offer_price, bulk_price, 'All-Season', datetime.now()))
        
        conn.commit()
        conn.close()
        print("Data insertion completed successfully")
        
    except Exception as e:
        print(f"Error inserting data: {str(e)}")

if __name__ == "__main__":
    insert_known_data() 