-- Table structure for table `absen_leg25`
DROP TABLE IF EXISTS `absen_leg25`;
CREATE TABLE `absen_leg25` (
  `id` int NOT NULL AUTO_INCREMENT,
  `materi` int NOT NULL,
  `astor` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `id_kelompok` int NOT NULL,
  `nrp_maba` varchar(9) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `status` varchar(11) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `waktu` datetime NOT NULL,
  `keaktifan maba` int NOT NULL,
  `gdrive_start` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `gdrive_finish` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `gdrive_susulan_start` text CHARACTER SET latin1 COLLATE latin1_swedish_ci,
  `gdrive_susulan_finish` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4600 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Table structure for table `assessment_leg`
DROP TABLE IF EXISTS `assessment_leg`;
CREATE TABLE `assessment_leg` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nrp` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `materi` int NOT NULL,
  `suasana_diskusi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `suasana diskusi(stats)` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `persiapan_pribadi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `kendala` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `manfaat_materi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=434 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `astor`
DROP TABLE IF EXISTS `astor`;
CREATE TABLE `astor` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_kelompok` varchar(30) DEFAULT NULL,
  `nrp` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `jurusan` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `jenis_kelamin` varchar(1) DEFAULT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `line` varchar(255) DEFAULT NULL,
  `handphone` varchar(255) DEFAULT NULL,
  `hobi` varchar(255) DEFAULT NULL,
  `ipk` float NOT NULL DEFAULT '0',
  `organisasi_lk` varchar(500) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `pos_organisasi_lk` varchar(250) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `isi_biodata` int NOT NULL DEFAULT '0',
  `status_konsumsi` int NOT NULL DEFAULT '0',
  `alergi` varchar(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `last_update_bio` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_jadwal_ktb` int NOT NULL DEFAULT '0',
  `last_acc` timestamp NULL DEFAULT NULL,
  `masih_ada` int NOT NULL DEFAULT '1',
  `kehadiran_ktb` double DEFAULT NULL,
  `kehadiran_sl` double DEFAULT NULL,
  `kehadiran_pastor` double DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `nrp` (`nrp`)
) ENGINE=MyISAM AUTO_INCREMENT=110020 DEFAULT CHARSET=latin1;

-- Table structure for table `booking`
DROP TABLE IF EXISTS `booking`;
CREATE TABLE `booking` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_jadwal` int NOT NULL,
  `id_astor` int NOT NULL,
  `status` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=414 DEFAULT CHARSET=latin1;

-- Table structure for table `data_tim`
DROP TABLE IF EXISTS `data_tim`;
CREATE TABLE `data_tim` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nrp` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `bidang` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('BPH','BPHK','Anggota') COLLATE utf8mb4_unicode_ci DEFAULT 'Anggota',
  `tim` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `essay_results`
DROP TABLE IF EXISTS `essay_results`;
CREATE TABLE `essay_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nrp` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jawaban_essay` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_soal` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `essay_results_id_soal_foreign` (`id_soal`),
  CONSTRAINT `essay_results_id_soal_foreign` FOREIGN KEY (`id_soal`) REFERENCES `uts_leg` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2834 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `jadwal`
DROP TABLE IF EXISTS `jadwal`;
CREATE TABLE `jadwal` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_mentor` int NOT NULL,
  `tipe_ktb` int NOT NULL DEFAULT '1',
  `hari` int NOT NULL,
  `waktu` time NOT NULL,
  `kapasitas` int NOT NULL DEFAULT '5',
  `status` int NOT NULL DEFAULT '1',
  `filter_gender` int NOT NULL DEFAULT '0' COMMENT '0=semua | 1=L only | 2=P only',
  `catatan` varchar(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL DEFAULT '-',
  `request_ruang` int NOT NULL DEFAULT '0',
  `show_table` int NOT NULL DEFAULT '1',
  `link_drive_tulis` varchar(500) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `link_drive_wawancara` varchar(500) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1005 DEFAULT CHARSET=latin1;

-- Table structure for table `jadwal_materi_eeg`
DROP TABLE IF EXISTS `jadwal_materi_eeg`;
CREATE TABLE `jadwal_materi_eeg` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tanggal` datetime NOT NULL,
  `nama` text NOT NULL,
  `video_briefing` varchar(255) DEFAULT NULL,
  `status` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=latin1;

-- Table structure for table `jawaban_todo_leg11`
DROP TABLE IF EXISTS `jawaban_todo_leg11`;
CREATE TABLE `jawaban_todo_leg11` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nrp` varchar(9) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `jawaban` varchar(3650) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `no_soal` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Table structure for table `jurusan25`
DROP TABLE IF EXISTS `jurusan25`;
CREATE TABLE `jurusan25` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=37 DEFAULT CHARSET=latin1;

-- Table structure for table `kelompok`
DROP TABLE IF EXISTS `kelompok`;
CREATE TABLE `kelompok` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(255) DEFAULT NULL,
  `id_jurusan` int NOT NULL,
  `gdrive_folder_kelompok` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=249 DEFAULT CHARSET=latin1;

-- Table structure for table `ketua_kelompok`
DROP TABLE IF EXISTS `ketua_kelompok`;
CREATE TABLE `ketua_kelompok` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nrp` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nrp` (`nrp`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `list_jurusan`
DROP TABLE IF EXISTS `list_jurusan`;
CREATE TABLE `list_jurusan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(50) NOT NULL,
  `link_form` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=32 DEFAULT CHARSET=latin1;

