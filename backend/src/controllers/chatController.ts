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
    let { data: messages, error: messagesError } = await supabase
      .from('support_messages')
      .select('*')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: true });

    if (messagesError && (messagesError.message.includes('thread_id') || messagesError.code === 'PGRST204' || messagesError.code === '42703')) {
      console.warn("Falling back to fetching messages by user_id for user side:", messagesError.message);
      const { data: rawMessages, error: msgError } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
        
      if (msgError) throw msgError;
      messages = rawMessages || [];
    } else if (messagesError) {
      throw messagesError;
    }

    // 4. Mark messages as read by user
    try {
      const { error: probeError } = await supabase.from('support_messages').select('thread_id').limit(1);
      const hasNewSchema = !probeError || (probeError.code !== '42703' && !probeError.message.includes('thread_id'));

      if (hasNewSchema) {
        await supabase
          .from('support_messages')
          .update({ is_read: true })
          .eq('thread_id', thread.id)
          .eq('sender_type', 'admin');
      } else {
        await supabase
          .from('support_messages')
          .update({ is_read: true })
          .eq('user_id', userId)
          .eq('sender', 'admin');
      }
    } catch (e) {
      console.warn("Failed to mark messages as read by user:", e);
    }

    // Reset unread count for user
    await supabase
      .from('support_threads')
      .update({ unread_user_count: 0 })
      .eq('id', thread.id);

    res.json({
      success: true,
      data: {
        thread,
        messages: (messages || []).map((msg: any) => ({
          ...msg,
          sender_type: msg.sender_type || msg.sender || 'user'
        }))
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
    const messagePayload: any = {
      message,
      attachment_url: attachmentUrl
    };

    // Try to determine which columns exist
    const { error: probeError } = await supabase.from('support_messages').select('thread_id').limit(1);
    const hasThreadId = !probeError || (probeError.code !== '42703' && !probeError.message.includes('thread_id'));

    if (hasThreadId) {
      messagePayload.thread_id = thread.id;
      messagePayload.sender_type = 'user';
      messagePayload.sender_id = userId;
    } else {
      messagePayload.user_id = userId;
      messagePayload.sender = 'user';
    }

    const { data: newMessage, error: messageError } = await supabase
      .from('support_messages')
      .insert(messagePayload)
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

    const responseData = {
      ...newMessage,
      sender_type: newMessage.sender_type || newMessage.sender || 'user'
    };

    res.status(201).json({ success: true, data: responseData });
  } catch (error: any) {
    console.error("SEND_MESSAGE_ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
