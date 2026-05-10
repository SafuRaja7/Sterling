import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/db';

// @desc    Get or create user's support thread
// @route   GET /api/chat/thread
export const getThread = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    // 1. Try to find existing thread
    let { data: thread, error: threadError } = await supabase
      .from('support_threads')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (threadError) throw threadError;

    // 2. If no thread exists, create one
    if (!thread) {
      const { data: newThread, error: createError } = await supabase
        .from('support_threads')
        .insert({ user_id: userId, status: 'open' })
        .select()
        .single();
      
      if (createError) throw createError;
      thread = newThread;
    }

    // 3. Fetch messages for this thread
    const { data: messages, error: messagesError } = await supabase
      .from('support_messages')
      .select('*')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // 4. Mark messages as read by user (sender_type='admin')
    await supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('thread_id', thread.id)
      .eq('sender_type', 'admin');

    // Reset unread count for user
    await supabase
      .from('support_threads')
      .update({ unread_user_count: 0 })
      .eq('id', thread.id);

    res.json({
      success: true,
      data: {
        thread,
        messages: messages || []
      }
    });
  } catch (error: any) {
    console.error("GET_THREAD_ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send message from user
// @route   POST /api/chat/message
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { message, attachmentUrl } = req.body;
    const userId = req.user._id;

    if (!message && !attachmentUrl) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    // 1. Get user thread (create if missing)
    let { data: thread, error: threadError } = await supabase
      .from('support_threads')
      .select('id, unread_admin_count')
      .eq('user_id', userId)
      .maybeSingle();

    if (threadError) throw threadError;

    if (!thread) {
      const { data: newThread, error: createError } = await supabase
        .from('support_threads')
        .insert({ user_id: userId, status: 'open' })
        .select()
        .single();
      
      if (createError) throw createError;
      thread = newThread;
    }

    if (!thread) {
      return res.status(500).json({ success: false, message: 'Failed to initialize support thread' });
    }

    // 2. Create message
    const { data: newMessage, error: messageError } = await supabase
      .from('support_messages')
      .insert({
        thread_id: thread.id,
        sender_id: userId,
        sender_type: 'user',
        message,
        attachment_url: attachmentUrl
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // 3. Update thread
    await supabase
      .from('support_threads')
      .update({ 
        last_message_at: new Date(),
        unread_admin_count: (thread.unread_admin_count || 0) + 1,
        status: 'open'
      })
      .eq('id', thread.id);

    // 4. Emit via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('admin_notifications').emit('new_support_message', {
        threadId: thread.id,
        userId: userId,
        username: req.user.username,
        message: newMessage
      });
    }

    res.status(201).json({ success: true, data: newMessage });
  } catch (error: any) {
    console.error("SEND_MESSAGE_ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
