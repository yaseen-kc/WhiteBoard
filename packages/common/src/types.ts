import { z } from 'zod';

export const CreateUserSchema = z.object({
    username: z.string()
        .min(3, "Username must be at least 3 characters long")
        .max(30, "Username must not exceed 30 characters")
        .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),

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
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

export const CreateRoomSchema = z.object({
    name: z.string()
        .min(1, "Room name is required")
        .max(50, "Room name must not exceed 50 characters")
        .trim()
        .regex(/^[a-zA-Z0-9\s_-]+$/, "Room name can only contain letters, numbers, spaces, underscores, and hyphens")
});