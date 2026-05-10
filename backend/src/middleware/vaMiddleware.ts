import { Request, Response, NextFunction } from 'express';

export const adminOrVA = (permission?: string) => {
  return async (req: any, res: Response, next: NextFunction) => {
    // 1. Check if it's a regular Admin (already authenticated via 'protect')
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // 2. Check if it's a VA (already authenticated via 'protect')
    if (req.va) {
      // Check specific permission if required
      if (!permission || req.va.permissions[permission]) {
        return next();
      }
      return res.status(403).json({ success: false, message: `Access denied: Missing ${permission} permission` });
    }

    res.status(403).json({ success: false, message: 'Not authorized for this action' });
  };
};
