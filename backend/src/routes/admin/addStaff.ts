import { RequestHandler, Router } from "express";
import prisma from "../../lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Define validation schema for adding staff
const addStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const addStaff: RequestHandler = async (req, res) => {

  const input = addStaffSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ message: "Invalid input", errors: input.error.errors });
    return;
  }

  const { email, password, firstName, lastName } = input.data;

  try {
    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ message: "User with this email already exists" });
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new staff member (librarian)
    const newStaff = await prisma.users.create({
      data: {
        id: uuidv4(),
        email,
        passwordHash,
        firstName,
        lastName,
        role: "LIBRARIAN",
        updatedAt: new Date(),
        isActive: true,
      },
    });

    // Return success response without sensitive data
    res.status(201).json({
      message: "Staff member created successfully",
      staff: {
        id: newStaff.id,
        email: newStaff.email,
        firstName: newStaff.firstName,
        lastName: newStaff.lastName,
        role: newStaff.role,
      },
    });
  } catch (error) {
    console.error("Error creating staff member:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

router.post("/", addStaff);

export default router;