-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 11, 2025 at 01:41 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `elearning`
--

-- --------------------------------------------------------

--
-- Table structure for table `enrollments`
--

CREATE TABLE `enrollments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `enrolled_at` datetime DEFAULT current_timestamp(),
  `completed` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `enrollments`
--

INSERT INTO `enrollments` (`id`, `user_id`, `module_id`, `enrolled_at`, `completed`) VALUES
(1, 14, 1, '2025-06-07 22:50:50', 0),
(2, 5, 1, '2025-06-07 23:46:46', 1),
(3, 17, 1, '2025-06-09 00:51:26', 0),
(4, 17, 5, '2025-06-09 10:18:01', 0),
(5, 15, 1, '2025-06-09 10:19:40', 0),
(6, 17, 6, '2025-06-09 10:59:07', 0),
(7, 17, 8, '2025-06-09 11:08:29', 0),
(8, 19, 5, '2025-06-09 11:32:13', 0),
(9, 17, 10, '2025-06-10 06:47:26', 0),
(10, 17, 9, '2025-06-10 07:20:19', 0),
(11, 26, 6, '2025-06-11 09:47:33', 0);

-- --------------------------------------------------------

--
-- Table structure for table `modules`
--

CREATE TABLE `modules` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `published` tinyint(1) DEFAULT 0,
  `lecturer_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `modules`
--

INSERT INTO `modules` (`id`, `title`, `description`, `published`, `lecturer_id`) VALUES
(1, 'programing', 'coding', 1, 5),
(5, 'math', 'math', 0, 16),
(6, 'database', 'database', 1, 16),
(8, 'sql', 'sql', 1, 16),
(9, 'big data', 'big data', 1, 21),
(10, 'business', 'introdution to business', 1, 16);

-- --------------------------------------------------------

--
-- Table structure for table `module_contents`
--

