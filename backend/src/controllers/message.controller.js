import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content, subject, propertyId } = req.body
    const msg = await prisma.message.create({
      data: { senderId: req.user.id, receiverId, content, subject, propertyId },
      include: { sender: { select: { firstName:true, lastName:true, avatar:true } } }
    })
    // Notification
    await prisma.notification.create({
      data: { userId: receiverId, title: 'Nouveau message', body: `De: ${msg.sender.firstName}`,
              type: 'message', link: `/messages/${req.user.id}` }
    })
    res.status(201).json(msg)
  } catch (e) { next(e) }
}

export const getConversations = async (req, res, next) => {
  try {
    const msgs = await prisma.message.findMany({
      where: { OR: [{ senderId: req.user.id }, { receiverId: req.user.id }] },
      include: {
        sender:   { select: { id:true, firstName:true, lastName:true, avatar:true } },
        receiver: { select: { id:true, firstName:true, lastName:true, avatar:true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    // Grouper par interlocuteur
    const convMap = {}
    for (const m of msgs) {
      const otherId = m.senderId === req.user.id ? m.receiverId : m.senderId
      if (!convMap[otherId]) convMap[otherId] = { messages: [], other: m.senderId === req.user.id ? m.receiver : m.sender }
      convMap[otherId].messages.push(m)
    }
    res.json(Object.values(convMap))
  } catch (e) { next(e) }
}

export const getConversation = async (req, res, next) => {
  try {
    const { userId } = req.params
    const messages = await prisma.message.findMany({
      where: { OR: [
        { senderId: req.user.id, receiverId: userId },
        { senderId: userId, receiverId: req.user.id }
      ]},
      include: { sender: { select: { firstName:true, lastName:true, avatar:true } } },
      orderBy: { createdAt: 'asc' }
    })
    // Marquer comme lus
    await prisma.message.updateMany({
      where: { senderId: userId, receiverId: req.user.id, status: 'SENT' },
      data: { status: 'READ' }
    })
    res.json(messages)
  } catch (e) { next(e) }
}
