# LMS Chat Architecture Plan (WhatsApp/Telegram Style)

## Goal

Build a modern chat system that supports:

- Group chat by category (Admin, Teacher, Student, Parent, Class, Program)
- Individual chat between any two users, even across categories
- Threaded, real-time style messaging UX for web clients

## Current Limitation (Existing LMS)

The current `messages` design is sender/receiver based per row. It works for simple inbox/sent flows but does not scale well for true chat rooms, member management, unread tracking, and real group conversations.

## Recommended Data Model

Introduce room-based chat tables while keeping the current `messages` table for backward compatibility.

### 1) `chat_rooms`

Represents a conversation container.

Suggested columns:

- `room_id` (PK)
- `uuid` (unique)
- `room_type` enum: `direct`, `group`, `broadcast`
- `name` nullable (for group/custom rooms)
- `category_type` nullable enum: `role`, `class`, `program`, `custom`
- `category_ref_id` nullable (ID of class/program/role reference)
- `created_by` (FK users)
- `is_active` tinyint default 1
- `created_at`, `updated_at`

### 2) `chat_room_members`

Maps users to rooms.

Suggested columns:

- `room_member_id` (PK)
- `room_id` (FK chat_rooms)
- `user_id` (FK users)
- `member_role` enum: `member`, `admin`
- `joined_at`
- `left_at` nullable
- `is_muted` tinyint default 0
- `is_archived` tinyint default 0

Constraints:

- Unique key (`room_id`, `user_id`)

### 3) `chat_messages`

Stores each message in a room.

Suggested columns:

- `chat_message_id` (PK)
- `uuid` (unique)
- `room_id` (FK chat_rooms)
- `sender_id` (FK users)
- `message_type` enum: `text`, `image`, `file`, `system`
- `message_text` longtext nullable
- `reply_to_message_id` nullable FK chat_messages
- `is_edited` tinyint default 0
- `edited_at` nullable
- `deleted_at` nullable (soft delete)
- `created_at`

Indexes:

- (`room_id`, `created_at`)
- (`sender_id`, `created_at`)

### 4) `chat_message_reads`

Tracks read state per user per message.

Suggested columns:

- `read_id` (PK)
- `chat_message_id` (FK chat_messages)
- `user_id` (FK users)
- `read_at`

Constraints:

- Unique key (`chat_message_id`, `user_id`)

### 5) Optional: `chat_attachments`

If you need robust file/image support.

Suggested columns:

- `attachment_id` (PK)
- `chat_message_id` (FK chat_messages)
- `file_name`
- `file_path`
- `mime_type`
- `file_size`
- `created_at`

## Core Product Behavior

### Direct Chat

- One room per pair of users (`room_type = direct`)
- If room exists, reuse it; otherwise create and add both members

### Category Group Chat

- Room per category group:
  - role-based: all Admins, all Teachers, etc.
  - class-based: one room per class
  - program-based: one room per program
- Membership can be synced by backend jobs/events when roster changes

### Cross-Category Individual Chat

- Allowed by policy: any authenticated user may start a direct room with any other user (unless blocked by future policy rules)

## API Design (New, Room-Based)

### Rooms

- `GET /api/chat/rooms` -> list rooms for current user (with last message + unread count)
- `POST /api/chat/rooms` -> create room (direct/group)
- `GET /api/chat/rooms/{roomUuid}` -> room metadata + members
- `POST /api/chat/rooms/{roomUuid}/members` -> add users to group room
- `DELETE /api/chat/rooms/{roomUuid}/members/{userId}` -> remove member

### Messages

- `GET /api/chat/rooms/{roomUuid}/messages?before=<cursor>&limit=30`
- `POST /api/chat/rooms/{roomUuid}/messages`
- `PUT /api/chat/messages/{messageUuid}` -> edit own message
- `DELETE /api/chat/messages/{messageUuid}` -> soft delete own message/admin
- `PUT /api/chat/messages/{messageUuid}/read`

### Presence/Typing (Optional but useful)

- `POST /api/chat/rooms/{roomUuid}/typing`
- `GET /api/chat/presence`

## Authorization Rules

- User must be a room member to read or send messages in that room
- Only room admins can manage members in non-direct rooms
- Direct room members are fixed (2 users)
- Only sender (or chat admin with policy) can edit/delete messages

## Frontend UX (Admin and Other Roles)

Use one unified layout:

- Left pane: conversation list (search + unread badges)
- Main pane: active thread + message timeline
- Composer: text, file, reply
- New chat modal:
  - Tab 1: Individual (all users search)
  - Tab 2: Group (category templates + custom)

This supports WhatsApp/Telegram-like flow while preserving LMS categories.

## Migration Strategy

### Phase 1 (Safe Foundation)

- Add new chat tables and indexes
- Keep existing `messages` API untouched

### Phase 2 (Backend)

- Add `ChatRepository`, `ChatController`, chat routes
- Ship room/message endpoints with pagination and membership checks

### Phase 3 (Frontend)

- Replace current admin message page internals with room-based APIs
- Re-enable both individual and group chat modes

### Phase 4 (Data Migration)

- Optional migration script:
  - Convert old direct messages into `direct` rooms
  - Keep old table as archive until confidence is high

### Phase 5 (Rollout)

- Enable teacher/student/parent chat clients on the same chat API
- Deprecate legacy inbox/sent model gradually

## Performance Notes

- Always paginate messages by cursor/time (`before`), not large offsets
- Index room/time fields aggressively
- Precompute unread counts per room or calculate from last-read pointers

## Suggested Next Implementation Task

Start with SQL migration + backend room/message endpoints, then connect admin UI to the new endpoints while preserving current navigation and page loading pattern.
