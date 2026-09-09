INSERT INTO `school_settings` (`id`, `key`, `value`, `updated_at`)
VALUES ('attendance-start-time', 'attendance_start_time', '05:00', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `value` = '05:00', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `school_settings` (`id`, `key`, `value`, `updated_at`)
VALUES ('attendance-late-after', 'attendance_late_after', '07:30', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `value` = '07:30', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `school_settings` (`id`, `key`, `value`, `updated_at`)
VALUES ('attendance-end-time', 'attendance_end_time', '10:00', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `value` = '10:00', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `school_settings` (`id`, `key`, `value`, `updated_at`)
VALUES ('auto-alfa-cron-time', 'auto_alfa_cron_time', '10:00', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `value` = '10:00', `updated_at` = CURRENT_TIMESTAMP(3);
