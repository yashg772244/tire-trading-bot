import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // TODO: Implement tire size lookup logic
    const { width, profile, rim } = req.query;
    
    // Return dummy data for now
    return res.status(200).json({
      success: true,
      sizes: [
        { width: 225, profile: 45, rim: 18 },
        { width: 235, profile: 40, rim: 19 },
        { width: 245, profile: 35, rim: 20 }
      ]
    });
  } catch (error) {
    console.error('Error in size API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 