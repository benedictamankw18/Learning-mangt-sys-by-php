---
name: chat-messaging-architecture
description: 'Design and implement WhatsApp/Telegram-style messaging for LMS with category group chats and cross-category individual chats. Use when adding room-based chat schema, backend APIs, and frontend chat UX.'
argument-hint: 'Chat scope to implement, e.g. "phase 1 schema", "chat endpoints", "admin chat UI", or "full rollout"'
---

# Chat Messaging Architecture (Room-Based)

## Use this skill when
- You need WhatsApp/Telegram-like chat behavior in LMS
- You need both:
  - category group chats (admin/teacher/student/parent/class/program)
  - direct one-to-one chat between any users, even across categories
- You are replacing or extending sender/receiver style messaging with room-based chat

## Source of truth
- Architecture plan: `d:\db\.md file\chat-messaging-architecture.md`

## Existing LMS constraints to respect
- Backend is PHP with Repository + Controller + Route pattern
- Frontend uses role dashboards and shared APIs in `lms-frontend/assets/js/config.js` and `lms-frontend/assets/js/api.js`
- Existing `messages` table and endpoints may still be in use; do not break legacy flows during migration

## Target architecture

### Core tables
Create these tables (keep legacy `messages` table until migration is complete):
- `chat_rooms`
- `chat_room_members`
- `chat_messages`
- `chat_message_reads`
- Optional: `chat_attachments`

### Key model decisions
- `chat_rooms.room_type`: `direct`, `group`, `broadcast`
- `chat_rooms.category_type`: `role`, `class`, `program`, `custom` (nullable for direct)
- Direct chat is one room with exactly 2 active members
- Group chat membership is user-based and can map to LMS categories
- Message rows belong to a room, not directly to one receiver

## Implementation workflow

### Step 1: Database migration (Phase 1)
- Add new chat tables and indexes
- Add FK constraints and unique keys
- Keep schema backward compatible

Checklist:
- [ ] Unique room identity (`uuid`)
- [ ] Unique room member tuple (`room_id`, `user_id`)
- [ ] Message pagination index (`room_id`, `created_at`)
- [ ] Read tracking uniqueness (`chat_message_id`, `user_id`)

### Step 2: Repository layer
Add repository methods that support:
- list rooms for user with last message and unread count
- get/create direct room for pair of users
- create group room and manage members
- post/list messages with cursor pagination
- mark message read

Repository rules:
- use prepared statements only
- wrap SQL in try/catch with `error_log`
- return consistent shapes (`[]`, `null`, `false`) on no-data/failure

### Step 3: Controller layer
Add `ChatController` with endpoints for rooms and messages.

Minimum endpoint set:
- `GET /chat/rooms`
- `POST /chat/rooms`
- `GET /chat/rooms/{roomUuid}`
- `POST /chat/rooms/{roomUuid}/members`
- `DELETE /chat/rooms/{roomUuid}/members/{userId}`
- `GET /chat/rooms/{roomUuid}/messages`
- `POST /chat/rooms/{roomUuid}/messages`
- `PUT /chat/messages/{messageUuid}/read`

Controller rules:
- enforce membership before room/message access
- enforce admin role for member management in group rooms
- only sender (or policy-admin) can edit/delete messages

### Step 4: Route registration
- Register chat routes in `lms-api/src/Routes/api.php`
- Place static/specific routes before wildcard routes
- Keep auth enabled for chat routes

### Step 5: Frontend integration
Update shared API config first:
- add chat endpoint constants in `assets/js/config.js`
- add `ChatAPI` wrapper in `assets/js/api.js`

Then update page behavior:
- left panel: room list + unread badges + search
- thread panel: messages timeline with pagination
- composer: text + reply (+ optional file)
- new chat modal:
  - Individual tab (all users search)
  - Group tab (role/class/program/custom)

## Security and policy rules
- User must be active member of room to read/send
- Direct rooms fixed to 2 members
- Group member changes restricted to room admins or system roles
- Cross-category direct chat allowed unless institution policy says otherwise

## Backward-compatible rollout

### Phase plan
1. Add schema and backend chat APIs
2. Use new APIs in admin messaging page
3. Enable same chat API for teacher/student/parent
4. Optionally migrate legacy messages into direct rooms
5. Deprecate legacy inbox/sent endpoints after stability window

## Definition of done
- [ ] Chat tables exist and pass FK/index checks
- [ ] Room + message APIs work with auth and membership checks
- [ ] Admin page supports both group and individual chat creation
- [ ] Unread counts and read state update correctly
- [ ] Existing legacy message pages remain functional during migration
- [ ] Basic tests/manual checks cover direct and group chat scenarios

## Common pitfalls
- Duplicating direct rooms for same user pair
- Using offset pagination for long chat history
- Counting unread per message without indexing
- Letting non-members access room metadata/messages
- Breaking legacy endpoints before full frontend migration

## Prompt patterns this skill should handle
- "implement phase 1 chat schema"
- "add chat room endpoints"
- "make admin messages like WhatsApp"
- "enable direct chat across user categories"
- "migrate old messages into direct rooms"
