-- ========================================
-- Migration: Create room-based chat messaging tables
-- Version: 003
-- Date: 2026-04-19
-- Description: Adds WhatsApp/Telegram-style schema (direct + group chat) while keeping legacy messages table intact
-- ========================================
USE lms;

CREATE TABLE
    IF NOT EXISTS chat_rooms (
        room_id INT AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(36) NOT NULL,
        institution_id INT NULL,
        room_type VARCHAR(20) NOT NULL DEFAULT 'direct',
        room_name VARCHAR(200) NULL,
        room_avatar VARCHAR(500) NULL,
        room_description TEXT NULL,
        category_type VARCHAR(20) NULL,
        category_ref_id INT NULL,
        category_label VARCHAR(100) NULL,
        direct_user_1 INT NULL,
        direct_user_2 INT NULL,
        created_by INT NULL,
        is_active TINYINT (1) NOT NULL DEFAULT 1,
        last_message_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_chat_rooms_uuid (uuid),
        UNIQUE KEY uq_chat_rooms_direct_pair (direct_user_1, direct_user_2),
        KEY idx_chat_rooms_institution_type (institution_id, room_type),
        KEY idx_chat_rooms_category (category_type, category_ref_id),
        KEY idx_chat_rooms_last_message_at (last_message_at),
        KEY idx_chat_rooms_created_by (created_by),
        CONSTRAINT fk_chat_rooms_institution FOREIGN KEY (institution_id) REFERENCES institutions (institution_id) ON DELETE SET NULL,
        CONSTRAINT fk_chat_rooms_direct_user_1 FOREIGN KEY (direct_user_1) REFERENCES users (user_id) ON DELETE SET NULL,
        CONSTRAINT fk_chat_rooms_direct_user_2 FOREIGN KEY (direct_user_2) REFERENCES users (user_id) ON DELETE SET NULL,
        CONSTRAINT fk_chat_rooms_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON DELETE SET NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    IF NOT EXISTS chat_messages (
        chat_message_id INT AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(36) NOT NULL,
        room_id INT NOT NULL,
        sender_id INT NOT NULL,
        message_type VARCHAR(20) NOT NULL DEFAULT 'text',
        message_text LONGTEXT NULL,
        reply_to_message_id INT NULL,
        is_edited TINYINT (1) NOT NULL DEFAULT 0,
        edited_at DATETIME NULL,
        deleted_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_chat_messages_uuid (uuid),
        KEY idx_chat_messages_room_created (room_id, created_at),
        KEY idx_chat_messages_sender_created (sender_id, created_at),
        KEY idx_chat_messages_room_deleted_created (room_id, deleted_at, created_at),
        KEY idx_chat_messages_reply_to (reply_to_message_id),
        CONSTRAINT fk_chat_messages_room FOREIGN KEY (room_id) REFERENCES chat_rooms (room_id) ON DELETE CASCADE,
        CONSTRAINT fk_chat_messages_sender FOREIGN KEY (sender_id) REFERENCES users (user_id) ON DELETE RESTRICT,
        CONSTRAINT fk_chat_messages_reply_to FOREIGN KEY (reply_to_message_id) REFERENCES chat_messages (chat_message_id) ON DELETE SET NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    IF NOT EXISTS chat_room_members (
        room_member_id INT AUTO_INCREMENT PRIMARY KEY,
        room_id INT NOT NULL,
        user_id INT NOT NULL,
        member_role VARCHAR(20) NOT NULL DEFAULT 'member',
        joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        left_at DATETIME NULL,
        is_muted TINYINT (1) NOT NULL DEFAULT 0,
        is_archived TINYINT (1) NOT NULL DEFAULT 0,
        last_read_message_id INT NULL,
        last_read_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_chat_room_members_room_user (room_id, user_id),
        KEY idx_chat_room_members_user_active (user_id, left_at),
        KEY idx_chat_room_members_room_role (room_id, member_role),
        KEY idx_chat_room_members_room_left (room_id, left_at),
        CONSTRAINT fk_chat_room_members_room FOREIGN KEY (room_id) REFERENCES chat_rooms (room_id) ON DELETE CASCADE,
        CONSTRAINT fk_chat_room_members_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
        CONSTRAINT fk_chat_room_members_last_read_message FOREIGN KEY (last_read_message_id) REFERENCES chat_messages (chat_message_id) ON DELETE SET NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    IF NOT EXISTS chat_message_reads (
        read_id INT AUTO_INCREMENT PRIMARY KEY,
        chat_message_id INT NOT NULL,
        user_id INT NOT NULL,
        read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_chat_message_reads_message_user (chat_message_id, user_id),
        KEY idx_chat_message_reads_user_read_at (user_id, read_at),
        CONSTRAINT fk_chat_message_reads_message FOREIGN KEY (chat_message_id) REFERENCES chat_messages (chat_message_id) ON DELETE CASCADE,
        CONSTRAINT fk_chat_message_reads_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    IF NOT EXISTS chat_attachments (
        attachment_id INT AUTO_INCREMENT PRIMARY KEY,
        chat_message_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        mime_type VARCHAR(100) NULL,
        file_size BIGINT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_chat_attachments_message (chat_message_id),
        CONSTRAINT fk_chat_attachments_message FOREIGN KEY (chat_message_id) REFERENCES chat_messages (chat_message_id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Optional migration tracking entry
INSERT INTO
    schema_migrations (version, description, applied_by, notes)
VALUES
    (
        '003',
        'Create room-based chat tables',
        'admin',
        'Adds chat_rooms/chat_messages model; legacy messages table remains active'
    );