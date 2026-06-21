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
        phone: phone || '',
        company: company || '',
        role: 'CLIENT',
        createdAt: FieldValue.serverTimestamp()
      });
      
      const userId = userRef.id;
      const token = jwt.sign(
        { id: userId, email, role: 'CLIENT' },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );
      
      // Enviar email (não bloquear se falhar)
      try {
        await sendEmail({
          to: email,
          subject: 'Bem-vindo à Arisa Express',
          template: 'welcome',
          data: { name }
        });
      } catch (emailError) {
        logger.error('Erro ao enviar email de boas-vindas:', emailError);
      }
      
      res.status(201).json({
        success: true,
        data: {
          user: { id: userId, email, name, role: 'CLIENT' },
          token
        }
      });
    } catch (error) {
      logger.error('Erro no registo:', error);
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
      
      res.json({
        success: true,
        data: {
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          token
        }
      });
    } catch (error) {
      logger.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  },
  
  refreshToken: async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Token não fornecido' });
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const newToken = jwt.sign(
        { id: decoded.id, email: decoded.email, role: decoded.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );
      res.json({ success: true, data: { token: newToken } });
    } catch (error) {
      res.status(401).json({ error: 'Token inválido' });
    }
  },
  
  logout: async (req: Request, res: Response) => {
    res.json({ success: true, message: 'Logout realizado com sucesso' });
  },
  
  forgotPassword: async (req: Request, res: Response) => {
    const { email } = req.body;
    // Implementar envio de email de recuperação (opcional)
    res.json({ success: true, message: 'Se o email existir, enviaremos instruções' });
  },
  
  resetPassword: async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    // Implementar redefinição de senha (opcional)
    res.json({ success: true, message: 'Senha redefinida com sucesso' });
  },
  
  getCurrentUser: async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Não autenticado' });
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const userDoc = await db.collection('users').doc(decoded.id).get();
      if (!userDoc.exists) return res.status(404).json({ error: 'Utilizador não encontrado' });
      
      const { password, ...userData } = userDoc.data() as any;
      res.json({ success: true, data: { id: userDoc.id, ...userData } });
    } catch (error) {
      res.status(401).json({ error: 'Token inválido' });
    }
  }
};