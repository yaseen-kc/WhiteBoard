import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { compare, hash } from 'bcrypt';

import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client"


const app = express();
app.use(express.json())

app.post("/signup", async (req: Request, res: Response) => {
    const parsedData = CreateUserSchema.safeParse(req.body)
    if (!parsedData.success) {
        res.status(400).json({
            message: "Incorrect Input",
            errors: parsedData.error.errors
        })
        return
    }
    try {
        const hashedPassword = await hash(parsedData.data.password, 10);
        const user = await prismaClient.user.create({
            data: {
                email: parsedData.data?.email,
                password: hashedPassword,
                name: parsedData.data.name
            }
        })
        res.status(201).json({
            message: "User created successfully",
            userId: user.id
        });
        return
    } catch (error) {
        res.status(411).json({
            message: "User Already Exists"
        })
    }
})

app.post("/signin", async (req: Request, res: Response) => {
    const parsedData = SigninSchema.safeParse(req.body)
    if (!parsedData.success) {
        res.status(400).json({
            message: "Incorrect Input",
            errors: parsedData.error.errors
        })
        return
    }
    const user = await prismaClient.user.findUnique({
        where: {
            email: parsedData.data.email,
        }
    })
    try {
        if (!user) {
            res.status(401).json({
                message: "Invalid Credentials"
            })
            return
        }
        const passwordValid = await compare(parsedData.data.password, user.password)
        if (!passwordValid) {
            res.status(401).json({
                message: "Invalid Credentials"
            })
            return
        }
        const token = jwt.sign({
            userId: user.id
        }, JWT_SECRET);
        res.json({
            token
        })
        return
    } catch (error) {
        res.status(500).json({
            message: "Error during authentication"
        })
        return
    }
})

app.post("/room", middleware, async (req: Request, res: Response) => {
    const parsedData = CreateRoomSchema.safeParse(req.body)
    if (!parsedData.success) {
        res.status(400).json({
            message: "Incorrect Input",
            errors: parsedData.error.errors
        })
        return;
    }
    const userId = req.userId
    if (!userId) {
        res.status(401).json({
            message: "User ID not found in token"
        });
        return;
    }
    try {
        const room = await prismaClient.room.create({
            data: {
                slug: parsedData.data.name,
                adminId: userId
            }
        })
        res.status(201).json({
            roomId: room.id
        })
        return
    } catch (error) {
        console.error("Failed to create room:", error);
        res.status(500).json({
            message: "Failed to create room"
        });
        return
    }
})

app.listen(3001);