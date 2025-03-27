import { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Open SQLite database
      const db = await open({
        filename: './tires.db',
        driver: sqlite3.Database
      });

      // Extract query parameters
      const { brand, size, vehicle, limit = 10, offset = 0 } = req.query;

      let query = `
        SELECT 
          tp.id, 
          tp.brand, 
          tp.model, 
          ts.full_size, 
          tp.base_price, 
          tp.offer_price, 
          tp.bulk_price,
          tp.category,
          tp.performance_rating,
          tp.features
        FROM 
          tire_product tp
        JOIN 
          tire_size ts ON tp.size_id = ts.id
      `;

      const queryParams: any[] = [];
      const whereClauses: string[] = [];

      // Add filters
      if (brand) {
        whereClauses.push('tp.brand LIKE ?');
        queryParams.push(`%${brand}%`);
      }

      if (size) {
        whereClauses.push('ts.full_size LIKE ?');
        queryParams.push(`%${size}%`);
      }

      if (vehicle) {
        query += `
          LEFT JOIN 
            tire_vehicle_compatibility tvc ON tp.id = tvc.tire_id
          LEFT JOIN 
            vehicle v ON tvc.vehicle_id = v.id
        `;
        
        const [make, model, year] = (vehicle as string).split(',');
        
        if (make) {
          whereClauses.push('v.make LIKE ?');
          queryParams.push(`%${make}%`);
        }
        
        if (model) {
          whereClauses.push('v.model LIKE ?');
          queryParams.push(`%${model}%`);
        }
        
        if (year && !isNaN(parseInt(year))) {
          whereClauses.push('v.year = ?');
          queryParams.push(parseInt(year));
        }
      }

      // Add WHERE clause if any filters are present
      if (whereClauses.length > 0) {
        query += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      // Add pagination
      query += ' LIMIT ? OFFSET ?';
      queryParams.push(parseInt(limit as string));
      queryParams.push(parseInt(offset as string));

      // Execute query
      const tires = await db.all(query, ...queryParams);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total FROM tire_product tp
        JOIN tire_size ts ON tp.size_id = ts.id
      `;

      if (vehicle) {
        countQuery += `
          LEFT JOIN 
            tire_vehicle_compatibility tvc ON tp.id = tvc.tire_id
          LEFT JOIN 
            vehicle v ON tvc.vehicle_id = v.id
        `;
      }

      if (whereClauses.length > 0) {
        countQuery += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      const countResult = await db.get(countQuery, ...queryParams.slice(0, -2));
      const total = countResult.total;

      // Process features field if it's stored as a JSON string
      const processedTires = tires.map(tire => {
        if (tire.features && typeof tire.features === 'string') {
          try {
            tire.features = JSON.parse(tire.features);
          } catch (e) {
            // Keep as is if it's not valid JSON
          }
        }
        return tire;
      });

      // Close database connection
      await db.close();

      // Return results
      res.status(200).json({
        tires: processedTires,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Error fetching tires:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 