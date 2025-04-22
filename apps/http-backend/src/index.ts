import express from "express";
import jwt from "jsonwebtoken";
import { hash } from 'bcrypt';

import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client"


const app = express();
app.use(express.json())

app.post("/signup", async (req, res) => {
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

app.post("/signin", (req, res) => {
    const data = SigninSchema.safeParse(req.body)
    if (!data.success) {
        res.json({
            message: "Incorrect Input"
        })
        return
    }

    const userId = 1;
    const token = jwt.sign({
        userId
    }, JWT_SECRET);

    res.json({
        token
    })
})

app.post("/room", middleware, (req, res) => {
    const data = CreateRoomSchema.safeParse(req.body)
    if (!data.success) {
        res.json({
            message: "Incorrect Input"
        })
        return
    }
    // db call

    res.json({
        roomId: 123
    })
})

app.listen(3001);