-- Table structure for table `maba`
DROP TABLE IF EXISTS `maba`;
CREATE TABLE `maba` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_kelompok` int DEFAULT NULL,
  `nrp` varchar(9) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `jenis_kelamin` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `agama` varchar(25) NOT NULL,
  `jurusan` varchar(80) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1361 DEFAULT CHARSET=latin1;

-- Table structure for table `mentor`
DROP TABLE IF EXISTS `mentor`;
CREATE TABLE `mentor` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `jenis_kelamin` varchar(2) DEFAULT NULL,
  `handphone` varchar(60) DEFAULT NULL,
  `line` varchar(255) DEFAULT NULL,
  `email` varchar(70) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `interest` varchar(500) DEFAULT NULL,
  `jurusan` varchar(200) DEFAULT NULL,
  `status_mentor` int DEFAULT NULL,
  `ganti_pass` int NOT NULL DEFAULT '0',
  `isi_biodata` int NOT NULL DEFAULT '0',
  `last_update_bio` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `pekerjaan` varchar(200) DEFAULT NULL,
  `hobi` varchar(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `organisasi_lk` varchar(300) DEFAULT NULL,
  `posisi_periode` varchar(300) DEFAULT NULL,
  `status_konsumsi` int DEFAULT NULL,
  `alergi` varchar(200) DEFAULT NULL,
  `keterangan` varchar(100) DEFAULT NULL,
  `showtable` int NOT NULL DEFAULT '1',
  `log` varchar(255) DEFAULT NULL,
  `log_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `max_astor_per_ktb` int NOT NULL DEFAULT '5',
  `angkatan` int DEFAULT NULL,
  `kriteria` varchar(180) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL COMMENT 'dikosongi jika tdk ada',
  `link_drive_wawancara` varchar(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL DEFAULT '#',
  `link_drive_tulis` varchar(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL DEFAULT '#',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `id_2` (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1001 DEFAULT CHARSET=latin1;

-- Table structure for table `nilai_leg`
DROP TABLE IF EXISTS `nilai_leg`;
CREATE TABLE `nilai_leg` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_kelompok` int DEFAULT NULL,
  `nrp` varchar(9) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `nama` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `nilai_1A` int DEFAULT '0',
  `nilai_1B` int DEFAULT '0',
  `nilai_1C` int DEFAULT '0',
  `nilai_2A` int DEFAULT '0',
  `nilai_2B` int DEFAULT '0',
  `nilai_2C` int DEFAULT '0',
  `nilai_3` int DEFAULT '0',
  `response` timestamp NULL DEFAULT NULL,
  `nrp_penilai` varchar(9) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;

-- Table structure for table `penilaian_pihak_ketiga`
DROP TABLE IF EXISTS `penilaian_pihak_ketiga`;
CREATE TABLE `penilaian_pihak_ketiga` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nrp_astor` varchar(9) NOT NULL,
  `nama_astor` varchar(100) NOT NULL,
  `nama_pengisi` varchar(100) NOT NULL,
  `no_wa_pengisi` varchar(25) NOT NULL,
  `hubungan_pengisi` varchar(100) NOT NULL,
  `pandangan` text NOT NULL,
  `pendapat_jadi_astor` text NOT NULL,
  `kagum` text NOT NULL,
  `perbaiki` text NOT NULL,
  `tahun_mengisi` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=148 DEFAULT CHARSET=latin1;

-- Table structure for table `progress_briefing`
DROP TABLE IF EXISTS `progress_briefing`;
CREATE TABLE `progress_briefing` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nrp` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `materi` int NOT NULL,
  `posisi_terakhir` int NOT NULL,
  `real_watch` float NOT NULL,
  `update_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `rekomendasi_astor`
DROP TABLE IF EXISTS `rekomendasi_astor`;
CREATE TABLE `rekomendasi_astor` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nrp` varchar(11) NOT NULL,
  `k1` int DEFAULT NULL,
  `k2` int DEFAULT NULL,
  `k3` int DEFAULT NULL,
  `k4` int DEFAULT NULL,
  `k5` int DEFAULT NULL,
  `k6` int DEFAULT NULL,
  `k7` int DEFAULT NULL,
  `mean` float DEFAULT NULL,
  `rekomendasi` int DEFAULT NULL COMMENT '1=Ya; 0=Tidak',
  `single_partner` int DEFAULT NULL COMMENT '1=Single; 2=Bisa Partner; 3=Harus Partner; 5=Pendamping; 6=Sit in',
  `alasan_mentor` text CHARACTER SET latin1 COLLATE latin1_swedish_ci,
  `catatan_dosen_sl` text CHARACTER SET latin1 COLLATE latin1_swedish_ci,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=130 DEFAULT CHARSET=latin1;

-- Table structure for table `room_requests`
DROP TABLE IF EXISTS `room_requests`;
CREATE TABLE `room_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `group_id` int NOT NULL,
  `requested_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `status` enum('PENDING','ASSIGNED','REJECTED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `assigned_room` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logistics_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `assigned_by_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `submitted_by_nrp` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sla_notified` tinyint(1) DEFAULT '0',
  `processed_by_nrp` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_code` (`ticket_code`),
  KEY `idx_group_req_date` (`group_id`,`requested_date`),
  KEY `idx_status_date` (`status`,`requested_date`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `settings`
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `setting_key` varchar(255) NOT NULL,
  `setting_value` text NOT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `uts_leg`
DROP TABLE IF EXISTS `uts_leg`;
CREATE TABLE `uts_leg` (
  `id` bigint unsigned NOT NULL,
  `teks_soal` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `isEssay` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

