CREATE TABLE `Stand` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255),
  `id_betreuer` int
);

CREATE TABLE `Gericht` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `id_stand` int,
  `name` varchar(255) NOT NULL,
  `preis` double,
  `lieferbar` bool
);

CREATE TABLE `Gericht_Zutaten` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `id_gericht` int,
  `id_zutat` int,
  `anzahl` int,
  `optional` bool
);

CREATE TABLE `Zutat` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255)
);

CREATE TABLE `Account` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `pw` varchar(255),
  `id_type` int
);

CREATE TABLE `AccountType` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `type` varchar(255)
);

CREATE TABLE `Tisch_Gruppe` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `groupname` varchar(255)
);

CREATE TABLE `Tisch` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `nummer` varchar(255) NOT NULL,
  `id_tischgruppe` int
);

CREATE TABLE `Sitzung` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `start` datetime NOT NULL,
  `end` datetime,
  `id_tisch` int,
  `id_abrechner` int,
  `id_ersteller` int
);

CREATE TABLE `Bestellung` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `id_gericht` int NOT NULL,
  `id_kellner` int NOT NULL,
  `id_sitzung` int NOT NULL,
  `erstellt` datetime NOT NULL,
  `erledigt` datetime,
  `in_zubereitung` bool,
  `anzahl` int,
  `bezahlt` int,
  `notiz` varchar(255)
);

CREATE TABLE `Account_Sitzung` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `id_account` int,
  `id_sitzung` int
);

CREATE TABLE `Zutat_Bestellung` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `id_zutat` int,
  `id_bestellung` int
);

ALTER TABLE `Account_Sitzung` ADD FOREIGN KEY (`id_account`) REFERENCES `Account` (`id`);
ALTER TABLE `Account_Sitzung` ADD FOREIGN KEY (`id_sitzung`) REFERENCES `Sitzung` (`id`);

ALTER TABLE `Account` ADD FOREIGN KEY (`id_type`) REFERENCES `AccountType` (`id`);

ALTER TABLE `Bestellung` ADD FOREIGN KEY (`id_gericht`) REFERENCES `Gericht` (`id`);

ALTER TABLE `Bestellung` ADD FOREIGN KEY (`id_kellner`) REFERENCES `Account` (`id`);

ALTER TABLE `Tisch` ADD FOREIGN KEY (`id_tischgruppe`) REFERENCES `Tisch_Gruppe` (`id`);

ALTER TABLE `Gericht` ADD FOREIGN KEY (`id_stand`) REFERENCES `Stand` (`id`);

ALTER TABLE `Stand` ADD FOREIGN KEY (`id_betreuer`) REFERENCES `Account` (`id`);

ALTER TABLE `Gericht_Zutaten` ADD FOREIGN KEY (`id_gericht`) REFERENCES `Gericht` (`id`);

ALTER TABLE `Gericht_Zutaten` ADD FOREIGN KEY (`id_zutat`) REFERENCES `Zutat` (`id`);

ALTER TABLE `Sitzung` ADD FOREIGN KEY (`id_tisch`) REFERENCES `Tisch` (`id`);

ALTER TABLE `Bestellung` ADD FOREIGN KEY (`id_sitzung`) REFERENCES `Sitzung` (`id`);

ALTER TABLE `Sitzung` ADD FOREIGN KEY (`id_abrechner`) REFERENCES `Account` (`id`);

ALTER TABLE `Sitzung` ADD FOREIGN KEY (`id_ersteller`) REFERENCES `Account` (`id`);

ALTER TABLE `Zutat_Bestellung` ADD FOREIGN KEY (`id_zutat`) REFERENCES `Zutat` (`id`);

ALTER TABLE `Zutat_Bestellung` ADD FOREIGN KEY (`id_bestellung`) REFERENCES `Bestellung` (`id`);
