import os
import pdfplumber
import re
from typing import List, Dict, Any, Tuple, Optional, Set
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Vehicle, TireProduct, TireSize
from datetime import datetime

def extract_text_from_pdf(pdf_path: str) -> Tuple[str, List[List[List[str]]]]:
    """Extract text and tables from PDF file."""
    text = ""
    all_tables = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            # Extract tables
            tables = page.extract_tables()
            if tables:
                all_tables.extend(tables)
            
            # Extract text
            text += page.extract_text() or ""
    return text, all_tables

def parse_tire_size(size_str: str) -> Dict[str, Any]:
    """Parse tire size string into components with enhanced pattern matching."""
    # Common tire size patterns
    patterns = [
        r'(\d{3})/(\d{2})(?:Z)?R(\d{2})(?:\s+(\d{2,3}(?:/\d{3})?)[A-Z])?',  # Standard format
        r'P(\d{3})/(\d{2})R(\d{2})',  # P-metric format
        r'LT(\d{3})/(\d{2})R(\d{2})',  # Light truck format
        r'(\d{3})-(\d{2})R(\d{2})'  # Alternative format with hyphen
    ]
    
    for pattern in patterns:
        match = re.search(pattern, size_str)
        if match:
            groups = match.groups()
            width = int(groups[0])
            aspect_ratio = int(groups[1])
            rim_size = int(groups[2])
            
            return {
                'width': width,
                'aspect_ratio': aspect_ratio,
                'rim_size': rim_size,
                'load_rating': None,  # Will be updated if found
                'speed_rating': size_str[-1] if size_str[-1].isalpha() else None,
                'construction': 'R',
                'full_size': size_str.strip()
            }
    return None

