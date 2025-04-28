import { WebSocket, WebSocketServer } from 'ws';
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { prismaClient } from "@repo/db/client";


const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket,
  rooms: String[],
  userId: String
}

const users: User[] = []

function checkUser(token: string): string | null {
  const decoded = jwt.verify(token, JWT_SECRET);

  if (typeof decoded == "string") {
    return null;
  }

  if (!decoded || !decoded.userId) {
    return null;
  }

  return decoded.userId

}

wss.on('connection', function connection(ws, request) {
  const url = request.url;
  if (!url) {
    return;
  }
  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || "";
  const userId = checkUser(token)

  if (userId == null) {
    ws.close()
    return
  }

  users.push({
    userId,
    rooms: [],
    ws
  })

  ws.on('message', async function message(data) {
    try {
      const parsedData = JSON.parse(data as unknown as string)

      switch (parsedData.type) {
        case "join_room":

          break;

        default:
          break;
      }

      if (parsedData.type === "join_room") {
        const user = users.find(x => x.ws === ws)
        user?.rooms.push(parsedData.roomId)
      }

      if (parsedData.type === "leave_room") {
        const user = users.find(x => x.ws === ws)
        if (!user) {
          return
        }
        user.rooms = user?.rooms.filter(x => x === parsedData.room)
      }

      if (parsedData.type === "chat") {
        const roomId = parsedData.roomId
        const message = parsedData.message

        await prismaClient.chat.create({
          data: {
            roomId,
            message,
            userId
          }
        })

        users.forEach(user => {
          if (user.rooms.includes(roomId)) {
            user.ws.send(JSON.stringify({
              type: "chat",
              message: message,
              roomId
            }))
          }
        })
      }
    } catch (error) {

    }

  });
});
