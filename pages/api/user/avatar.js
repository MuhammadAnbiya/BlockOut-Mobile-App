import prisma from '../../../lib/prisma';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { SHOP_CATALOG } from '../../../lib/shopCatalog';

async function handler(req, res) {
  const userId = req.user.userId;

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { inventory: true }
      });

      const responseData = {
        equipped: {
            top: user.equippedTop,
            shirt: user.equippedShirt,
            pants: user.equippedPants,
            shoes: user.equippedShoes,
            gender: user.avatarGender
        },
        stats: {
            coins: user.coinsBalance,
            streak: user.dayStreak
        },
        inventory: user.inventory.map(i => i.itemId) 
      };

      return res.status(200).json(responseData);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch avatar data' });
    }
  }

  if (req.method === 'PUT') {
    const { itemId, category } = req.body; 

    if (!itemId || !category) return res.status(400).json({ error: 'Missing itemId or category' });

    try {
      if (!itemId.startsWith("starter_")) {
          const hasItem = await prisma.inventory.findFirst({
            where: { userId, itemId }
          });
          if (!hasItem) return res.status(403).json({ error: 'You do not own this item!' });
      }

      let updateData = {};
      if (category === 'TOP') updateData.equippedTop = itemId;
      else if (category === 'SHIRT') updateData.equippedShirt = itemId;
      else if (category === 'PANTS') updateData.equippedPants = itemId;
      else if (category === 'SHOES') updateData.equippedShoes = itemId;
      else return res.status(400).json({ error: 'Invalid category' });

      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      return res.status(200).json({ success: true, message: 'Avatar updated!' });

    } catch (error) {
      return res.status(500).json({ error: 'Failed to equip item' });
    }
  }

  return res.status(405).end();
}

export default authMiddleware(handler);