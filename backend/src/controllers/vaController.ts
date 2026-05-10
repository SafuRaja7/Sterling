import { Request, Response } from 'express';
import { supabase } from '../config/db';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sterling_jwt_key_2026';

// Helper to generate a random secure password
const generateRandomPassword = () => {
  return crypto.randomBytes(8).toString('hex'); // 16 character hex string
};

// Helper to generate a unique username
const generateUniqueUsername = () => {
  return 'VA_' + Math.floor(1000 + Math.random() * 9000);
};

export const createVA = async (req: Request, res: Response) => {
  try {
    const password = generateRandomPassword();
    const username = generateUniqueUsername();
    const passwordHash = await bcrypt.hash(password, 10);

    const { data: va, error } = await supabase
      .from('va_accounts')
      .insert({
        username,
        password_hash: passwordHash,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'VA account created successfully',
      data: {
        id: va.id,
        username: va.username,
        password // Show once to admin
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const vaLogin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const { data: va, error } = await supabase
      .from('va_accounts')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error || !va) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, va.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (va.status === 'rejected') {
      return res.status(403).json({ success: false, message: 'Access Denied' });
    }

    if (va.status === 'pending') {
       // Create a session entry even if pending, to track the request
       const sessionToken = crypto.randomBytes(32).toString('hex');
       await supabase.from('va_sessions').insert({
         va_id: va.id,
         session_token: sessionToken,
         is_active: false // Inactive until admin approves
       });
       
       return res.json({ 
         success: true, 
         message: 'Login request sent to Admin. Please wait for approval.',
         status: 'pending' 
       });
    }

    // If approved, create active session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const { error: sessionError } = await supabase.from('va_sessions').insert({
      va_id: va.id,
      session_token: sessionToken,
      is_active: true
    });

    if (sessionError) throw sessionError;

    // Fetch permissions to return to frontend
    const { data: permissions } = await supabase
      .from('va_permissions')
      .select('*')
      .eq('va_id', va.id)
      .single();

    // Generate a JWT for the frontend to store
    const token = jwt.sign({ vaId: va.id, sessionToken, type: 'va' }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: va.id,
        token,
        username: va.username,
        role: 'va',
        permissions: permissions || {}
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getVAs = async (req: Request, res: Response) => {
  try {
    const { data: vas, error } = await supabase
      .from('va_accounts')
      .select('*, va_permissions(*)');

    if (error) throw error;
    res.json({ success: true, data: vas });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateVAPermissions = async (req: Request, res: Response) => {
  try {
    const { vaId } = req.params;
    const permissions = req.body; // e.g. { can_edit: true, ... }

    const { error } = await supabase
      .from('va_permissions')
      .update({ ...permissions, updated_at: new Date() })
      .eq('va_id', vaId);

    if (error) throw error;
    res.json({ success: true, message: 'Permissions updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const approveVA = async (req: Request, res: Response) => {
  try {
    const { vaId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const status = action === 'approve' ? 'approved' : 'rejected';
    const { error } = await supabase
      .from('va_accounts')
      .update({ status })
      .eq('id', vaId);

    if (error) throw error;

    if (status === 'approved') {
       // Activate any pending sessions
       await supabase.from('va_sessions')
         .update({ is_active: true })
         .eq('va_id', vaId);
    }

    res.json({ success: true, message: `VA account ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const revokeVAAccess = async (req: Request, res: Response) => {
  try {
    const { vaId } = req.params;

    // Due to CASCADE, deleting the account will delete sessions and permissions
    const { error } = await supabase
      .from('va_accounts')
      .delete()
      .eq('id', vaId);

    if (error) throw error;
    res.json({ success: true, message: 'VA account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getVAActivity = async (req: Request, res: Response) => {
  try {
    const { vaId } = req.params;
    const { data, error } = await supabase
      .from('va_activity_logs')
      .select('*')
      .eq('va_id', vaId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const logVAActivity = async (vaId: string, action: string, details: any) => {
  try {
    await supabase.from('va_activity_logs').insert({
      va_id: vaId,
      action,
      details
    });
  } catch (error) {
    console.error('Failed to log VA activity:', error);
  }
};
