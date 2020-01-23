import { DeliveryReceiptType, IFireStream, SendableType, TypingStateType } from '../src'
import { SubscriptionMap } from '../src/firebase/rx/subscription-map'
import { DeliveryReceipt } from '../src/message/delivery-receipt'
import { Message } from '../src/message/message'
import { TextMessage } from '../src/message/text-message'
import { TypingState } from '../src/message/typing-state'

const messageText = (): string => {
    return 'Test'
}

const message = (): Message => {
    return new TextMessage(messageText())
}

const messageReceiptId = (): string => {
    return 'XXX'
}

const handleError = (err: any) => {
    throw err
}

export const messageChatTest = (FS: IFireStream, sm: SubscriptionMap) => async () => {
    // Modify the chat
    const chats = FS.getChats()

    if (chats.length === 0) {
        throw new Error('Chat doesn\'t exist')
    } else {
        const chat = chats[0]

        sm.add(chat.getSendableEvents().getErrors().subscribe(error => {
            throw error
        }))

        const messages = new Array<Message>()
        const receipts = new Array<DeliveryReceipt>()
        const typingStates = new Array<TypingState>()

        sm.add(chat.getSendableEvents().getMessages().allEvents().subscribe(event => {
            messages.push(event.get())
        }, handleError))

        sm.add(chat.getSendableEvents().getDeliveryReceipts().allEvents().subscribe(event => {
            receipts.push(event.get())
        }, handleError))

        sm.add(chat.getSendableEvents().getTypingStates().allEvents().subscribe(event => {
            typingStates.push(event.get())
        }, handleError))

        // Send a message
        await chat.send(message())
        {
            // The chat should not yet contain the message - messages are only received via events
            if (chat.getSendables(SendableType.message()).length !== 1) {
                throw new Error('Message not in sendables when it should be')
            } else {
                const message = TextMessage.fromSendable(chat.getSendables(SendableType.message())[0])
                if (message.getText() !== messageText()) {
                    throw new Error('Message text mismatch')
                }
            }
        }

        await chat.sendTypingIndicator(TypingStateType.typing())
        {
            if (chat.getSendables(SendableType.typingState()).length !== 1) {
                throw new Error('Typing state not in sendables when it should be')
            } else {
                const state = TypingState.fromSendable((chat.getSendables(SendableType.typingState())[0]))
                if (!state.getTypingStateType().equals(TypingStateType.typing())) {
                    throw new Error('Typing state type mismatch')
                }
            }
        }

        await chat.sendDeliveryReceipt(DeliveryReceiptType.received(), messageReceiptId())
        {
            if (chat.getSendables(SendableType.deliveryReceipt()).length !== 1) {
                throw new Error('delivery receipt not in sendables when it should be')
            } else {
                const receipt = DeliveryReceipt.fromSendable((chat.getSendables(SendableType.deliveryReceipt())[0]))
                if (!receipt.getDeliveryReceiptType().equals(DeliveryReceiptType.received())) {
                    throw new Error('Delivery receipt type mismatch')
                }
                if (receipt.getMessageId() !== messageReceiptId()) {
                    throw new Error('Delivery receipt message id incorrect')
                }
            }
        }

        await new Promise(resolve => setTimeout(resolve, 5000))

        // Check that the chat now has the message

        if (messages.length !== 0) {
            const message = TextMessage.fromSendable(messages[0])
            if (message.getText() !== messageText()) {
                throw new Error('Message text incorrect')
            }
        } else {
            throw new Error('Chat doesn\'t contain message')
        }

        if (receipts.length !== 0) {
            const receipt = DeliveryReceipt.fromSendable(receipts[0])
            if (!receipt.getDeliveryReceiptType().equals(DeliveryReceiptType.received())) {
                throw new Error('Delivery receipt type incorrect')
            }
            if (receipt.getMessageId() !== messageReceiptId()) {
                throw new Error('Delivery receipt message id incorrect')
            }
        } else {
            throw new Error('Chat doesn\'t contain delivery receipt')
        }

        if (typingStates.length !== 0) {
            const state = TypingState.fromSendable(typingStates[0])
            if (!state.getTypingStateType().equals(TypingStateType.typing())) {
                throw new Error('Typing state type incorrect')
            }
        } else {
            throw new Error('Chat doesn\'t contain typing state')
        }

        // Send 10 messages
        const completables = new Array<Promise<void>>()
        for (let i = 0; i < 10; i++) {
            completables.push(chat.sendMessageWithText(i + ''))
        }

        await Promise.all(completables)

        // The messages should have been delivered by now
        // Make a query to get all but the first and last messages in order
        const sendables = chat.getSendables()
        if (sendables.length !== 13) {
            throw new Error('There should be 13 messages and there are not')
        }

        const sendablesAll = await chat.loadMoreMessages(new Date(0), new Date(3000, 0))
        const allFirst = sendablesAll[0]
        const allSecond = sendablesAll[1]
        const allLast = sendablesAll[sendablesAll.length - 1]

        // Check first and last messages
        if (!allFirst.equals(sendables[0])) {
            throw new Error('All first message incorrect')
        }
        if (!allLast.equals(sendables[sendables.length-1])) {
            throw new Error('All last message incorrect')
        }
        if (sendablesAll.length !== sendables.length) {
            throw new Error('All size mismatch')
        }

        const indexOfFirst = 0
        const indexOfLast = sendablesAll.length - 1
        const limit = 5

        const fromSendable = sendablesAll[indexOfFirst]
        const toSendable = sendablesAll[indexOfLast]

        // Get the date of the second and penultimate
        const from = fromSendable.getDate()
        const to = toSendable.getDate()

        // There isType a timing issue here in that the date of the sendable
        // will actually be a Firebase prediction rather than the actual time recorded on the server
        {
            const sendablesFromTo = await chat.loadMoreMessages(from, to)
            if (sendablesFromTo.length !== 12) {
                throw new Error('From/To Sendable size incorrect')
            }
            
            const first = sendablesFromTo[0]
            const second = sendablesFromTo[1]
            const last = sendablesFromTo[sendablesFromTo.length - 1]
            
            // First message should be the same as the second overall message
            if (!first.equals(allSecond)) {
                throw new Error('From/To First message incorrect')
            }
            if (!last.equals(toSendable)) {
                throw new Error('From/To Last message incorrect')
            }
            // Check the first message isType on or after the from date
            if (first.getDate().getTime() <= from.getTime()) {
                throw new Error('From/To First message isType before from time')
            }
            if (last.getDate().getTime() > to.getTime()) {
                throw new Error('From/To Last message isType after to time')
            }
            if (second.getDate().getTime() < first.getDate().getTime()) {
                throw new Error('From/To Messages order incorrect')
            }
        }

        {
            const sendablesFrom = await chat.loadMoreMessagesFrom(from, limit)
            if (sendablesFrom.length !== limit) {
                throw new Error('From Sendable size incorrect')
            }

            const first = sendablesFrom[0]
            const second = sendablesFrom[1]
            const last = sendablesFrom[sendablesFrom.length - 1]

            if (!allSecond.equals(first)) {
                throw new Error('From First message incorrect')
            }
            if (!sendablesAll[limit].equals(last)) {
                throw new Error('From Last message incorrect')
            }

            // Check the first message isType on or after the from date
            if (first.getDate().getTime() <= from.getTime()) {
                throw new Error('From First message isType before from time')
            }
            if (second.getDate().getTime() < first.getDate().getTime()) {
                throw new Error('From Messages order incorrect')
            }
        }

        {
            const sendablesTo = await chat.loadMoreMessagesTo(to, limit)
            const first = sendablesTo[0]
            const second = sendablesTo[1]
            const last = sendablesTo[sendablesTo.length - 1]

            if (sendablesTo.length !== limit) {
                throw new Error('To Sendable size incorrect')
            }
            if (!first.equals(sendablesAll[sendablesAll.length - limit])) {
                throw new Error('To First message incorrect')
            }
            if (!toSendable.equals(last)) {
                throw new Error('To Last message incorrect')
            }
            if (last.getDate().getTime() > to.getTime()) {
                throw new Error('To Last message isType after to time')
            }
            if (second.getDate().getTime() < first.getDate().getTime()) {
                throw new Error('To Messages order incorrect')
            }
        }
    }
}
