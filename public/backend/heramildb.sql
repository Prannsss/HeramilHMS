-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 03, 2025 at 09:26 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `heramildb`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `appointment_id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `appointment_datetime` datetime NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('Scheduled','Completed','Cancelled','Pending') DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bills`
--

CREATE TABLE `bills` (
  `bill_id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `bill_date` date NOT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `status` enum('Paid','Unpaid','Pending') DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bill_items`
--

CREATE TABLE `bill_items` (
  `bill_item_id` int(11) NOT NULL,
  `bill_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `line_total` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `department_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `roles` text DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`department_id`, `name`, `description`, `roles`, `status`, `created_at`, `updated_at`) VALUES
(1, 'General Medicine', 'General medical practice and primary care', 'General Medicine', 'Active', NOW(), NOW()),
(2, 'Cardiology', 'Heart and cardiovascular system specialist care', 'Cardiologist', 'Active', NOW(), NOW()),
(3, 'Pediatrics', 'Medical care for infants, children, and adolescents', 'Pediatrician', 'Active', NOW(), NOW()),
(4, 'Radiology', 'Medical imaging and diagnostic imaging services', 'Radiologist', 'Active', NOW(), NOW()),
(5, 'Emergency', 'Emergency and urgent care services', 'Registered Nurse', 'Active', NOW(), NOW()),
(6, 'Administration', 'Hospital administration and management', 'Administrator', 'Active', NOW(), NOW()),
(7, 'Urology', 'Urinary system and male reproductive system care', 'Urologist', 'Active', NOW(), NOW()),
(8, 'Dermatology', 'Skin, hair, and nail specialist care', 'Dermatologist', 'Active', NOW(), NOW()),
(9, 'Neurology', 'Nervous system and brain specialist care', 'Neurologist', 'Active', NOW(), NOW()),
(10, 'Orthopedics', 'Bone, joint, and musculoskeletal system care', 'Orthopedic Surgeon', 'Active', NOW(), NOW());

-- --------------------------------------------------------

--
-- Table structure for table `doctors`
--

CREATE TABLE `doctors` (
  `doctor_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `specialization` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `department` varchar(100) DEFAULT 'General Medicine',
  `status` enum('Active','On Leave','Retired') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctors`
--

INSERT INTO `doctors` (`doctor_id`, `user_id`, `name`, `specialization`, `email`, `department`, `status`, `created_at`, `updated_at`) VALUES
(1, 2, 'Dr. Jayson Ado', 'General Medicine', 'jayson@heramil.com', 'General Medicine', 'Active', '2025-07-19 13:22:48', '2025-07-23 16:10:47'),
(2, 3, 'Dr. Juan Tamad', 'Cardiologist', 'jtamad@heramil.com', 'Cardiology', 'Active', '2025-07-19 13:22:48', '2025-07-23 15:35:10');

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `item_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `stock_quantity` int(11) NOT NULL DEFAULT 0,
  `max_stock` int(11) DEFAULT 100,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`item_id`, `name`, `category`, `stock_quantity`, `max_stock`, `unit_price`, `created_at`, `updated_at`) VALUES
(9, 'Biogesic', '', 68, 100, 12.00, '2025-08-01 08:36:02', '2025-08-03 07:08:35');

-- --------------------------------------------------------

--
-- Table structure for table `medical_records`
--

CREATE TABLE `medical_records` (
  `record_id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `created_date` date DEFAULT NULL,
  `record_date` date NOT NULL,
  `record_type` varchar(50) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `record_entries` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`record_entries`)),
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `patient_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `age` int(11) DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `reason_for_appointment` text DEFAULT NULL,
  `blood_type` varchar(10) DEFAULT 'Unknown',
  `allergies` text DEFAULT 'None',
  `status` enum('Active','Admitted','Discharged') DEFAULT 'Active',
  `date_of_admission` date DEFAULT curdate(),
  `reason_for_admission` text DEFAULT 'General consultation',
  `floor_number` varchar(10) DEFAULT 'N/A',
  `room_number` varchar(10) DEFAULT 'N/A',
  `date_of_discharge` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `room_id` int(11) NOT NULL,
  `room_number` varchar(10) NOT NULL,
  `floor` int(11) NOT NULL,
  `status` enum('Vacant','Occupied','Maintenance') DEFAULT 'Vacant',
  `patient_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`room_id`, `room_number`, `floor`, `status`, `patient_id`, `created_at`, `updated_at`) VALUES