CREATE TABLE `module_contents` (
  `id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `content_type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `file_path` varchar(255) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `display_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `module_contents`
--

INSERT INTO `module_contents` (`id`, `module_id`, `content_type`, `title`, `description`, `file_path`, `original_filename`, `uploaded_at`, `display_order`) VALUES
(1, 1, 'pdf', 'the basics of networking cables', 'Let\'s know how to create these cables', 'uploads\\contentFile-1748955712112.pdf', 'ETHERNET CABLE.pdf', '2025-06-03 13:01:52', 0),
(9, 1, 'other', 'UIWRQ', 'jKFALGUEWF', '/uploads/contentFile-1749456974171.docx', 'Notes on routing protocols.docx', '2025-06-09 08:16:14', 1),
(10, 5, 'pdf', 'introduction', 'basic knowledge', '/uploads/contentFile-1749457449358.pdf', 'RMT_UR_BBIT_ 2025.pdf', '2025-06-09 08:24:09', 1),
(11, 8, 'other', 'introduction', 'learning act', '/uploads/contentFile-1749459964026.zip', 'programming final project.zip', '2025-06-09 09:06:04', 1),
(12, 10, 'pdf', 'introduction', 'jfds', '/uploads/contentFile-1749530796689.pdf', '1_Introduction to BI.pdf', '2025-06-10 04:46:36', 1),
(13, 5, 'pdf', 'TEYEWUIQ', 'fgdhW', '/uploads/contentFile-1749627980027.pdf', 're.pdf', '2025-06-11 07:46:20', 2);

-- --------------------------------------------------------

--
-- Table structure for table `options`
--

CREATE TABLE `options` (
  `id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `option_text` varchar(255) NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `options`
--

INSERT INTO `options` (`id`, `question_id`, `option_text`, `is_correct`) VALUES
(1, 2, 'true', 1),
(2, 2, 'false', 0);

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paid_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE `questions` (
  `id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `question_text` text NOT NULL,
  `question_type` enum('multiple_choice','true_false','short_answer') DEFAULT 'multiple_choice',
  `display_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `questions`
--

INSERT INTO `questions` (`id`, `quiz_id`, `question_text`, `question_type`, `display_order`) VALUES
(2, 2, 'resource management generate economic situation management skills', 'multiple_choice', 0);

-- --------------------------------------------------------

--
-- Table structure for table `quizzes`
--

CREATE TABLE `quizzes` (
  `id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `pass_percentage` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quizzes`
--

INSERT INTO `quizzes` (`id`, `module_id`, `title`, `description`, `duration_minutes`, `pass_percentage`, `created_at`, `updated_at`) VALUES
(2, 5, 'first assignment', 'individual assignment', 45, 16, '2025-06-09 08:34:36', '2025-06-09 08:34:36');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_answers`
--

CREATE TABLE `quiz_answers` (
  `id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `submission_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `submitted_text` text DEFAULT NULL,
  `selected_option_id` int(11) DEFAULT NULL,
  `is_correct` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_submissions`
--

CREATE TABLE `quiz_submissions` (
  `id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `score` decimal(5,2) NOT NULL,
  `passed` tinyint(1) NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `registration`
--

CREATE TABLE `registration` (
  `id` int(11) NOT NULL,
  `firstname` varchar(50) DEFAULT NULL,
  `lastname` varchar(50) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('learner','lecturer','administrator') DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `registration`
--

INSERT INTO `registration` (`id`, `firstname`, `lastname`, `username`, `email`, `password`, `role`, `active`) VALUES
(5, 'Alice', 'Uwayo', 'uwayo', 'uwayo@gmail.com', '$2b$10$47XZsFlx1TzPNRWwuf/as.Q9jNNHZ/7Tyw7Thdg9NCdQvHnEpH2Ie', 'lecturer', 1),
(14, 'HIRWA', 'Aime', 'Aimerance', 'hirwaaimerance@gmail.com', '$2b$10$s6NALK69z3LOKXkc.dTR3uSImDp8SGNh1QzoumRd5EyfFesRP3Xc6', 'learner', 1),
(15, 'phocas', 'NTIRENGANYA ', 'phocas', 'ntirenganyaphocas0007@gmail.com', '$2b$10$nq9lnoVo71CltXsRtFm8/.5PICerSpx56Jq3Y6iFpgilutWpgDDGO', 'administrator', 1),
(16, 'Grace', 'Mbabazi', 'grace', 'grace@gmail.com', '$2b$10$Y167cJ65qUvd0J6CNlbHNuVjmtChBkWk6vDdKLKcVhdL./OiLbBMS', 'lecturer', 1),
(17, 'peter', 'ngabo', 'petern', 'petern@gmail.com', '$2b$10$vFtkLIBK1ey8vprneqtX/.LorjbXcCB82XqYRGPmbi1AxodZrBHDW', 'learner', 1),
(18, 'phocas', 'kalisa', 'kalisa', 'kal@gmal.com', '$2b$10$0nTUE/4UiKqQb8hLtTEL3Org2RALBnDJHVTv28ZRRaT/uZC4hIoOm', 'administrator', 1),
(19, 'igihe', 'Peter ', 'igihe', 'igihe@gmail.com', '$2b$10$OhVpTKLUNJpXQbsrtjJjt.8DfcoYnABemYHI7.14GF3Qf3f2i9q6G', 'learner', 1),
(20, 'keve', 'niwe', 'niwe', 'niwe@gmail.com', '$2b$10$VKrEm3x/V.M8JVqFXWvv5eM9MLO4.uHrO4RlKf3yQ05LNzv1WbH8.', 'administrator', 1),
(21, 'iranzi', 'emmy', 'emmy', 'emmy@gmail.com', '$2b$10$NLhBooJEQgsiEjq8jqxiw.iiPPn8z0FDOq41oBelLZ93WGNgaCWHC', 'lecturer', 1),
(22, 'abdul', 'rukundo', 'abdul', 'abdul@gmail.com', '$2b$10$E3JqB8sdPCqyLtMh.B./xOHTlfgOWtJNYPnBQDPQj2G4xkYvyzXei', 'administrator', 1),
(23, 'fabrice', 'niyo', 'fabrice', 'fabrice@gmail.com', '$2b$10$maS6q3IXj8mrAIjVST6Z..plXI6BSXYpw/hjm1DsUOVL2eDzj9ew6', 'lecturer', 1),
(24, 'sam', 'rukundo', 'sam', 'sam@gmail.com', '$2b$10$o3huEn.URhEm70k80FFyauVkE0e3bKhs1MfARtboQjO9IIu8LEviG', 'lecturer', 1),
(25, 'eric', 'nsabi', 'nsabi', 'nsabi@gmail.com', '$2b$10$t7dCY.5bCfB83gTERnW78OC1.gXhGs7q6GPf87XnGFTWSZ9gmMs5e', 'administrator', 1),
(26, 'gab', 'musa', 'musa', 'musa@gmail.com', '$2b$10$vVwDkpAEW/vIX92yFo43G.umkxpJEqLWnIS5oPfmzbGKfyhyUfuii', 'learner', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `module_id` (`module_id`);

--
-- Indexes for table `modules`
--
ALTER TABLE `modules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_lecturer_id` (`lecturer_id`);

--
-- Indexes for table `module_contents`
--
ALTER TABLE `module_contents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `module_id` (`module_id`);

--
-- Indexes for table `options`
--
ALTER TABLE `options`
  ADD PRIMARY KEY (`id`),
  ADD KEY `question_id` (`question_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `module_id` (`module_id`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `quiz_id` (`quiz_id`);

--
-- Indexes for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `module_id` (`module_id`);

--
-- Indexes for table `quiz_answers`
--
ALTER TABLE `quiz_answers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `question_id` (`question_id`),
  ADD KEY `submission_id` (`submission_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `selected_option_id` (`selected_option_id`);

--
-- Indexes for table `quiz_submissions`
--
ALTER TABLE `quiz_submissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `quiz_id` (`quiz_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `registration`
--
ALTER TABLE `registration`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `enrollments`
--
ALTER TABLE `enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `modules`
--
ALTER TABLE `modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `module_contents`
--
ALTER TABLE `module_contents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `options`
--
ALTER TABLE `options`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `quizzes`
--
ALTER TABLE `quizzes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `quiz_answers`
--
ALTER TABLE `quiz_answers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `quiz_submissions`
--
ALTER TABLE `quiz_submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `registration`
--
ALTER TABLE `registration`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `registration` (`id`),
  ADD CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`);

--
-- Constraints for table `modules`
--
ALTER TABLE `modules`
  ADD CONSTRAINT `fk_lecturer_id` FOREIGN KEY (`lecturer_id`) REFERENCES `registration` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `module_contents`
--
ALTER TABLE `module_contents`
  ADD CONSTRAINT `module_contents_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `options`
--
ALTER TABLE `options`
  ADD CONSTRAINT `options_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `registration` (`id`),
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`);

--
-- Constraints for table `questions`
--
ALTER TABLE `questions`
  ADD CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD CONSTRAINT `quizzes_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_answers`
--
ALTER TABLE `quiz_answers`
  ADD CONSTRAINT `quiz_answers_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quiz_answers_ibfk_2` FOREIGN KEY (`submission_id`) REFERENCES `quiz_submissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quiz_answers_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `registration` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quiz_answers_ibfk_4` FOREIGN KEY (`selected_option_id`) REFERENCES `options` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `quiz_submissions`
--
ALTER TABLE `quiz_submissions`
  ADD CONSTRAINT `quiz_submissions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quiz_submissions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `registration` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
