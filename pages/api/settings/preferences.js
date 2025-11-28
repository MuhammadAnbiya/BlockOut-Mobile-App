import prisma from '../../../lib/prisma';
import { authMiddleware } from '../../../middleware/authMiddleware';

async function handler(req, res) {
  const userId = req.user.userId;

  if (req.method === 'GET') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workoutPrefs: true }
    });

    const workoutToggles = {};
    user.workoutPrefs.forEach(pref => {
        workoutToggles[pref.type] = pref.isEnabled;
    });

    return res.status(200).json({
      notification: user.notificationEnabled,
      workout: workoutToggles
    });
  }

  if (req.method === 'POST') {
    const { notificationEnabled, workoutType, isEnabled } = req.body;

    try {
      if (typeof notificationEnabled !== 'undefined') {
        await prisma.user.update({
          where: { id: userId },
          data: { notificationEnabled }
        });
      }

      if (workoutType && typeof isEnabled !== 'undefined') {
        await prisma.workoutPreference.upsert({
          where: { 

             id: -1
          },
          create: {
             userId,
             type: workoutType,
             target: 10, 
             isEnabled
          },
          update: {
             isEnabled
          }
        });
        
        const existing = await prisma.workoutPreference.findFirst({
            where: { userId, type: workoutType }
        });

        if (existing) {
            await prisma.workoutPreference.update({
                where: { id: existing.id },
                data: { isEnabled }
            });
        } else {
            await prisma.workoutPreference.create({
                data: { userId, type: workoutType, target: 10, isEnabled }
            });
        }
      }

      return res.status(200).json({ success: true, message: 'Settings saved' });
    } catch (error) {
        console.error(error);
      return res.status(500).json({ error: 'Failed to save settings' });
    }
  }
}

export default authMiddleware(handler);