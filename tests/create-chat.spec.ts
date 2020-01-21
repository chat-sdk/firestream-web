import { IFireStream } from '../lib'
import { User } from '../lib/chat'
import { RoleType } from '../lib/types'

export const createChatTest = (FS: IFireStream) => async (testUsers: User[]) => {
    const chatName = 'Test'
    const chatImageUrl = 'https://chatsdk.co/wp-content/uploads/2017/01/image_message-407x389.jpg'
    const customData = {
        TestKey:  'TestValue',
        Key2: 999,
    }

    const chat = await FS.createChat(chatName, chatImageUrl, customData, testUsers)

    if (chat.getName() !== chatName) {
        throw new Error('Name mismatch')
    }

    if (chat.getImageURL() !== chatImageUrl) {
        throw new Error('Image url mismatch')
    }

    if (!chat.getId()) {
        throw new Error('Chat id not set')
    }

    if (chat.getCustomData()) {
        if (JSON.stringify(chat.getCustomData()) !== JSON.stringify(customData)) {
            throw new Error('Custom data value mismatch')
        }
    } else {
        throw new Error('Custom data is null')
    }

    for (const user of chat.getUsers()) {
        for (const testUser of testUsers) {
            if (user.equals(testUser) && !user.isMe()) {
                if (!user.roleType!.equals(testUser.roleType!)) {
                    throw new Error('Role type mismatch')
                }
            }
        }
        if (user.isMe() && !user.roleType!.equals(RoleType.owner())) {
            throw new Error('Creator user not owner')
        }
    }
}
