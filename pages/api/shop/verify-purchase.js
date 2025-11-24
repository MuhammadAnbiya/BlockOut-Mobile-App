import prisma from '../../../lib/prisma'; // FIX: Import dari lib
import { ethers } from 'ethers';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { provider } from '../../../lib/web3';

const ITEM_PRICES = {
  "skin_dragon": "500",
  "skin_robot": "1000"
};

const ADMIN_WALLET = process.env.ADMIN_WALLET_ADDRESS ? process.env.ADMIN_WALLET_ADDRESS.toLowerCase() : "";

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { txHash, itemId } = req.body;
  const userId = req.user.userId;

  if (!txHash || !itemId) return res.status(400).json({ error: 'Missing data' });

  try {
    const existingPurchase = await prisma.purchaseHistory.findUnique({
      where: { txHash: txHash }
    });

    if (existingPurchase) {
      return res.status(409).json({ error: 'Transaction hash already used' });
    }

    const tx = await provider.getTransaction(txHash);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1) {
      return res.status(400).json({ error: 'Transaction failed or pending' });
    }

    if (tx.to.toLowerCase() !== ADMIN_WALLET) {
      return res.status(400).json({ error: 'Invalid recipient address' });
    }

    const expectedPrice = ITEM_PRICES[itemId];
    if (!expectedPrice) return res.status(400).json({ error: 'Invalid Item ID' });

    const valueSent = ethers.formatUnits(tx.value, 18); 
    if (parseFloat(valueSent) < parseFloat(expectedPrice)) {
       return res.status(400).json({ error: 'Insufficient payment amount' });
    }

    await prisma.$transaction([
      prisma.purchaseHistory.create({
        data: { userId, itemId, txHash, amount: valueSent }
      }),
      prisma.inventory.create({
        data: { userId, itemId, itemType: 'SHIRT', isOwned: true }
      })
    ]);

    res.status(200).json({ success: true, message: 'Item Unlocked!' });

  } catch (error) {
    console.error("Verify Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default authMiddleware(handler);