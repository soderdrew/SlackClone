# Database Schema

## User
- id: ObjectId
- email: String (unique, required)
- password: String (hashed)
- username: String (unique, required)
- displayName: String
- avatar: String (URL)
- status: {
    text: String,
    emoji: String,
    type: Enum['online', 'offline', 'away', 'dnd'],
    expiresAt: Date
  }
- preferences: {
    theme: String,
    notifications: {
      desktop: Boolean,
      email: Boolean,
      sound: Boolean
    },
    timezone: String
  }
- lastSeen: Date
- createdAt: Date
- updatedAt: Date

## Channel
- id: ObjectId
- name: String (required)
- description: String
- type: Enum['public', 'private', 'dm', 'group_dm']
- createdBy: ObjectId (ref: User)
- members: [{
    user: ObjectId (ref: User),
    role: Enum['owner', 'admin', 'member'],
    joinedAt: Date
  }]
- isArchived: Boolean
- topic: String
- createdAt: Date
- updatedAt: Date

## Message
- id: ObjectId
- content: String
- contentType: Enum['text', 'file', 'system']
- sender: ObjectId (ref: User)
- channel: ObjectId (ref: Channel)
- thread: ObjectId (ref: Thread)
- parentMessage: ObjectId (ref: Message)
- mentions: [{
    user: ObjectId (ref: User),
    type: Enum['user', 'channel', 'here', 'everyone']
  }]
- reactions: [{
    emoji: String,
    users: [ObjectId] (ref: User),
    count: Number
  }]
- attachments: [{
    type: String,
    url: String,
    name: String,
    size: Number,
    thumbnailUrl: String
  }]
- editHistory: [{
    content: String,
    editedAt: Date,
    editedBy: ObjectId (ref: User)
  }]
- isEdited: Boolean
- isPinned: Boolean
- deliveryStatus: Enum['sent', 'delivered', 'read']
- readBy: [{
    user: ObjectId (ref: User),
    readAt: Date
  }]
- createdAt: Date
- updatedAt: Date

## Thread
- id: ObjectId
- channel: ObjectId (ref: Channel)
- parentMessage: ObjectId (ref: Message)
- participants: [ObjectId] (ref: User)
- lastReply: {
    content: String,
    sender: ObjectId (ref: User),
    timestamp: Date
  }
- replyCount: Number
- subscribedUsers: [ObjectId] (ref: User)
- createdAt: Date
- updatedAt: Date

## File
- id: ObjectId
- name: String
- type: String
- size: Number
- url: String
- thumbnailUrl: String
- uploadedBy: ObjectId (ref: User)
- channel: ObjectId (ref: Channel)
- message: ObjectId (ref: Message)
- accessLevel: Enum['public', 'private', 'channel']
- createdAt: Date
- updatedAt: Date

## UserPresence
- id: ObjectId
- user: ObjectId (ref: User)
- status: Enum['online', 'offline', 'away', 'dnd']
- lastActiveAt: Date
- currentChannel: ObjectId (ref: Channel)
- device: String
- updatedAt: Date

## Workspace
- id: ObjectId
- name: String
- domain: String
- owner: ObjectId (ref: User)
- settings: {
    defaultChannels: [ObjectId] (ref: Channel),
    fileUploadLimit: Number,
    allowedEmailDomains: [String],
    retentionPolicy: {
      days: Number,
      enabled: Boolean
    }
  }
- createdAt: Date
- updatedAt: Date 