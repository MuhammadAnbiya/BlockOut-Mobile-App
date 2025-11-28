import prisma from '../../../lib/prisma';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { SHOP_CATALOG } from '../../../lib/shopCatalog'

const STARTER_ITEMS = [
  { id: "starter_hair", name: "Red Hair", type: "TOP" },
  { id: "starter_shirt", name: "Basic Shirt", type: "SHIRT" },
  { id: "starter_pants", name: "Blue Shorts", type: "PANTS" },
  { id: "starter_shoes", name: "Black Sneakers", type: "SHOES" }
];

async function handler(req, res) {
  const userId = req.user.userId;

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { inventory: true }
      });

      const ownedItems = user.inventory.map(inv => {
        const catalogItem = SHOP_CATALOG[inv.itemId];
        if (catalogItem) {
            return { 
                id: inv.itemId, 
                name: catalogItem.name, 
                type: catalogItem.type 
            };
        }
        return null;
      }).filter(Boolean); 

      const allMyItems = [...STARTER_ITEMS, ...ownedItems];

      const categorizedInventory = {
        TOP: allMyItems.filter(i => i.type === 'TOP'),
        SHIRT: allMyItems.filter(i => i.type === 'SHIRT'),
        PANTS: allMyItems.filter(i => i.type === 'PANTS'),
        SHOES: allMyItems.filter(i => i.type === 'SHOES') 
      };

      const responseData = {
        userProfile: {
            name: `${user.firstName} ${user.lastName}`,
            avatarUrl: user.avatarUrl || "",
        },
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
        inventory: categorizedInventory
      };

      return res.status(200).json(responseData);
    } catch (error) {
      console.error("Avatar Error:", error);
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
      else if (category === 'SHOES' || category === 'BOTTOM') updateData.equippedShoes = itemId;
      else return res.status(400).json({ error: 'Invalid category' });

      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      return res.status(200).json({ success: true, message: 'Avatar updated!' });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to equip item' });
    }
  }

  return res.status(405).end();
}

export default authMiddleware(handler);