import { RequestHandler, Router } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

const router = Router();

const userDetailsSchema = z.object({
    userId : z.string()
})

const getUserDetails: RequestHandler = async (req, res) => {
  const input = userDetailsSchema.safeParse(req.query);
  if (!input.success) {
    res.status(400).json("Invalid Request");
    return;
  }

  const { userId } = input.data;
  try {
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      }
    });
    if (!user) {
      res.status(404).json("User Not Found");
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json("Internal Server Error");
  }
};

router.get('/', getUserDetails);

export default router;