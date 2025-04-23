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
    try {
        const parsedData = CreateUserSchema.safeParse(req.body)

        if (!parsedData.success) {
            res.json({
                message: "Incorrect Input"
            })
            return
        }
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
    try {
        const parsedData = SigninSchema.safeParse(req.body)
        if (!parsedData.success) {
            res.json({
                message: "Incorrect Input"
            })
            return
        }

        const user = await prismaClient.user.findUnique({
            where: {
                email: parsedData.data.email,
            }
        })

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

app.post("/room", middleware, async (req, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body)
    if (!parsedData.success) {
        res.json({
            message: "Incorrect Input"
        })
        return;
    }
    // @ts-ignore: TODO: Fix this???
    const userId = req.userId

    await prismaClient.room.create({
        data: {
            slug: parsedData.data.name,
            adminId: userId
        }
    })
    res.json({
        roomId: userId
    })
})

app.listen(3001);