def extract_vehicle_info(text: str) -> List[Dict[str, Any]]:
    """Extract vehicle information with enhanced pattern matching."""
    vehicles = []
    
    # Common car manufacturers
    valid_makes = {
        'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 'BMW',
        'Mercedes-Benz', 'Audi', 'Volkswagen', 'Subaru', 'Mazda', 'Lexus', 'Acura',
        'Infiniti', 'Volvo', 'Porsche', 'Jeep', 'Chrysler', 'Dodge', 'Ram', 'GMC',
        'Buick', 'Cadillac', 'Lincoln', 'Tesla', 'Genesis', 'Land Rover', 'Jaguar',
        'Mitsubishi', 'Mini', 'Fiat', 'Alfa Romeo', 'Maserati', 'Ferrari', 'Lamborghini',
        'Bentley', 'Rolls-Royce', 'McLaren', 'Aston Martin'
    }
    
    # Look for vehicle information in various formats
    patterns = [
        # Format: Make Model (Year)
        r'({})\s+([\w\s-]+?)\s*\((\d{{4}})\)'.format('|'.join(valid_makes)),
        
        # Format: Make: xxx Model: xxx Year: xxx
        r'(?:Make|Vehicle):\s*({})\s*(?:Model|Type):\s*([\w\s-]+?)\s*Year:\s*(\d{{4}})'.format('|'.join(valid_makes)),
        
        # Format: Make Model Year
        r'({})\s+([\w\s-]+?)\s+(\d{{4}})'.format('|'.join(valid_makes))
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
        for match in matches:
            vehicle = {
                'make': match.group(1).strip(),
                'model': match.group(2).strip(),
                'year': match.group(3).strip(),
                'trim': None,
                'body_type': None
            }
            
            # Look for tire size near the vehicle info
            size_context = text[max(0, match.start()-100):min(len(text), match.end()+100)]
            size_patterns = [
                r'(?:Tire Size|Size|OE Size):\s*([\d/R-]+[A-Z]?)',
                r'(\d{3}/\d{2}R\d{2}(?:\s*\d{2,3}[A-Z])?)'
            ]
            
            for size_pattern in size_patterns:
                size_match = re.search(size_pattern, size_context)
                if size_match:
                    tire_info = parse_tire_size(size_match.group(1))
                    if tire_info:
                        vehicle['tire_size'] = tire_info['full_size']
                        vehicle['wheel_size'] = tire_info['rim_size']
                        break
            
            vehicles.append(vehicle)
    
    return vehicles

def extract_tire_info(text: str) -> List[Dict[str, Any]]:
    """Extract tire information with enhanced pattern matching."""
    tires = []
    
    # Major tire brands
    valid_brands = {
        'Michelin', 'Bridgestone', 'Goodyear', 'Continental', 'Pirelli', 'Yokohama',
        'Dunlop', 'Firestone', 'BFGoodrich', 'Toyo', 'Cooper', 'Hankook', 'Kumho',
        'Falken', 'Nitto', 'General', 'Uniroyal', 'Kelly', 'Nexen', 'Mickey Thompson'
    }
    
    # Look for tire information in various formats
    patterns = [
        # Pattern for detailed listing
        r'({0})\s+([\w\s-]+?)\s+(\d{{3}}/\d{{2}}R\d{{2}}(?:\s*\d{{2,3}}[A-Z])?)\s*[\$£]?([\d,.]+)'.format('|'.join(valid_brands)),
        
        # Pattern for catalog format
        r'({0})\s*(?:Brand|Model|Type)?:\s*([\w\s-]+?)\s+Size:\s*(\d{{3}}/\d{{2}}R\d{{2}}(?:\s*\d{{2,3}}[A-Z])?)\s*Price:\s*[\$£]?([\d,.]+)'.format('|'.join(valid_brands)),
        
        # Pattern for table format
        r'({0})\s*\|\s*([\w\s-]+?)\s*\|\s*(\d{{3}}/\d{{2}}R\d{{2}}(?:\s*\d{{2,3}}[A-Z])?)\s*\|\s*[\$£]?([\d,.]+)'.format('|'.join(valid_brands))
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
        for match in matches:
            try:
                # Clean up price string and convert to float
                price_str = match.group(4).strip().replace(',', '')
                # Remove any trailing dots or dashes
                price_str = re.sub(r'[\.]+$', '', price_str)
                price_str = re.sub(r'[-]+$', '', price_str)
                price = float(price_str)
                
                tire = {
                    'brand': match.group(1).strip(),
                    'model': match.group(2).strip(),
                    'size': match.group(3).strip(),
                    'price': price,
                    'category': 'All-Season',  # Default category
                    'rating': 4.0  # Default rating
                }
                
                # Look for additional information
                context = text[max(0, match.start()-100):min(len(text), match.end()+100)]
                
                # Try to find category
                category_patterns = [
                    r'Category:\s*([^|\n]+)',
                    r'Type:\s*([^|\n]+)',
                    r'(?:All-Season|Summer|Winter|All-Weather|Performance|Touring|Highway|Off-Road|Track|Sport)'
                ]
                
                for cat_pattern in category_patterns:
                    category_match = re.search(cat_pattern, context, re.IGNORECASE)
                    if category_match:
                        tire['category'] = category_match.group(1).strip() if category_match.groups() else category_match.group(0)
                        break
                
                # Try to find rating
                rating_patterns = [
                    r'Rating:\s*([\d.]+)',
                    r'Score:\s*([\d.]+)',
                    r'Stars:\s*([\d.]+)'
                ]
                
                for rating_pattern in rating_patterns:
                    rating_match = re.search(rating_pattern, context)
                    if rating_match:
                        tire['rating'] = float(rating_match.group(1))
                        break
                
                tires.append(tire)
            except ValueError:
                continue  # Skip entries with invalid prices
    
    return tires

def is_valid_vehicle(vehicle: Dict[str, Any]) -> bool:
    """Validate vehicle data."""
    if not vehicle.get('make') or not vehicle.get('model') or not vehicle.get('year'):
        return False
    
    # Check for invalid makes/models (likely parsing errors)
    make = vehicle['make'].strip()
    model = vehicle['model'].strip()
    
    # Must be proper length strings
    if len(make) < 2 or len(model) < 2:
        return False
    
    # Must not be numeric only
    if make.isdigit() or model.isdigit():
        return False
    
    # Must not contain invalid characters
    invalid_chars = set('|/\\[]{}()<>+=')
    if any(c in invalid_chars for c in make) or any(c in invalid_chars for c in model):
        return False
    
    # Year must be reasonable
    try:
        year = int(vehicle['year'])
        if year < 1990 or year > 2025:
            return False
    except ValueError:
        return False
    
    return True

def is_valid_tire(tire: Dict[str, Any]) -> bool:
    """Validate tire data."""
    if not tire.get('brand') or not tire.get('model') or not tire.get('size'):
        return False
    
    # Check for invalid brands/models (likely parsing errors)
    brand = tire['brand'].strip()
    model = tire['model'].strip()
    
    # Must be proper length strings
    if len(brand) < 2 or len(model) < 2:
        return False
    
    # Must not be numeric only
    if brand.isdigit() or model.isdigit():
        return False
    
    # Must not contain invalid characters
    invalid_chars = set('|/\\[]{}()<>+=')
    if any(c in invalid_chars for c in brand) or any(c in invalid_chars for c in model):
        return False
    
    # Price must be reasonable
    try:
        price = float(tire['price'])
        if price < 50 or price > 1000:  # Reasonable price range for tires
            return False
    except ValueError:
        return False
    
    return True

def process_table_row(row: List[str], valid_makes: Set[str], valid_brands: Set[str]) -> Tuple[Optional[Dict], Optional[Dict]]:
    """Process a table row to extract vehicle or tire information."""
    if not row or all(cell is None or cell.strip() == "" for cell in row):
        return None, None
    
    # Convert None to empty strings and clean cells
    row = [str(cell).strip() if cell is not None else "" for cell in row]
    
    vehicle = None
    tire = None
    
    # Try to identify if this is a vehicle row
    for make in valid_makes:
        for cell in row:
            if make.lower() in cell.lower():
                # Look for year pattern
                year_match = re.search(r'\b(19|20)\d{2}\b', cell)
                if year_match:
                    year = year_match.group(0)
                    # Extract model by removing make and year
                    model_text = cell.replace(make, "").replace(year, "").strip()
                    model_text = re.sub(r'[^\w\s-]', '', model_text).strip()
                    
                    if model_text:
                        vehicle = {
                            'make': make,
                            'model': model_text,
                            'year': year,
                            'trim': None,
                            'body_type': None
                        }
                        
                        # Look for tire size in the row
                        for cell_text in row:
                            size_match = re.search(r'\d{3}/\d{2}R\d{2}(?:\s*\d{2,3}[A-Z])?', cell_text)
                            if size_match:
                                tire_info = parse_tire_size(size_match.group(0))
                                if tire_info:
                                    vehicle['tire_size'] = tire_info['full_size']
                                    vehicle['wheel_size'] = tire_info['rim_size']
                                break
                        break
                break
    
    # Try to identify if this is a tire row
    for brand in valid_brands:
        for i, cell in enumerate(row):
            if brand.lower() in cell.lower():
                # Look for tire size pattern in the row
                size_pattern = r'\d{3}/\d{2}R\d{2}(?:\s*\d{2,3}[A-Z])?'
                price_pattern = r'[\$£]?\s*(\d{2,3}(?:\.\d{2})?)'
                
                size_match = None
                price_match = None
                model_text = ""
                
                # Look in all cells for required information
                for j, other_cell in enumerate(row):
                    if not size_match:
                        size_match = re.search(size_pattern, other_cell)
                    if not price_match:
                        price_match = re.search(price_pattern, other_cell)
                    if j != i and other_cell and len(other_cell) > 3:  # Potential model name
                        model_text = other_cell.strip()
                
                if size_match and price_match and model_text:
                    tire = {
                        'brand': brand,
                        'model': model_text,
                        'size': size_match.group(0),
                        'price': float(price_match.group(1)),
                        'category': 'All-Season',  # Default
                        'rating': 4.0  # Default
                    }
                    break
            if tire:
                break
    
    return vehicle, tire

def process_catalogs():
    """Process all PDF catalogs and extract data."""
    pdf_dir = "data"
    all_vehicles = []
    all_tires = []
    
    # Common car manufacturers
    valid_makes = {
        'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 'BMW',
        'Mercedes-Benz', 'Audi', 'Volkswagen', 'Subaru', 'Mazda', 'Lexus', 'Acura',
        'Infiniti', 'Volvo', 'Porsche', 'Jeep', 'Chrysler', 'Dodge', 'Ram', 'GMC',
        'Buick', 'Cadillac', 'Lincoln', 'Tesla', 'Genesis', 'Land Rover', 'Jaguar',
        'Mitsubishi', 'Mini', 'Fiat', 'Alfa Romeo', 'Maserati', 'Ferrari', 'Lamborghini',
        'Bentley', 'Rolls-Royce', 'McLaren', 'Aston Martin'
    }
    
    # Major tire brands
    valid_brands = {
        'Michelin', 'Bridgestone', 'Goodyear', 'Continental', 'Pirelli', 'Yokohama',
        'Dunlop', 'Firestone', 'BFGoodrich', 'Toyo', 'Cooper', 'Hankook', 'Kumho',
        'Falken', 'Nitto', 'General', 'Uniroyal', 'Kelly', 'Nexen', 'Mickey Thompson'
    }
    
    for pdf_file in os.listdir(pdf_dir):
        if pdf_file.endswith('.pdf'):
            pdf_path = os.path.join(pdf_dir, pdf_file)
            print(f"Processing {pdf_file}...")
            
            try:
                text, tables = extract_text_from_pdf(pdf_path)
                print(f"Extracted {len(text)} characters and {len(tables)} tables from {pdf_file}")
                
                vehicles_from_tables = []
                tires_from_tables = []
                
                # Process tables
                for table in tables:
                    for row in table:
                        vehicle, tire = process_table_row(row, valid_makes, valid_brands)
                        if vehicle:
                            vehicles_from_tables.append(vehicle)
                        if tire:
                            tires_from_tables.append(tire)
                
                print(f"Found {len(vehicles_from_tables)} vehicles and {len(tires_from_tables)} tires in tables")
                
                # Filter out duplicates based on make, model, and year for vehicles
                vehicle_keys = set()
                unique_vehicles = []
                for v in vehicles_from_tables:
                    key = (v['make'], v['model'], v['year'])
                    if key not in vehicle_keys and is_valid_vehicle(v):
                        vehicle_keys.add(key)
                        unique_vehicles.append(v)
                
                # Filter out duplicates based on brand, model, and size for tires
                tire_keys = set()
                unique_tires = []
                for t in tires_from_tables:
                    key = (t['brand'], t['model'], t['size'])
                    if key not in tire_keys and is_valid_tire(t):
                        tire_keys.add(key)
                        unique_tires.append(t)
                
                print(f"After filtering: {len(unique_vehicles)} valid vehicles and {len(unique_tires)} valid tires")
                all_vehicles.extend(unique_vehicles)
                all_tires.extend(unique_tires)
                
            except Exception as e:
                print(f"Error processing {pdf_file}: {str(e)}")
    
    return all_vehicles, all_tires

def save_to_database(vehicles: List[Dict[str, Any]], tires: List[Dict[str, Any]]):
    """Save extracted data to database."""
    engine = create_engine('sqlite:///tires.db')
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Save vehicles
        for vehicle_data in vehicles:
            vehicle = Vehicle(
                make=vehicle_data.get('make'),
                model=vehicle_data.get('model'),
                year=int(vehicle_data.get('year', 2024)),
                trim=vehicle_data.get('trim'),
                body_type=vehicle_data.get('body_type'),
                wheel_size=int(vehicle_data.get('wheel_size', 0)),
                tire_size=vehicle_data.get('tire_size')
            )
            session.add(vehicle)
        
        # Save tires
        for tire_data in tires:
            tire_size_info = parse_tire_size(tire_data.get('size', ''))
            if tire_size_info:
                # Create or get TireSize
                tire_size = TireSize(
                    width=tire_size_info['width'],
                    aspect_ratio=tire_size_info['aspect_ratio'],
                    rim_size=tire_size_info['rim_size'],
                    load_rating=tire_size_info['load_rating'],
                    speed_rating=tire_size_info['speed_rating'],
                    construction=tire_size_info['construction'],
                    full_size=tire_size_info['full_size']
                )
                session.add(tire_size)
                session.flush()  # This will assign an ID to tire_size
                
                # Create TireProduct
                tire = TireProduct(
                    brand=tire_data.get('brand'),
                    model=tire_data.get('model'),
                    size_id=tire_size.id,
                    price=float(tire_data.get('price', 0)),
                    category=tire_data.get('category', 'All-Season'),
                    performance_rating=int(float(tire_data.get('rating', 4)) * 20),  # Convert 0-5 to 0-100
                    tread_life=50000,  # Default value
                    wet_performance=4,  # Default values
                    dry_performance=4,
                    noise_level=3,
                    run_flat=False,
                    description=f"{tire_data.get('brand')} {tire_data.get('model')} {tire_size_info['full_size']}",
                    stock=10,  # Default stock
                    features=tire_data.get('features', '{"type": "All-Season"}')
                )
                session.add(tire)
        
        session.commit()
        print(f"Successfully saved {len(vehicles)} vehicles and {len(tires)} tires to database")
        
    except Exception as e:
        session.rollback()
        print(f"Error saving to database: {str(e)}")
        raise  # Re-raise the exception to see the full error
    finally:
        session.close()

def main():
    print("Starting catalog processing...")
    vehicles, tires = process_catalogs()
    print(f"\nExtraction complete!")
    print(f"Total vehicles found: {len(vehicles)}")
    print(f"Total tires found: {len(tires)}")
    
    print("\nSaving to database...")
    save_to_database(vehicles, tires)
    print("Processing complete!")

if __name__ == "__main__":
    main() 