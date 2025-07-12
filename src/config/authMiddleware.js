import jwt from 'jsonwebtoken';
import credentials from "./credentials.js";

const APP_SECRET = credentials.app_secret; // Be sure to use env in production

export const authMiddleware = (req, res, next) => {
    try {
        // Accept token via Authorization header: Bearer <token>
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Invalid token format.' });
        }

        // Verify token
        jwt.verify(token, APP_SECRET, (err, decoded) => {
            if (err || !decoded) {
                return res.status(401).json({ message: 'Invalid or expired token.' });
            }

            // Attach payload to request
            req.user = {
                name: decoded.account_name,
                id: decoded.account_id,
                account_type: decoded.account_type,
                developer_id: decoded.account_type === "device" ? decoded.developer_id : null              // optional extra info
            };

            next();
        });
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ message: 'Auth processing failed.' });
    }
};
