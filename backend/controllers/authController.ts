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
      const { email, password, confirmPassword, name, phone, company } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'As senhas não coincidem' });
      }

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
      const accessToken = jwt.sign(
        { id: userId, email, role: 'CLIENT' },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { id: userId, email, role: 'CLIENT' },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      await db.collection('refreshTokens').doc(refreshToken).set({
        userId,
        email,
        role: 'CLIENT',
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

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
          accessToken,
          refreshToken
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

      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      await db.collection('refreshTokens').doc(refreshToken).set({
        userId: user.id,
        email: user.email,
        role: user.role,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      res.json({
        success: true,
        data: {
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  },

  refreshToken: async (req: Request, res: Response) => {
    try {
      const refreshToken = req.headers.authorization?.replace('Bearer ', '');
      if (!refreshToken) return res.status(401).json({ error: 'Refresh token não fornecido' });

      const tokenDoc = await db.collection('refreshTokens').doc(refreshToken).get();
      if (!tokenDoc.exists) {
        return res.status(401).json({ error: 'Refresh token inválido' });
      }

      const tokenData = tokenDoc.data() as any;
      if (tokenData.expiresAt?.toDate?.() < new Date()) {
        await tokenDoc.ref.delete();
        return res.status(401).json({ error: 'Refresh token expirado' });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;

      const newAccessToken = jwt.sign(
        { id: decoded.id, email: decoded.email, role: decoded.role },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      const newRefreshToken = jwt.sign(
        { id: decoded.id, email: decoded.email, role: decoded.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      await tokenDoc.ref.delete();

      await db.collection('refreshTokens').doc(newRefreshToken).set({
        userId: decoded.id,
        email: decoded.email,
        role: decoded.role,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      res.json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
    } catch (error) {
      res.status(401).json({ error: 'Refresh token inválido' });
    }
  },

  logout: async (req: Request, res: Response) => {
    try {
      const refreshToken = req.headers.authorization?.replace('Bearer ', '');
      if (refreshToken) {
        await db.collection('refreshTokens').doc(refreshToken).delete();
      }
      res.json({ success: true, message: 'Logout realizado com sucesso' });
    } catch (error) {
      res.json({ success: true, message: 'Logout realizado com sucesso' });
    }
  },

  forgotPassword: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }

      const userSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
      if (userSnapshot.empty) {
        return res.json({ success: true, message: 'Se o email existir, enviaremos instruções' });
      }

      const userDoc = userSnapshot.docs[0];
      const resetToken = jwt.sign(
        { id: userDoc.id, email },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      await db.collection('passwordResets').add({
        userId: userDoc.id,
        email,
        token: resetToken,
        used: false,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      });

      try {
        await sendEmail({
          to: email,
          subject: 'Recuperação de Senha - Arisa Express',
          template: 'reset-password',
          data: {
            name: (userDoc.data() as any).name || 'Utilizador',
            token: resetToken
          }
        });
      } catch (emailError) {
        logger.error('Erro ao enviar email de recuperação:', emailError);
      }

      res.json({ success: true, message: 'Se o email existir, enviaremos instruções' });
    } catch (error) {
      logger.error('Erro no forgotPassword:', error);
      res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
      }

      const resetSnapshot = await db.collection('passwordResets')
        .where('token', '==', token)
        .where('used', '==', false)
        .limit(1)
        .get();

      if (resetSnapshot.empty) {
        return res.status(400).json({ error: 'Token inválido ou já utilizado' });
      }

      const resetDoc = resetSnapshot.docs[0];
      const resetData = resetDoc.data() as any;

      if (resetData.expiresAt?.toDate?.() < new Date()) {
        await resetDoc.ref.update({ used: true });
        return res.status(400).json({ error: 'Token expirado' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.collection('users').doc(decoded.id).update({
        password: hashedPassword
      });

      await resetDoc.ref.update({ used: true });

      res.json({ success: true, message: 'Senha redefinida com sucesso' });
    } catch (error) {
      logger.error('Erro no resetPassword:', error);
      res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
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