(1, '101', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-08-03 06:20:27'),
(2, '102', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-08-03 07:09:59'),
(3, '103', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 17:19:48'),
(4, '104', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 17:13:16'),
(5, '105', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-23 15:12:03'),
(6, '106', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(7, '107', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(8, '108', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(9, '109', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(10, '110', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-08-01 06:45:16'),
(11, '111', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(12, '112', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(13, '113', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(14, '114', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(15, '115', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(16, '116', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(17, '117', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(18, '118', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(19, '119', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(20, '120', 1, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(21, '201', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(22, '202', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-08-01 06:45:24'),
(23, '203', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(24, '204', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(25, '205', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(26, '206', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(27, '207', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(28, '208', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(29, '209', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(30, '210', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(31, '211', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(32, '212', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(33, '213', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(34, '214', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(35, '215', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(36, '216', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(37, '217', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(38, '218', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(39, '219', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(40, '220', 2, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(41, '301', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(42, '302', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(43, '303', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(44, '304', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(45, '305', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(46, '306', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(47, '307', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(48, '308', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(49, '309', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(50, '310', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(51, '311', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(52, '312', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(53, '313', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(54, '314', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(55, '315', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(56, '316', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(57, '317', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(58, '318', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(59, '319', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50'),
(60, '320', 3, 'Vacant', NULL, '2025-07-21 16:11:50', '2025-07-21 16:11:50');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('Admin','Doctor') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `email`, `password_hash`, `role`) VALUES
(1, 'admin@heramil.com', '5b40171489659251097e7790fc2f1892e2183a72546fe1df283d07865db9149c', 'Admin'),
(2, 'jayson@heramil.com', '3774ddde24599a159714229d51072079faaa552ecdab0c8ec4c8d75f08d34e29', 'Doctor'),
(3, 'jtamad@heramil.com', 'ae1ab9285852aa137d74c398996bbd79606d9207b1b67b6ace874c00f75342a1', 'Doctor');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`appointment_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `bills`
--
ALTER TABLE `bills`
  ADD PRIMARY KEY (`bill_id`),
  ADD KEY `patient_id` (`patient_id`);

--
-- Indexes for table `bill_items`
--
ALTER TABLE `bill_items`
  ADD PRIMARY KEY (`bill_item_id`),
  ADD KEY `bill_id` (`bill_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`department_id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`doctor_id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `medical_records`
--
ALTER TABLE `medical_records`
  ADD PRIMARY KEY (`record_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`patient_id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`room_id`),
  ADD UNIQUE KEY `room_number` (`room_number`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `floor` (`floor`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `appointment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `bills`
--
ALTER TABLE `bills`
  MODIFY `bill_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `bill_items`
--
ALTER TABLE `bill_items`
  MODIFY `bill_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `department_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `doctors`
--
ALTER TABLE `doctors`
  MODIFY `doctor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `medical_records`
--
ALTER TABLE `medical_records`
  MODIFY `record_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `patient_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE SET NULL;

--
-- Constraints for table `bills`
--
ALTER TABLE `bills`
  ADD CONSTRAINT `bills_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE SET NULL;

--
-- Constraints for table `bill_items`
--
ALTER TABLE `bill_items`
  ADD CONSTRAINT `bill_items_ibfk_1` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`bill_id`) ON DELETE CASCADE;

--
-- Constraints for table `doctors`
--
ALTER TABLE `doctors`
  ADD CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `medical_records`
--
ALTER TABLE `medical_records`
  ADD CONSTRAINT `medical_records_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `medical_records_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE SET NULL;

--
-- Constraints for table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
