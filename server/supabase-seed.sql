-- Generated from the repository JSON files. Run supabase-schema.sql first.

begin;

insert into public.users (id, email, username, password_hash, role, is_active, last_login_at, created_at, updated_at) values
('usr-admin', 'admin@smkn2padang.sch.id', 'admin', '$2b$12$O4dt7e33RccRuWN7aVLYouBy.WXJP8pxxExUTgy/SBVm9p.dp6vGO', 'SUPER_ADMIN', TRUE, '2026-09-09T00:44:47.820Z', '2026-09-08T03:53:18.674Z', '2026-09-09T00:44:47.820Z'),
('usr-smkn2padang', 'smkn2padang@smkn2padang.sch.id', 'smkn2padang', '$2b$12$MLX6jsdwR6QqLM0wPsudI.LEi7MprzxuJr/nCg8pZicnWbRUr0ibG', 'SCANNER', TRUE, NULL, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('usr-guru', 'guru@smkn2padang.sch.id', 'guru', '$2b$12$EVeoqtV1rK4suzn4sn17X.CXFRzCZISAdBFKogghQlWrXtJ2ME7Ha', 'GURU', TRUE, '2026-09-09T00:42:48.375Z', '2026-09-08T03:53:18.674Z', '2026-09-09T00:42:48.375Z'),
('a0410176-064f-4787-bc03-6b229dd3190c', 'guru-c4c71bdf6cc44da591db8ba74066ad9b@internal.siap.local', 'guru_c4c71bdf6cc44da591db8ba74066ad9b', '$2b$12$HGVJk5.tEerIdex3uYpCxunTzx1fuEF4y8FaHldxRcZB/QwlYUwhC', 'GURU', TRUE, NULL, '2026-09-08T17:32:37.345Z', '2026-09-08T17:32:37.345Z'),
('4fd1a699-8a09-4607-a1cc-cfd0c3fb8974', 'guru-995ce20aa7734e50b211cbeb2b46dfe7@internal.siap.local', 'guru_995ce20aa7734e50b211cbeb2b46dfe7', '$2b$12$zQ4PPRd7fXM8gxBy0on6GePXri1Rb1wR7cfPre0GmqgsJa3WXkNtK', 'GURU', TRUE, NULL, '2026-09-09T01:04:35.741Z', '2026-09-09T01:04:35.741Z')
on conflict (id) do nothing;

insert into public.majors (id, code, name, created_at, updated_at) values
('mjr-rpl', 'RPL', 'Rekayasa Perangkat Lunak', '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('mjr-tkj', 'TKJ', 'Teknik Komputer dan Jaringan', '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('mjr-mplb', 'MPLB', 'Multimedia dan Persiapan Luar Biasa', '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('mjr-akl', 'AKL', 'Akuntansi', '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('mjr-ulw', 'ULW', 'Usaha Layanan Wisata', '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('mjr-bd', 'BD', 'Bisnis Daring', '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('mjr-br', 'BR', 'Barista', '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z')
on conflict (id) do nothing;

insert into public.teachers (id, user_id, nip, full_name, phone, is_homeroom, created_at, updated_at) values
('tch-1', 'usr-guru', '198501012010011001', 'Eka Puspita', '08123456000', FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T17:27:20.522Z'),
('20c0759b-6e53-4800-8d4f-87b8ad61ae0f', 'a0410176-064f-4787-bc03-6b229dd3190c', '1211213232222', 'Buk Ando', '0821732817382', FALSE, '2026-09-08T17:32:38.729Z', '2026-09-08T17:32:38.729Z'),
('573e053c-50cc-4de1-81f5-7180cff28575', '4fd1a699-8a09-4607-a1cc-cfd0c3fb8974', '', 'dfdljfbdjibhkfdvkh', '', FALSE, '2026-09-09T01:04:37.372Z', '2026-09-09T01:04:37.372Z')
on conflict (id) do nothing;

insert into public.parents (id, user_id, full_name, email, phone, address, created_at, updated_at) values
('prn-1', NULL, 'Bapak Aditya', 'ortu1@gmail.com', '082111111111', 'Jl. Sudirman No. 1', '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('prn-2', NULL, 'Bapak Annisa', 'ortu2@gmail.com', '082222222222', 'Jl. Sudirman No. 2', '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z')
on conflict (id) do update set user_id = excluded.user_id, full_name = excluded.full_name, email = excluded.email, phone = excluded.phone, address = excluded.address, updated_at = excluded.updated_at;

insert into public.classes (id, name, grade, major_id, homeroom_teacher_id, created_at, updated_at) values
('cls-x-rpl-1', 'X RPL 1', 10, 'mjr-rpl', 'tch-1', '2026-09-08T03:53:18.674Z', '2026-09-08T17:28:27.065Z'),
('cls-x-rpl-2', 'X RPL 2', 10, 'mjr-rpl', NULL, '2026-09-08T03:53:18.674Z', '2026-09-09T01:03:53.028Z'),
('cls-x-tkj-1', 'X TKJ 1', 10, 'mjr-tkj', NULL, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('cls-x-mplb-1', 'X MPLB 1', 10, 'mjr-mplb', NULL, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('cls-x-akl-1', 'XII BD 1', 12, 'mjr-bd', '20c0759b-6e53-4800-8d4f-87b8ad61ae0f', '2026-09-08T03:53:18.674Z', '2026-09-09T01:21:42.860Z'),
('cls-x-ulw-1', 'X ULW 1', 10, 'mjr-ulw', NULL, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('cls-x-bd-1', 'X BD 1', 10, 'mjr-bd', NULL, '2026-09-08T03:53:18.674Z', '2026-09-08T15:33:11.604Z'),
('cls-x-br-1', 'X BR 1', 10, 'mjr-br', NULL, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('cls-xi-rpl-1', 'XI RPL 1', 11, 'mjr-rpl', NULL, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('cls-xi-tkj-1', 'XI TKJ 1', 11, 'mjr-tkj', NULL, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('cls-xii-rpl-1', 'XII RPL 1', 12, 'mjr-rpl', NULL, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('c70ab90f-b7cd-402f-b1fd-5aaad6cea97a', 'XI AKL 5', 11, 'mjr-akl', NULL, '2026-09-09T01:14:25.702Z', '2026-09-09T01:14:25.702Z')
on conflict (id) do nothing;

insert into public.academic_years (id, name, is_active, created_at) values
('academic-year-2026-2027', '2026/2027', TRUE, '2026-09-09T16:43:11.778Z')
on conflict (id) do nothing;

insert into public.semesters (id, academic_year_id, name, "order", start_date, end_date, is_active, created_at) values
('semester-2026-2027-ganjil', 'academic-year-2026-2027', 'Ganjil', 1, '2026-07-01T00:00:00.000Z', '2026-12-31T23:59:59.000Z', TRUE, '2026-09-09T16:43:11.780Z')
on conflict (id) do nothing;

-- students/cls-x-akl-1.json - XII BD 1 (cls-x-akl-1)
insert into public.students (id, user_id, nis, nisn, full_name, gender, birth_date, address, major_id, class_id, parent_id, parent_full_name, parent_email, parent_phone, parent_address, qr_token, is_active, email_sent, created_at, updated_at) values
('std-8', NULL, '260008', '0060000008', 'Fajar Rahman', 'L', '2008-05-15T00:00:00.000Z', 'Jl. Merdeka No. 2', 'mjr-akl', 'cls-x-akl-1', 'prn-1', 'Bapak Aditya', 'ortu1@gmail.com', '082111111111', 'Jl. Sudirman No. 1', 'QR-K3L4M5N6O7P8', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('std-16', NULL, '260016', '0060000016', 'Novita Sari', 'P', '2008-05-15T00:00:00.000Z', 'Jl. Raya Bandung No. 1', 'mjr-akl', 'cls-x-akl-1', 'prn-1', 'Bapak Aditya', 'ortu1@gmail.com', '082111111111', 'Jl. Sudirman No. 1', 'QR-G1H2I3J4K5L6', TRUE, TRUE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('std-25', NULL, '260025', '0060000025', 'Wulan Sari', 'P', '2008-05-15T00:00:00.000Z', 'Jl. Waringin No. 1', 'mjr-akl', 'cls-x-akl-1', 'prn-2', 'Bapak Annisa', 'ortu2@gmail.com', '082222222222', 'Jl. Sudirman No. 2', 'QR-I5J6K7L8M9N0', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z')
on conflict (id) do nothing;

-- students/cls-x-bd-1.json - X BD 1 (cls-x-bd-1)
insert into public.students (id, user_id, nis, nisn, full_name, gender, birth_date, address, major_id, class_id, parent_id, parent_full_name, parent_email, parent_phone, parent_address, qr_token, is_active, email_sent, created_at, updated_at) values
('std-10', NULL, '260010', '0060000010', 'Hendra Wijaya', 'L', '2008-05-15T00:00:00.000Z', 'Jl. Cendana No. 1', 'mjr-bd', 'cls-x-bd-1', 'prn-1', 'Bapak Aditya', 'ortu1@gmail.com', '082111111111', 'Jl. Sudirman No. 1', 'QR-W5X6Y7Z8A9B0', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('std-19', NULL, '260019', '0060000019', 'Qoriati Nurhandayah', 'P', '2008-05-15T00:00:00.000Z', 'Jl. Pendidikan No. 1', 'mjr-bd', 'cls-x-bd-1', 'prn-2', 'Bapak Annisa', 'ortu2@gmail.com', '082222222222', 'Jl. Sudirman No. 2', 'QR-Y9Z0A1B2C3D4', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('std-27', NULL, '260027', '0060000027', 'Yuni Astuti', 'P', '2008-05-15T00:00:00.000Z', 'Jl. Asem No. 1', 'mjr-bd', 'cls-x-bd-1', 'prn-2', 'Bapak Annisa', 'ortu2@gmail.com', '082222222222', 'Jl. Sudirman No. 2', 'QR-U7V8W9X0Y1Z2', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z')
on conflict (id) do nothing;

-- students/cls-x-br-1.json - X BR 1 (cls-x-br-1)
insert into public.students (id, user_id, nis, nisn, full_name, gender, birth_date, address, major_id, class_id, parent_id, parent_full_name, parent_email, parent_phone, parent_address, qr_token, is_active, email_sent, created_at, updated_at) values
('std-11', NULL, '260011', '0060000011', 'Indah Permata', 'P', '2008-05-15T00:00:00.000Z', 'Jl. Pemuda No. 1', 'mjr-br', 'cls-x-br-1', 'prn-2', 'Bapak Annisa', 'ortu2@gmail.com', '082222222222', 'Jl. Sudirman No. 2', 'QR-C1D2E3F4G5H6', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('std-20', NULL, '260020', '0060000020', 'Raka Pratama', 'L', '2008-05-15T00:00:00.000Z', 'Jl. Sudeta No. 1', 'mjr-br', 'cls-x-br-1', 'prn-1', 'Bapak Aditya', 'ortu1@gmail.com', '082111111111', 'Jl. Sudirman No. 1', 'QR-E5F6G7H8I9J0', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('std-28', NULL, '260028', '0060000028', 'Zaki Ramadhan', 'L', '2008-05-15T00:00:00.000Z', 'Jl. Buah Batu No. 1', 'mjr-br', 'cls-x-br-1', 'prn-1', 'Bapak Aditya', 'ortu1@gmail.com', '082111111111', 'Jl. Sudirman No. 1', 'QR-A3B4C5D6E7F8', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z')
on conflict (id) do nothing;

-- students/cls-x-mplb-1.json - X MPLB 1 (cls-x-mplb-1)
insert into public.students (id, user_id, nis, nisn, full_name, gender, birth_date, address, major_id, class_id, parent_id, parent_full_name, parent_email, parent_phone, parent_address, qr_token, is_active, email_sent, created_at, updated_at) values
('std-7', NULL, '260007', '0060000007', 'Eka Putri', 'P', '2008-05-15T00:00:00.000Z', 'Jl. Merdeka No. 1', 'mjr-mplb', 'cls-x-mplb-1', 'prn-2', 'Bapak Annisa', 'ortu2@gmail.com', '082222222222', 'Jl. Sudirman No. 2', 'QR-E7F8G9H0I1J2', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('std-17', NULL, '260017', '0060000017', 'Oki Pranoto', 'L', '2008-05-15T00:00:00.000Z', 'Jl. Tegallega No. 1', 'mjr-mplb', 'cls-x-mplb-1', 'prn-2', 'Bapak Annisa', 'ortu2@gmail.com', '082222222222', 'Jl. Sudirman No. 2', 'QR-M7N8O9P0Q1R2', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('std-24', NULL, '260024', '0060000024', 'Vicky Hermawan', 'L', '2008-05-15T00:00:00.000Z', 'Jl. Veteran No. 1', 'mjr-mplb', 'cls-x-mplb-1', 'prn-1', 'Bapak Aditya', 'ortu1@gmail.com', '082111111111', 'Jl. Sudirman No. 1', 'QR-C9D0E1F2G3H4', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z')
on conflict (id) do nothing;

-- students/cls-x-rpl-1.json - X RPL 1 (cls-x-rpl-1)
insert into public.students (id, user_id, nis, nisn, full_name, gender, birth_date, address, major_id, class_id, parent_id, parent_full_name, parent_email, parent_phone, parent_address, qr_token, is_active, email_sent, created_at, updated_at) values
('std-1', NULL, '260001', '0060000001', 'Aditya Pratama', 'L', '2008-05-15T00:00:00.000Z', 'Jl. Sudirman No. 1', 'mjr-rpl', 'cls-x-rpl-1', 'prn-1', 'Bapak Aditya', 'aqiostore123@gmail.com', '082111111111', 'Jl. Sudirman No. 1', 'QR-376C2843FFC9', TRUE, TRUE, '2026-09-08T03:53:18.674Z', '2026-09-09T01:22:26.494Z'),
('std-12', NULL, '260012', '0060000012', 'Joko Susilo', 'L', '2008-05-15T00:00:00.000Z', 'Jl. Gatot Subroto No. 1', 'mjr-rpl', 'cls-x-rpl-1', 'prn-1', 'Bapak Aditya', 'ortu1@gmail.com', '082111111111', 'Jl. Sudirman No. 1', 'QR-I7J8K9L0M1N2', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('std-29', NULL, '260029', '0060000029', 'Ainun Aziza', 'P', '2008-05-15T00:00:00.000Z', 'Jl. Caringin No. 1', 'mjr-rpl', 'cls-x-rpl-1', 'prn-2', 'Bapak Annisa', 'ortu2@gmail.com', '082222222222', 'Jl. Sudirman No. 2', 'QR-G9H0I1J2K3L4', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z')
on conflict (id) do nothing;

-- students/cls-x-rpl-2.json - X RPL 2 (cls-x-rpl-2)
insert into public.students (id, user_id, nis, nisn, full_name, gender, birth_date, address, major_id, class_id, parent_id, parent_full_name, parent_email, parent_phone, parent_address, qr_token, is_active, email_sent, created_at, updated_at) values
('std-2', NULL, '260002', '0060000002', 'Annisa Rahma', 'P', '2008-05-15T00:00:00.000Z', 'Jl. Sudirman No. 2', 'mjr-rpl', 'cls-x-rpl-2', 'prn-1', 'Bapak Aditya', 'ortu1eftrghgh@gmail.com', '082111111111', 'Jl. Sudirman No. 1', 'QR-41C5E8F895DB', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T16:12:33.710Z'),
('std-13', NULL, '260013', '0060000013', 'Karina Lestari', 'P', '2008-05-15T00:00:00.000Z', 'Jl. Imam Bonjol No. 1', 'mjr-rpl', 'cls-x-rpl-2', 'prn-2', 'Bapak Annisa', 'ortu43535@gmail.com', '082222222222', 'Jl. Sudirman No. 2', 'QR-O3P4Q5R6S7T8', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T16:07:50.760Z'),
('std-30', NULL, '260030', '0060000030', 'Bima Sakti', 'L', '2008-05-15T00:00:00.000Z', 'Jl. Dandang No. 1', 'mjr-rpl', 'cls-x-rpl-2', 'prn-1', 'Bapak Aditya', 'ortu1@gmail.com', '082111111111', 'Jl. Sudirman No. 1', 'QR-M5N6O7P8Q9R0', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('8c9cbba5-8d03-4413-895d-3c31862851d3', NULL, '2637267362', '2323233', 'dljfhbkjisgfjegkjbeiusgfuegseyugu', 'P', '0034-05-07T00:00:00.000Z', NULL, 'mjr-rpl', 'cls-x-rpl-2', NULL, NULL, NULL, NULL, NULL, 'SIAP-3C8EB9074E0F-MTTEFS2W', TRUE, FALSE, '2026-09-09T01:07:47.816Z', '2026-09-09T01:07:47.816Z')
on conflict (id) do nothing;

-- students/cls-x-tkj-1.json - X TKJ 1 (cls-x-tkj-1)
insert into public.students (id, user_id, nis, nisn, full_name, gender, birth_date, address, major_id, class_id, parent_id, parent_full_name, parent_email, parent_phone, parent_address, qr_token, is_active, email_sent, created_at, updated_at) values
('std-5', NULL, '260005', '0060000005', 'Citra Dewi', 'P', '2008-05-15T00:00:00.000Z', 'Jl. Sudirman No. 5', 'mjr-tkj', 'cls-x-tkj-1', 'prn-2', 'Bapak Annisa', 'ortu2@gmail.com', '082222222222', 'Jl. Sudirman No. 2', 'QR-B81C7C1F44DC', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('std-14', NULL, '260014', '0060000014', 'Lionel Messi', 'L', '2008-05-15T00:00:00.000Z', 'Jl. Nusantara No. 1', 'mjr-tkj', 'cls-x-tkj-1', 'prn-1', 'Bapak Aditya', 'ortu1@gmail.com', '082111111111', 'Jl. Sudirman No. 1', 'QR-U9V0W1X2Y3Z4', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z')
on conflict (id) do nothing;

-- students/cls-x-ulw-1.json - X ULW 1 (cls-x-ulw-1)
insert into public.students (id, user_id, nis, nisn, full_name, gender, birth_date, address, major_id, class_id, parent_id, parent_full_name, parent_email, parent_phone, parent_address, qr_token, is_active, email_sent, created_at, updated_at) values
('std-9', NULL, '260009', '0060000009', 'Gita Salsabila', 'P', '2008-05-15T00:00:00.000Z', 'Jl. Ahmad Yani No. 1', 'mjr-ulw', 'cls-x-ulw-1', 'prn-2', 'Bapak Annisa', 'ortu2@gmail.com', '082222222222', 'Jl. Sudirman No. 2', 'QR-Q9R0S1T2U3V4', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('std-18', NULL, '260018', '0060000018', 'Putri Handayani', 'P', '2008-05-15T00:00:00.000Z', 'Jl. Cijagra No. 1', 'mjr-ulw', 'cls-x-ulw-1', 'prn-1', 'Bapak Aditya', 'ortu1@gmail.com', '082111111111', 'Jl. Sudirman No. 1', 'QR-S3T4U5V6W7X8', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z')
on conflict (id) do nothing;

-- students/cls-xi-rpl-1.json - XI RPL 1 (cls-xi-rpl-1)
insert into public.students (id, user_id, nis, nisn, full_name, gender, birth_date, address, major_id, class_id, parent_id, parent_full_name, parent_email, parent_phone, parent_address, qr_token, is_active, email_sent, created_at, updated_at) values
('std-3', NULL, '260003', '0060000003', 'Arief Hidayat', 'L', '2008-05-15T00:00:00.000Z', 'Jl. Sudirman No. 3', 'mjr-rpl', 'cls-xi-rpl-1', 'prn-2', 'Bapak Annisa', 'ortu2@gmail.com', '082222222222', 'Jl. Sudirman No. 2', 'QR-62E035FE4BED', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('std-15', NULL, '260015', '0060000015', 'Maya Kusuma', 'P', '2008-05-15T00:00:00.000Z', 'Jl. Dipati Ukur No. 1', 'mjr-rpl', 'cls-xi-rpl-1', 'prn-2', 'Bapak Annisa', 'ortu2@gmail.com', '082222222222', 'Jl. Sudirman No. 2', 'QR-A5B6C7D8E9F0', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('std-21', NULL, '260021', '0060000021', 'Siti Nurhaliza', 'P', '2008-05-15T00:00:00.000Z', 'Jl. Setiabudi No. 1', 'mjr-rpl', 'cls-xi-rpl-1', 'prn-2', 'Bapak Annisa', 'ortu2@gmail.com', '082222222222', 'Jl. Sudirman No. 2', 'QR-K1L2M3N4O5P6', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z')
on conflict (id) do nothing;

-- students/cls-xi-tkj-1.json - XI TKJ 1 (cls-xi-tkj-1)
insert into public.students (id, user_id, nis, nisn, full_name, gender, birth_date, address, major_id, class_id, parent_id, parent_full_name, parent_email, parent_phone, parent_address, qr_token, is_active, email_sent, created_at, updated_at) values
('std-6', NULL, '260006', '0060000006', 'Dimas Anggara', 'L', '2008-05-15T00:00:00.000Z', 'Jl. Sudirman No. 6', 'mjr-tkj', 'cls-xi-tkj-1', 'prn-1', 'Bapak Aditya', 'ortu1@gmail.com', '082111111111', 'Jl. Sudirman No. 1', 'QR-ADCD2191AD0C', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('std-22', NULL, '260022', '0060000022', 'Teguh Budiman', 'L', '2008-05-15T00:00:00.000Z', 'Jl. Tangkuban Perahu No. 1', 'mjr-tkj', 'cls-xi-tkj-1', 'prn-1', 'Bapak Aditya', 'ortu1@gmail.com', '082111111111', 'Jl. Sudirman No. 1', 'QR-Q7R8S9T0U1V2', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('a0e71c47-abf0-4d11-a96f-d3d42397fa3f', NULL, '32243555555555555', '4555555555555555', 'fdggggggggggggggggggggggggggggggggggggggggggg', 'P', '0006-04-05T00:00:00.000Z', NULL, 'mjr-tkj', 'cls-xi-tkj-1', NULL, NULL, NULL, NULL, NULL, 'SIAP-623AF2390ED2-MTSXPIEH', TRUE, FALSE, '2026-09-08T17:19:28.361Z', '2026-09-08T17:19:28.361Z')
on conflict (id) do nothing;

-- students/cls-xii-rpl-1.json - XII RPL 1 (cls-xii-rpl-1)
insert into public.students (id, user_id, nis, nisn, full_name, gender, birth_date, address, major_id, class_id, parent_id, parent_full_name, parent_email, parent_phone, parent_address, qr_token, is_active, email_sent, created_at, updated_at) values
('std-4', NULL, '260004', '0060000004', 'Bagus Triyono', 'L', '2008-05-15T00:00:00.000Z', 'Jl. Sudirman No. 4', 'mjr-rpl', 'cls-xii-rpl-1', 'prn-1', 'Bapak Aditya', 'ortu1@gmail.com', '082111111111', 'Jl. Sudirman No. 1', 'QR-DCE5C6D97BB3', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z'),
('std-23', NULL, '260023', '0060000023', 'Umi Marfuah', 'P', '2008-05-15T00:00:00.000Z', 'Jl. Ujung Berung No. 1', 'mjr-rpl', 'cls-xii-rpl-1', 'prn-2', 'Bapak Annisa', 'ortu2@gmail.com', '082222222222', 'Jl. Sudirman No. 2', 'QR-W3X4Y5Z6A7B8', TRUE, FALSE, '2026-09-08T03:53:18.674Z', '2026-09-08T03:53:18.674Z')
on conflict (id) do nothing;

-- school_settings: no source records

-- violation_categories: no source records

insert into public.attendance (id, student_id, semester_id, date, check_in_time, status, permission_id, created_at, updated_at) values
('7fa3a278-ef4c-495a-a8cc-9de121fb1a81', 'std-16', 'semester-2026-2027-ganjil', '2026-09-09', '2026-09-09T00:56:15.429Z', 'TERLAMBAT', NULL, '2026-09-09T00:56:15.429Z', '2026-09-09T00:56:15.429Z'),
('6f3f114d-64cb-434a-9e71-87af17bca9bf', 'std-1', 'semester-2026-2027-ganjil', '2026-09-09', '2026-09-09T01:22:47.206Z', 'TERLAMBAT', NULL, '2026-09-09T01:22:47.206Z', '2026-09-09T01:22:47.206Z')
on conflict (id) do nothing;

-- permissions: no source records

-- violations: no source records

-- notifications: no source records

insert into public.email_logs (id, to_email, subject, body, status, error_message, related_type, related_id, sent_at, created_at) values
('e8015e05-71be-4db4-822c-a7d381fbfb02', 'ortu1@gmail.com', '[SIAP] Terlambat - Novita Sari (Rabu, 9 September 2026)', '<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Absensi: Terlambat</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:''Segoe UI'',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:#d97706;padding:20px 28px;">
                <p style="margin:0;color:#ffffff;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;opacity:0.85;">
                  SIAP SMKN 2 PADANG
                </p>
                <p style="margin:4px 0 0;color:#ffffff;font-size:18px;font-weight:700;">
                  Absensi: Terlambat
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;color:#1e293b;font-size:14px;line-height:1.6;">
                
    <p>Yth. Bapak Aditya,</p>
    <p>
      Kami informasikan bahwa ananda telah tercatat <strong>terlambat</strong>
      di sekolah pada hari ini.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;font-size:13px;"><tr>
    <td style="padding:4px 0;color:#64748b;width:120px;">Nama Siswa</td>
    <td style="padding:4px 0;color:#0f172a;font-weight:600;">Novita Sari</td>
  </tr><tr>
    <td style="padding:4px 0;color:#64748b;width:120px;">Kelas</td>
    <td style="padding:4px 0;color:#0f172a;font-weight:600;">X AKL 1 (Akuntansi)</td>
  </tr><tr>
    <td style="padding:4px 0;color:#64748b;width:120px;">Tanggal</td>
    <td style="padding:4px 0;color:#0f172a;font-weight:600;">Rabu, 9 September 2026</td>
  </tr><tr>
    <td style="padding:4px 0;color:#64748b;width:120px;">Jam Scan</td>
    <td style="padding:4px 0;color:#0f172a;font-weight:600;">07.56</td>
  </tr><tr>
    <td style="padding:4px 0;color:#64748b;width:120px;">Status</td>
    <td style="padding:4px 0;color:#0f172a;font-weight:600;">⏰ Terlambat</td>
  </tr></table>
    <p>Terima kasih atas perhatian dan kerja samanya.</p>
  
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">
                  Email ini dikirim otomatis oleh Sistem Informasi Absensi & Pemantauan Siswa
                  (SIAP) SMKN 2 Padang. Mohon tidak membalas email ini. Jika ada pertanyaan,
                  silakan hubungi wali kelas atau pihak sekolah secara langsung.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>', 'SENT', NULL, 'ATTENDANCE', '7fa3a278-ef4c-495a-a8cc-9de121fb1a81', '2026-09-09T00:56:24.219Z', '2026-09-09T00:56:17.366Z'),
('8b4a899d-7502-4cb7-b5f6-cac02bfce2f8', 'aqiostore123@gmail.com', '[SIAP] Terlambat - Aditya Pratama (Rabu, 9 September 2026)', '<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Absensi: Terlambat</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:''Segoe UI'',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:#d97706;padding:20px 28px;">
                <p style="margin:0;color:#ffffff;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;opacity:0.85;">
                  SIAP SMKN 2 PADANG
                </p>
                <p style="margin:4px 0 0;color:#ffffff;font-size:18px;font-weight:700;">
                  Absensi: Terlambat
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;color:#1e293b;font-size:14px;line-height:1.6;">
                
    <p>Yth. Bapak Aditya,</p>
    <p>
      Kami informasikan bahwa ananda telah tercatat <strong>terlambat</strong>
      di sekolah pada hari ini.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;font-size:13px;"><tr>
    <td style="padding:4px 0;color:#64748b;width:120px;">Nama Siswa</td>
    <td style="padding:4px 0;color:#0f172a;font-weight:600;">Aditya Pratama</td>
  </tr><tr>
    <td style="padding:4px 0;color:#64748b;width:120px;">Kelas</td>
    <td style="padding:4px 0;color:#0f172a;font-weight:600;">X RPL 1 (Rekayasa Perangkat Lunak)</td>
  </tr><tr>
    <td style="padding:4px 0;color:#64748b;width:120px;">Tanggal</td>
    <td style="padding:4px 0;color:#0f172a;font-weight:600;">Rabu, 9 September 2026</td>
  </tr><tr>
    <td style="padding:4px 0;color:#64748b;width:120px;">Jam Scan</td>
    <td style="padding:4px 0;color:#0f172a;font-weight:600;">08.22</td>
  </tr><tr>
    <td style="padding:4px 0;color:#64748b;width:120px;">Status</td>
    <td style="padding:4px 0;color:#0f172a;font-weight:600;">⏰ Terlambat</td>
  </tr></table>
    <p>Terima kasih atas perhatian dan kerja samanya.</p>
  
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">
                  Email ini dikirim otomatis oleh Sistem Informasi Absensi & Pemantauan Siswa
                  (SIAP) SMKN 2 Padang. Mohon tidak membalas email ini. Jika ada pertanyaan,
                  silakan hubungi wali kelas atau pihak sekolah secara langsung.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>', 'SENT', NULL, 'ATTENDANCE', '6f3f114d-64cb-434a-9e71-87af17bca9bf', '2026-09-09T01:22:52.345Z', '2026-09-09T01:22:47.225Z')
on conflict (id) do nothing;

commit;
