import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export function middleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        res.status(401).json({
            message: "Authentication token is required"
        })
        return
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (typeof decoded === 'object' && decoded !== null) {

            req.userId = decoded.userId;
            next();
        } else {
            throw new Error("Invalid token payload");
        }
    } catch (error) {
        res.status(401).json({
            message: "Invalid or expired token"
        })
        return
    }

}