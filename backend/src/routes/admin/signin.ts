import { RequestHandler, Router } from "express";
import prisma from "../../lib/prisma";
import { signInSchema } from "../../types/zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();

const signIn: RequestHandler = async (req, res) => {
  const input = signInSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json("Invalid Request");
    return;
  }

  const { email , password } = input.data;
  try {
    const user = await prisma.users.findUnique({
      where: {
        email,
      },
      select: {
        email: true,
        role : true,
        passwordHash : true,
        id : true,
      }
    });
    if(!user){
      res.status(404).json("User Not Found");
      return;
    }
    const isMatch = await bcrypt.compare(password, user?.passwordHash);
    
    if (!isMatch) {
      res.status(401).json("Invalid Credentials");
      return;
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string);
    res.json({ token , email });
    return;

  } catch (error) {
    res.status(500).json("Internal Server Error");
    return;
  }
};

router.post('/', signIn);

export default router;