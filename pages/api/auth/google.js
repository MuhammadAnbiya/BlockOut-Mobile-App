import prisma from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;
const client = new OAuth2Client(CLIENT_ID);

async function verifyGoogleToken(idToken) {
  try {
    console.log("🔍 Verifying Google Token...");
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: CLIENT_ID, 
    });
    console.log("✅ Google Token Valid!");
    return ticket.getPayload();
  } catch (error) {
    console.error("❌ Google Verification Failed:", error.message);
    throw new Error(`Google Token Error: ${error.message}`);
  }
}

async function findOrCreateUser(payload) {
  const { email, given_name, family_name } = payload;

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log("🆕 Creating new user from Google...");
    user = await prisma.user.create({
      data: {
        email,
        firstName: given_name || "User",
        lastName: family_name || "",
        avatarGender: "MALE", 
        equippedTop: "starter_hair",
        equippedShirt: "starter_shirt",
        equippedPants: "starter_pants",
        equippedShoes: "starter_shoes"
      }
    });
  } else {
    console.log("👋 Existing user found.");
  }

  return user;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'Missing idToken' });
  }

  try {
    const googlePayload = await verifyGoogleToken(idToken);
    const user = await findOrCreateUser(googlePayload);
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      message: 'Google Login success',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        email: user.email,
        isNewUser: !user.createdAt 
      }
    });

  } catch (error) {
    console.error("🔥 API Error:", error.message);
    
    if (error.message.includes("Google Token Error")) {
      return res.status(401).json({ error: 'Invalid Google Token', details: error.message });
    }
    
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}