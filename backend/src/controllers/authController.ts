// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { sendEmail } from '../services/emailService';
import { logger } from '../utils/logger';

export const AuthController = {
  register: async (req: Request, res: Response) => {
    try {
      const { email, password, name, phone, company } = req.body;
      
      const userSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
      if (!userSnapshot.empty) {
        return res.status(400).json({ error: 'Email já registado' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const userRef = await db.collection('users').add({
        email,
        password: hashedPassword,
        name,
        phone,
        company,
        role: 'CLIENT',
        createdAt: FieldValue.serverTimestamp()
      });
      
      const userId = userRef.id;
      const token = jwt.sign(
        { id: userId, email, role: 'CLIENT' },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );
      
      await sendEmail({
        to: email,
        subject: 'Bem-vindo à Arisa Express',
        template: 'welcome',
        data: { name }
      });
      
      res.status(201).json({
        success: true,
        data: {
          user: { id: userId, email, name, role: 'CLIENT' },
          token
        }
      });
    } catch (error) {
      logger.error('Register error:', error);
      res.status(500).json({ error: 'Erro ao registar utilizador' });
    }
  },
  
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      const userSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
      if (userSnapshot.empty) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
      
      const userDoc = userSnapshot.docs[0];
      const user = { id: userDoc.id, ...userDoc.data() } as any;
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
      
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );
      
      await db.collection('activityLogs').add({
        userId: user.id,
        action: 'LOGIN',
        details: { ip: req.ip },
        timestamp: FieldValue.serverTimestamp()
      });
      
      res.json({
        success: true,
        data: {
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          token
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  },
  
  async refreshToken(req: Request, res: Response) {
    // Implementation for token refresh
    res.json({ success: true });
  },
  
  async logout(req: Request, res: Response) {
    res.json({ success: true, message: 'Logout successful' });
  },
  
  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    const userSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    let user = null;
    if (!userSnapshot.empty) {
      user = { id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data() } as any;
    }
    
    if (user) {
      const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
      await sendEmail({
        to: email,
        subject: 'Recuperação de Senha',
        template: 'reset-password',
        data: { name: user.name, token: resetToken }
      });
    }
    
    res.json({ success: true, message: 'Se o email existir, enviaremos instruções' });
  },
  
  async resetPassword(req: Request, res: Response) {
    res.json({ success: true });
  },
  
  async getCurrentUser(req: Request, res: Response) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const userDoc = await db.collection('users').doc(decoded.id).get();
      
      if (!userDoc.exists) return res.status(404).json({ error: 'Usuário não encontrado' });
      
      const { password, ...userWithoutPassword } = userDoc.data() as any;
      res.json({ success: true, data: { id: userDoc.id, ...userWithoutPassword } });
    } catch (error) {
      res.status(401).json({ error: 'Token inválido' });
    }
  }
};