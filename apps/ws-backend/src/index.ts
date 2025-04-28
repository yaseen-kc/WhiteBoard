import { WebSocket, WebSocketServer } from 'ws'
import jwt, { JwtPayload } from "jsonwebtoken"
import { JWT_SECRET } from '@repo/backend-common/config'
import { prismaClient } from "@repo/db/client"


const wss = new WebSocketServer({ port: 8080 })

interface User {
  ws: WebSocket,
  rooms: String[],
  userId: String
}

const users: User[] = []

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)

    if (typeof decoded === "string") {
      return null
    }

    const payload = decoded as JwtPayload
    if (!payload || !payload.userId) {
      return null
    }

    return payload.userId as string
  } catch (err) {
    console.error("Token verification failed:", err)
    return null
  }

}

wss.on('connection', function connection(ws, request) {
  const url = request.url
  if (!url) {
    ws.close()
    return
  }

  const queryParams = new URLSearchParams(url.split('?')[1])
  const token = queryParams.get('token') || ""
  const userId = checkUser(token)

  if (userId === null) {
    ws.close()
    return
  }

  const user: User = {
    userId,
    rooms: [],
    ws
  }

  users.push(user)

  ws.on('message', async function message(data) {
    try {
      const parsedData = JSON.parse(data.toString())

      switch (parsedData.type) {
        case "join_room":
          if (!user.rooms.includes(parsedData.roomId)) {
            user.rooms.push(parsedData.roomId)
            console.log(`User ${userId} joined room ${parsedData.roomId}`)
          }
          break

        case "leave_room":
          user.rooms = user.rooms.filter(x => x !== parsedData.roomId)
          console.log(`User ${userId} left room ${parsedData.roomId}`)
          break

        case "chat":
          const { roomId, message } = parsedData

          if (!roomId || !message) {
            console.error("Missing roomId or message")
            return
          }

          if (!user.rooms.includes(roomId)) {
            console.error(`User ${userId} attempted to send message to room ${roomId} they haven't joined`)
            return
          }

          try {
            await prismaClient.chat.create({
              data: {
                roomId,
                message,
                userId
              }
            })

            const messageData = JSON.stringify({
              type: "chat",
              message,
              roomId,
              userId
            })

            users.forEach(u => {
              if (u.userId !== userId && u.rooms.includes(roomId)) {
                u.ws.send(messageData)
              }
            })
          } catch (dbError) {
            console.error("Database error:", dbError)
          }
          break

        default:
          console.warn(`Unknown message type: ${parsedData.type}`)
      }
    } catch (err) {
      console.error("Error processing message:", err)
    }
  })

  ws.on('close', function () {
    console.log(`User ${userId} disconnected`)
    const index = users.findIndex(u => u.userId === userId)
    if (index !== -1) {
      users.splice(index, 1)
    }
  })

  ws.on('error', function (err) {
    console.error(`WebSocket error for user ${userId}:`, err)
    ws.close()
  })
})
