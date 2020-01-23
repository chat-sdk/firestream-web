import { EventType, IFireStream, RoleType, Event } from '../lib'
import { User } from '../lib/chat'
import { SubscriptionMap } from '../lib/firebase/rx/subscription-map'
import { IJsonObject } from '../lib/interfaces/json'

const handleError = (err: any) => {
    throw err
}

export const modifyChatTest = (FS: IFireStream, sm: SubscriptionMap) => async (testUsers: User[]) => {
    const chatName = 'Test2'
    const chatImageURL = 'http://chatsdk.co/wp-content/uploads/2019/03/ic_launcher_big.png'
    
    const customData = {
        'TestKey3': 'TestValuexx',
        'Key4': 999,
    }
    
    // Modify the chat
    const chats = FS.getChats()
    
    if (chats.length === 0) {
        throw new Error('Chat doesn\'t exist')
    } else {
        const chat = chats[0]
        
        const nameEvents = new Array<string>()
        const imageURLEvents = new Array<string>()
        const customDataEvents = new Array<IJsonObject>()
        const userEvents = new Array<Event<User>>()
        
        const removedUsers = new Array<User>()
        const addedUsers = new Array<User>()
        
        sm.add(chat.getNameChangeEvents().subscribe(s => {
            nameEvents.push(s)
        }, handleError))
        
        sm.add(chat.getImageURLChangeEvents().subscribe(s => {
            imageURLEvents.push(s)
        }, handleError))
        
        sm.add(chat.getCustomDataChangedEvents().subscribe(map => {
            customDataEvents.push(map)
        }, handleError))
        
        const userEventsSubscription = chat.getUserEvents().newEvents().subscribe(userEvent => {
            console.warn('TEST:', userEvent.getType())
            if (userEvent.typeIs(EventType.Modified)) {
                userEvents.push(userEvent)
            } else {
                throw new Error('Add or Remove User event when modify expected')
            }
        }, handleError)
        
        chat.setName(chatName).then(() => {
            if (chat.getName() !== chatName) {
                throw new Error('Chat name not updated')
            }
        }, handleError)
        
        chat.setImageURL(chatImageURL).then(() => {
            if (chat.getImageURL() !== chatImageURL) {
                throw new Error('Chat image URL not updated')
            }
        }, handleError)
        
        chat.setCustomData(customData).then(() => {
            if (JSON.stringify(chat.getCustomData()) !== JSON.stringify(customData)) {
                throw new Error('Chat custom data not updated')
            }
        }, handleError)
        
        for (const u of testUsers) {
            if (!u.isMe()) {
                chat.setRole(u, u.getRoleType()!).then(() => {
                    // Check the user's role
                    if (!u.equalsRoleType(chat.getRoleType(u))) {
                        throw new Error('User role updated not correct')
                    }
                }, handleError)
            }
        }
        
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                
                // Check the chat isType correct
                // Check the name matches
                if (chat.getName() !== chatName) {
                    reject(new Error('Name mismatch'))
                }
                
                if (chat.getImageURL() !== chatImageURL) {
                    reject(new Error('Image URL mismatch'))
                }
                
                if (JSON.stringify(chat.getCustomData()) !== JSON.stringify(customData)) {
                    reject(new Error('Custom data mismatch'))
                }
                
                // Check the users
                for (const user of chat.getUsers()) {
                    for (const u of testUsers) {
                        if (user.equals(u) && !user.isMe()) {
                            if (!user.equalsRoleType(u)) {
                                reject(new Error('Role type mismatch'))
                            }
                        }
                    }
                    if (user.isMe() && !user.equalsRoleType(RoleType.owner())) {
                        reject(new Error('Creator user not owner'))
                    }
                }
                
                if (nameEvents.length === 0) {
                    reject(new Error('Name not set from stream'))
                } else {
                    if (nameEvents[nameEvents.length - 1] !== chatName) {
                        reject(new Error('Name from stream incorrect'))
                    }
                }
                
                if (imageURLEvents.length === 0) {
                    reject(new Error('ImageURL not set from stream'))
                } else {
                    if (imageURLEvents[imageURLEvents.length - 1] !== chatImageURL) {
                        reject(new Error('ImageURL from stream incorrect'))
                    }
                }
                
                if (customDataEvents.length === 0) {
                    reject(new Error('Custom data not set from stream'))
                } else {
                    if (customDataEvents[customDataEvents.length - 1] === customData) {
                        reject(new Error('Custom data from stream incorrect'))
                    }
                }
                
                userEventsSubscription.unsubscribe()
                
                sm.add(chat.getUserEvents().newEvents().subscribe(userEvent => {
                    if (userEvent.typeIs(EventType.Added)) {
                        addedUsers.push(userEvent.get())
                    }
                    else if (userEvent.typeIs(EventType.Removed)) {
                        removedUsers.push(userEvent.get())
                    }
                    else {
                        reject(new Error('Modify event when added or removed expected'))
                    }
                }, handleError))
                
                // Now try to add one user and remove another user
                const u1 = testUsers[0]
                
                chat.removeUser(u1).then(() => {
                    const role = chat.getRoleType(u1)
                    if (role) {
                        reject(new Error('User removed but still exists in chat'))
                    }
                })
                
                setTimeout(() => {
                    if (removedUsers.length === 0) {
                        reject(new Error('User removed event didn\'t fire'))
                    } else {
                        if (!removedUsers[0].equals(u1)) {
                            reject(new Error('Removed user mismatch'))
                        }
                    }
                    
                    chat.addUser(false, u1).then(() => {
                        const role = chat.getRoleType(u1)
                        if (!role?.equals(u1.getRoleType())) {
                            reject(new Error('Added user has wrong role'))
                        }
                    })
                    
                    setTimeout(() => {
                        if (addedUsers.length === 0) {
                            reject(new Error('User added event didn\'t fire'))
                        } else {
                            if (!addedUsers[0].equals(u1)) {
                                reject(new Error('Added user mismatch'))
                            }
                        }
                        
                        resolve()
                        
                    }, 200)
                }, 2000)
            }, 4000)
        })
    }
}
