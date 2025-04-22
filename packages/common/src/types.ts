import { z } from 'zod';

export const CreateUserSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),


    password: z.string()
        .min(8, "Password must be at least 8 characters long")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
            "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"),

    name: z.string()
        .min(1, "Name is required")
        .max(100, "Name must not exceed 100 characters")
        .trim()
});

export const SigninSchema = z.object({
    email: z.string().email({ message: "Email is required" }), password: z.string().min(1, "Password is required"),
});

export const CreateRoomSchema = z.object({
    name: z.string()
        .min(1, "Room name is required")
        .max(50, "Room name must not exceed 50 characters")
        .trim()
        .regex(/^[a-zA-Z0-9\s_-]+$/, "Room name can only contain letters, numbers, spaces, underscores, and hyphens")
});